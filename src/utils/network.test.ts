import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { fetchJSONFromURL } from './network'
import { ofetch } from 'ofetch'
import { Log } from './Log'
import type { IconifyJSON } from '@iconify/types'

// Mock the external dependencies
jest.mock('ofetch', () => ({
  ofetch: jest.fn(),
}))

jest.mock('./Log', () => ({
  Log: {
    error: jest.fn(),
  },
}))

const mockedOfetch = ofetch as jest.MockedFunction<typeof ofetch>
const mockedLogError = Log.error as jest.MockedFunction<typeof Log.error>

// Define a proper IconifyJSON type for testing
const createMockIconifyJSON = (): IconifyJSON => ({
  prefix: 'test',
  icons: {
    home: {
      body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />',
    },
  },
  height: 24,
})

describe('network utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchJSONFromURL', () => {
    it('should fetch and return JSON data successfully', async () => {
      const mockData = createMockIconifyJSON()
      mockedOfetch.mockResolvedValue(mockData)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toEqual(mockData)
      expect(mockedLogError).not.toHaveBeenCalled()
    })

    it('should handle string response and parse it as JSON', async () => {
      const mockData = createMockIconifyJSON()
      const jsonString = JSON.stringify(mockData)
      mockedOfetch.mockResolvedValue(jsonString)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toEqual(mockData)
      expect(mockedLogError).not.toHaveBeenCalled()
    })

    it('should return null when string response cannot be parsed as JSON', async () => {
      const invalidJsonString = '{ invalid json }'
      mockedOfetch.mockResolvedValue(invalidJsonString)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toBeNull()
      expect(mockedLogError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON from URL')
      )
    })

    it('should return null when ofetch throws an error', async () => {
      const errorMessage = 'Network error'
      mockedOfetch.mockRejectedValue(new Error(errorMessage))

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toBeNull()
      expect(mockedLogError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch JSON from URL')
      )
      expect(mockedLogError).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage)
      )
    })

    it('should handle error objects without message property', async () => {
      const errorObject = { code: 'ECONNREFUSED', errno: 'ECONNREFUSED' }
      mockedOfetch.mockRejectedValue(errorObject)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(result).toBeNull()
      expect(mockedLogError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch JSON from URL')
      )
    })

    it('should handle different URL formats', async () => {
      const mockData = createMockIconifyJSON()
      mockedOfetch.mockResolvedValue(mockData)

      const result = await fetchJSONFromURL('http://localhost:3000/api/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('http://localhost:3000/api/data.json')
      expect(result).toEqual(mockData)
    })

    it('should return null when fetch returns null', async () => {
      mockedOfetch.mockResolvedValue(null)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toBeNull()
    })

    it('should return undefined when fetch returns undefined', async () => {
      mockedOfetch.mockResolvedValue(undefined)

      const result = await fetchJSONFromURL('https://example.com/data.json')

      expect(mockedOfetch).toHaveBeenCalledWith('https://example.com/data.json')
      expect(result).toBeUndefined()
    })
  })
})