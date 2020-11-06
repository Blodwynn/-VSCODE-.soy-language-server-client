import linenumber = require('linenumber');
import fs = require('fs');
import { ITemplatePathMap, ITemplatePathDescription } from '../interfaces';

function insertElementWithKey (templateName: string, element: ITemplatePathDescription, allTemplatePathMaps: ITemplatePathMap): void {
    if (Array.isArray(allTemplatePathMaps[templateName])) {
        allTemplatePathMaps[templateName].push(element);
    } else {
        allTemplatePathMaps[templateName] = new Array(element);
    }
}

export function parseFile (file: string, allTemplatePathMaps: ITemplatePathMap) {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{(del)?template ([\w\d.]+)[^\}]*\}/gm;
    const content: string = fs.readFileSync(file, 'utf8');
    let m, n: RegExpExecArray;

    if (m = namespacePattern.exec(content)) {
        const namespace: string = m[1];

        while (n = templatePattern.exec(content)) {
            const lineNr = linenumber(content, n[0]);
            const isDeltemplate = n[1];
            const templateName: string = n[2];
            const fullTemplateName: string = `${namespace}.${templateName}`;

            const newItem: ITemplatePathDescription = {
                path: file,
                line: lineNr ? lineNr[0].line - 1 : 1
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

export function parseFiles (wsFolders): ITemplatePathMap {
    const allTemplatePathMaps: ITemplatePathMap = {};

    wsFolders.forEach(
        files => files.forEach(
            file => parseFile(file, allTemplatePathMaps)
        )
    );

    return allTemplatePathMaps;
}
