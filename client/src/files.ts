import vscode = require('vscode');
import fg = require('fast-glob');
import path = require('path');
import { ExtensionData } from './constants';
import { getExtensionConfiguration } from './utils';

function excludeFromFileSearch(wsPath:string): string[] {
    return [
        path.join('!**', 'node_modules'),
        ...getExtensionConfiguration().excludePaths.map(excludedPath => path.join('!',wsPath,excludedPath))
    ]
};

export function getSoyFiles (): Thenable<string[][]> {
    const promises = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const globalSoyFilesPath = path.join(wsFolder.uri.fsPath, '**', '*.soy');

        promises.push(fg.async([globalSoyFilesPath, ...excludeFromFileSearch(wsFolder.uri.fsPath)]));
    });

    return Promise.all(promises);
}

export function getSoyFile (filePath: string): Thenable<string[]> {
    return fg.async(filePath);
}

function getExtensionPath (): string {
    return vscode.extensions.getExtension(ExtensionData.ExtensionIdentifier).extensionPath;
}

export function getChangeLogPath (): string {
    const extensionPath: string = getExtensionPath();

    return path.join(extensionPath, 'CHANGELOG.md');
}

export function getReadmePath (): string {
    const extensionPath: string = getExtensionPath();

    return path.join(extensionPath, 'README.md');
}
