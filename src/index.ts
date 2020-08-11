import { ExtensionContext } from 'vscode'
import { version } from '../package.json'
import { Log } from './utils'
import { collections } from './collections'
import { RegisterCompletion } from './completions'
import { setCtx } from './ctx'
import { RegisterAnnotations } from './annotation'

export async function activate(ctx: ExtensionContext) {
  setCtx(ctx)
  Log.info(`🈶 Activated, v${version}`)

  Log.info(`🎛 ${collections.length} icon sets loaded`)

  RegisterCompletion()
  RegisterAnnotations()
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
