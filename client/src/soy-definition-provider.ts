import vscode = require('vscode');
import fs = require('fs');
import glob = require('glob');
import path = require('path');
import linenumber = require('linenumber');

interface SoyDefinitionInformation {
	file: string;
	line: number;
}

interface TemplatePathDescription {
    path: string;
    line: number;
}

// TODO - add line number here
interface TemplatePathMap {
    [template: string]: TemplatePathDescription
}

function getFiles() {
    const currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const soyPathPattern = [
        currentWorkspaceFolder,
        '**',
        '*.soy'
    ];
    const globalSoyFilesPath = path.join(...soyPathPattern);

    return glob.sync(globalSoyFilesPath);
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

function parseFiles(files: string[]) : TemplatePathMap {
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

function normalizeAliasTemplate(alias: string, template: string): string {
    const truncatedAliasPath: string = alias.substr(0, alias.lastIndexOf('.') + 1);

    return `${truncatedAliasPath}${template}`;
}

function getNamespace(documentText: string): string {
    const namespacePattern: RegExp = /\{namespace\s*([\w\d.]+)/;
    const namespaceMatch = namespacePattern.exec(documentText);

    if (namespaceMatch) {
        return namespaceMatch[1];
    }

    return null;
}

function getMatchingAlias(template: string, aliases: string[]): string {
    const matchingPart = template.split('.')[0];

    return aliases.find(alias => alias.endsWith(matchingPart));
}

function getAliases(documentText: string): string[] {
    const aliasPattern: RegExp = /\{alias\s*([\w\d.]+)/gm;
    let aliases: string[] = [];
    let m;

    while (m = aliasPattern.exec(documentText)) {
        aliases.push(m[1]);
    }

    return aliases;
}

function getTemplateDescription(templateToSearchFor: string, templatePathMap: TemplatePathMap, document: vscode.TextDocument): TemplatePathDescription {
    const documentText: string = document.getText();
    const namespace: string = getNamespace(documentText);
    const aliases: string[] = getAliases(documentText);
    let templateData: TemplatePathDescription;

    if (templateToSearchFor.startsWith('.')) {
        const templateNamespace = `${namespace}${templateToSearchFor}`;
        templateData = templatePathMap[templateNamespace];
    } else {
        templateData = templatePathMap[templateToSearchFor];

        if (!templateData || !templateData.path) {
            const alias: string = getMatchingAlias(templateToSearchFor, aliases);
            const fullTemplatePath: string = normalizeAliasTemplate(alias, templateToSearchFor);
            templateData = templatePathMap[fullTemplatePath];
        }
    }

    return templateData;
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap, token: vscode.CancellationToken): Promise<SoyDefinitionInformation> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const templateToSearchFor: string = document.getText(wordRange);

    const templateData = getTemplateDescription(templateToSearchFor, templatePathMap, document);

    if (token) {
        // do this later on each read iterations
        // we might not need this at all if we parse all .soy files on startup
    }

    if (!path) {
        return Promise.reject(`Cannot find declaration for ${templateToSearchFor}`);
    }

	if (!wordRange || lineText.startsWith('//')) {
		return Promise.resolve(null);
	}
	if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
		position = position.translate(0, -1);
    }

	return Promise.resolve(<SoyDefinitionInformation>{
        file: templateData.path,
        line: templateData.line
    });
}

export class SoyDefinitionProvider implements vscode.DefinitionProvider {
    files: any;
    templatePathMap: any;

    constructor() {
        this.files = getFiles();
        this.templatePathMap = parseFiles(this.files);
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
        return definitionLocation(document, position, this.templatePathMap, token)
            .then(definitionInfo => {
                if (definitionInfo == null || definitionInfo.file == null) return null;
                let definitionResource = vscode.Uri.file(definitionInfo.file);
                let pos = new vscode.Position(definitionInfo.line, 1);
                return new vscode.Location(definitionResource, pos);
            }, err => {
                if (err) {
                    return Promise.reject(err);
                }
                return Promise.resolve(null);
            });
	}
}
