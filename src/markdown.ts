import type { ExtensionContext } from 'vscode'
import { MarkdownString } from 'vscode'
import { DelimitersSeperator, config } from './config'
import { getDataURL, getIconInfo } from './loader'
import { collections } from './collections'

export async function getIconMarkdown(ctx: ExtensionContext, key: string) {
  const info = await getIconInfo(ctx, key)
  if (!info)
    return ''

  const icon = await getDataURL(ctx, info, 150)
  const setId = key.split(DelimitersSeperator.value)[0]
  const url = `https://icones.netlify.app/collection/${setId}`
  return new MarkdownString(`| |\n|:---:|\n| ![](${icon}) |\n| [\`${key}\`](${url}) |`)
}

export async function getCollectionMarkdown(ctx: ExtensionContext, id: string) {
  const collection = collections.find(collection => collection.id === id)
  if (!collection)
    return ''

  const iconKeys = collection.icons.slice(0, 5)
  const icons = await Promise.all(iconKeys.map(key => getDataURL(ctx, [id, key].join(config.delimiters[0]), 24)))
  const iconsMarkdown = icons.map(icon => `![](${icon})`).join('  ')

  const url = `https://icones.netlify.app/collection/${collection.id}`
  return new MarkdownString(`#### [${collection.name}](${url})\n${collection.author}\n\n${iconsMarkdown}`)
}
