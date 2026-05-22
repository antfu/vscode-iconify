import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { DecorationOptions } from 'vscode'
import { useCommand } from 'reactive-vscode'
import { config } from './config'
import * as meta from './generated/meta'
import { clearCache } from './loader'
import { useCommands } from './commands'

// Mock the dependencies
jest.mock('reactive-vscode', () => ({
  useCommand: jest.fn(),
}))

jest.mock('./config', () => ({
  config: {
    annotations: false,
    inplace: false,
    $update: jest.fn(),
  },
}))

jest.mock('./generated/meta', () => ({
  commands: {
    toggleAnnotations: 'extension.toggle-annotations',
    toggleInplace: 'extension.toggle-inplace',
    clearCache: 'extension.clear-cache',
  },
}))

jest.mock('./loader', () => ({
  clearCache: jest.fn(),
}))

// Import the actual functions after mocks are set up
const mockedUseCommand = useCommand as jest.MockedFunction<typeof useCommand>
const mockedConfig = config as jest.Mocked<typeof config>
const mockedClearCache = clearCache as jest.MockedFunction<typeof clearCache>

describe('Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set initial config values
    mockedConfig.annotations = false
    mockedConfig.inplace = false
  })

  test('should register toggleAnnotations command', () => {
    useCommands()

    expect(mockedUseCommand).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function)
    )

    // Verify that the toggleAnnotations command is registered
    const callArgs = mockedUseCommand.mock.calls
    const toggleAnnotationCall = callArgs.find(
      (call) => call[0] === 'extension.toggle-annotations'
    )
    expect(toggleAnnotationCall).toBeDefined()

    // Execute the toggle annotation callback
    const toggleAnnotationCallback = toggleAnnotationCall![1] as () => void
    toggleAnnotationCallback()

    // Verify that config was updated
    expect(mockedConfig.$update).toHaveBeenCalledWith('annotations', true)
  })

  test('should register toggleInplace command', () => {
    useCommands()

    // Verify that the toggleInplace command is registered
    const callArgs = mockedUseCommand.mock.calls
    const toggleInplaceCall = callArgs.find(
      (call) => call[0] === 'extension.toggle-inplace'
    )
    expect(toggleInplaceCall).toBeDefined()

    // Execute the toggle inplace callback
    const toggleInplaceCallback = toggleInplaceCall![1] as () => void
    toggleInplaceCallback()

    // Verify that config was updated
    expect(mockedConfig.$update).toHaveBeenCalledWith('inplace', true)
  })

  test('should register clearCache command', () => {
    useCommands()

    // Verify that the clearCache command is registered
    const callArgs = mockedUseCommand.mock.calls
    const clearCacheCall = callArgs.find(
      (call) => call[0] === 'extension.clear-cache'
    )
    expect(clearCacheCall).toBeDefined()

    // Execute the clear cache callback
    const clearCacheCallback = clearCacheCall![1] as () => void
    clearCacheCallback()

    // Verify that clearCache was called
    expect(mockedClearCache).toHaveBeenCalled()
  })

  test('should toggle annotations from true to false', () => {
    mockedConfig.annotations = true
    useCommands()

    const callArgs = mockedUseCommand.mock.calls
    const toggleAnnotationCall = callArgs.find(
      (call) => call[0] === 'extension.toggle-annotations'
    )
    
    const toggleAnnotationCallback = toggleAnnotationCall![1] as () => void
    toggleAnnotationCallback()

    expect(mockedConfig.$update).toHaveBeenCalledWith('annotations', false)
  })

  test('should toggle inplace from true to false', () => {
    mockedConfig.inplace = true
    useCommands()

    const callArgs = mockedUseCommand.mock.calls
    const toggleInplaceCall = callArgs.find(
      (call) => call[0] === 'extension.toggle-inplace'
    )
    
    const toggleInplaceCallback = toggleInplaceCall![1] as () => void
    toggleInplaceCallback()

    expect(mockedConfig.$update).toHaveBeenCalledWith('inplace', false)
  })

  test('should register all three commands', () => {
    useCommands()

    expect(mockedUseCommand).toHaveBeenCalledTimes(3)

    const registeredCommands = mockedUseCommand.mock.calls.map(call => call[0])
    expect(registeredCommands).toContain('extension.toggle-annotations')
    expect(registeredCommands).toContain('extension.toggle-inplace')
    expect(registeredCommands).toContain('extension.clear-cache')
  })
})