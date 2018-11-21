import vscode = require('vscode');
import { SoyDefinitionProvider } from '../definition-provider/soy-definition-provider';

export class SoyHoverProvider implements vscode.HoverProvider {

    soyDefinitionProvider: SoyDefinitionProvider;

    constructor(soyDefinitionProvider) {
        this.soyDefinitionProvider = soyDefinitionProvider;
    }

    public provideHover(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Hover> {

        return this.soyDefinitionProvider.provideDefinition(document, position)
            .then(definitionLocation => {
                return new Promise(resolve => {
                    const definitionCount = definitionLocation && definitionLocation.length;
                    if (definitionCount) {
                        if (definitionCount > 1) {
                            resolve(
                                new vscode.Hover(`${definitionCount} implementations are available.`)
                            );
                        } else {
                            resolve(
                                new vscode.Hover('1 implementation is available.')
                            );
                        }
                    } else {
                        resolve(
                            new vscode.Hover('No implementations found.')
                        );
                    }
                });
            });
    }
}
