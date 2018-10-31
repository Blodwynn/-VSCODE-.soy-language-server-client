import linenumber = require('linenumber');
import fs = require('fs');
import { getNamespace, getAliases, getMatchingAlias, normalizeAliasTemplate } from '../utils';
import { CallMap, SoyDefinitionInformation, AliasMap } from '../interfaces';

function escapeRegExp (string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function insertElementWithKey (templateName: string, fileLocation: SoyDefinitionInformation, allCallMaps: CallMap) {
    if (Array.isArray(allCallMaps[templateName])) {
        allCallMaps[templateName].push(fileLocation);
    } else {
        allCallMaps[templateName] = new Array(fileLocation);
    }
}

function insertCalls (templateName: string, file: string, lineNrs: any, allCallMaps: CallMap) {
    lineNrs.forEach(lineItem => {
        insertElementWithKey(
            templateName,
            {
                file,
                line: lineItem.line - 1
            },
            allCallMaps
        );
    });
}

function parseFile (file: string, allCallMaps: CallMap) {
    const content: string = fs.readFileSync(file, "utf8");
    const namespace = getNamespace(content);
    const callPattern: RegExp = /\{(?:del)?call ([\w\d.]+)[^\w\d.].*/gm;
    let m;

    while (m = callPattern.exec(content)) {
        const lineNr = linenumber(content, escapeRegExp(m[0]));
        const template = m[1];

        if (template.startsWith('.')) {
            insertCalls(`${namespace}${template}`, file, lineNr, allCallMaps);
        } else {
            const aliases: AliasMap[] = getAliases(content);
            const alias: string = getMatchingAlias(template, aliases);

            if (alias) {
                const fullTemplatePath: string = normalizeAliasTemplate(alias, template);
                insertCalls(fullTemplatePath, file, lineNr, allCallMaps);
            } else {
                insertCalls(template, file, lineNr, allCallMaps);
            }
        }
    }
}

export function parseFilesForReferences (wsFolders: string[][]) {
    let allCallMaps: CallMap = {};

    wsFolders.forEach(
        files => files.forEach(
            file => parseFile(file, allCallMaps)
        )
    );

    return allCallMaps;
}