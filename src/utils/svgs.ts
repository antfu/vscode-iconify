import Base64 from './base64'

export function toDataUrl(str: string) {
  return `data:image/svg+xml;base64,${Base64.encode(str)}`
}

export function pathToSvg(str: string, width: number, height: number, fontSize = '1em') {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${fontSize}" height="${fontSize}" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${width} ${height}">${str}</svg>`
}
