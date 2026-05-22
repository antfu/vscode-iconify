import { readJSON } from './read-file'

// Mock modules before importing
jest.mock('node:fs/promises', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(),
  },
  readFile: jest.fn(),
}))

jest.mock('strip-json-comments', () => ({
  __esModule: true,
  default: jest.fn(),
}))

import fs from 'node:fs/promises'
import stripJsonComments from 'strip-json-comments'

describe('readJSON', () => {
  const mockReadFile = fs.readFile as jest.Mock
  const mockStripJsonComments = stripJsonComments as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should read a JSON file and parse it correctly', async () => {
    const mockContent = '{"name": "test", "value": 123}'
    const mockStrippedContent = '{"name": "test", "value": 123}'
    const expectedResult = { name: 'test', value: 123 }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(mockReadFile).toHaveBeenCalledWith('/path/to/file.json', { encoding: 'utf8' })
    expect(mockStripJsonComments).toHaveBeenCalledWith(mockContent, { trailingCommas: true })
    expect(result).toEqual(expectedResult)
  })

  it('should handle JSON with comments correctly', async () => {
    const mockContent = `{
      "name": "test", // This is a comment
      "value": 123
    }`
    const mockStrippedContent = `{
      "name": "test",
      "value": 123
    }`
    const expectedResult = { name: 'test', value: 123 }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(mockStripJsonComments).toHaveBeenCalledWith(mockContent, { trailingCommas: true })
    expect(result).toEqual(expectedResult)
  })

  it('should handle JSON with trailing commas correctly', async () => {
    const mockContent = `{
      "name": "test",
      "value": 123,
    }`
    const mockStrippedContent = `{
      "name": "test",
      "value": 123
    }`
    const expectedResult = { name: 'test', value: 123 }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(mockStripJsonComments).toHaveBeenCalledWith(mockContent, { trailingCommas: true })
    expect(result).toEqual(expectedResult)
  })

  it('should handle JSON with both comments and trailing commas', async () => {
    const mockContent = `{
      "name": "test", // comment here
      "value": 123,
    }`
    const mockStrippedContent = `{
      "name": "test",
      "value": 123
    }`
    const expectedResult = { name: 'test', value: 123 }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(mockStripJsonComments).toHaveBeenCalledWith(mockContent, { trailingCommas: true })
    expect(result).toEqual(expectedResult)
  })

  it('should handle nested objects and arrays', async () => {
    const mockContent = `{
      "config": {
        "env": "development", // environment setting
      },
      "items": [
        "item1", // first item
        "item2", // second item
      ]
    }`
    const mockStrippedContent = `{
      "config": {
        "env": "development"
      },
      "items": [
        "item1",
        "item2"
      ]
    }`
    const expectedResult = {
      config: { env: 'development' },
      items: ['item1', 'item2']
    }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(result).toEqual(expectedResult)
  })

  it('should throw an error when JSON parsing fails', async () => {
    const mockContent = '{ invalid json }'
    const mockStrippedContent = '{ invalid json }'

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    await expect(readJSON('/path/to/file.json')).rejects.toThrow()
  })

  it('should propagate file read errors', async () => {
    const error = new Error('File not found')
    mockReadFile.mockRejectedValue(error)

    await expect(readJSON('/path/to/file.json')).rejects.toThrow('File not found')
  })

  it('should handle empty JSON object', async () => {
    const mockContent = '{}'
    const mockStrippedContent = '{}'
    const expectedResult = {}

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(result).toEqual(expectedResult)
  })

  it('should handle JSON with various data types', async () => {
    const mockContent = `{
      "string": "value",
      "number": 42,
      "boolean": true,
      "nullValue": null,
      "array": [1, 2, "three"], // array with mixed types
    }`
    const mockStrippedContent = `{
      "string": "value",
      "number": 42,
      "boolean": true,
      "nullValue": null,
      "array": [1, 2, "three"]
    }`
    const expectedResult = {
      string: 'value',
      number: 42,
      boolean: true,
      nullValue: null,
      array: [1, 2, 'three']
    }

    mockReadFile.mockResolvedValue(mockContent)
    mockStripJsonComments.mockReturnValue(mockStrippedContent)

    const result = await readJSON('/path/to/file.json')

    expect(result).toEqual(expectedResult)
  })
})