import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, ProviderResult } from "vscode";
// CompletionItem
import { TriggerCharacters } from '../constants';
import { CompletionItemKind, CompletionTriggerKind } from "vscode-languageclient";
import { SoyDefinitionProvider } from '../definition-provider/soy-definition-provider';

export class SoyCompletionItemProvider implements CompletionItemProvider {
    soyDefinitionProvider: SoyDefinitionProvider;

    constructor (soyDefinitionProvider: SoyDefinitionProvider) {
        this.soyDefinitionProvider = soyDefinitionProvider;
    }

    provideCompletionItems (document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<any> {
        return new Promise((resolve) => {
            if(document || position || token || context) {
                console.log('document: ', document);
                console.log('position: ', position);
                console.log('context: ', context);
            }

            if (context.triggerKind === 0) {
                resolve([
                    {
                        label: 'if block',
                        kind: CompletionItemKind.Keyword,
                        insertTextRules: 'text',
                        insertText: [
                            "if ${1:condition}}",
                            "    ${2:statements}",
                            "{/if}"
                        ].join('\n')
                    }
                ]);
            } else if (context.triggerKind === CompletionTriggerKind.Invoked) {
                if (context.triggerCharacter === TriggerCharacters.Dot) {

                } else if (context.triggerCharacter === TriggerCharacters.LeftBrace) {
                    // Todo
                    resolve([{
                        label: 'simpleText',
                        kind: 'text',
                        insertText: 'simpleText'
                    }, {
                        label: 'testing',
                        kind: 'text',
                        insertText: 'testing(${1:condition})',
                        insertTextRules: 'text'
                    }, {
                        label: 'ifelse',
                        kind: 'text',
                        insertText: [
                            'if (${1:condition}) {',
                            '\t$0',
                            '} else {',
                            '\t',
                            '}'
                        ].join('\n'),
                        insertTextRules: 'text',
                        documentation: 'If-Else Statement'
                    }]);
                }
            }

            resolve(null);
        });
    }
}
