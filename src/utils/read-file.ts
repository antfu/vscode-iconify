import type { PathLike } from 'node:fs'
import fs from 'node:fs/promises'
import stripJsonComments from 'strip-json-comments'

/**
 * Read and parse a JSON file.
 *
 * Note: The file can contain comments and trailing commas.
 */
export async function readJSON(filePath: PathLike) {
  const contents = await fs.readFile(filePath, { encoding: 'utf8' })
  const stripped = stripJsonComments(contents, { trailingCommas: true })
  return JSON.parse(stripped)
}
