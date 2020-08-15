import { TextDocument, languages, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionItemKind, ExtensionContext } from 'vscode'
import { SUPPORTED_LANG_IDS, DELIMITER } from './meta'
import { collections } from './collections'
import { getIconMarkdown } from './markdown'
import { REGEX_NAMESPACE } from './config'

export function RegisterCompletion(ctx: ExtensionContext) {
  const provider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
      const match = document.getWordRangeAtPosition(position, REGEX_NAMESPACE.value)
      if (!match)
        return null

      const id = document.getText(match).slice(1, -1)
      const info = collections.find(i => i.id === id)
      if (!info)
        return null

      return info.icons
        .map((i) => {
          const item = new CompletionItem(i, CompletionItemKind.Text)
          item.detail = `${id}:${i}`
          return item
        })
    },
    async resolveCompletionItem(item: CompletionItem) {
      return {
        ...item,
        documentation: await getIconMarkdown(ctx, item.detail!),
      }
    },
  }

  ctx.subscriptions.push(
    languages.registerCompletionItemProvider(
      SUPPORTED_LANG_IDS,
      provider,
      DELIMITER,
    ),
  )
}
