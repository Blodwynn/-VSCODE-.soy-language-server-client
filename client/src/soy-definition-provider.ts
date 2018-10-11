import vscode = require('vscode');
import fs = require('fs');
import glob = require('glob');
import path = require('path');

interface SoyDefinitionInformation {
	file: string;
	line: number;
	column: number;
	doc: string;
	declarationlines: string[];
}

interface TemplatePathMap {
    [template: string]: string
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
            templatePathMap[`${namespace}${n[1]}`] = file;
        }
    }

    return templatePathMap;
}

function parseFiles(files: string[]) : TemplatePathMap {
    let allTemplatePathMaps: TemplatePathMap = {};

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

// function getPathOfTemplate(template: string, parsedFiles: TemplatePathMap[]): string {
//     return parsedFiles[template];
// }

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<SoyDefinitionInformation> {
    const documentText: string = document.getText();
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const files: string[] = getFiles(document);
    const templatePathMap: TemplatePathMap = parseFiles(files);
    const templateToSearchFor: string = document.getText(wordRange);
    const namespace = getNamespace(documentText);
    console.log('namespace: ', namespace);
    console.log('templatePathMap: ', templatePathMap);

    if (templateToSearchFor.startsWith('.')) {
        const templateNamespace = `${namespace}${templateToSearchFor}`;
        const path = templatePathMap[templateNamespace];
        console.log('path', path);
        // Finish this
    } else {
        let path = templatePathMap[templateToSearchFor];
        if (path) {
            console.log('fullpath', path);
        } else {
            console.log('alias path');
            // search for alias + this
        }
    }


    if (token) {
        // do this later
    }

	if (!wordRange || lineText.startsWith('//')) {
		return Promise.resolve(null);
	}
	if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
		position = position.translate(0, -1);
    }

    console.log('templateToSearchFor: ', templateToSearchFor);

	return null;
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
