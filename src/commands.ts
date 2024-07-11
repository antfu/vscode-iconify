import type { DecorationOptions } from 'vscode'
import { useCommand } from 'reactive-vscode'
import { config } from './config'
import { clearCache } from './loader'
import * as meta from './generated/meta'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function RegisterCommands() {
  useCommand(meta.commands.toggleAnnotations, () => {
    config.annotations = !config.annotations
  })

  useCommand(meta.commands.toggleInplace, () => {
    config.inplace = !config.inplace
  })

  useCommand(meta.commands.clearCache, () => {
    clearCache()
  })
}
