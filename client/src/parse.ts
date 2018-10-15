import vscode = require('vscode');
import fg = require('fast-glob');
import path = require('path');
import linenumber = require('linenumber');
import fs = require('fs');
import { TemplatePathMap, TemplatePathDescription } from './interfaces';

const excludeFromFileSearch = [
    '!**/node_modules'
]

function getSoyFiles() {
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

function parseFile(file: string, allTemplatePathMaps: TemplatePathMap) {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{(del)?template ([\w\d.]+)/gm;
    const content: string = fs.readFileSync(file, "utf8");
    let m, n;

    if (m = namespacePattern.exec(content)) {
        const namespace = m[1];

        while (n = templatePattern.exec(content)) {
            const lineNr = linenumber(content, n[0]);
            const templateName = n[2];
            const fullTemplateName = `${namespace}.${templateName}`;

            if (n[1]) {
                const newItem = {
                    path: file,
                    line: lineNr[0].line - 1
                };

                if (Array.isArray(allTemplatePathMaps[templateName])) {
                    (<TemplatePathDescription[]>allTemplatePathMaps[templateName]).push(newItem);
                } else {
                    allTemplatePathMaps[templateName] = new Array(newItem);
                }

                if (Array.isArray(allTemplatePathMaps[fullTemplateName])) {
                    (<TemplatePathDescription[]>allTemplatePathMaps[fullTemplateName]).push(newItem);
                } else {
                    allTemplatePathMaps[fullTemplateName] = new Array(newItem);
                }
            } else {
                allTemplatePathMaps[`${namespace}${templateName}`] = {
                    path: file,
                    line: lineNr[0].line - 1
                };
            }
        }
    }
}

export function parseFiles() : TemplatePathMap {
    let allTemplatePathMaps: TemplatePathMap = {};

    getSoyFiles()
        .then(wfFolders => {
            wfFolders.forEach(
                files => files.forEach(
                    file => parseFile(file, allTemplatePathMaps)
                )
            );
        });

    return allTemplatePathMaps;
}
