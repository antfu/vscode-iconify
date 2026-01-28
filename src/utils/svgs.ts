import type { IconInfo } from '../loader'
import { iconToSVG } from '@iconify/utils'
import Base64 from './base64'

export function toDataUrl(str: string) {
  return `data:image/svg+xml;base64,${Base64.encode(str)}`
}

export function pathToSvg(info: IconInfo, fontSize: number) {
  const { body, width, height, left, top, rotate, hFlip, vFlip } = info
  const result = iconToSVG(
    { body, width, height, left, top },
    {
      height: `${fontSize}px`,
      rotate,
      hFlip,
      vFlip,
    },
  )

  const attributes = [
    'xmlns="http://www.w3.org/2000/svg"',
    'xmlns:xlink="http://www.w3.org/1999/xlink"',
    'preserveAspectRatio="xMidYMid meet"',
    ...Object
      .entries(result.attributes)
      .map(([key, value]) => `${key}="${value}"`),
  ]
  const formattedAttributes = attributes.join(' ')

  return `<svg ${formattedAttributes}>${result.body}</svg>`
}
