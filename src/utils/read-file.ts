import type { PathLike } from 'fs-extra'
import fs from 'fs-extra'
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
