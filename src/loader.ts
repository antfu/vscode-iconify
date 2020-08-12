import type { IconifyJSON } from '@iconify/iconify'
import axios from 'axios'
import { ExtensionContext } from 'vscode'
import { COLLECTION_API } from './meta'
import { toDataUrl, pathToSvg } from './utils/svgs'
import { Log } from './utils'

const LoadedIconSets: Record<string, IconifyJSON> = {}
const dataURLCache: Record<string, string> = {}

export const UniqPromise = <T>(fn: (ctx: ExtensionContext, id: string) => Promise<T>) => {
  const tasks: Record<string, Promise<T>> = {}

  return async(ctx: ExtensionContext, id: string) => {
    if (!tasks[id])
      tasks[id] = fn(ctx, id)
    return await tasks[id]
  }
}

export const LoadIconSet = UniqPromise(async(ctx: ExtensionContext, id: string) => {
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
        const url = `${COLLECTION_API}/${id}.json`
        Log.info(`☁️ [${id}] Downloading from ${url}`)
        data = (await axios.get(url)).data
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

export async function getDataURL(ctx: ExtensionContext, key: string, fontSize = '1em') {
  if (dataURLCache[fontSize + key])
    return dataURLCache[fontSize + key]

  const [id, icon] = key.split(':', 2)
  const data = await LoadIconSet(ctx, id)
  const path = data?.icons?.[icon]?.body
  if (!data || !path)
    return ''

  dataURLCache[fontSize + key] = toDataUrl(pathToSvg(path, data.width || 32, data.height || 32, fontSize).replace(/currentColor/g, '#ddd'))
  return dataURLCache[fontSize + key]
}
