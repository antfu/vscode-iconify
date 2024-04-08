import { Buffer } from 'node:buffer'
import type { IconifyIcon, IconifyJSON } from '@iconify/iconify'
import { $fetch } from 'ofetch'
import type { ExtensionContext } from 'vscode'
import { Uri, workspace } from 'vscode'
import { pathToSvg, toDataUrl } from './utils/svgs'
import { Log } from './utils'
import { color, config, customCollections, parseIcon } from './config'

let loadedIconSets: Record<string, IconifyJSON> = {}
let dataURLCache: Record<string, string> = {}

let _tasks: Record<string, Promise<any>> = {}
export function UniqPromise<T>(fn: (ctx: ExtensionContext, id: string) => Promise<T>) {
  return async (ctx: ExtensionContext, id: string) => {
    if (!_tasks[id])
      _tasks[id] = fn(ctx, id)
    return await _tasks[id]
  }
}

function getCacheUri(ctx: ExtensionContext) {
  return Uri.joinPath(ctx.globalStorageUri, 'icon-set-cache')
}

function getCacheUriForIconSet(ctx: ExtensionContext, iconSetId: string) {
  return Uri.joinPath(getCacheUri(ctx), `${iconSetId}.json`)
}

export async function clearCache(ctx: ExtensionContext) {
  _tasks = {}
  await workspace.fs.delete(getCacheUri(ctx), { recursive: true })

  // clear legacy cache
  for (const id of ctx.globalState.keys()) {
    if (id.startsWith('icons-'))
      ctx.globalState.update(id, undefined)
  }

  loadedIconSets = {}
  dataURLCache = {}
  Log.info('🗑️ Cleared all cache')
}

async function writeCache(ctx: ExtensionContext, iconSetId: string, data: IconifyJSON) {
  try {
    await workspace.fs.writeFile(
      getCacheUriForIconSet(ctx, iconSetId),
      Buffer.from(JSON.stringify(data)),
    )
  }
  catch (e) {
    Log.error(e)
  }
}

async function loadCache(ctx: ExtensionContext, iconSetId: string): Promise<IconifyJSON | undefined> {
  try {
    const buffer = await workspace.fs.readFile(getCacheUriForIconSet(ctx, iconSetId))
    return JSON.parse(buffer.toString())
  }
  catch (_) {}
}

async function migrateCache(ctx: ExtensionContext) {
  const prefix = 'icons-'
  for (const key of ctx.globalState.keys()) {
    if (key.startsWith(prefix)) {
      const cached = ctx.globalState.get<IconifyJSON>(key)!
      const iconSetId = key.slice(prefix.length)
      loadedIconSets[iconSetId] = cached
      await writeCache(ctx, iconSetId, cached)
      ctx.globalState.update(key, undefined)
      Log.info(`🔀 [${iconSetId}] Migrated iconset to new storage`)
    }
  }
}

export const LoadIconSet = UniqPromise(async (ctx: ExtensionContext, id: string) => {
  await migrateCache(ctx)

  let data: IconifyJSON = loadedIconSets[id] || customCollections.value.find(c => c.prefix === id)

  if (!data) {
    const cached = await loadCache(ctx, id)
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
        writeCache(ctx, id, data)
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

export async function getIconInfo(ctx: ExtensionContext, key: string) {
  const result = parseIcon(key)
  if (!result)
    return

  const data = await LoadIconSet(ctx, result.collection)
  const icon = data?.icons?.[result.icon] as IconInfo
  if (!data || !icon)
    return null

  if (!icon.width)
    icon.width = data.width || 16

  if (!icon.height)
    icon.height = data.height || 16

  icon.collection = result.collection
  icon.id = result.icon
  icon.key = key
  icon.ratio = (data.width! / data.height!) || 1

  return icon
}

export async function getDataURL(ctx: ExtensionContext, key: string, fontSize?: number): Promise<string>
export async function getDataURL(ctx: ExtensionContext, info: IconInfo, fontSize?: number): Promise<string>
export async function getDataURL(ctx: ExtensionContext, keyOrInfo: string | IconInfo, fontSize = 32) {
  const key = typeof keyOrInfo === 'string' ? keyOrInfo : keyOrInfo.key

  const cacheKey = color.value + fontSize + key
  if (dataURLCache[cacheKey])
    return dataURLCache[cacheKey]

  const info = typeof keyOrInfo === 'string' ? await getIconInfo(ctx, key) : keyOrInfo

  if (!info)
    return ''

  dataURLCache[cacheKey] = toDataUrl(pathToSvg(info, fontSize).replace(/currentColor/g, color.value))
  return dataURLCache[cacheKey]
}
