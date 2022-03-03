import type { ExtensionContext } from 'vscode'
import { version } from '../package.json'
import { Log } from './utils'
import { collections } from './collections'
import { RegisterCompletion } from './completions'
import { RegisterAnnotations } from './annotation'
import { RegisterCommands } from './commands'

export async function activate(ctx: ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)

  Log.info(`🎛 ${collections.length} icon sets loaded`)

  RegisterCommands(ctx)
  RegisterCompletion(ctx)
  RegisterAnnotations(ctx)
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
