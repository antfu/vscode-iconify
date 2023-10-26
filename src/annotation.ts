import type { DecorationOptions, ExtensionContext, TextEditor } from 'vscode'
import { DecorationRangeBehavior, Range, Uri, window, workspace } from 'vscode'
import { REGEX_FULL, config, onConfigUpdated } from './config'
import { getDataURL, getIconInfo } from './loader'
import { isTruthy } from './utils'

import { getIconMarkdown } from './markdown'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function RegisterAnnotations(ctx: ExtensionContext) {
  const InlineIconDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; opacity: 0.6 !important;',
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  })
  const HideTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;', // a hack to inject custom style
  })

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  async function updateDecorations() {
    if (!editor)
      return

    if (!config.annotations) {
      editor.setDecorations(InlineIconDecoration, [])
      editor.setDecorations(HideTextDecoration, [])
      return
    }

    const text = editor.document.getText()
    let match
    const regex = REGEX_FULL.value
    regex.lastIndex = 0
    const keys: [Range, string][] = []

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text))) {
      const key = match[1]
      if (!key)
        continue

      const startPos = editor.document.positionAt(match.index + 1)
      const endPos = editor.document.positionAt(match.index + match[0].length)
      keys.push([new Range(startPos, endPos), key])
    }

    decorations = (await Promise.all(keys.map(async ([range, key]) => {
      const info = await getIconInfo(ctx, key)
      if (!info)
        return undefined

      const position = config.position === 'after' ? 'after' : 'before'
      const dataurl = await getDataURL(ctx, info, config.fontSize * 1.2)

      const item: DecorationMatch = {
        range,
        renderOptions: {
          [position]: {
            contentIconPath: Uri.parse(dataurl),
            margin: `-${config.fontSize}px 2px; transform: translate(-2px, 3px);`,
            width: `${config.fontSize * info.ratio * 1.1}px`,
          },
        },
        hoverMessage: await getIconMarkdown(ctx, key),
        key,
      }
      return item
    }))).filter(isTruthy)

    refreshDecorations()
  }

  function refreshDecorations() {
    if (!editor)
      return

    if (!config.annotations) {
      editor.setDecorations(InlineIconDecoration, [])
      editor.setDecorations(HideTextDecoration, [])
      return
    }

    editor.setDecorations(InlineIconDecoration, decorations)
    if (config.inplace) {
      editor.setDecorations(
        HideTextDecoration,
        decorations
          .map(({ range }) => range)
          .filter(i => i.start.line !== editor!.selection.start.line),
      )
    }
    else {
      editor.setDecorations(HideTextDecoration, [])
    }
  }

  function updateEditor(_editor?: TextEditor) {
    if (!_editor || editor === _editor)
      return
    editor = _editor
    decorations = []
  }

  let timeout: NodeJS.Timer | undefined
  function triggerUpdateDecorations(_editor?: TextEditor) {
    updateEditor(_editor)

    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    timeout = setTimeout(() => {
      updateDecorations()
    }, 200)
  }

  window.onDidChangeActiveTextEditor((e) => {
    triggerUpdateDecorations(e)
  }, null, ctx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document)
      triggerUpdateDecorations(window.activeTextEditor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeConfiguration(async () => {
    await onConfigUpdated()
    triggerUpdateDecorations()
  }, null, ctx.subscriptions)

  window.onDidChangeVisibleTextEditors((editors) => {
    triggerUpdateDecorations(editors[0])
  }, null, ctx.subscriptions)

  window.onDidChangeTextEditorSelection((e) => {
    updateEditor(e.textEditor)
    refreshDecorations()
  })

  // on start up
  updateEditor(window.activeTextEditor)
  triggerUpdateDecorations()
}
