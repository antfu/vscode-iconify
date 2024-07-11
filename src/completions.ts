import type { CompletionItemProvider, TextDocument } from 'vscode'
import { CompletionItem, CompletionItemKind, Position, Range, languages } from 'vscode'
import { extensionContext } from 'reactive-vscode'
import { getCollectionMarkdown, getIconMarkdown } from './markdown'
import { REGEX_NAMESPACE, REGEX_PREFIXED, config, enabledAliasIds, enabledCollectionIds, enabledCollections } from './config'

export function RegisterCompletion() {
  const ctx = extensionContext.value!
  const iconProvider: CompletionItemProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
      const line = document.getText(new Range(new Position(position.line, 0), new Position(position.line, position.character)))

      const prefixMatch = line.match(REGEX_PREFIXED.value)
      if (!prefixMatch)
        return null

      const range = new Range(position.line, position.character, position.line, position.character)
      const aliasCompletion = enabledAliasIds.value.map((i) => {
        const item = new CompletionItem(i, CompletionItemKind.Text)
        item.detail = `alias: ${i}`
        item.range = range
        return item
      })

      if (config.customAliasesOnly)
        return aliasCompletion

      const namespaceMatch = line.match(REGEX_NAMESPACE.value)
      if (!namespaceMatch)
        return aliasCompletion

      const id = namespaceMatch[1]
      const info = enabledCollections.value.find(i => i.id === id)
      if (!info)
        return aliasCompletion

      return [
        ...aliasCompletion,
        ...info.icons
          .map((i) => {
            const item = new CompletionItem(i, CompletionItemKind.Text)
            item.detail = `${id}${config.delimiters[0]}${i}`
            item.range = range
            return item
          }),
      ]
    },
    async resolveCompletionItem(item: CompletionItem) {
      return {
        ...item,
        documentation: await getIconMarkdown(item.detail!),
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
