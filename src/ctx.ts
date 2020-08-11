import { ExtensionContext } from 'vscode'
import { collectionIds } from './collections'

// eslint-disable-next-line
export let ctx: ExtensionContext = null!

export function setCtx(_ctx: ExtensionContext) {
  ctx = _ctx
  collectionIds.map(i =>
    ctx.globalState.update(i, undefined),
  )
}
