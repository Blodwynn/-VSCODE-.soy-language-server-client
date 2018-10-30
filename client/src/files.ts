import vscode = require('vscode');
import fg = require('fast-glob');
import path = require('path');

const excludeFromFileSearch = [
    '!**/node_modules'
]

export function getSoyFiles() {
    let promises = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const soyPathPattern = [
            wsFolder.uri.fsPath,
            '**',
            '*.soy'
        ];

        const globalSoyFilesPath = path.join(...soyPathPattern);

        promises.push(fg.async([globalSoyFilesPath, ...excludeFromFileSearch]));
    });

    return Promise.all(promises);
}
