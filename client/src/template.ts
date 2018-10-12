import vscode = require('vscode');
import { TemplatePathDescription, TemplatePathMap } from './interfaces';

function normalizeAliasTemplate(alias: string, template: string): string {
    const truncatedAliasPath: string = alias.substr(0, alias.lastIndexOf('.') + 1);

    return `${truncatedAliasPath}${template}`;
}

function getNamespace(documentText: string): string {
    const namespacePattern: RegExp = /\{namespace\s*([\w\d.]+)/;
    const namespaceMatch = namespacePattern.exec(documentText);

    if (namespaceMatch) {
        return namespaceMatch[1];
    }

    return null;
}

function getMatchingAlias(template: string, aliases: string[]): string {
    const matchingPart = template.split('.')[0];

    return aliases.find(alias => alias.endsWith(matchingPart));
}

function getAliases(documentText: string): string[] {
    const aliasPattern: RegExp = /\{alias\s*([\w\d.]+)/gm;
    let aliases: string[] = [];
    let m;

    while (m = aliasPattern.exec(documentText)) {
        aliases.push(m[1]);
    }

    return aliases;
}

export function getTemplateDescription(templateToSearchFor: string, templatePathMap: TemplatePathMap, document: vscode.TextDocument): TemplatePathDescription {
    const documentText: string = document.getText();
    const namespace: string = getNamespace(documentText);
    const aliases: string[] = getAliases(documentText);
    let templateData: TemplatePathDescription;

    if (templateToSearchFor.startsWith('.')) {
        const templateNamespace = `${namespace}${templateToSearchFor}`;
        templateData = templatePathMap[templateNamespace];
    } else {
        templateData = templatePathMap[templateToSearchFor];

        if (!templateData || !templateData.path) {
            const alias: string = getMatchingAlias(templateToSearchFor, aliases);
            const fullTemplatePath: string = normalizeAliasTemplate(alias, templateToSearchFor);
            templateData = templatePathMap[fullTemplatePath];
        }
    }

    return templateData;
}
