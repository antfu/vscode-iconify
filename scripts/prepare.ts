import path from 'path'
import fs from 'fs-extra'

const out = path.resolve(__dirname, '../src/generated')

async function prepareJSON() {
  const dir = path.resolve(__dirname, '../node_modules/@iconify/json')
  const raw = await fs.readJSON(path.join(dir, 'collections.json'))

  const collections = Object.entries(raw).map(([id, v]) => ({
    ...(v as any),
    id,
  }))

  const collectionsMeta = []

  for (const info of collections) {
    const setData = await fs.readJSON(path.join(dir, 'json', `${info.id}.json`))

    const icons = Object.keys(setData.icons)
    const categories = setData.categories
    const meta = { ...info, icons, categories }
    delete meta.samples
    delete meta.categories
    collectionsMeta.push(meta)
  }

  await fs.ensureDir(out)
  await fs.writeFile(path.join(out, 'collections.ts'), `export default \`${JSON.stringify(collectionsMeta)}\``, 'utf-8')
}

async function prepare() {
  await prepareJSON()
}

prepare()
