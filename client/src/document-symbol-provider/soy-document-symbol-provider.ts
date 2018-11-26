import { DocumentSymbolProvider, TextDocument, ProviderResult, SymbolInformation } from 'vscode';

export class SoyDocumentSymbolProvider implements DocumentSymbolProvider {

    public provideDocumentSymbols (document: TextDocument): ProviderResult<SymbolInformation[]> {
        const matches = this.getSymbolData(document.getText());

        console.log(matches);

        return null;
    }

    private getSymbolData (documentText: string): RegExpMatchArray[] {
        const pattern: RegExp = /(?:del)?(?:template|call)\s+([\w\d.]+)/gm;
        const matches: RegExpMatchArray[] = [];
        let m: RegExpMatchArray = pattern.exec(documentText);

        while (m = pattern.exec(documentText)) {
            matches.push(m);
        }

        return matches;
    }
}
