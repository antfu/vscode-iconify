import { MarkdownString, ExtensionContext } from 'vscode'
import { DelimitersSeperator } from './config'
import { getDataURL, getIconInfo } from './loader'

export async function getIconMarkdown(ctx: ExtensionContext, key: string) {
  const info = await getIconInfo(ctx, key)
  if (!info)
    return ''

  const icon = await getDataURL(ctx, info, 150)
  const setId = key.split(DelimitersSeperator.value)[0]
  const url = `https://icones.netlify.app/collection/${setId}`
  return new MarkdownString(`| |\n|:---:|\n| ![](${icon}) |\n| [\`${key}\`](${url}) |`)
}
