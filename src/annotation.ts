import type { DecorationOptions } from 'vscode'
import { shallowRef, useActiveEditorDecorations, useActiveTextEditor, useDocumentText, useTextEditorSelections, watchEffect } from 'reactive-vscode'
import { DecorationRangeBehavior, languages, Range, Uri, window } from 'vscode'
import { config, editorConfig, isCustomAliasesFile, REGEX_COLLECTION_ICON, REGEX_FULL } from './config'
import { getDataURL, getIconInfo } from './loader'
import { getIconMarkdown } from './markdown'

import { isTruthy } from './utils'

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

    const { document } = editor.value
    const previewIncludePatterns = config.preview.include || []
    const previewExcludePatterns = config.preview.exclude || []

    let shouldPreview = previewIncludePatterns.length
      ? previewIncludePatterns.some(pattern => !!languages.match({ pattern }, document))
      : true
    if (previewExcludePatterns.length && previewExcludePatterns.some(pattern => !!languages.match({ pattern }, document)))
      shouldPreview = false

    if (!shouldPreview) {
      decorations.value = []
      return
    }

    let match
    const isAliasesFile = isCustomAliasesFile(document.uri.path)
    const regex = isAliasesFile ? REGEX_COLLECTION_ICON.value : REGEX_FULL.value
    if (!regex)
      return
    regex.lastIndex = 0
    const keys: [Range, string][] = []

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text.value!))) {
      const key = match[1]
      if (!key)
        continue

      const startPos = document.positionAt(match.index + 1)
      const endPos = document.positionAt(match.index + match[0].length)
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
