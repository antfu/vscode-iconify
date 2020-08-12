import { workspace } from 'vscode'
import { EXT_NAMESPACE } from './meta'

export const config = {
  get hideName() {
    return this.getConfig<boolean>('hideName') ?? false
  },

  // config
  getConfig<T = any>(key: string): T | undefined {
    return workspace
      .getConfiguration(EXT_NAMESPACE)
      .get<T>(key)
  },

  async setConfig(key: string, value: any, isGlobal = false) {
    // update value
    return await workspace
      .getConfiguration(EXT_NAMESPACE)
      .update(key, value, isGlobal)
  },
}
