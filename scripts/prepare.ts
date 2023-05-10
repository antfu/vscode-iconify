import path from 'node:path'
import fs from 'fs-extra'
import type { IconifyMetaDataCollection } from '@iconify/json'
import type { IconifyJSON } from '@iconify/iconify'
import type { IconsetMeta } from '../src/collections'

const out = path.resolve(__dirname, '../src/generated')

async function prepareJSON() {
  const dir = path.resolve(__dirname, '../node_modules/@iconify/json')
  const raw: IconifyMetaDataCollection = await fs.readJSON(path.join(dir, 'collections.json'))

  const collections = Object.entries(raw).map(([id, v]) => ({
    ...(v as any),
    id,
  }))

  const collectionsMeta: IconsetMeta[] = []

  for (const info of collections) {
    const setData: IconifyJSON = await fs.readJSON(path.join(dir, 'json', `${info.id}.json`))

    const icons = Object.keys(setData.icons)
    const { id, name, author, height, license } = info
    const meta = { author: author.name, height, name, id, icons, license: license.spdk }
    collectionsMeta.push(meta)
  }

  const collectionsIds = collectionsMeta.map(i => i.id).sort()

  const pkg = await fs.readJSON('./package.json')
  pkg.contributes.configuration.properties['iconify.includes'].items.enum = collectionsIds
  pkg.contributes.configuration.properties['iconify.excludes'].items.enum = collectionsIds
  await fs.writeJSON('./package.json', pkg, { spaces: 2 })

  await fs.ensureDir(out)
  await fs.writeFile(path.join(out, 'collections.ts'), `export default \`${JSON.stringify(collectionsMeta)}\``, 'utf-8')
}

async function prepare() {
  await prepareJSON()
}

prepare()
