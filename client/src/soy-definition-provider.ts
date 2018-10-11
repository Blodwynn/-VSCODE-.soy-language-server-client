import vscode = require('vscode');
import path = require('path');
import fs = require('fs');
import os = require('os');

export interface SoyDefinitionInformation {
	file: string;
	line: number;
	column: number;
	doc: string;
	declarationlines: string[];
}

export async function definitionLocation(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<SoyDefinitionInformation> {
    let wordRange = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    let lineText = document.lineAt(position.line).text;

    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    await fs.readdir(rootPath, (err, files) => {
        console.log(files);
    });

    const currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    // console.log('vscode.workspace: ', vscode.workspace);

    // console.log('document: ', document);
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
