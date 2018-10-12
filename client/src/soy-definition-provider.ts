import vscode = require('vscode');
import glob = require('glob');
import path = require('path');
import { SoyDefinitionInformation, TemplatePathMap, TemplatePathDescription } from './interfaces';
import { parseFiles } from './parse';

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

function getSoyFiles() {
    // const currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
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

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, templatePathMap: TemplatePathMap): Promise<SoyDefinitionInformation> {
    const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /[\w\d.]+/);
    const lineText: string = document.lineAt(position.line).text;
    const templateToSearchFor: string = document.getText(wordRange);

    const templateData = getTemplateDescription(templateToSearchFor, templatePathMap, document);

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
        this.files = getSoyFiles();
        this.templatePathMap = parseFiles(this.files);
	}

	public provideDefinition(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location> {
        return definitionLocation(document, position, this.templatePathMap)
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
