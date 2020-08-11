import { TextDocument, languages, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionItemKind, MarkdownString } from 'vscode'
import { SUPPORTED_LANG_IDS, REGEX_NAMESPACE } from './meta'
import { collections } from './collections'
import { getDataURL } from './loader'
import { ctx } from './ctx'

const TRIGGER = ':'

export function RegisterCompletion() {
  const provider: CompletionItemProvider = {
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
      const match = document.getWordRangeAtPosition(position, REGEX_NAMESPACE)
      if (!match)
        return null

      const id = document.getText(match).slice(1, -1)
      const info = collections.find(i => i.id === id)
      if (!info)
        return null

      return info.icons
        .map((i) => {
          const item = new CompletionItem(i, CompletionItemKind.Enum)
          item.detail = `${id}:${i}`
          return item
        })
    },
    async resolveCompletionItem(item: CompletionItem) {
      const dataURL = await getDataURL(item.detail!)
      return {
        ...item,
        documentation: new MarkdownString(`![](${dataURL})`),
      }
    },
  }

  ctx.subscriptions.push(
    languages.registerCompletionItemProvider(
      SUPPORTED_LANG_IDS,
      provider,
      TRIGGER,
    ),
  )
}
