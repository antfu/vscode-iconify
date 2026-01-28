import type { IconifyAlias, IconifyIcon, IconifyJSON } from '@iconify/types'
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import { extensionContext } from 'reactive-vscode'
import { Uri, workspace } from 'vscode'
import { color, config, customCollections, enabledAliases, parseIcon } from './config'
import { Log } from './utils'
import { pathToSvg, toDataUrl } from './utils/svgs'

let loadedIconSets: Record<string, IconifyJSON> = {}
let dataURLCache: Record<string, string> = {}

let _tasks: Record<string, Promise<any>> = {}
export function UniqPromise<T>(fn: (id: string) => Promise<T>) {
  return async (id: string) => {
    if (!_tasks[id])
      _tasks[id] = fn(id)
    return await _tasks[id]
  }
}
export function deleteTask(id: string) {
  return delete _tasks[id]
}

function getCacheUri() {
  return Uri.joinPath(extensionContext.value!.globalStorageUri, 'icon-set-cache')
}

function getCacheUriForIconSet(iconSetId: string) {
  return Uri.joinPath(getCacheUri(), `${iconSetId}.json`)
}

export async function clearCache() {
  const ctx = extensionContext.value!
  _tasks = {}
  await workspace.fs.delete(getCacheUri(), { recursive: true })

  // clear legacy cache
  for (const id of ctx.globalState.keys()) {
    if (id.startsWith('icons-'))
      ctx.globalState.update(id, undefined)
  }

  loadedIconSets = {}
  dataURLCache = {}
  Log.info('🗑️ Cleared all cache')
}

async function writeCache(iconSetId: string, data: IconifyJSON) {
  try {
    await workspace.fs.writeFile(
      getCacheUriForIconSet(iconSetId),
      Buffer.from(JSON.stringify(data)),
    )
  }
  catch (e) {
    Log.error(e)
  }
}

async function loadCache(iconSetId: string): Promise<IconifyJSON | undefined> {
  try {
    const buffer = await workspace.fs.readFile(getCacheUriForIconSet(iconSetId))
    return JSON.parse(buffer.toString())
  }
  catch {}
}

async function migrateCache() {
  const ctx = extensionContext.value!
  const prefix = 'icons-'
  for (const key of ctx.globalState.keys()) {
    if (key.startsWith(prefix)) {
      const cached = ctx.globalState.get<IconifyJSON>(key)!
      const iconSetId = key.slice(prefix.length)
      loadedIconSets[iconSetId] = cached
      await writeCache(iconSetId, cached)
      ctx.globalState.update(key, undefined)
      Log.info(`🔀 [${iconSetId}] Migrated iconset to new storage`)
    }
  }
}

export const LoadIconSet = UniqPromise(async (id: string) => {
  await migrateCache()

  let data: IconifyJSON = loadedIconSets[id] || customCollections.value.find(c => c.prefix === id)

  if (!data) {
    const cached = await loadCache(id)
    if (cached) {
      loadedIconSets[id] = cached
      data = cached
      Log.info(`✅ [${id}] Loaded from disk`)
    }
    else {
      try {
        const url = `${config.cdnEntry}/${id}.json`
        Log.info(`⏳ [${id}] Downloading from ${url}`)
        data = await $fetch(url)
        Log.info(`✅ [${id}] Downloaded`)
        loadedIconSets[id] = data
        writeCache(id, data)
      }
      catch (e) {
        Log.error(e, true)
      }
    }
  }

  return data
})

export interface IconInfo extends IconifyIcon {
  width: number
  height: number
  key: string
  ratio: number
  collection: string
  id: string
}

function normalizeIcon(icon: IconifyIcon, data: IconifyJSON): IconifyIcon {
  const normalized: IconifyIcon = { ...icon }

  normalized.left = normalized.left ?? data.left ?? 0
  normalized.top = normalized.top ?? data.top ?? 0
  normalized.width = normalized.width ?? data.width ?? 16
  normalized.height = normalized.height ?? data.height ?? 16

  if (normalized.rotate)
    normalized.rotate = normalized.rotate % 4

  return normalized
}

function mergeAlias(parent: IconifyIcon, alias: IconifyAlias): IconifyIcon {
  const merged: IconifyIcon = { ...parent }

  if (alias.left != null)
    merged.left = alias.left
  if (alias.top != null)
    merged.top = alias.top
  if (alias.width != null)
    merged.width = alias.width
  if (alias.height != null)
    merged.height = alias.height

  const parentRotate = parent.rotate ?? 0
  const aliasRotate = alias.rotate ?? 0
  const rotate = (parentRotate + aliasRotate) % 4
  if (rotate)
    merged.rotate = rotate
  else
    delete merged.rotate

  const hFlip = parent.hFlip !== alias.hFlip
  if (hFlip)
    merged.hFlip = true
  else
    delete merged.hFlip

  const vFlip = parent.vFlip !== alias.vFlip
  if (vFlip)
    merged.vFlip = true
  else
    delete merged.vFlip

  return merged
}

function resolveIconData(data: IconifyJSON, name: string): IconifyIcon | null {
  const visited = new Set<string>()

  const resolve = (key: string): IconifyIcon | null => {
    if (visited.has(key))
      return null
    visited.add(key)

    const icon = data.icons?.[key]
    if (icon)
      return normalizeIcon(icon, data)

    const alias = data.aliases?.[key]
    if (!alias)
      return null

    const parent = resolve(alias.parent)
    if (!parent)
      return null

    return normalizeIcon(mergeAlias(parent, alias), data)
  }

  return resolve(name)
}

export async function getIconInfo(key: string, allowAliases = true) {
  const alias = allowAliases ? enabledAliases.value[key] : undefined
  if (allowAliases && config.customAliasesOnly && !alias)
    return

  const actualKey = alias ?? key

  const result = parseIcon(actualKey)
  if (!result)
    return

  const data = await LoadIconSet(result.collection)
  if (!data)
    return null

  const iconData = resolveIconData(data, result.icon)
  if (!iconData)
    return null

  const width = iconData.width ?? data.width ?? 16
  const height = iconData.height ?? data.height ?? 16

  const icon: IconInfo = {
    ...iconData,
    width,
    height,
    collection: result.collection,
    id: result.icon,
    key: actualKey,
    ratio: (width / height) || 1,
  }

  return icon
}

export async function getDataURL(key: string, fontSize?: number): Promise<string>
export async function getDataURL(info: IconInfo, fontSize?: number): Promise<string>
export async function getDataURL(keyOrInfo: string | IconInfo, fontSize = 32) {
  const key = typeof keyOrInfo === 'string' ? keyOrInfo : keyOrInfo.key

  const cacheKey = color.value + fontSize + key
  if (dataURLCache[cacheKey])
    return dataURLCache[cacheKey]

  const info = typeof keyOrInfo === 'string'
    ? await getIconInfo(key)
    : keyOrInfo

  if (!info)
    return ''

  dataURLCache[cacheKey] = toDataUrl(pathToSvg(info, fontSize).replace(/currentColor/g, color.value))
  return dataURLCache[cacheKey]
}
