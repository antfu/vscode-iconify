import { defineExtension } from 'reactive-vscode'
import { version } from '../package.json'
import { useAnnotations } from './annotation'
import { collections } from './collections'
import { useCommands } from './commands'
import { useCompletion } from './completions'
import { useCustomAliases, useCustomCollections } from './config'
import { Log } from './utils'

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
