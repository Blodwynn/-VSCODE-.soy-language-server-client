import linenumber = require('linenumber');
import fs = require('fs');
import { getNamespace, getMatchingAlias, normalizeAliasTemplate } from '../template-utils';
import { ITemplatePathDescription, ITemplatePathMap } from '../interfaces';

function escapeRegExp (unescapedString: string) {
    return unescapedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isIncluded (templateName: string, file: string, line: number, allCallMaps: ITemplatePathMap): boolean {
    const templatePathDescription: ITemplatePathDescription[] = allCallMaps[templateName];

    if (templatePathDescription) {
        const filtered = templatePathDescription.filter(
            (templateData: ITemplatePathDescription) => templateData.line === line && templateData.path === file
        );

        if (filtered.length) {
            return true;
        }
    }

    return false;
}

function insertElementWithKey (templateName: string, fileLocation: ITemplatePathDescription, allCallMaps: ITemplatePathMap) {
    if (Array.isArray(allCallMaps[templateName])) {
        allCallMaps[templateName].push(fileLocation);
    } else {
        allCallMaps[templateName] = new Array(fileLocation);
    }
}

function insertCalls (templateName: string, path: string, lineNrs: any[], allCallMaps: ITemplatePathMap) {
    lineNrs.forEach(lineItem => {
        const line = lineItem.line - 1;

        if (!isIncluded(templateName, path, line, allCallMaps)) {
            insertElementWithKey(
                templateName,
                {
                    path,
                    line
                },
                allCallMaps
            );
        }
    });
}

export function parseFile (file: string, allCallMaps: ITemplatePathMap) {
    const documentText: string = fs.readFileSync(file, 'utf8');
    const namespace: string = getNamespace(documentText);
    const callPattern: RegExp = /\{(?:del)?call ([\w\d.]+)[^\w\d.].*/gm;
    let m: RegExpExecArray;

    while (m = callPattern.exec(documentText)) {
        const lineNr = linenumber(documentText, escapeRegExp(m[0]));
        const template = m[1];

        if (template.startsWith('.')) {
            insertCalls(`${namespace}${template}`, file, lineNr, allCallMaps);
        } else {
            const alias: string = getMatchingAlias(template, documentText);

            if (alias) {
                const fullTemplatePath: string = normalizeAliasTemplate(alias, template);
                insertCalls(fullTemplatePath, file, lineNr, allCallMaps);
            } else {
                insertCalls(template, file, lineNr, allCallMaps);
            }
        }
    }
}

export function parseFilesForReferences (wsFolders: string[][]): ITemplatePathMap {
    const allCallMaps: ITemplatePathMap = {};

    wsFolders.forEach(
        files => files.forEach(
            file => parseFile(file, allCallMaps)
        )
    );

    return allCallMaps;
}
