/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
import { SoyConfigSettings, ErrorItem } from './interfaces';
import patterns from './patterns';
import {
    createConnection,
    TextDocuments,
    TextDocument,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification
} from 'vscode-languageserver';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments = new TextDocuments();
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
    let capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    hasConfigurationCapability =
        capabilities.workspace && !!capabilities.workspace.configuration;
    hasWorkspaceFolderCapability =
        capabilities.workspace && !!capabilities.workspace.workspaceFolders;

    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            // either this is true and use the onDefinition
            // or just have the subscription in the extension
            definitionProvider: false
        }
    };
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(
            DidChangeConfigurationNotification.type,
            undefined
        );
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

const defaultSettings: SoyConfigSettings = {
    ignoreTodo: false,
    ignoreBreakingChange: false,
    ignoreErrors: false
};
let globalSettings: SoyConfigSettings = defaultSettings;

let documentSettings: Map<string, Thenable<SoyConfigSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        documentSettings.clear();
    } else {
        globalSettings = <SoyConfigSettings>(
            (change.settings.soyLanguageServer || defaultSettings)
        );
    }

    documents.all().forEach(validateSoyDocument);
});

function getDocumentSettings(resource: string): Thenable<SoyConfigSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'soyLanguageServer'
        });
        documentSettings.set(resource, result);
    }
    return result;
}

documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

documents.onDidChangeContent(change => {
    validateSoyDocument(change.document);
});

documents.onDidClose(change => {
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] });
});

function validateWithPattern(errorItem: ErrorItem, text: string, textDocument: TextDocument, severity: DiagnosticSeverity): Diagnostic[] {
    const pattern: RegExp = errorItem.pattern;
    const message: string = errorItem.message;
    let diagnosticResults : Diagnostic[] = [];
    let m: RegExpExecArray;

    while (m = pattern.exec(text)) {
        const startPosition: number = m.index + m[0].indexOf(m[1]);

        diagnosticResults.push({
            severity,
            range: {
                start: textDocument.positionAt(startPosition),
                end: textDocument.positionAt(startPosition + m[1].length)
            },
            message: `${m[1]}: ${message}.`,
            source: 'soy-ext'
        });
    }

    return diagnosticResults;
}

function validatePatterns(errorItems: any[], text: string, textDocument: TextDocument, severity: DiagnosticSeverity): Diagnostic[] {
    let diagnosticResults : Diagnostic[] = [];

    errorItems.forEach(errorItem  => {
        diagnosticResults = diagnosticResults.concat(validateWithPattern(errorItem, text, textDocument, severity));
    });

    return diagnosticResults;
}

async function validateSoyDocument(textDocument: TextDocument): Promise<void> {
    let settings = await getDocumentSettings(textDocument.uri);
    let text = textDocument.getText();
    let diagnostics: Diagnostic[] = [];

    if (!settings.ignoreErrors) {
        diagnostics.push(...validatePatterns(patterns.error, text, textDocument, DiagnosticSeverity.Error));
    }

    if (!settings.ignoreTodo) {
        diagnostics.push(...validatePatterns(patterns.todo, text, textDocument, DiagnosticSeverity.Information));
    }

    if (!settings.ignoreBreakingChange) {
        diagnostics.push(...validatePatterns(patterns.breakingChange, text, textDocument, DiagnosticSeverity.Information));
    }

    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received an file change event');
});

documents.listen(connection);
connection.listen();
