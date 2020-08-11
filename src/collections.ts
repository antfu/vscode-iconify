import raw from './generated/collections.json'

export interface IconsetMeta {
  id: string
  name: string
  author: string
  icons: string[]
  height: number
  width: number
}

export const collections: IconsetMeta[] = raw as any

export const collectionIds = collections.map(i => i.id)
