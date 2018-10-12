import vscode = require('vscode');
import fs = require('fs');
import glob = require('glob');
import path = require('path');

interface SoyDefinitionInformation {
	file: string;
	line: number;
	column: number;
}

interface TemplatePathDescription {
    path: string;
    line: number;
}

// TODO - add line number here
interface TemplatePathMap {
    [template: string]: TemplatePathDescription
}

function getFiles(document: vscode.TextDocument) {
    const currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const soyPathPattern = [
        currentWorkspaceFolder.uri.fsPath,
        '**',
        '*.soy'
    ];
    const globalSoyFilesPath = path.join(...soyPathPattern);

    return glob.sync(globalSoyFilesPath);
}

function parseFile(file: string): TemplatePathMap {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{template ([\w\d.]+)/gm;
    const content: string = fs.readFileSync(file, "utf8");
    let templatePathMap: TemplatePathMap = {};
    let m, n;

    if (m = namespacePattern.exec(content)) {
        const namespace = m[1];

        while (n = templatePattern.exec(content)) {
            templatePathMap[`${namespace}${n[1]}`] = {
                path: file,
                line: 0
            };
        }
    }

    return templatePathMap;
}

function parseFiles(files: string[]) : TemplatePathMap {
    let allTemplatePathMaps: TemplatePathMap = {};

    // TODO - refactor this
    files.forEach(file => {
        const parsedData = parseFile(file);
        if (parsedData) {
            allTemplatePathMaps = Object.assign(
                allTemplatePathMaps,
                parsedData
            );
        }
    });

    return allTemplatePathMaps;
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

function getPathOfTemplate(templateToSearchFor: string, templatePathMap: TemplatePathMap, document: vscode.TextDocument): string {
    const documentText: string = document.getText();
    const namespace: string = getNamespace(documentText);
    const aliases: string[] = getAliases(documentText);
    let path: string;

    if (templateToSearchFor.startsWith('.')) {
        const templateNamespace = `${namespace}${templateToSearchFor}`;
        path = templatePathMap[templateNamespace].path;
    } else {
        const templateData: TemplatePathDescription = templatePathMap[templateToSearchFor];
        path = templateData && templateData.path;

        if (!path) {
            const alias: string = getMatchingAlias(templateToSearchFor, aliases);
            console.log('alias: ', alias);
        }
    }

    return path;
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<SoyDefinitionInformation> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const files: string[] = getFiles(document);
    const templatePathMap: TemplatePathMap = parseFiles(files);
    const templateToSearchFor: string = document.getText(wordRange);

    const path = getPathOfTemplate(templateToSearchFor, templatePathMap, document);

    if (token) {
        // do this later on each read iterations
        // we might not need this at all if we parse all .soy files on startup
    }

    if (!path) {
        return Promise.reject(`Cannot find declaration for ${templateToSearchFor}`);
    }

	if (!wordRange || lineText.startsWith('//')) {
		return Promise.resolve(null);
	}
	if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
		position = position.translate(0, -1);
    }

	return Promise.resolve(<SoyDefinitionInformation>{
        file: path,
        line: 0, // TODO / get line
        column: 1
    });
}

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
	constructor() {

	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        return definitionLocation(document, position, token)
            .then(definitionInfo => {
                if (definitionInfo == null || definitionInfo.file == null) return null;
                let definitionResource = vscode.Uri.file(definitionInfo.file);
                let pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
                return new vscode.Location(definitionResource, pos);
            }, err => {
                if (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(null);
            });
	}
}
