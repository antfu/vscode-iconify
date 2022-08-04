import type { IconifyIcon, IconifyJSON } from '@iconify/iconify'
import { $fetch } from 'ohmyfetch'
import type { ExtensionContext } from 'vscode'
import { pathToSvg, toDataUrl } from './utils/svgs'
import { Log } from './utils'
import { color, config, parseIcon } from './config'
import { collectionIds } from './collections'

const LoadedIconSets: Record<string, IconifyJSON> = {}
const dataURLCache: Record<string, string> = {}

let _tasks: Record<string, Promise<any>> = {}
export const UniqPromise = <T>(fn: (ctx: ExtensionContext, id: string) => Promise<T>) => {
  return async (ctx: ExtensionContext, id: string) => {
    if (!_tasks[id])
      _tasks[id] = fn(ctx, id)
    return await _tasks[id]
  }
}

export function clearCache(ctx: ExtensionContext) {
  for (const id of collectionIds) {
    ctx.globalState.update(`icons-${id}`, undefined)
    _tasks = {}
  }
}

export const LoadIconSet = UniqPromise(async (ctx: ExtensionContext, id: string) => {
  let data: IconifyJSON = LoadedIconSets[id]

  if (!data) {
    const key = `icons-${id}`
    const cached = ctx.globalState.get(key) as IconifyJSON | undefined
    if (cached && cached?.icons) {
      LoadedIconSets[id] = cached
      data = cached
      Log.info(`✅ [${id}] Loaded from disk`)
    }
    else {
      try {
        const url = `${config.cdnEntry}/${id}.json`
        Log.info(`☁️ [${id}] Downloading from ${url}`)
        data = await $fetch(url)
        Log.info(`✅ [${id}] Downloaded`)
        ctx.globalState.update(key, data)
        LoadedIconSets[id] = data!
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
    icon.width = data.width || 32

  if (!icon.height)
    icon.height = data.height || 32

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
