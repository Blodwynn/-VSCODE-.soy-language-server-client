import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, ProviderResult, CompletionItem, CompletionList } from "vscode";
import { TriggerCharacters } from '../constants';
import { CompletionItemKind, CompletionTriggerKind } from "vscode-languageclient";
import { SoyDefinitionProvider } from '../definition-provider/soy-definition-provider';

export class SoyCompletionItemProvider implements CompletionItemProvider {
    soyDefinitionProvider: SoyDefinitionProvider;

    constructor (soyDefinitionProvider: SoyDefinitionProvider) {
        this.soyDefinitionProvider = soyDefinitionProvider;
    }

    provideCompletionItems (document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList> {
        return new Promise((resolve) => {
            if(document || position || token || context) {
                // console.log('document: ', document);
                // console.log('position: ', position);
                // console.log('context: ', context);
            }

            console.log('getDefinitionList', this.soyDefinitionProvider.getDefinitionList());

            if (context.triggerKind === 0) {
                // Todo ctrl+space
                resolve(null);
            } else if (context.triggerKind === CompletionTriggerKind.Invoked) {
                if (context.triggerCharacter === TriggerCharacters.Dot) {
                    const list: CompletionList = new CompletionList([], true);

                    list.items = [
                        this.buildCompletionItem(
                            'if block',
                            CompletionItemKind.Snippet,
                            [
                                "if ${1:condition}}",
                                "    ${2:statements}",
                                "{/if}"
                            ].join('\n'))
                    ];

                    resolve(list);
                } else if (context.triggerCharacter === TriggerCharacters.LeftBrace) {
                    // Todo
                }
            }

            resolve(null);
        });
    }

    private buildCompletionItem (label: string, itemKind: CompletionItemKind, insertText: string): CompletionItem {
        const completionItem: CompletionItem = new CompletionItem(label, itemKind);
        completionItem.insertText = insertText;

        return completionItem;
    }

}
