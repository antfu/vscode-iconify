import type { CompletionItemProvider, ExtensionContext, TextDocument } from 'vscode'
import { CompletionItem, CompletionItemKind, Position, Range, languages } from 'vscode'
import { getCollectionMarkdown, getIconMarkdown } from './markdown'
import { REGEX_NAMESPACE, config, enabledCollectionIds, enabledCollections } from './config'

export function RegisterCompletion(ctx: ExtensionContext) {
  const iconProvider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
      const line = document.getText(new Range(new Position(position.line, 0), new Position(position.line, position.character)))
      const match = line.match(REGEX_NAMESPACE.value)
      if (!match)
        return null

      const id = match[1]
      const info = enabledCollections.value.find(i => i.id === id)
      if (!info)
        return null

      const range = new Range(position.line, position.character, position.line, position.character)
      return info.icons
        .map((i) => {
          const item = new CompletionItem(i, CompletionItemKind.Text)
          item.detail = `${id}${config.delimiters[0]}${i}`
          item.range = range
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

      return enabledCollectionIds.value
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
      '"',
      '\'',
    ),
  )
}
