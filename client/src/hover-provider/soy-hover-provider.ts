import vscode = require('vscode');
import { SoyDefinitionProvider } from '../definition-provider/soy-definition-provider';
import { SoyReferenceProvider } from '../reference-provider/soy-reference-provider';

export class SoyHoverProvider implements vscode.HoverProvider {
    soyDefinitionProvider: SoyDefinitionProvider;
    soyReferenceProvider: SoyReferenceProvider;

    constructor(soyDefinitionProvider, soyReferenceProvider) {
        this.soyDefinitionProvider = soyDefinitionProvider;
        this.soyReferenceProvider = soyReferenceProvider;
    }

    private createSentence (numberOfItems: number, itemName: string): string {
        const plural = `${itemName}s`;

        if (!numberOfItems) {
            return `No ${plural} found.`;
        } else if (numberOfItems === 1) {
            return `1 ${itemName} is available.`;
        } else {
            return `${numberOfItems} ${plural} are available.`;
        }
    }

    public provideHover (document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Hover> {

        return new Promise<vscode.Hover>(resolve => {
            const wordRange: vscode.Range = document.getWordRangeAtPosition(position, /(del)?(call|template)\s+[\w\d.]+/);

            if (wordRange) {
                Promise.all([
                    this.soyDefinitionProvider.provideDefinition(document, position),
                    this.soyReferenceProvider.provideReferences(document, position)
                ]).then(templateInformation => {
                    const definitions: vscode.Location[] = templateInformation[0];
                    const references: vscode.Location[] = templateInformation[1];

                    const definitionHoverItem: string = this.createSentence(definitions && definitions.length, 'definition');
                    const referenceHoverItem: string = this.createSentence(references && references.length, 'reference');

                    resolve(new vscode.Hover([definitionHoverItem, referenceHoverItem]));
                });
            } else {
                resolve(null);
            }
        });
    }
}
