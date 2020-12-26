import { DecorationOptions, ExtensionContext, commands } from 'vscode'
import { config } from './config'
import { clearCache } from './loader'

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

  ctx.subscriptions.push(
    commands.registerCommand('iconify.clear-cache', () => {
      clearCache(ctx)
    }),
  )
}
