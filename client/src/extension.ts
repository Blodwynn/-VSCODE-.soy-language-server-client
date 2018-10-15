'use strict';

import * as path from 'path';
import vscode = require('vscode');
import { workspace, ExtensionContext } from 'vscode';
import { SoyDefinitionProvider } from './soy-definition-provider';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

const soyDocFilter: vscode.DocumentFilter = {
	language: 'soy',
	scheme: 'file'
};

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(soyDocFilter, new SoyDefinitionProvider()));

	vscode.languages.setLanguageConfiguration('soy', {
		wordPattern: /[\w\d.]+/g
	});

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'soy' }
		],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'soyLanguageServer',
		'Soy Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
