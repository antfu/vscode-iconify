import { collectionIds } from './collections'

export const EXT_NAMESPACE = 'iconify'
export const EXT_ID = 'antfu.iconify'
export const EXT_NAME = 'Iconify IntelliSense'

export const COLLECTION_API = 'https://raw.githubusercontent.com/iconify/collections-json/master/json/'
export const SUPPORTED_LANG_IDS = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
  'vue',
  'svelte',
  'html',
  'pug',
]

export const REGEX_NAMESPACE = new RegExp(`[^\\w\\d](?:${collectionIds.join('|')}):`)
export const REGEX_FULL = new RegExp(`[^\\w\\d]((?:${collectionIds.join('|')}):[\\w-]+)`, 'g')
