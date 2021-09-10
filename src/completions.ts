import { TextDocument, languages, Position, CompletionItem, CompletionItemProvider, CompletionItemKind, ExtensionContext, Range } from 'vscode'
import { collections } from './collections'
import { getIconMarkdown, getCollectionMarkdown } from './markdown'
import { config, enabledCollections, REGEX_NAMESPACE } from './config'

export function RegisterCompletion(ctx: ExtensionContext) {
  const iconProvider: CompletionItemProvider = {
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

  const REGEX_COLLECTION = /icon=['"][\w-]*$/

  const collectionProvider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
      const line = document.getText(new Range(new Position(position.line, 0), new Position(position.line, position.character)))
      const match = REGEX_COLLECTION.test(line)
      if (!match)
        return null

      return enabledCollections.value
        .map(c => new CompletionItem(c, CompletionItemKind.Text))
    },

    async resolveCompletionItem(item: CompletionItem) {
      return {
        ...item,
        documentation: await getCollectionMarkdown(ctx, item.label as string),
      }
    },
  }

  ctx.subscriptions.push(
    languages.registerCompletionItemProvider(
      config.languageIds,
      iconProvider,
      ...config.delimiters,
    ),
    languages.registerCompletionItemProvider(
      config.languageIds,
      collectionProvider,
      '"', '\'',
    ),
  )
}
