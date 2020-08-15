import { DecorationOptions, ExtensionContext, commands } from 'vscode'
import { config } from './config'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function RegisterCommands(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    commands.registerCommand('iconify.toggle-annotations', () => {
      config.annotations = !config.annotations
    }),
  )

  ctx.subscriptions.push(
    commands.registerCommand('iconify.toggle-inplace', () => {
      config.inplace = !config.inplace
    }),
  )
}
