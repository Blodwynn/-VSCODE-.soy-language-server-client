import vscode = require('vscode');
// import fs = require('fs');
import glob = require('glob');
import path = require('path');

export interface SoyDefinitionInformation {
	file: string;
	line: number;
	column: number;
	doc: string;
	declarationlines: string[];
}

function getSoyFiles(document: vscode.TextDocument) {
    const currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const soyPathPattern = [
        currentWorkspaceFolder.uri.fsPath,
        '**',
        '*.soy'
    ];
    const globalSoyFilesPath = path.join(...soyPathPattern);

    return glob.sync(globalSoyFilesPath);
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<SoyDefinitionInformation> {
    const files = getSoyFiles(document);
    let wordRange = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    let lineText = document.lineAt(position.line).text;

    console.log('files: ', files);

    if (token) {
        // do this later
    }

	if (!wordRange || lineText.startsWith('//')) {
		return Promise.resolve(null);
	}
	if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
		position = position.translate(0, -1);
	}

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
