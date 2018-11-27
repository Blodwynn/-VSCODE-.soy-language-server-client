import vscode = require('vscode');
import fg = require('fast-glob');
import path = require('path');

const excludeFromFileSearch = [
    '!**/node_modules'
]

export function getSoyFiles() {
    let promises = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const globalSoyFilesPath = path.join(wsFolder.uri.fsPath, '**', '*.soy');

        promises.push(fg.async([globalSoyFilesPath, ...excludeFromFileSearch]));
    });

    return Promise.all(promises);
}

export function getSoyFile(filePath) {
    return fg.async(filePath);
}
