import type { IconifyJSON } from '@iconify/types'
import type { IconsetMeta } from './collections'
import { isAbsolute, resolve } from 'node:path'
import fs from 'fs-extra'
import { computed, defineConfigObject, ref, shallowReactive, shallowRef, useFsWatcher, useIsDarkTheme, useWorkspaceFolders, watchEffect } from 'reactive-vscode'
import { Uri } from 'vscode'
import { collectionIds, collections } from './collections'
import * as Meta from './generated/meta'
import { deleteTask } from './loader'
import { Log, readJSON } from './utils'

export const config = defineConfigObject<Meta.NestedScopedConfigs>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)

export const editorConfig = defineConfigObject<{
  fontSize: number
}>(
  'editor',
  {
    fontSize: 12,
  },
)

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export const customCollections = shallowRef([] as IconifyJSON[])

export async function useCustomCollections() {
  const workspaceFolders = useWorkspaceFolders()

  /** key is URL.href */
  const result = shallowReactive(new Map<string, IconifyJSON>())
  const iconifyJsonPaths = computed(() => {
    const files = Array.from(
      new Set(config.customCollectionJsonPaths.flatMap((file: string) => {
        if (isAbsolute(file))
          return [file]

        const list: string[] = []
        if (workspaceFolders.value) {
          for (const folder of workspaceFolders.value)
            list.push(resolve(folder.uri.fsPath, file))
        }
        return list
      })),
    )

    return files.filter((file) => {
      const exists = fs.existsSync(file)
      if (!exists)
        Log.warn(`Custom collection file does not exist: ${file}`)
      return exists
    })
  })
  const { onDidChange, onDidDelete, onDidCreate } = useFsWatcher(iconifyJsonPaths)

  async function load(url: URL) {
    Log.info(`Loading custom collections from:\n${url}`)
    try {
      const val: IconifyJSON = await readJSON(url)
      result.set(url.href, val)
      deleteTask(val.prefix)
    }
    catch {
      Log.error(`Error on loading custom collection: ${url}`)
    }
  }

  // Initial load
  iconifyJsonPaths.value.forEach(p => load(new URL(Uri.file(p))))

  onDidChange(uri => load(new URL(uri)))
  onDidCreate(uri => load(new URL(uri)))
  onDidDelete(uri => result.delete(new URL(uri).href))

  watchEffect(() => customCollections.value = Array.from(result.values()))
}

export const customAliases = ref([] as Record<string, string>[])
const customAliasesFiles = ref([] as string[])

export async function useCustomAliases() {
  const workspaceFolders = useWorkspaceFolders()

  watchEffect(async () => {
    const result = [] as Record<string, string>[]
    const files = Array.from(
      new Set(config.customAliasesJsonPaths.flatMap((file: string) => {
        if (isAbsolute(file))
          return [file]

        const list: string[] = []
        if (workspaceFolders.value) {
          for (const folder of workspaceFolders.value)
            list.push(resolve(folder.uri.fsPath, file))
        }
        return list
      })),
    )

    const existingFiles = files.filter((file) => {
      const exists = fs.existsSync(file)
      if (!exists)
        Log.warn(`Custom aliases file does not exist: ${file}`)
      return exists
    })

    if (existingFiles.length) {
      Log.info(`Loading custom aliases from:\n${existingFiles.map(i => `  - ${i}`).join('\n')}`)

      await Promise.all(existingFiles.map(async (file) => {
        try {
          result.push(await readJSON(file))
        }
        catch {
          Log.error(`Error on loading custom aliases: ${file}`)
        }
      }))
    }

    customAliases.value = result
    customAliasesFiles.value = existingFiles
  })
}

export const enabledCollectionIds = computed(() => {
  const includes = config.includes?.length ? config.includes : collectionIds
  const excludes = config.excludes as string[] || []

  const collections = [
    ...includes.filter(i => !excludes.includes(i)),
    ...(Object.keys(config.customCollectionIdsMap)),
    ...customCollections.value.map(c => c.prefix),
  ]
  collections.sort((a, b) => b.length - a.length)
  return collections
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

export const enabledAliases = computed((): Record<string, string> => {
  const flat: Record<string, string> = {}
  for (const aliases of customAliases.value) {
    for (const [key, value] of Object.entries(aliases))
      flat[key] = value
  }
  return flat
})

export const enabledAliasIds = computed(() => {
  return Object.keys(enabledAliases.value)
})

export function isCustomAliasesFile(path: string) {
  return customAliasesFiles.value.includes(path)
}

const RE_PART_DELIMITERS = computed(() => `(${config.delimiters.map(i => escapeRegExp(i)).join('|')})`)

const RE_PART_PREFIXES = computed(() => {
  if (!config.prefixes.filter(Boolean).length)
    return ''
  const empty = config.prefixes.includes('')
  return `(?:${config.prefixes.filter(Boolean)
    .map(i => escapeRegExp(i))
    .join('|')})${empty ? '?' : ''}`
})

const RE_PART_SUFFIXES = computed(() => {
  if (!config.suffixes.filter(Boolean).length)
    return ''
  const empty = config.suffixes.includes('')
  return `(?:${config.suffixes.filter(Boolean)
    .map(i => escapeRegExp(i))
    .join('|')})${empty ? '?' : ''}`
})

export const REGEX_DELIMITERS = computed(() => new RegExp(RE_PART_DELIMITERS.value, 'g'))

export const REGEX_PREFIXED = computed(() => {
  return new RegExp(`[^\\w\\d]${RE_PART_PREFIXES.value}[\\w-]*$`)
})

export const REGEX_NAMESPACE = computed(() => {
  return new RegExp(`[^\\w\\d]${RE_PART_PREFIXES.value}(${enabledCollectionIds.value.join('|')})${RE_PART_DELIMITERS.value}[\\w-]*$`)
})

export const REGEX_COLLECTION_ICON = computed(() => {
  return new RegExp(`[^\\w\\d]((?:${enabledCollectionIds.value.join('|')})${RE_PART_DELIMITERS.value}[\\w-]+)(?=\\b[^-])`, 'g')
})

export const REGEX_FULL = computed(() => {
  if (config.customAliasesOnly)
    return new RegExp(`[^\\w\\d]${RE_PART_PREFIXES.value}(${enabledAliasIds.value.join('|')})${RE_PART_SUFFIXES.value}(?=\\b[^-])`, 'g')
  return new RegExp(`[^\\w\\d]${RE_PART_PREFIXES.value}((?:(?:${enabledCollectionIds.value.join('|')})${RE_PART_DELIMITERS.value}[\\w-]+)|(?:${enabledAliasIds.value.join('|')}))${RE_PART_SUFFIXES.value}(?=\\b[^-])`, 'g')
})

const REGEX_STARTING_DELIMITERS = computed(() => new RegExp(`^${RE_PART_DELIMITERS.value}`, 'g'))

function verifyCollection(collection: string, str: string) {
  return str.startsWith(collection) && REGEX_STARTING_DELIMITERS.value.test(str.slice(collection.length))
}

export function parseIcon(str: string) {
  const collection = enabledCollectionIds.value.find(c => verifyCollection(c, str))
  if (!collection)
    return

  const icon = str.slice(collection.length).replace(REGEX_STARTING_DELIMITERS.value, '')
  if (!icon)
    return

  return {
    collection: String(config.customCollectionIdsMap[collection] ?? collection),
    icon,
  }
}

const isDark = useIsDarkTheme()
export const color = computed(() => isDark.value ? '#eee' : '#222')
