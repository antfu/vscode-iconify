import type { DecorationOptions } from 'vscode'
import { DecorationRangeBehavior, Range, Uri, window } from 'vscode'
import { shallowRef, useActiveEditorDecorations, useActiveTextEditor, useDocumentText, useTextEditorSelections, watchEffect } from 'reactive-vscode'
import { REGEX_COLLECTION_ICON, REGEX_FULL, config, editorConfig, isCustomAliasesFile } from './config'
import { getDataURL, getIconInfo } from './loader'
import { isTruthy } from './utils'

import { getIconMarkdown } from './markdown'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function useAnnotations() {
  const InlineIconDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; opacity: 0.6 !important;',
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  })
  const HideTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;', // a hack to inject custom style
  })

  const editor = useActiveTextEditor()
  const selections = useTextEditorSelections(editor)
  const text = useDocumentText(() => editor.value?.document)

  const decorations = shallowRef<DecorationMatch[]>([])

  useActiveEditorDecorations(InlineIconDecoration, decorations)
  useActiveEditorDecorations(
    HideTextDecoration,
    () => config.inplace
      ? decorations.value
        .map(({ range }) => range)
        .filter(i => !selections.value.map(({ start }) => start.line).includes(i.start.line))
      : [],
  )

  // Calculate decorations
  watchEffect(async () => {
    if (!editor.value)
      return

    if (!config.annotations) {
      decorations.value = []
      return
    }

    let match
    const isAliasesFile = isCustomAliasesFile(editor.value.document.uri.path)
    const regex = isAliasesFile ? REGEX_COLLECTION_ICON.value : REGEX_FULL.value
    regex.lastIndex = 0
    const keys: [Range, string][] = []

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text.value!))) {
      const key = match[1]
      if (!key)
        continue

      const startPos = editor.value.document.positionAt(match.index + 1)
      const endPos = editor.value.document.positionAt(match.index + match[0].length)
      keys.push([new Range(startPos, endPos), key])
    }

    const fontSize = editorConfig.fontSize
    const position = config.position === 'after' ? 'after' : 'before'
    decorations.value = (await Promise.all(keys.map(async ([range, key]) => {
      const info = await getIconInfo(key, !isAliasesFile)
      if (!info)
        return undefined

      const dataurl = await getDataURL(info, editorConfig.fontSize * 1.2)

      const item: DecorationMatch = {
        range,
        renderOptions: {
          [position]: {
            contentIconPath: Uri.parse(dataurl),
            margin: `-${fontSize}px 2px; transform: translate(-2px, 3px);`,
            width: `${fontSize * info.ratio * 1.1}px`,
          },
        },
        hoverMessage: await getIconMarkdown(key),
        key,
      }
      return item
    }))).filter(isTruthy)
  })
}
