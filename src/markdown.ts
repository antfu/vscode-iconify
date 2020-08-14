import { MarkdownString, ExtensionContext } from 'vscode'
import { getDataURL } from './loader'
import { DELIMITER } from './meta'

export async function getIconMarkdown(ctx: ExtensionContext, key: string) {
  const icon = await getDataURL(ctx, key, 150)
  const setId = key.split(DELIMITER)[0]
  const url = `https://icones.netlify.app/collection/${setId}`
  return new MarkdownString(`| |\n|:---:|\n| ![](${icon}) |\n| [\`${key}\`](${url}) |`)
}
