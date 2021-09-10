import { workspace } from 'vscode'
import { reactive, computed, ref } from '@vue/reactivity'
import { EXT_NAMESPACE } from './meta'
import { collectionIds } from './collections'

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
  delimiters: createConfigRef(`${EXT_NAMESPACE}.delimiters`, [':', '-', '/']),
  includes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.includes`, null),
  excludes: createConfigRef<string[] | null>(`${EXT_NAMESPACE}.excludes`, null),
  fontSize: createConfigRef('editor.fontSize', 12),
  languageIds: createConfigRef(`${EXT_NAMESPACE}.languageIds`, []),
})

export const enabledCollections = computed(() => {
  const includes = config.includes?.length ? config.includes : collectionIds
  const excludes = config.excludes || []

  return includes.filter(i => !excludes.includes(i))
})

export function parseIcon(str: string) {
  const collection = enabledCollections.value.find(i => str.startsWith(i))
  if (!collection)
    return

  if (!config.delimiters.includes(str[collection.length]))
    return

  const icon = str.slice(collection.length + 1)

  if (!icon)
    return

  return { collection, icon }
}

export const delimiters = computed(() => `[${escapeRegExp(config.delimiters.join(''))}]`)

export const DelimitersSeperator = computed(() => new RegExp(delimiters.value, 'g'))

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
  return new RegExp(`[^\\w\\d](${enabledCollections.value.join('|')})${delimiters.value}[\\w-]*$`)
})

export const REGEX_FULL = computed(() => {
  return new RegExp(`[^\\w\\d]((?:${enabledCollections.value.join('|')})${delimiters.value}[\\w-]+)`, 'g')
})

export function onConfigUpdated() {
  _configState.value = +new Date()
}

export function isDarkTheme() {
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
