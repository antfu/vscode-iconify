// Setup file to mock VSCode module before tests run
jest.mock('vscode', () => {
  const mockRange = function(start, end) {
    this.start = start;
    this.end = end;
  };

  const mockDisposable = function() {
    this.dispose = jest.fn();
  };

  return {
    DecorationRangeBehavior: {
      ClosedClosed: 'ClosedClosed',
    },
    languages: {
      match: jest.fn(),
    },
    Range: mockRange,
    Uri: {
      parse: jest.fn((uri) => ({ uri })),
    },
    window: {
      createTextEditorDecorationType: jest.fn(),
    },
    workspace: {
      onDidChangeTextDocument: jest.fn(),
      onDidSaveTextDocument: jest.fn(),
    },
    commands: {
      registerCommand: jest.fn(),
    },
    Disposable: mockDisposable,
  };
}, { virtual: true });

// Mock other required modules
jest.mock('reactive-vscode', () => ({
  shallowRef: jest.fn((initialValue) => ({ value: initialValue })),
  ref: jest.fn((initialValue) => ({ value: initialValue })),
  computed: jest.fn((fn) => ({ value: fn() })),
  useIsDarkTheme: jest.fn(() => ({ value: false })),
  useActiveEditorDecorations: jest.fn(),
  useActiveTextEditor: jest.fn(() => ({ value: null })),
  useDocumentText: jest.fn(() => ({ value: null })),
  useTextEditorSelections: jest.fn(() => ({ value: [] })),
  watchEffect: jest.fn(),
  defineLogger: jest.fn(() => ({
    event: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  defineConfigObject: jest.fn((scope, defaults) => defaults),
  extensionContext: {
    subscriptions: [],
  },
}), { virtual: true });

jest.mock('./config', () => ({
  config: {
    annotations: true,
    inplace: false,
    preview: {
      include: [],
      exclude: [],
    },
    position: 'before',
  },
  editorConfig: {
    fontSize: 14,
  },
  isCustomAliasesFile: jest.fn(),
  REGEX_COLLECTION_ICON: {
    value: null,
  },
  REGEX_FULL: {
    value: null,
  },
}), { virtual: true });

jest.mock('./loader', () => ({
  getDataURL: jest.fn(),
  getIconInfo: jest.fn(),
}), { virtual: true });

jest.mock('./markdown', () => ({
  getIconMarkdown: jest.fn(),
}), { virtual: true });

// Mock the generated/meta module
jest.mock('./generated/meta', () => ({
  displayName: 'test-extension',
}), { virtual: true });

// Mock fs module to handle both sync and promises
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    stat: jest.fn(),
  },
}), { virtual: true });

// Mock node:fs as well
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    stat: jest.fn(),
  },
}), { virtual: true });

// Mock ofetch
jest.mock('ofetch', () => ({
  $fetch: jest.fn(),
}), { virtual: true });

// Mock node:buffer
jest.mock('node:buffer', () => ({
  Buffer: {
    from: jest.fn(),
  },
}), { virtual: true });

// Mock strip-json-comments
jest.mock('strip-json-comments', () => ({
  __esModule: true,
  default: jest.fn((str) => str),
}), { virtual: true });