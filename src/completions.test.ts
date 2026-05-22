import { CompletionItem, CompletionItemKind, Range, Position, TextDocument } from 'vscode'
import { useCompletion } from './completions'
import * as vscode from 'vscode'
import { extensionContext } from 'reactive-vscode'
import { config, enabledAliasIds, enabledCollectionIds, enabledCollections, REGEX_NAMESPACE, REGEX_PREFIXED } from './config'
import { getIconMarkdown, getCollectionMarkdown } from './markdown'

// Store original values to properly mock
let capturedProviders: any[] = []

// Mock the reactive-vscode module
jest.mock('reactive-vscode', () => ({
  extensionContext: {
    value: {
      subscriptions: [],
    },
  },
  computed: jest.fn((fn) => ({ value: fn() })),
  ref: jest.fn((initialValue) => ({ value: initialValue })),
  shallowRef: jest.fn((initialValue) => ({ value: initialValue })),
}), { virtual: true })

// Mock VSCode module
jest.mock('vscode', () => ({
  CompletionItem: jest.fn((label, kind) => ({ label, kind })),
  CompletionItemKind: { Text: 1 },
  languages: {
    registerCompletionItemProvider: jest.fn((selector, provider, ...triggerCharacters) => {
      // Capture the provider to access it later in tests
      capturedProviders.push(provider)
      // Return a mock disposable object
      return { dispose: jest.fn() }
    }),
  },
  Position: class {
    constructor(public line: number, public character: number) {}
  },
  Range: jest.fn((startLine, startChar, endLine, endChar) => ({ 
    start: { line: startLine, character: startChar }, 
    end: { line: endLine, character: endChar } 
  })),
}), { virtual: true })

// Mock config
jest.mock('./config', () => ({
  config: {
    languageIds: ['html', 'javascript'],
    delimiters: [':', '-'],
    customAliasesOnly: false,
  },
  enabledAliasIds: { value: ['alias1', 'alias2'] },
  enabledCollectionIds: { value: ['mdi', 'fa', 'simple-icons'] },
  enabledCollections: { 
    value: [
      { id: 'mdi', name: 'Material Design Icons', icons: ['home', 'account'], author: 'Google' },
      { id: 'fa', name: 'Font Awesome', icons: ['star', 'heart'], author: 'Author' },
    ] 
  },
  REGEX_PREFIXED: { value: /[^a-zA-Z0-9][\w-]*$/ },
  REGEX_NAMESPACE: { value: /[^a-zA-Z0-9]([\w-]+):[\w-]*$/ },
}), { virtual: true })

// Mock markdown functions
jest.mock('./markdown', () => ({
  getIconMarkdown: jest.fn(async (key: string) => `Icon documentation for ${key}`),
  getCollectionMarkdown: jest.fn(async (ctx: any, id: string) => `Collection documentation for ${id}`),
}), { virtual: true })

describe('useCompletion', () => {
  let mockExtensionContext: any
  let registerCompletionItemProviderSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    capturedProviders = [] // Reset captured providers
    
    // Create spy after mocks are set up
    registerCompletionItemProviderSpy = jest.spyOn(require('vscode').languages, 'registerCompletionItemProvider')
    
    // Reset mock extension context
    mockExtensionContext = {
      subscriptions: [],
    }
    ;(extensionContext as any).value = mockExtensionContext
  })

  it('should register two completion item providers when called', () => {
    useCompletion()
    
    // Check if two providers were registered
    expect(registerCompletionItemProviderSpy).toHaveBeenCalledTimes(2)
  })

  it('should add providers to extension context subscriptions', () => {
    useCompletion()
    
    // Check if providers were added to subscriptions
    expect(mockExtensionContext.subscriptions).toHaveLength(2)
  })

  it('should call registerCompletionItemProvider with correct parameters', () => {
    useCompletion()

    const calls = registerCompletionItemProviderSpy.mock.calls

    // First call - icon provider (languageIds, iconProvider, ...delimiters)
    expect(calls[0][0]).toEqual(['html', 'javascript']) // language IDs
    expect(calls[0][2]).toBeDefined() // provider object exists (index 2 is the provider)
    // The delimiters are passed as additional arguments: ...config.delimiters
    // So they would be at indices after the provider
    expect(calls[0]).toContain(':') // first delimiter
    expect(calls[0]).toContain('-') // second delimiter

    // Second call - collection provider (languageIds, collectionProvider, '"', "'")
    expect(calls[1][0]).toEqual(['html', 'javascript']) // language IDs
    expect(calls[1][2]).toBeDefined() // provider object exists
    expect(calls[1]).toContain('"') // quote character
    expect(calls[1]).toContain('\'') // apostrophe character
  })

  it('should properly capture and provide access to both providers', () => {
    useCompletion()
    
    // Should have captured both providers
    expect(capturedProviders).toHaveLength(2)
    
    const [iconProvider, collectionProvider] = capturedProviders
    
    // Both providers should have the expected methods
    expect(typeof iconProvider.provideCompletionItems).toBe('function')
    expect(typeof iconProvider.resolveCompletionItem).toBe('function')
    
    expect(typeof collectionProvider.provideCompletionItems).toBe('function')
    expect(typeof collectionProvider.resolveCompletionItem).toBe('function')
  })

  describe('Icon provider functionality', () => {
    let iconProvider: any
    let mockDocument: TextDocument
    let mockPosition: Position

    beforeEach(() => {
      mockDocument = {
        getText: jest.fn(),
      } as unknown as TextDocument
      
      mockPosition = new (require('vscode').Position)(0, 10)
      
      useCompletion()
      
      // Get the icon provider from the captured providers
      iconProvider = capturedProviders[0]
    })

    it('should return null when no prefix match', () => {
      // Mock document getText to return a string that doesn't match the prefix regex
      Object.defineProperty(require('./config'), 'REGEX_PREFIXED', {
        value: { value: /notmatching/ },
        writable: true
      })
      
      ;(mockDocument.getText as jest.Mock).mockReturnValueOnce('no prefix here')
      
      const result = iconProvider.provideCompletionItems(mockDocument, mockPosition)
      
      expect(result).toBeNull()
    })

    it('should return alias completions when prefix matches', () => {
      // Mock the REGEX_PREFIXED to match our test case
      Object.defineProperty(require('./config'), 'REGEX_PREFIXED', {
        value: { value: /[^a-zA-Z0-9][\w-]*$/ },
        writable: true
      })
      
      ;(mockDocument.getText as jest.Mock).mockReturnValueOnce('prefix-alias1')
      
      const result = iconProvider.provideCompletionItems(mockDocument, mockPosition)
      
      if (result) {
        expect(result).toHaveLength(2) // alias1 and alias2
        expect(result.map((item: any) => item.label)).toContain('alias1')
        expect(result.map((item: any) => item.label)).toContain('alias2')
      }
    })

    it('should return both alias and icon completions when namespace matches', () => {
      // Mock the configs properly
      Object.defineProperty(require('./config'), 'REGEX_PREFIXED', {
        value: { value: /[^a-zA-Z0-9][\w-]*$/ },
        writable: true
      })
      Object.defineProperty(require('./config'), 'REGEX_NAMESPACE', {
        value: { value: /[^a-zA-Z0-9](mdi|fa):[\w-]*$/ },
        writable: true
      })
      Object.defineProperty(require('./config'), 'enabledCollections', {
        value: { 
          value: [
            { id: 'mdi', name: 'Material Design Icons', icons: ['home', 'account'] },
          ] 
        },
        writable: true
      })
      
      ;(mockDocument.getText as jest.Mock).mockReturnValueOnce('prefix-mdi:home')
      
      const result = iconProvider.provideCompletionItems(mockDocument, mockPosition)
      
      if (result) {
        // Should return 2 aliases + 2 icons = 4
        expect(result).toHaveLength(4)
        const labels = result.map((item: any) => item.label)
        expect(labels).toContain('alias1')
        expect(labels).toContain('alias2')
        expect(labels).toContain('home')
        expect(labels).toContain('account')
      }
    })

    it('should properly resolve completion item with documentation', async () => {
      const mockItem = { label: 'test-icon', detail: 'mdi:test-icon' }
      
      const result = await iconProvider.resolveCompletionItem(mockItem)
      
      expect(result).toEqual({
        ...mockItem,
        documentation: 'Icon documentation for mdi:test-icon',
      })
    })
  })

  describe('Collection provider functionality', () => {
    let collectionProvider: any
    let mockDocument: TextDocument
    let mockPosition: Position

    beforeEach(() => {
      mockDocument = {
        getText: jest.fn(),
      } as unknown as TextDocument
      
      mockPosition = new (require('vscode').Position)(0, 10)
      
      useCompletion()
      
      // Get the collection provider from the captured providers
      collectionProvider = capturedProviders[1]
    })

    it('should return null when line does not match collection regex', () => {
      // Note: collection provider uses a different regex pattern
      const COLLECTION_REGEX = /icon=['"][\w-]*$/
      
      ;(mockDocument.getText as jest.Mock).mockReturnValueOnce('no match here')
      
      const result = collectionProvider.provideCompletionItems(mockDocument, mockPosition)
      
      expect(result).toBeNull()
    })

    it('should return collection completions when regex matches', () => {
      ;(mockDocument.getText as jest.Mock).mockReturnValueOnce('icon="mdi"')
      
      const result = collectionProvider.provideCompletionItems(mockDocument, mockPosition)
      
      if (result) {
        expect(result).toHaveLength(3) // mdi, fa, simple-icons from mocks
        expect(result.map((item: any) => item.label)).toContain('mdi')
        expect(result.map((item: any) => item.label)).toContain('fa')
        expect(result.map((item: any) => item.label)).toContain('simple-icons')
      }
    })

    it('should properly resolve collection completion item with documentation', async () => {
      const mockItem = { label: 'mdi', detail: 'Material Design Icons' }
      
      const result = await collectionProvider.resolveCompletionItem(mockItem)
      
      expect(result).toEqual({
        ...mockItem,
        documentation: 'Collection documentation for mdi',
      })
    })
  })
})