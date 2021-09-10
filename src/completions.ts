import { TextDocument, languages, Position, CompletionItem, CompletionItemProvider, CompletionItemKind, ExtensionContext, Range } from 'vscode'
import { collections } from './collections'
import { getIconMarkdown } from './markdown'
import { config, REGEX_NAMESPACE } from './config'

export function RegisterCompletion(ctx: ExtensionContext) {
  const provider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
      const line = document.getText(new Range(new Position(position.line, 0), new Position(position.line, position.character)))
      const match = line.match(REGEX_NAMESPACE.value)
      if (!match)
        return null

      const id = match[1]
      const info = collections.find(i => i.id === id)
      if (!info)
        return null

      return info.icons
        .map((i) => {
          const item = new CompletionItem(i, CompletionItemKind.Text)
          item.detail = `${id}${config.delimiters[0]}${i}`
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
      config.languageIds,
      provider,
      ...config.delimiters,
    ),
  )
}
