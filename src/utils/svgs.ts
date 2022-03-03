import type { IconInfo } from '../loader'
import Base64 from './base64'

export function toDataUrl(str: string) {
  return `data:image/svg+xml;base64,${Base64.encode(str)}`
}

export function pathToSvg(info: IconInfo, fontSize: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${fontSize * info.ratio}px" height="${fontSize}px" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${info.width} ${info.height}">${info.body}</svg>`
}
