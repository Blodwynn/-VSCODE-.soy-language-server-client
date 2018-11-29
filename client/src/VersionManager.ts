import vscode = require('vscode');
import { ExtensionContext, extensions } from 'vscode';
import { GlobalState, ExtensionData } from './constants';

export class VersionManager {
    context: ExtensionContext;
    extension: vscode.Extension<any>;

    constructor (context: ExtensionContext) {
        this.context = context;
        this.extension = extensions.getExtension(ExtensionData.ExtensionIdentifier);
    }

    public getSavedVersion (): string {
        return this.context.globalState.get(GlobalState.CurrentVersion);
    }

    public getCurrentVersion (): string {
        return this.extension.packageJSON.version;
    }

    public clearSavedVersion (): void {
        this.context.globalState.update(
            GlobalState.CurrentVersion,
            null
        );
    }

    public UpdateSavedVersion (): void {
        this.context.globalState.update(
            GlobalState.CurrentVersion,
            this.getCurrentVersion()
        );
    }
}
