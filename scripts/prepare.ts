import type { IconifyMetaDataCollection } from '@iconify/json'
import type { IconifyJSON } from '@iconify/types'
import type { IconsetMeta } from '../src/collections'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../package.json' with { type: 'json' }

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const out = resolve(__dirname, '../src/generated')

async function prepareJSON() {
  const dir = resolve(__dirname, '../node_modules/@iconify/json')
  const raw: IconifyMetaDataCollection = JSON.parse(await readFile(join(dir, 'collections.json'), 'utf-8'))

  const collections = Object.entries(raw).map(([id, v]) => ({
    ...(v as any),
    id,
  }))

  const collectionsMeta: IconsetMeta[] = []

  for (const info of collections) {
    const setData: IconifyJSON = JSON.parse(await readFile(join(dir, 'json', `${info.id}.json`), 'utf-8'))

    const icons = Object.keys(setData.icons)
    const { id, name, author, height, license } = info
    const meta = { author: author.name, height, name, id, icons, license: license.spdk }
    collectionsMeta.push(meta)
  }

  const collectionsIds = collectionsMeta.map(i => i.id).sort()

  pkg.contributes.configuration.properties['iconify.includes'].items.enum = collectionsIds
  pkg.contributes.configuration.properties['iconify.excludes'].items.enum = collectionsIds
  await writeFile('./package.json', JSON.stringify(pkg, null, 2), 'utf-8')

  await mkdir(out, { recursive: true })
  await writeFile(join(out, 'collections.ts'), `export default \`${JSON.stringify(collectionsMeta)}\``, 'utf-8')
}

async function prepare() {
  await prepareJSON()
}

prepare()
