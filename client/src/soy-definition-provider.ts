import vscode = require('vscode');
import { SoyDefinitionInformation, TemplatePathMap } from './interfaces';
import { parseFiles } from './parse';
import { getTemplateDescription } from './template';

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap): Promise<SoyDefinitionInformation> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const templateToSearchFor: string = document.getText(wordRange);

    const templateData = getTemplateDescription(templateToSearchFor, templatePathMap, document);

    if (!templateData || !templateData.path) {
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
    templatePathMap: TemplatePathMap;

    constructor() {
        this.templatePathMap = parseFiles();
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
