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

function insertElementWithKey(templateName: string, element: TemplatePathDescription, allTemplatePathMaps: TemplatePathMap) {
    if (Array.isArray(allTemplatePathMaps[templateName])) {
        (<TemplatePathDescription[]>allTemplatePathMaps[templateName]).push(element);
    } else {
        allTemplatePathMaps[templateName] = new Array(element);
    }
}

function parseFile(file: string, allTemplatePathMaps: TemplatePathMap) {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{(del)?template ([\w\d.]+)([^\w\d.]).*/gm;
    const content: string = fs.readFileSync(file, "utf8");
    let m, n;

    if (m = namespacePattern.exec(content)) {
        const namespace: string = m[1];

        while (n = templatePattern.exec(content)) {
            const lineNr = linenumber(content, n[0]);
            const isDeltemplate = n[1];
            const templateName: string = n[2];
            const fullTemplateName: string = `${namespace}.${templateName}`;

            const newItem: TemplatePathDescription = {
                path: file,
                line: lineNr[0].line - 1
            };

            if (isDeltemplate) {
                insertElementWithKey(templateName, newItem, allTemplatePathMaps);
                insertElementWithKey(fullTemplateName, newItem, allTemplatePathMaps);
            } else {
                insertElementWithKey(`${namespace}${templateName}`, newItem, allTemplatePathMaps);
            }
        }
    }
}

export function parseFiles() : TemplatePathMap {
    let allTemplatePathMaps: TemplatePathMap = {};

    getSoyFiles()
        .then(wsFolders => {
            wsFolders.forEach(
                files => files.forEach(
                    file => parseFile(file, allTemplatePathMaps)
                )
            );
        });

    return allTemplatePathMaps;
}
