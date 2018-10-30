import vscode = require('vscode');
import { SoyDefinitionInformation, TemplatePathMap } from '../interfaces';
import { getTemplateDescription } from './template';
import { parseFiles } from './parse';
import { createLocation } from '../utils';

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap): Promise<any> {
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

    const informationArray = templateData.map(item => (<SoyDefinitionInformation>{file: item.path, line: item.line}));
    return Promise.resolve(informationArray);
}

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    templatePathMap: TemplatePathMap;

    constructor(wsFolders) {
        this.templatePathMap = parseFiles(wsFolders);
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location> {
        return definitionLocation(document, position, this.templatePathMap)
            .then(definitionInfo => {
                if (Array.isArray(definitionInfo)) {
                    return definitionInfo.map(info => createLocation(info));
                } else {
                    return createLocation(definitionInfo);
                }
            }, err => {
                if (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(null);
            });
	}
}
