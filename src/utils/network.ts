import type { IconifyJSON } from '@iconify/types'
import { ofetch } from 'ofetch'
import { Log } from './Log'

export async function fetchJSONFromURL(url: string): Promise<IconifyJSON | null> {
  try {
    let data = await ofetch<IconifyJSON>(url)
    if (typeof data === 'string') {
      // If the response is a string, try to parse it as JSON
      try {
        data = JSON.parse(data)
      }
      catch (e) {
        Log.error(`Failed to parse JSON from URL "${url}": ${e}`)
        return null
      }
    }
    return data
  }
  catch (error: any) {
    Log.error(`Failed to fetch JSON from URL "${url}": ${error.message || error}`)
    return null
  }
}
