import vscode = require('vscode');
import { TemplatePathMap, TemplatePathDescription } from '../interfaces';
import { getTemplateDescription } from './template';
import { parseFiles, parseFile } from './parse';
import { createLocation } from '../utils';

function removeRecordsWithPath(filePath: string, templatePathMap: TemplatePathMap) {
    Object.keys(templatePathMap).forEach(key => {
        const itemArray = templatePathMap[key];
        const contains = itemArray.find(pathDescription => pathDescription.path === filePath)
        if (contains) {
            delete templatePathMap[key];
        }
    });
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap): Promise<TemplatePathDescription[]> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const templateToSearchFor: string = document.getText(wordRange);

    const templateData = getTemplateDescription(templateToSearchFor, templatePathMap, document);

    if (!templateData || !templateData.length) {
        return Promise.reject(`Cannot find declaration for ${templateToSearchFor}`);
    }

    if (!wordRange || lineText.startsWith('//')) {
        return Promise.resolve(null);
    }

    if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
        position = position.translate(0, -1);
    }

    const informationArray = templateData.map(item => ({path: item.path, line: item.line}));
    return Promise.resolve(informationArray);
}

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    templatePathMap: TemplatePathMap;

    public parseWorkspaceFolders(wsFolders: string[][]) {
        this.templatePathMap = parseFiles(wsFolders);
    }

    public parseSingleFile(documentPath: string) {
        removeRecordsWithPath(documentPath, this.templatePathMap);
        parseFile(documentPath, this.templatePathMap);
    }

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location> {
        return definitionLocation(document, position, this.templatePathMap)
            .then(definitionInfo => {
                if (definitionInfo) {
                    return definitionInfo.map(info => createLocation(info));
                }

                return null;
            }, err => {
                if (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(null);
            });
	}
}
