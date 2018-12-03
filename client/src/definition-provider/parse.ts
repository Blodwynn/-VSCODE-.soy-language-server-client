import linenumber = require('linenumber');
import fs = require('fs');
import { TemplatePathMap, TemplatePathDescription } from '../interfaces';

function insertElementWithKey (templateName: string, element: TemplatePathDescription, allTemplatePathMaps: TemplatePathMap): void {
    if (Array.isArray(allTemplatePathMaps[templateName])) {
        allTemplatePathMaps[templateName].push(element);
    } else {
        allTemplatePathMaps[templateName] = new Array(element);
    }
}

export function parseFile (file: string, allTemplatePathMaps: TemplatePathMap) {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{(del)?template ([\w\d.]+)([^\w\d.]).*/gm;
    const content: string = fs.readFileSync(file, 'utf8');
    let m, n: RegExpExecArray;

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

export function parseFiles (wsFolders): TemplatePathMap {
    const allTemplatePathMaps: TemplatePathMap = {};

    wsFolders.forEach(
        files => files.forEach(
            file => parseFile(file, allTemplatePathMaps)
        )
    );

    return allTemplatePathMaps;
}
