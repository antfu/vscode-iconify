import { ExtensionContext, MarkdownString } from 'vscode'
import { getIconMarkdown, getCollectionMarkdown } from './markdown'
import { config, enabledCollections } from './config'
import { getDataURL, getIconInfo } from './loader'

// Mock the dependencies
jest.mock('./config', () => ({
  config: {
    delimiters: ['-', '_']
  },
  enabledCollections: {
    value: []
  }
}))

jest.mock('./loader', () => ({
  getDataURL: jest.fn(),
  getIconInfo: jest.fn()
}))

jest.mock('vscode', () => ({
  MarkdownString: jest.fn().mockImplementation((value) => ({ value })),
  Uri: {
    parse: jest.fn((str) => ({ path: str }))
  }
}))

// Define the types for our mocks
const mockedConfig = require('./config')
const mockedLoader = require('./loader')

describe('getIconMarkdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset enabledCollections mock
    mockedConfig.enabledCollections.value = []
  })

  it('should return empty string when getIconInfo returns null', async () => {
    mockedLoader.getIconInfo.mockResolvedValue(null)

    const result = await getIconMarkdown('test-icon')

    expect(result).toBe('')
    expect(mockedLoader.getIconInfo).toHaveBeenCalledWith('test-icon')
  })

  it('should return MarkdownString with icon info when getIconInfo returns valid data', async () => {
    const mockIconInfo = {
      collection: 'test-collection',
      name: 'test-icon'
    }
    const mockDataURL = 'data:image/svg+xml;base64,test-data'
    const mockCollection = {
      id: 'test-collection',
      name: 'Test Collection',
      license: 'MIT'
    }

    // Setup mocks
    mockedLoader.getIconInfo.mockResolvedValue(mockIconInfo)
    mockedLoader.getDataURL.mockResolvedValue(mockDataURL)
    mockedConfig.enabledCollections.value = [mockCollection]

    const result = await getIconMarkdown('test-icon')

    // Check that all necessary functions were called
    expect(mockedLoader.getIconInfo).toHaveBeenCalledWith('test-icon')
    expect(mockedLoader.getDataURL).toHaveBeenCalledWith(mockIconInfo, 150)

    // Verify the result is a MarkdownString (checking for expected properties)
    expect(result).toHaveProperty('value')

    // Verify the content of the MarkdownString
    const expectedContent = `| |\n|:---:|\n| ![](${mockDataURL}) |\n| [\`test-icon\`](https://icones.js.org/collection/test-collection) |\n\nMIT`
    expect((result as any).value).toBe(expectedContent)
  })

  it('should handle collection without license', async () => {
    const mockIconInfo = {
      collection: 'test-collection',
      name: 'test-icon'
    }
    const mockDataURL = 'data:image/svg+xml;base64,test-data'
    const mockCollection = {
      id: 'test-collection',
      name: 'Test Collection'
      // No license property
    }

    // Setup mocks
    mockedLoader.getIconInfo.mockResolvedValue(mockIconInfo)
    mockedLoader.getDataURL.mockResolvedValue(mockDataURL)
    mockedConfig.enabledCollections.value = [mockCollection]

    const result = await getIconMarkdown('test-icon')

    // Verify the content ends with an empty string for missing license
    const expectedContent = `| |\n|:---:|\n| ![](${mockDataURL}) |\n| [\`test-icon\`](https://icones.js.org/collection/test-collection) |\n\n`
    expect((result as any).value).toBe(expectedContent)
  })
})

describe('getCollectionMarkdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset enabledCollections mock
    mockedConfig.enabledCollections.value = []
  })

  it('should return empty string when collection is not found', async () => {
    mockedConfig.enabledCollections.value = []

    const result = await getCollectionMarkdown({} as ExtensionContext, 'non-existent-collection')

    expect(result).toBe('')
  })

  it('should return MarkdownString with collection info when collection is found', async () => {
    const mockCollection = {
      id: 'test-collection',
      name: 'Test Collection',
      author: 'Test Author',
      license: 'MIT',
      icons: ['icon1', 'icon2', 'icon3']
    }

    const mockDataURLs = [
      'data:image/svg+xml;base64,icon1-data',
      'data:image/svg+xml;base64,icon2-data',
      'data:image/svg+xml;base64,icon3-data'
    ]

    // Setup mocks
    mockedConfig.enabledCollections.value = [mockCollection]
    mockedLoader.getDataURL
      .mockResolvedValueOnce(mockDataURLs[0])
      .mockResolvedValueOnce(mockDataURLs[1])
      .mockResolvedValueOnce(mockDataURLs[2])

    const result = await getCollectionMarkdown({} as ExtensionContext, 'test-collection')

    // Verify getDataURL was called for each icon
    expect(mockedLoader.getDataURL).toHaveBeenCalledTimes(3)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(1, 'test-collection-icon1', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(2, 'test-collection-icon2', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(3, 'test-collection-icon3', 24)

    // Verify the result is a MarkdownString (checking for expected properties)
    expect(result).toHaveProperty('value')

    // Verify the content of the MarkdownString
    const expectedContent = `#### [Test Collection](https://icones.js.org/collection/test-collection)\nTest Author\n\n![](${mockDataURLs[0]})  ![](${mockDataURLs[1]})  ![](${mockDataURLs[2]})\n\nMIT`
    expect((result as any).value).toBe(expectedContent)
  })

  it('should limit to 5 icons even if collection has more', async () => {
    const mockCollection = {
      id: 'test-collection',
      name: 'Test Collection',
      author: 'Test Author',
      license: 'MIT',
      icons: ['icon1', 'icon2', 'icon3', 'icon4', 'icon5', 'icon6', 'icon7'] // 7 icons
    }

    // Only mock the first 5 data URLs since the function only processes 5 icons
    const mockDataURLs = [
      'data:image/svg+xml;base64,icon1-data',
      'data:image/svg+xml;base64,icon2-data',
      'data:image/svg+xml;base64,icon3-data',
      'data:image/svg+xml;base64,icon4-data',
      'data:image/svg+xml;base64,icon5-data'
    ]

    // Setup mocks
    mockedConfig.enabledCollections.value = [mockCollection]
    mockedLoader.getDataURL
      .mockResolvedValueOnce(mockDataURLs[0])
      .mockResolvedValueOnce(mockDataURLs[1])
      .mockResolvedValueOnce(mockDataURLs[2])
      .mockResolvedValueOnce(mockDataURLs[3])
      .mockResolvedValueOnce(mockDataURLs[4])

    const result = await getCollectionMarkdown({} as ExtensionContext, 'test-collection')

    // getDataURL should only be called 5 times (for the first 5 icons)
    expect(mockedLoader.getDataURL).toHaveBeenCalledTimes(5)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(1, 'test-collection-icon1', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(2, 'test-collection-icon2', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(3, 'test-collection-icon3', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(4, 'test-collection-icon4', 24)
    expect(mockedLoader.getDataURL).toHaveBeenNthCalledWith(5, 'test-collection-icon5', 24)
  })

  it('should handle collection without license', async () => {
    const mockCollection = {
      id: 'test-collection',
      name: 'Test Collection',
      author: 'Test Author',
      // No license property
      icons: ['icon1', 'icon2']
    }

    const mockDataURLs = [
      'data:image/svg+xml;base64,icon1-data',
      'data:image/svg+xml;base64,icon2-data'
    ]

    // Setup mocks
    mockedConfig.enabledCollections.value = [mockCollection]
    mockedLoader.getDataURL
      .mockResolvedValueOnce(mockDataURLs[0])
      .mockResolvedValueOnce(mockDataURLs[1])

    const result = await getCollectionMarkdown({} as ExtensionContext, 'test-collection')

    // Verify the content ends with an empty string for missing license
    const expectedContent = `#### [Test Collection](https://icones.js.org/collection/test-collection)\nTest Author\n\n![](${mockDataURLs[0]})  ![](${mockDataURLs[1]})\n\n`
    expect((result as any).value).toBe(expectedContent)
  })
})