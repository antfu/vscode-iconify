import { defineExtension } from 'reactive-vscode'
import { version } from '../package.json'
import { Log } from './utils'
import { collections } from './collections'
import { RegisterCompletion } from './completions'
import { RegisterAnnotations } from './annotation'
import { RegisterCommands } from './commands'
import { LoadCustomAliases, LoadCustomCollections } from './config'

const { activate, deactivate } = defineExtension(async () => {
  Log.info(`🈶 Activated, v${version}`)

  RegisterCommands()

  await LoadCustomCollections()

  Log.info(`🎛 ${collections.length} icon sets loaded`)

  await LoadCustomAliases()

  Log.info(`🎛 ${collections.length} aliases loaded`)

  RegisterCompletion()
  RegisterAnnotations()
})

export { activate, deactivate }
