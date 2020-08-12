import { window, TextEditor, workspace, DecorationOptions, Range, Uri, DecorationRangeBehavior } from 'vscode'
import { REGEX_FULL } from './meta'
import { getDataURL } from './loader'
import { ctx } from './ctx'

export function RegisterAnnotations() {
  const BasicDecoration = window.createTextEditorDecorationType({
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
    before: {
      margin: '-10px 2px; transform: translate(-2px, 3px);',
      width: '1.1em',
    },
  })

  const IconOnlyDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;', // a hack to inject custom style
  })

  async function updateDecorations(editor: TextEditor) {
    if (!editor)
      return

    const text = editor.document.getText()

    let match
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

    const decorations = await Promise.all(
      keys.map(
        async([range, key]): Promise<DecorationOptions> => ({
          range,
          renderOptions: {
            before: {
              contentIconPath: Uri.parse(await getDataURL(key)),
            },
          },
        }),
      ),
    )

    editor.setDecorations(BasicDecoration, decorations)
    editor.setDecorations(IconOnlyDecoration, keys.map(([range]) => range))
  }

  let timeout: NodeJS.Timer | undefined
  function triggerUpdateDecorations(editor: TextEditor) {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    timeout = setTimeout(() => updateDecorations(editor), 500)
  }

  window.onDidChangeActiveTextEditor((editor) => {
    if (editor)
      triggerUpdateDecorations(editor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document)
      triggerUpdateDecorations(window.activeTextEditor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeConfiguration(() => {
    if (window.activeTextEditor)
      triggerUpdateDecorations(window.activeTextEditor)
  }, null, ctx.subscriptions)

  window.onDidChangeVisibleTextEditors((editors) => {
    if (editors[0])
      triggerUpdateDecorations(editors[0])
  }, null, ctx.subscriptions)
}
