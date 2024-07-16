import type { DecorationOptions } from 'vscode'
import { useCommand } from 'reactive-vscode'
import { config } from './config'
import { clearCache } from './loader'
import * as meta from './generated/meta'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export function useCommands() {
  useCommand(meta.commands.toggleAnnotations, () => {
    config.$update('annotations', !config.annotations)
  })

  useCommand(meta.commands.toggleInplace, () => {
    config.$update('inplace', !config.inplace)
  })

  useCommand(meta.commands.clearCache, () => {
    clearCache()
  })
}
