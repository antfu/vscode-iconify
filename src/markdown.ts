import { MarkdownString, ExtensionContext } from 'vscode'
import { DelimitersSeperator } from './config'
import { getDataURL } from './loader'

export async function getIconMarkdown(ctx: ExtensionContext, key: string) {
  const icon = await getDataURL(ctx, key, 150)
  const setId = key.split(DelimitersSeperator.value)[0]
  const url = `https://icones.netlify.app/collection/${setId}`
  return new MarkdownString(`| |\n|:---:|\n| ![](${icon}) |\n| [\`${key}\`](${url}) |`)
}
