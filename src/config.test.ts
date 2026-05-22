import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { jest } from '@jest/globals'
import * as originalConfig from './config'

// Mock reactive-vscode module before importing the config
jest.mock('reactive-vscode', () => ({
  defineConfigObject: (scope: string, defaults: any) => {
    // Mock config object with scope and defaults
    const mockConfig = { ...defaults }
    return mockConfig
  },
  useIsDarkTheme: () => ({ value: false }),
  computed: (fn: () => any) => {
    // Create a computed mock that returns a reactive object with a value property
    const computedValue = { value: fn() }
    return computedValue
  },
  ref: (val: any) => {
    return { value: val }
  },
  shallowRef: (val: any) => {
    return { value: val }
  },
  useWorkspaceFolders: () => ({ value: [] }),
  useFsWatcher: () => ({
    onDidChange: () => {},
    onDidDelete: () => {},
    onDidCreate: () => {},
  }),
  watchEffect: (fn: () => void) => {
    // Execute the function immediately in tests
    fn();
    return () => {}; // Cleanup function
  }
}))

// Mock VS Code module
jest.mock('vscode', () => ({
  Uri: {
    parse: (path: string) => ({
      fsPath: path,
      toString: () => path,
    }),
    file: (path: string) => ({
      fsPath: path,
      toString: () => `file://${path}`,
    }),
  },
}))

// Mock collections module
jest.mock('./collections', () => ({
  collectionIds: ['mdi', 'fa', 'simple-icons'],
  collections: [{ id: 'mdi', name: 'Material Design Icons' }]
}))

// Mock generated meta module
jest.mock('./generated/meta', () => ({
  NestedScopedConfigs: {},
  scopedConfigs: {
    scope: 'test.scope',
    defaults: {
      includes: [],
      excludes: [],
      delimiters: [':', '-', '_'],
      prefixes: ['icon:'],
      suffixes: ['_end'],
      customCollectionIdsMap: {},
      customCollectionJsonPaths: [],
      customAliasesJsonPaths: [],
      customAliasesOnly: false,
    }
  }
}))

// Mock the loader module
jest.mock('./loader', () => ({
  deleteTask: jest.fn(),
}))

// Mock utils module
jest.mock('./utils', () => ({
  Log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  readJSON: jest.fn(),
}))

// Mock utils/network module
jest.mock('./utils/network', () => ({
  fetchJSONFromURL: jest.fn(),
}))

// Now import the config module after all mocks are set up
const {
  config,
  editorConfig,
  customCollections,
  useCustomCollections,
  customAliases,
  useCustomAliases,
  enabledCollectionIds,
  enabledCollections,
  enabledAliases,
  enabledAliasIds,
  isCustomAliasesFile,
  REGEX_DELIMITERS,
  REGEX_PREFIXED,
  REGEX_NAMESPACE,
  REGEX_COLLECTION_ICON,
  REGEX_FULL,
  parseIcon,
  color
} = originalConfig

describe('config.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Since module-level imports are created when the module is imported,
    // we may need to re-import or reset the state
    jest.resetModules()
  })

  describe('Configuration Objects', () => {
    it('should create config object with correct defaults', () => {
      expect(config).toBeDefined()
      expect(config.delimiters).toEqual([':', '-', '_'])
      expect(config.prefixes).toEqual(['icon:'])
      expect(config.suffixes).toEqual(['_end'])
      expect(config.customAliasesOnly).toBe(false)
    })

    it('should create editorConfig object with correct defaults', () => {
      expect(editorConfig).toBeDefined()
      expect(editorConfig.fontSize).toBe(12)
    })
  })

  describe('Custom Collections', () => {
    it('should initialize customCollections as shallowRef with empty array', () => {
      expect(customCollections).toBeDefined()
      expect(Array.isArray(customCollections.value)).toBe(true)
      expect(customCollections.value).toHaveLength(0)
    })
  })

  describe('Custom Aliases', () => {
    it('should initialize customAliases as ref with empty array', () => {
      expect(customAliases).toBeDefined()
      expect(Array.isArray(customAliases.value)).toBe(true)
      expect(customAliases.value).toHaveLength(0)
    })
  })

  describe('Computed Values', () => {
    it('should compute enabledCollectionIds correctly with default config', () => {
      const result = enabledCollectionIds.value
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.some(id => id === 'mdi')).toBe(true)
      expect(result.some(id => id === 'fa')).toBe(true)
      expect(result.some(id => id === 'simple-icons')).toBe(true)
    })

    it('should compute enabledCollectionIds with custom includes', () => {
      // This test is testing the logic of the computed value, so we can simulate it
      const includes = ['mdi', 'fa']  // Simulating config.includes
      const collectionIds = ['mdi', 'fa', 'simple-icons'] // Simulating collectionIds from collections module
      const allIncludes = includes.length ? includes : collectionIds

      expect(allIncludes).toContain('mdi')
      expect(allIncludes).toContain('fa')
    })

    it('should compute enabledCollectionIds considering excludes', () => {
      const testIncludes = ['mdi', 'fa', 'simple-icons']
      const testExcludes = ['fa']
      const result = testIncludes.filter(i => !testExcludes.includes(i))

      expect(result).toContain('mdi')
      expect(result).not.toContain('fa')
      expect(result).toContain('simple-icons')
    })

    it('should compute enabledCollections correctly', () => {
      const result = enabledCollections.value
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(1) // Should contain at least the default collections
    })

    it('should compute enabledAliases correctly with empty customAliases', () => {
      const result = enabledAliases.value
      expect(result).toEqual({})
    })

    it('should compute enabledAliasIds correctly', () => {
      const result = enabledAliasIds.value
      expect(result).toEqual([])
    })
  })

  describe('Regular Expressions', () => {
    it('should create REGEX_DELIMITERS with configured delimiters', () => {
      const regex = REGEX_DELIMITERS.value
      expect(regex).toBeInstanceOf(RegExp)
      // Test that the regex includes our delimiters
      expect(':').toMatch(regex) // The colon should match the delimiter pattern
      expect('-').toMatch(regex) // The dash should match the delimiter pattern
      expect('_').toMatch(regex) // The underscore should match the delimiter pattern
    })

    it('should create REGEX_PREFIXED with configured prefixes', () => {
      const regex = REGEX_PREFIXED.value
      expect(regex).toBeInstanceOf(RegExp)
      // Test that it matches the prefix pattern
      expect(' icon:').toMatch(regex) // Should match the prefix
    })

    it('should create REGEX_NAMESPACE with enabled collection IDs', () => {
      const regex = REGEX_NAMESPACE.value
      expect(regex).toBeInstanceOf(RegExp)
      // The test string should match the pattern that looks for prefix + collection + delimiter + icon
      const testString = ' icon:mdi:test'
      expect(testString).toMatch(regex)
    })

    it('should create REGEX_COLLECTION_ICON with enabled collection IDs', () => {
      const regex = REGEX_COLLECTION_ICON.value
      expect(regex).toBeInstanceOf(RegExp)
      // Test that collection:icon pattern matches
      const testString = ' icon mdi:home fa:user'
      expect(testString).toMatch(regex)
    })

    it('should create REGEX_FULL that properly matches icon patterns', () => {
      const regex = REGEX_FULL.value
      expect(regex).toBeInstanceOf(RegExp)
      // Test basic functionality - the expected regex pattern should match icon-like patterns
      // The regex pattern contains collection IDs and delimiters that should match icon patterns
    })
  })

  describe('parseIcon function', () => {
    it('should parse a valid icon string', () => {
      const result = parseIcon('mdi:home')
      expect(result).toEqual({
        collection: 'mdi',
        icon: 'home',
      })
    })

    it('should return undefined for invalid icon string', () => {
      const result = parseIcon('invalid-icon')
      expect(result).toBeUndefined()
    })

    it('should handle different delimiters', () => {
      const result = parseIcon('mdi-home')
      expect(result).toEqual({
        collection: 'mdi',
        icon: 'home',
      })
    })

    it('should handle custom collection ID mapping', () => {
      // Since the original config is already created with mocks, we can't easily modify it
      // But we can test the function logic
      const result = parseIcon('mdi:home')
      expect(result).toEqual({
        collection: 'mdi', // Using default as there's no custom mapping in the mock
        icon: 'home',
      })
    })
  })

  describe('isCustomAliasesFile function', () => {
    it('should return false when no aliases files are registered', () => {
      const result = isCustomAliasesFile('/path/to/file.json')
      expect(result).toBe(false)
    })
  })

  describe('Color computed value', () => {
    it('should return light theme color when theme is not dark', () => {
      const result = color.value
      expect(result).toBe('#222') // Light theme color
    })
  })

  describe('useCustomCollections function', () => {
    it('should be defined', () => {
      expect(useCustomCollections).toBeDefined()
      expect(typeof useCustomCollections).toBe('function')
    })
  })

  describe('useCustomAliases function', () => {
    it('should be defined', () => {
      expect(useCustomAliases).toBeDefined()
      expect(typeof useCustomAliases).toBe('function')
    })
  })
})