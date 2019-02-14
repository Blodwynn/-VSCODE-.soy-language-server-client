'use strict';

import * as path from 'path';
import vscode = require('vscode');
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { showNotification, getExtensionConfiguration } from './utils';
import { SoyDefinitionProvider } from './definition-provider/soy-definition-provider';
import { SoyReferenceProvider } from './reference-provider/soy-reference-provider';
import { SoyHoverProvider } from './hover-provider/soy-hover-provider';
import { SoyDocumentSymbolProvider } from './document-symbol-provider/soy-document-symbol-provider';
import { SoyCompletionItemProvider } from './completion-item-provider/soy-completion-item-provider';
import { getSoyFiles, getSoyFile, getChangeLogPath, getReadmePath } from './files';
import { VersionManager } from './VersionManager';
import { Commands, TriggerCharacters, UpdateNotificationItem } from './constants';

const soyDefinitionProvider = new SoyDefinitionProvider();
const soyReferenceProvider = new SoyReferenceProvider();
const soyHoverProvider = new SoyHoverProvider(soyDefinitionProvider, soyReferenceProvider);
const soyDocumentSymbolProvider = new SoyDocumentSymbolProvider();
const soyCompletionItemProvider = new SoyCompletionItemProvider(soyDefinitionProvider);
const extensionConfiguration: vscode.WorkspaceConfiguration = getExtensionConfiguration();
let client: LanguageClient;

const soyDocFilter: vscode.DocumentFilter = {
    language: 'soy',
    scheme: 'file'
};

function getSetupExtensionClient (context: ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'soy' }
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    return new LanguageClient(
        'soyLanguageServer',
        'Soy Language Server',
        serverOptions,
        clientOptions
    );
}

function registerProviders (context: ExtensionContext): void {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(soyDocFilter, soyDefinitionProvider));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(soyDocFilter, soyReferenceProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider(soyDocFilter, soyHoverProvider));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(soyDocFilter, soyDocumentSymbolProvider));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        soyDocFilter, soyCompletionItemProvider, TriggerCharacters.Dot, TriggerCharacters.LeftBrace
    ));
}

function registerCommands (context: ExtensionContext): void {
    context.subscriptions.push(vscode.commands.registerCommand(
        Commands.ReparseWorkSpace,
        () => initalizeProviders('Reparsing workspace...', 'Workspace parsed.')
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        Commands.ShowExtensionChanges,
        () => showExtensionChanges()
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        Commands.About,
        () => showReadme()
    ));
}

function initalizeProviders (startMessage: string, finishMessage: string, noMessages?: boolean): void {
    if (!noMessages) {
        showNotification(startMessage);
    }

    getSoyFiles()
        .then(wsFolders => {
            soyDefinitionProvider.parseWorkspaceFolders(wsFolders);
            soyReferenceProvider.parseWorkspaceFolders(wsFolders);
            if (!noMessages) {
                showNotification(finishMessage);
            }
        });
}

function showReadme () {
    const readmePath: string = getReadmePath();
    vscode.commands.executeCommand(Commands.ShowMarkDownPreview, vscode.Uri.file(readmePath));
}

function showExtensionChanges (): void {
    const changeLogPath: string = getChangeLogPath();
    vscode.commands.executeCommand(Commands.ShowMarkDownPreview, vscode.Uri.file(changeLogPath));
}

function showNewChanges (currentVersion: string, previousVersion: string): void {
    if (!previousVersion || (previousVersion !== currentVersion)) {
        vscode.window.showInformationMessage(
            'Soy Extension just got updated, check out what\'s new!',
            UpdateNotificationItem.SeeUpdates,
            UpdateNotificationItem.Dismiss
        )
        .then(choosenOption => {
            if (choosenOption === UpdateNotificationItem.SeeUpdates) {
                showExtensionChanges();
            }
        });
    }
}

export function activate (context: ExtensionContext): void {
    const versionManager: VersionManager = new VersionManager(context);
    client = getSetupExtensionClient(context);

    showNewChanges(versionManager.getCurrentVersion(), versionManager.getSavedVersion());
    versionManager.UpdateSavedVersion();

    registerProviders(context);
    registerCommands(context);
    initalizeProviders('Starting up...', 'Started.', extensionConfiguration.noStartupMessages);

    vscode.workspace.onDidSaveTextDocument(e => {
        getSoyFile(e.uri.fsPath)
            .then(file => {
                const filePath: string = file[0] as string;

                soyDefinitionProvider.parseSingleFile(filePath);
                soyReferenceProvider.parseSingleFile(filePath);
            });
    }, null, context.subscriptions);

    client.start();
}

export function deactivate (): Thenable<void> {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
