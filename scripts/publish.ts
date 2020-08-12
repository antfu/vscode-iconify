import { execSync } from 'child_process'
import fs from 'fs-extra'

async function publish() {
  await fs.remove('./dist')
  execSync('npm run build', { stdio: 'inherit' })

  const files = ['LICENSE', 'README.md', 'snippets', '.vscodeignore']

  for (const f of files)
    await fs.copy(`./${f}`, `./dist/${f}`)

  const json = await fs.readJSON('./package.json')
  delete json.scripts
  delete json.devDependencies
  json.main = 'index.js'
  await fs.writeJSON('./dist/package.json', json)

  execSync('npm i --only=production --no-package-lock', { stdio: 'inherit', cwd: './dist' })

  execSync('vsce publish', { stdio: 'inherit', cwd: './dist' })
}

publish()
