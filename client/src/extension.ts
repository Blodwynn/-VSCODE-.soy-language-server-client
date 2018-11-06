'use strict';

import * as path from 'path';
import vscode = require('vscode');
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { SoyDefinitionProvider } from './definition-provider/soy-definition-provider';
import { SoyReferenceProvider } from './reference-provider/soy-reference-provider';
import { getSoyFiles, getSoyFile } from './files';

const soyDefProvider = new SoyDefinitionProvider();
const soyRefProvider = new SoyReferenceProvider();
let client: LanguageClient;

const soyDocFilter: vscode.DocumentFilter = {
    language: 'soy',
    scheme: 'file'
};

function showNotification(message: string) {
    vscode.window.showInformationMessage(message);
}

function initalizeProviders() {
    showNotification('Soy extension starting up...');
    getSoyFiles()
        .then(wsFolders => {
            soyDefProvider.parseWorkspaceFolders(wsFolders);
            soyRefProvider.parseWorkspaceFolders(wsFolders);
            showNotification('Soy extension started.');
        });
}

export function activate(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    );
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    context.subscriptions.push(vscode.languages.registerDefinitionProvider(soyDocFilter, soyDefProvider));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(soyDocFilter, soyRefProvider));

    initalizeProviders();

    vscode.workspace.onDidSaveTextDocument(e => {
        getSoyFile(e.uri.fsPath)
            .then(file => {
                const filePath: string = <string>file[0];

                soyDefProvider.parseSingleFile(filePath);
                soyRefProvider.parseSingleFile(filePath);
            });
    }, null, context.subscriptions);

    let clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'soy' }
        ],
        synchronize: {
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

    client.start();
}

export function deactivate(): Thenable<void> {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
