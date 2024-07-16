import { defineExtension } from 'reactive-vscode'
import { version } from '../package.json'
import { Log } from './utils'
import { collections } from './collections'
import { useCompletion } from './completions'
import { useAnnotations } from './annotation'
import { useCommands } from './commands'
import { useCustomAliases, useCustomCollections } from './config'

const { activate, deactivate } = defineExtension(async () => {
  Log.info(`🈶 Activated, v${version}`)

  useCommands()

  await useCustomCollections()

  Log.info(`🎛 ${collections.length} icon sets loaded`)

  await useCustomAliases()

  Log.info(`🎛 ${collections.length} aliases loaded`)

  useCompletion()
  useAnnotations()
})

export { activate, deactivate }
