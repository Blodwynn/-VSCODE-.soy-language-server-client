import { AliasMap } from './../interfaces';
import vscode = require('vscode');
import { parseFilesForReferences } from './parse';
import { getNamespace, getAliases, getMatchingAlias, createLocation, normalizeAliasTemplate } from '../utils';

export class SoyReferenceProvider implements vscode.ReferenceProvider {
    callMap: any;

    constructor(wsFolders) {
        this.callMap = parseFilesForReferences(wsFolders);
	}

    public provideReferences(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location[]> {
        const documentText: string = document.getText();
        const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
        const templateToSearchFor: string = document.getText(wordRange);
        const namespace: string = getNamespace(documentText);
        let records;

        return new Promise<vscode.Location[]>((resolve, reject) => {
            if (!templateToSearchFor) {
                reject('Invalid template name!');
            }

            if (templateToSearchFor.startsWith('.')) {
                records = this.callMap[`${namespace}${templateToSearchFor}`];
            } else {
                const aliases: AliasMap[] = getAliases(documentText);
                const alias: string = getMatchingAlias(templateToSearchFor, aliases);

                if (alias) {
                    const fullTemplatePath = normalizeAliasTemplate(alias, templateToSearchFor);
                    records = this.callMap[fullTemplatePath];
                } else {
                    records = this.callMap[templateToSearchFor];
                }
            }

            resolve(records.map(info => createLocation(info)));
        });
    }
}
