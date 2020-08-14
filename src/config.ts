import { workspace } from 'vscode'
import { reactive, computed, ref } from '@vue/reactivity'
import { EXT_NAMESPACE } from './meta'

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
      // eslint-disable-next-line
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
  annonations: createConfigRef(`${EXT_NAMESPACE}.annonations`, true),
  fontSize: createConfigRef('editor.fontSize', 12),
})

export function onConfigUpdated() {
  _configState.value = +new Date()
}
