import vscode = require('vscode');
import glob = require('glob');
import path = require('path');
import { SoyDefinitionInformation, TemplatePathMap } from './interfaces';
import { parseFiles } from './parse';
import { getTemplateDescription } from './template';

function getSoyFiles() {
    let fileList: string[] = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const soyPathPattern = [
            wsFolder.uri.fsPath,
            '**',
            '*.soy'
        ];

        const globalSoyFilesPath = path.join(...soyPathPattern);

        fileList.push(...glob.sync(globalSoyFilesPath));
    });

    return fileList;
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap): Promise<SoyDefinitionInformation> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const templateToSearchFor: string = document.getText(wordRange);

    const templateData = getTemplateDescription(templateToSearchFor, templatePathMap, document);

    if (!path) {
        return Promise.reject(`Cannot find declaration for ${templateToSearchFor}`);
    }

	if (!wordRange || lineText.startsWith('//')) {
		return Promise.resolve(null);
	}
	if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
		position = position.translate(0, -1);
    }

	return Promise.resolve(<SoyDefinitionInformation>{
        file: templateData.path,
        line: templateData.line
    });
}

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    files: string[];
    templatePathMap: TemplatePathMap;

    constructor() {
        this.files = getSoyFiles();
        this.templatePathMap = parseFiles(this.files);
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location> {
        return definitionLocation(document, position, this.templatePathMap)
            .then(definitionInfo => {
                if (definitionInfo == null || definitionInfo.file == null) return null;
                let definitionResource = vscode.Uri.file(definitionInfo.file);
                let pos = new vscode.Position(definitionInfo.line, 1);
                return new vscode.Location(definitionResource, pos);
            }, err => {
                if (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(null);
            });
	}
}
