import vscode = require('vscode');
import glob = require('glob');
import path = require('path');
import linenumber = require('linenumber');
import fs = require('fs');
import { TemplatePathMap } from './interfaces';

function getSoyFiles() {
    let fileList: string[] = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const soyPathPattern = [
            wsFolder.uri.fsPath,
            '**',
            '*.soy'
        ];

        const globalSoyFilesPath = path.join(...soyPathPattern);

        fileList.push(...glob.sync(globalSoyFilesPath));
    });

    return fileList;
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
            const lineNr = linenumber(content, n[0]);
            templatePathMap[`${namespace}${n[1]}`] = {
                path: file,
                line: lineNr[0].line - 1
            };
        }
    }

    return templatePathMap;
}

export function parseFiles() : TemplatePathMap {
    const files = getSoyFiles();
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
