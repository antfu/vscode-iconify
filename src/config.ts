import { isAbsolute, resolve } from 'node:path'
import { ColorThemeKind, window, workspace } from 'vscode'
import fs from 'fs-extra'
import { computed, reactive, ref } from '@vue/reactivity'
import type { IconifyJSON } from '@iconify/iconify'
import { EXT_NAMESPACE } from './meta'
import type { IconsetMeta } from './collections'
import { collectionIds, collections } from './collections'
import { Log } from './utils'

const _configState = ref(0)

function getConfig<T = any>(key: string): T | undefined {
  return workspace
    .getConfiguration()
    .get<T>(key)
}

async function setConfig(key: string, value: any, isGlobal = true) {
  // update value
  return await workspace
    .getConfiguration()
    .update(key, value, isGlobal)
}

function createConfigRef<T>(key: string, defaultValue: T, isGlobal = true) {
  return computed({
    get: () => {
      // to force computed update
      // eslint-disable-next-line no-unused-expressions
      _configState.value
      return getConfig<T>(key) ?? defaultValue
    },
    set: (v) => {
      setConfig(key, v, isGlobal)
    },
  })
}

export const config = reactive({
  inplace: createConfigRef(`${EXT_NAMESPACE}.inplace`, true),
  annotations: createConfigRef(`${EXT_NAMESPACE}.annotations`, true),
  color: createConfigRef(`${EXT_NAMESPACE}.color`, 'auto'),
  delimiters: createConfigRef(`${EXT_NAMESPACE}.delimiters`, ['::', '--', '//', '@@', ':', '-', '/', '@']),
  includes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.includes`, null),
  excludes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.excludes`, null),
  fontSize: createConfigRef('editor.fontSize', 12),
  languageIds: createConfigRef(`${EXT_NAMESPACE}.languageIds`, []),
  cdnEntry: createConfigRef(`${EXT_NAMESPACE}.cdnEntry`, 'https://cdn.jsdelivr.net/gh/iconify/icon-sets/json'),
  customCollectionJsonPaths: createConfigRef(`${EXT_NAMESPACE}.customCollectionJsonPaths`, []),
})

export const customCollections = ref([] as IconifyJSON[])

export async function LoadCustomCollections() {
  const result = [] as IconifyJSON[]
  const files = Array.from(
    new Set(config.customCollectionJsonPaths.flatMap((file: string) => {
      if (isAbsolute(file))
        return [file]

      const list: string[] = []
      if (workspace?.workspaceFolders) {
        for (const folder of workspace.workspaceFolders)
          list.push(resolve(folder.uri.fsPath, file))
      }
      return list
    })),
  )

  const existingFiles = files.filter((file) => {
    const exists = fs.existsSync(file)
    if (!exists)
      Log.warning(`Custom collection file does not exist: ${file}`)
    return exists
  })

  if (existingFiles.length) {
    Log.info(`Loading custom collections from:\n${existingFiles.map(i => `  - ${i}`).join('\n')}`)

    await Promise.all(existingFiles.map(async (file) => {
      try {
        result.push(await fs.readJSON(file))
      }
      catch {
        Log.error(`Error on loading custom collection: ${file}`)
      }
    }))
  }

  customCollections.value = result
}

export const enabledCollectionIds = computed(() => {
  const includes = config.includes?.length ? config.includes : collectionIds
  const excludes = config.excludes || []

  return [...includes.filter(i => !excludes.includes(i)), ...customCollections.value.map(c => c.prefix)]
})

export const enabledCollections = computed<IconsetMeta[]>(() => {
  const customData: IconsetMeta[] = customCollections.value.map(c => ({
    id: c.prefix,
    name: c.info?.name,
    author: c.info?.author.name,
    icons: Object.keys(c.icons),
    height: c.info?.height,
  }))
  return [...collections, ...customData]
})

export const delimiters = computed(() => `(${escapeRegExp(config.delimiters.join('@delim@')).replace(/@delim@/g, '|')})`)
export const DelimitersSeperator = computed(() => new RegExp(delimiters.value, 'g'))
const startingDelim = new RegExp(`^${delimiters.value}`)

function verifyCollection(collection: string, str: string) {
  return startingDelim.test(str.replace(collection, ''))
}

export function parseIcon(str: string) {
  const collection = enabledCollectionIds.value.find(i => str.startsWith(i) && verifyCollection(i, str))
  if (!collection)
    return

  const icon = str.replace(collection, '').replace(startingDelim, '')
  if (!icon)
    return

  return { collection, icon }
}

export const color = computed(() => {
  return config.color === 'auto'
    ? isDarkTheme()
      ? '#eee'
      : '#222'
    : config.color
})

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export const REGEX_NAMESPACE = computed(() => {
  return new RegExp(`[^\\w\\d](${enabledCollectionIds.value.join('|')})${delimiters.value}[\\w-]*$`)
})

export const REGEX_FULL = computed(() => {
  return new RegExp(`[^\\w\\d]((?:${enabledCollectionIds.value.join('|')})${delimiters.value}[\\w-]+)`, 'g')
})

export async function onConfigUpdated() {
  _configState.value = +new Date()
  await LoadCustomCollections()
}

// First try the activeColorThemeKind (if available) otherwise apply regex on the color theme's name
function isDarkTheme() {
  const themeKind = window?.activeColorTheme?.kind
  if (themeKind && themeKind === ColorThemeKind?.Dark)
    return true

  const theme = createConfigRef('workbench.colorTheme', '', true)

  // must be dark
  if (theme.value.match(/dark|black/i) != null)
    return true

  // must be light
  if (theme.value.match(/light/i) != null)
    return false

  // IDK, maybe dark
  return true
}
