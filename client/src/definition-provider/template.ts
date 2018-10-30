import vscode = require('vscode');
import { TemplatePathDescription, TemplatePathMap } from '../interfaces';
import { normalizeAliasTemplate, getNamespace, getAliases, getMatchingAlias } from '../utils';

export function getTemplateDescription( templateToSearchFor: string, templatePathMap: TemplatePathMap, document: vscode.TextDocument): TemplatePathDescription[]  {
    const documentText: string = document.getText();
    const namespace: string = getNamespace(documentText);
    const aliases: string[] = getAliases(documentText);
    let templateData: TemplatePathDescription[];

    if (templateToSearchFor.startsWith('.')) {
        templateData = templatePathMap[`${namespace}${templateToSearchFor}`];
    } else {
        templateData = templatePathMap[templateToSearchFor];

        if (!templateData) {
            const alias: string = getMatchingAlias(templateToSearchFor, aliases);

            if (alias) {
                const fullTemplatePath: string = normalizeAliasTemplate(alias, templateToSearchFor);
                templateData = templatePathMap[fullTemplatePath];
            }
        }
    }

    return templateData;
}
