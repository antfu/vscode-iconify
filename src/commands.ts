import type { DecorationOptions, ExtensionContext } from 'vscode'
import { commands } from 'vscode'
import { config } from './config'
import { clearCache } from './loader'
import * as meta from './generated/meta'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function RegisterCommands(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    commands.registerCommand(meta.commands.toggleAnnotations, () => {
      config.annotations = !config.annotations
    }),
  )

  ctx.subscriptions.push(
    commands.registerCommand(meta.commands.toggleInplace, () => {
      config.inplace = !config.inplace
    }),
  )

  ctx.subscriptions.push(
    commands.registerCommand(meta.commands.clearCache, () => {
      clearCache(ctx)
    }),
  )
}
