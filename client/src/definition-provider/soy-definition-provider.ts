import vscode = require('vscode');
import { TemplatePathMap, TemplatePathDescription, AliasMap } from '../interfaces';
import { parseFiles, parseFile } from './parse';
import { createLocation, normalizeAliasTemplate, getNamespace, getAliases, getMatchingAlias } from '../template-utils';

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    templatePathMap: TemplatePathMap;

    public parseWorkspaceFolders (wsFolders: string[][]): void {
        this.templatePathMap = parseFiles(wsFolders);
    }

    public parseSingleFile (documentPath: string): void {
        this.removeRecordsWithPath(documentPath);
        parseFile(documentPath, this.templatePathMap);
    }

	public provideDefinition (document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location[]> {
        return this.definitionLocation(document, position)
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

    private removeRecordsWithPath (filePath: string): void {
        Object.keys(this.templatePathMap).forEach(key => {
            const itemArray = this.templatePathMap[key];
            const contains = itemArray.find(pathDescription => pathDescription.path === filePath)
            if (contains) {
                delete this.templatePathMap[key];
            }
        });
    }

    private definitionLocation (document: vscode.TextDocument, position: vscode.Position): Promise<TemplatePathDescription[]> {
        const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
        const lineText: string = document.lineAt(position.line).text;
        const templateToSearchFor: string = document.getText(wordRange);
        const templateData: TemplatePathDescription[] = this.getTemplateDescription(templateToSearchFor, document);

        if (!wordRange || lineText.startsWith('//')) {
            return Promise.resolve(null);
        }

        if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
            position = position.translate(0, -1);
        }

        return Promise.resolve(templateData);
    }

    private getTemplateDescription(templateToSearchFor: string, document: vscode.TextDocument): TemplatePathDescription[]  {
        const documentText: string = document.getText();
        const namespace: string = getNamespace(documentText);
        const aliases: AliasMap[] = getAliases(documentText);
        let templateData: TemplatePathDescription[];

        if (templateToSearchFor.startsWith('.')) {
            templateData = this.templatePathMap[`${namespace}${templateToSearchFor}`];
        } else {
            templateData = this.templatePathMap[templateToSearchFor];

            if (!templateData) {
                const alias: string = getMatchingAlias(templateToSearchFor, aliases);

                if (alias) {
                    const fullTemplatePath: string = normalizeAliasTemplate(alias, templateToSearchFor);
                    templateData = this.templatePathMap[fullTemplatePath];
                }
            }
        }

        return templateData;
    }
}
