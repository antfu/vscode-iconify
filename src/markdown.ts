import type { ExtensionContext } from 'vscode'
import { MarkdownString } from 'vscode'
import { config, enabledCollections } from './config'
import { getDataURL, getIconInfo } from './loader'

export async function getIconMarkdown(key: string) {
  const info = await getIconInfo(key)
  if (!info)
    return ''

  const icon = await getDataURL(info, 150)
  const setId = info.collection
  const url = `https://icones.js.org/collection/${setId}`
  const collection = enabledCollections.value.find(collection => collection.id === setId)
  return new MarkdownString(`| |\n|:---:|\n| ![](${icon}) |\n| [\`${key}\`](${url}) |\n\n${collection?.license ?? ''}`)
}

export async function getCollectionMarkdown(ctx: ExtensionContext, id: string) {
  const collection = enabledCollections.value.find(collection => collection.id === id)
  if (!collection)
    return ''

  const iconKeys = collection.icons.slice(0, 5)
  const icons = await Promise.all(iconKeys.map(key => getDataURL([id, key].join(config.delimiters[0]), 24)))
  const iconsMarkdown = icons.map(icon => `![](${icon})`).join('  ')

  const url = `https://icones.js.org/collection/${collection.id}`
  return new MarkdownString(`#### [${collection.name}](${url})\n${collection.author}\n\n${iconsMarkdown}\n\n${collection.license ?? ''}`)
}
