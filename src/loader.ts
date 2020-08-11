import type { IconifyJSON } from '@iconify/iconify'
import axios from 'axios'
import { ctx } from './ctx'
import { COLLECTION_API } from './meta'
import { toDataUrl, pathToSvg } from './utils/svgs'
import { Log } from './utils'

const LoadedIconSets: Record<string, IconifyJSON> = {}
const dataURLCache: Record<string, string> = {}

export const UniqPromise = <T>(fn: (id: string) => Promise<T>) => {
  const tasks: Record<string, Promise<T>> = {}

  return async(id: string) => {
    if (!tasks[id])
      tasks[id] = fn(id)
    return await tasks[id]
  }
}

export const LoadIconSet = UniqPromise(async(id: string) => {
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

export async function getDataURL(key: string) {
  if (dataURLCache[key])
    return dataURLCache[key]

  const [id, icon] = key.split(':', 2)
  const data = await LoadIconSet(id)
  const path = data?.icons?.[icon]?.body
  if (!data || !path)
    return ''

  dataURLCache[key] = toDataUrl(pathToSvg(path, data.width || 32, data.height || 32).replace(/currentColor/g, '#ddd'))
  return dataURLCache[key]
}
