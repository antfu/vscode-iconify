import { window, TextEditor, DecorationOptions, Range, Uri, DecorationRangeBehavior, ExtensionContext, workspace } from 'vscode'
import { REGEX_FULL } from './meta'
import { getDataURL } from './loader'
import { isTruthy } from './utils'
import { config } from './config'
import { getIconMarkdown } from './markdown'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function RegisterAnnotations(ctx: ExtensionContext) {
  const BasicDecoration = window.createTextEditorDecorationType({
    rangeBehavior: DecorationRangeBehavior.OpenOpen,
    before: {
      margin: '-10px 2px; transform: translate(-2px, 3px);',
      width: '1.1em',
    },
  })

  const HideTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;', // a hack to inject custom style
  })

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  async function updateDecorations() {
    if (!editor)
      return

    const text = editor.document.getText()
    let match
    REGEX_FULL.lastIndex = 0
    const keys: [Range, string][] = []

    // eslint-disable-next-line no-cond-assign
    while ((match = REGEX_FULL.exec(text))) {
      const key = match[1]
      if (!key)
        continue

      const startPos = editor.document.positionAt(match.index + 1)
      const endPos = editor.document.positionAt(match.index + key.length + 1)
      keys.push([new Range(startPos, endPos), key])
    }

    decorations = (
      await Promise.all(
        keys.map(
          async([range, key]) => {
            const dataurl = await getDataURL(ctx, key)
            if (!dataurl)
              return undefined

            const item: DecorationMatch = {
              range,
              renderOptions: {
                before: {
                  contentIconPath: Uri.parse(dataurl),
                },
              },
              hoverMessage: await getIconMarkdown(ctx, key),
              key,
            }
            return item
          },
        ),
      ))
      .filter(isTruthy)

    refreshDecorations()
  }

  function refreshDecorations() {
    if (!editor)
      return
    editor.setDecorations(BasicDecoration, decorations)
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
    }, 500)
  }

  window.onDidChangeActiveTextEditor((e) => {
    triggerUpdateDecorations(editor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document)
      triggerUpdateDecorations(window.activeTextEditor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeConfiguration(() => {
    triggerUpdateDecorations(window.activeTextEditor)
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
