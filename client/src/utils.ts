import vscode = require('vscode');

export function normalizeAliasTemplate(alias: string, template: string): string {
    const truncatedAliasPath: string = alias.substr(0, alias.lastIndexOf('.') + 1);

    return `${truncatedAliasPath}${template}`;
}

export function getNamespace(documentText: string): string {
    const namespacePattern: RegExp = /\{namespace\s*([\w\d.]+)/;
    const namespaceMatch = namespacePattern.exec(documentText);

    if (namespaceMatch) {
        return namespaceMatch[1];
    }

    return null;
}

export function getMatchingAlias(template: string, aliases: string[]): string {
    const matchingPart = template.split('.')[0];

    return aliases.find(alias => alias.endsWith(matchingPart));
}

export function getAliases(documentText: string): string[] {
    const aliasPattern: RegExp = /\{alias\s*([\w\d.]+)/gm;
    let aliases: string[] = [];
    let m;

    while (m = aliasPattern.exec(documentText)) {
        aliases.push(m[1]);
    }

    return aliases;
}

export function createLocation(definitionInfo) {
    if (definitionInfo == null || definitionInfo.file == null) return null;

    let definitionResource = vscode.Uri.file(definitionInfo.file);
    let pos = new vscode.Position(definitionInfo.line, 1);

    return new vscode.Location(definitionResource, pos);
}
