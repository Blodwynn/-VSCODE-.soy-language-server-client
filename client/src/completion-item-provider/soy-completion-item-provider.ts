import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, ProviderResult, CompletionItem, CompletionList, Range } from "vscode";
import { TriggerCharacters } from '../constants';
import { CompletionItemKind, CompletionTriggerKind } from "vscode-languageclient";
import { SoyDefinitionProvider } from '../definition-provider/soy-definition-provider';
import { TemplatePathMap } from "../interfaces";
import { getNamespace, getMatchingAlias, normalizeAliasTemplate } from "../template-utils";

export class SoyCompletionItemProvider implements CompletionItemProvider {
    soyDefinitionProvider: SoyDefinitionProvider;

    constructor (soyDefinitionProvider: SoyDefinitionProvider) {
        this.soyDefinitionProvider = soyDefinitionProvider;
    }

    provideCompletionItems (document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList> {
        return new Promise((resolve) => {
            if (token.isCancellationRequested) {
                resolve(null);
            }

            const wordRange: Range = document.getWordRangeAtPosition(position, /(del)?call\s+[\w\d.]+/);

            if (wordRange && context.triggerKind === CompletionTriggerKind.Invoked) {
                if (context.triggerCharacter === TriggerCharacters.Dot) {
                    const documentText: string = document.getText();
                    const templateCall: string = document.getText(wordRange);
                    const templateNameStart: string = templateCall.match(/(?:del)?call\s+([\w\d.]+)/)[1];
                    let templateToSearchFor: string;

                    if (templateNameStart.startsWith('.')) {
                        const namespace: string = getNamespace(documentText);

                        templateToSearchFor = `${namespace}${templateNameStart}`;
                    } else {
                        const alias: string = getMatchingAlias(templateNameStart, documentText);

                        if (alias) {
                            templateToSearchFor = normalizeAliasTemplate(alias, templateNameStart);
                        } else {
                            templateToSearchFor = templateNameStart;
                        }
                    }

                    const completionItems: string[] = this.getCompletionItemsData(templateToSearchFor);

                    resolve(new CompletionList(
                        completionItems.map(
                            templateName => this.buildCompletionItem(templateName, templateToSearchFor)
                        ),
                        false
                    ));
                }
                // else if (context.triggerCharacter === TriggerCharacters.LeftBrace) {
                //     // Todo - provide snippets
                // }
            }

            resolve(null);
        });
    }

    private buildCompletionItem (templateName: string, omittablePrefix: string): CompletionItem {
        const completion: string = templateName.replace(new RegExp(`^${omittablePrefix}`), '');

        return <CompletionItem>{
            label: completion,
            kind: CompletionItemKind.Function,
            insertText: completion
        };
    }

    private getCompletionItemsData (templateNameStart: string): string[] {
        const definitionList: TemplatePathMap = this.soyDefinitionProvider.getDefinitionList();

        if (!definitionList) {
            return [];
        }

        return Object.keys(definitionList).filter(templateName => templateName.startsWith(templateNameStart));
    }
}
