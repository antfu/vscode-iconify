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

  async function updateDecorations(editor: TextEditor) {
    if (!editor)
      return

    const text = editor.document.getText()
    const decorations: Promise<DecorationOptions>[] = []

    let match

    // eslint-disable-next-line no-cond-assign
    while ((match = REGEX_FULL.exec(text))) {
      const key = match[1]
      if (!key)
        continue

      const startPos = editor.document.positionAt(match.index + 1)
      const endPos = editor.document.positionAt(match.index + key.length + 1)

      decorations.push(
        (async() => ({
          range: new Range(startPos, endPos),
          renderOptions: {
            before: {
              contentIconPath: Uri.parse(await getDataURL(key)),
            },
          },
        }))(),
      )
    }

    editor.setDecorations(BasicDecoration, await Promise.all(decorations))
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
}
