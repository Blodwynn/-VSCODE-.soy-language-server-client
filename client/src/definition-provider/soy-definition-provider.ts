import vscode = require('vscode');
import { TemplatePathMap, TemplatePathDescription } from '../interfaces';
import { parseFiles, parseFile } from './parse';
import { createLocation, normalizeAliasTemplate, getNamespace, getMatchingAlias } from '../template-utils';

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    private templatePathMap: TemplatePathMap;

    public parseWorkspaceFolders (wsFolders: string[][]): void {
        this.templatePathMap = parseFiles(wsFolders);
    }

    public parseSingleFile (documentPath: string): void {
        this.removeRecordsWithPath(documentPath);
        parseFile(documentPath, this.templatePathMap);
    }

	public provideDefinition (document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location[]> {
        if (!this.templatePathMap) {
            return Promise.resolve(null);
        }

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

    public getDefinitionList (): TemplatePathMap {
        return JSON.parse(JSON.stringify(this.templatePathMap));
    }

    private removeRecordsWithPath (filePath: string): void {
        Object.keys(this.templatePathMap).forEach(key => {
            this.templatePathMap[key] = this.templatePathMap[key].filter(
                pathDescription => pathDescription.path !== filePath
            );
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
        let templateData: TemplatePathDescription[];

        if (templateToSearchFor.startsWith('.')) {
            const namespace: string = getNamespace(documentText);

            templateData = this.templatePathMap[`${namespace}${templateToSearchFor}`];
        } else {
            templateData = this.templatePathMap[templateToSearchFor];

            if (!templateData) {
                const alias: string = getMatchingAlias(templateToSearchFor, documentText);

                if (alias) {
                    const fullTemplatePath: string = normalizeAliasTemplate(alias, templateToSearchFor);
                    templateData = this.templatePathMap[fullTemplatePath];
                }
            }
        }

        return templateData;
    }
}
