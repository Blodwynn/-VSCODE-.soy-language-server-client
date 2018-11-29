import vscode = require('vscode');

export function showNotification (message: string): void {
    const prefix: string = 'Soy Extension:';

    vscode.window.showInformationMessage(`${prefix} ${message}`);
}
