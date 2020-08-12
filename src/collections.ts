import raw from './generated/collections'

export interface IconsetMeta {
  id: string
  name: string
  author: string
  icons: string[]
  height: number
  width: number
}

export const collections: IconsetMeta[] = JSON.parse(raw)

export const collectionIds = collections.map(i => i.id)
