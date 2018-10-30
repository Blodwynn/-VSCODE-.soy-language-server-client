import linenumber = require('linenumber');
import fs = require('fs');
import { getNamespace, getAliases, getMatchingAlias, normalizeAliasTemplate } from '../utils';

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function insertElementWithKey(templateName: string, file: any, allCallMaps: any) {
    if (Array.isArray(allCallMaps[templateName])) {
        allCallMaps[templateName].push(file);
    } else {
        allCallMaps[templateName] = new Array(file);
    }
}

function parseFile (file, allCallMaps) {
    const content: string = fs.readFileSync(file, "utf8");
    const namespace = getNamespace(content);
    const callPattern: RegExp = /\{(?:del)?call ([\w\d.]+)[^\w\d.].*/gm;
    let m;

    while (m = callPattern.exec(content)) {
        const lineNr = linenumber(content, escapeRegExp(m[0]));
        const template = m[1];

        if (template.startsWith('.')) {
            lineNr.forEach(lineItem => {
                insertElementWithKey(
                    `${namespace}${template}`,
                    {
                        file,
                        line: lineItem.line - 1
                    },
                    allCallMaps
                );

            });
        } else {
            const aliases: string[] = getAliases(content);
            const alias: string = getMatchingAlias(template, aliases);

            if (alias) {
                const fullTemplatePath: string = normalizeAliasTemplate(alias, template);

                lineNr.forEach(lineItem => {
                    insertElementWithKey(
                        fullTemplatePath,
                        {
                            file,
                            line: lineItem.line - 1
                        },
                        allCallMaps
                    );
                });
            } else {
                lineNr.forEach(lineItem => {
                    insertElementWithKey(
                        template,
                        {
                            file,
                            line: lineItem.line - 1
                        },
                        allCallMaps
                    );
                });
            }
        }
    }

}

export function parseFilesForReferences (wsFolders) {
    let allCallMaps = {};

    wsFolders.forEach(
        files => files.forEach(
            file => parseFile(file, allCallMaps)
        )
    );

    return allCallMaps;
}
