import { AliasMap, TemplatePathDescription, TemplatePathMap } from './../interfaces';
import vscode = require('vscode');
import { parseFilesForReferences, parseFile } from './parse';
import { getNamespace, getAliases, getMatchingAlias, createLocation, normalizeAliasTemplate } from '../utils';

export class SoyReferenceProvider implements vscode.ReferenceProvider {
    callMap: TemplatePathMap;

    removeCallsFromFile (documentPath: string): void {
        Object.keys(this.callMap).forEach(key => {
            this.callMap[key] = this.callMap[key].filter(
                pathDescription => pathDescription.path !== documentPath
            );
        });
    }

    public parseWorkspaceFolders (wsFolders: string[][]): void {
        this.callMap = parseFilesForReferences(wsFolders);
	}

    public parseSingleFile (documentPath: string): void {
        this.removeCallsFromFile(documentPath);
        parseFile(documentPath, this.callMap);
    }

    public provideReferences (document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location[]> {
        const documentText: string = document.getText();
        const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
        const templateToSearchFor: string = document.getText(wordRange);
        const namespace: string = getNamespace(documentText);
        let records: TemplatePathDescription[];

        return new Promise<vscode.Location[]>(resolve => {
            if (!templateToSearchFor) {
                resolve(null);
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

            resolve(records && records.map(info => createLocation(info)));
        });
    }
}
