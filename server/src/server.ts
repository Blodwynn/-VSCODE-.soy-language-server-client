/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	// Definition,
	// Location
} from 'vscode-languageserver';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
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
			completionProvider: {
				resolveProvider: true
			},
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

// connection.onDefinition((textDocumentIdentifier: any): Definition => {
//     return Location.create(textDocumentIdentifier.uri, {
//         start: { line: textDocumentIdentifier.line, character: 1 },
//         end: { line: textDocumentIdentifier.line, character: 2 }
//     });
// });

interface SoyConfigSettings {
	ignoreTodo: boolean;
	ignoreBreakingChange: boolean;
	ignoreErrors: boolean;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: SoyConfigSettings = { ignoreTodo: false, ignoreBreakingChange: false, ignoreErrors: false };
let globalSettings: SoyConfigSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<SoyConfigSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <SoyConfigSettings>(
			(change.settings.soyLanguageServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
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

interface ErrorItem {
	pattern: RegExp;
	message: string;
}

const errorPatterns: ErrorItem[] = [
	// LET
	{ pattern: /\{\s*let\s+\w.*?\}/ig,                  message: 'Missing $ sign for variable declaration'},
	{ pattern: /\{\s*let.*?kind=[^}]*?\/\}/ig,          message: 'Unnecessary closing tag for LET opening tag'},
	{ pattern: /\{\s*let \$[\w\d."'=]+:(.*)[^/]\}/ig,   message: 'Missing closing tag for LET declaration'},
	{ pattern: /\{\s*let.*?\/ }/ig,                     message: 'Extra spacing before closing tag'},

	// PARAM
	{ pattern: /\{\s*param.*?kind=[^}]*?\/\}/ig,        message: 'Unnecessary closing tag for PARAM opening tag'},
	{ pattern: /\{\s*param [\w\d."'=]+?:[^}]*[^/]\}/ig, message: 'Missing closing tag for parameter'},
	{ pattern: /\{\s*param.*?\/ }/ig,                   message: 'Extra spacing before closing tag'},

	{ pattern: /\{template.*?\/\s*\}/ig,                message: 'Self closing is not applicable for templates' },
	{ pattern: /\{deltemplate.*?\/\s*\}/ig,             message: 'Self closing is not applicable for deltemplates' }
];

const breakingChangePatterns: ErrorItem[] = [
	{ pattern: /breaking ?change/ig, message: 'To be checked for followups' }
];

const todoPatterns: ErrorItem[] = [
	{ pattern: /TO ?DO/ig,             message: 'To be checked for followups' }
];

function validateWithPattern(errorItem: any, text: string, textDocument: TextDocument, severity: DiagnosticSeverity) {
	const pattern = errorItem.pattern;
	const message = errorItem.message;
	let diagnosticResults : Diagnostic[] = [];
	let m;

	while (m = pattern.exec(text)) {
		diagnosticResults.push({
			severity,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]}: ${message}.`,
			source: 'ex'
		});
	}

	return diagnosticResults;
}

function validatePatterns(errorItems: any[], text: string, textDocument: TextDocument, severity: DiagnosticSeverity) {
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
		diagnostics.push(...validatePatterns(errorPatterns, text, textDocument, DiagnosticSeverity.Error));
	}

	if (!settings.ignoreTodo) {
		diagnostics.push(...validatePatterns(todoPatterns, text, textDocument, DiagnosticSeverity.Information));
	}

	if (!settings.ignoreBreakingChange) {
		diagnostics.push(...validatePatterns(breakingChangePatterns, text, textDocument, DiagnosticSeverity.Information));
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			(item.detail = 'TypeScript details'),
				(item.documentation = 'TypeScript documentation');
		} else if (item.data === 2) {
			(item.detail = 'JavaScript details'),
				(item.documentation = 'JavaScript documentation');
		}
		return item;
	}
);

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
