// Setup file to mock VSCode module before tests run
jest.mock('vscode', () => {
  const mockRange = class {
    start: any;
    end: any;
    constructor(start: any, end: any) {
      this.start = start;
      this.end = end;
    }
    isEmpty = jest.fn();
    contains = jest.fn();
    with = jest.fn();
  };

  const mockDisposable = class {
    dispose: () => void;
    constructor() {
      this.dispose = jest.fn();
    }
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
      parse: jest.fn((uri: any) => ({ uri })),
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
  shallowRef: jest.fn((initialValue: any) => ({ value: initialValue })),
  ref: jest.fn((initialValue: any) => ({ value: initialValue })),
  computed: jest.fn((getter: any) => ({ value: getter() })),
  useIsDarkTheme: jest.fn(() => ({ value: true })),
  useActiveEditorDecorations: jest.fn(),
  useActiveTextEditor: jest.fn(() => ({ value: null })),
  useDocumentText: jest.fn(() => ({ value: null })),
  useTextEditorSelections: jest.fn(() => ({ value: [] })),
  watchEffect: jest.fn(),
  defineLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  extensionContext: {
    value: {
      extensionUri: { fsPath: '/mock/extension/path' },
      subscriptions: [],
    }
  }
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

// Mock node:fs and fs modules
jest.mock('node:fs', () => ({
  promises: {
    stat: jest.fn(),
  },
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}), { virtual: true });

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
  },
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}), { virtual: true });

// Mock ofetch
jest.mock('ofetch', () => ({
  $fetch: jest.fn(),
}), { virtual: true });

// Mock modules that may cause issues
jest.mock('strip-json-comments', () => ({
  default: (json: string) => json,
}), { virtual: true });

// Mock loader and markdown
jest.mock('./loader', () => ({
  getDataURL: jest.fn(),
  getIconInfo: jest.fn(),
}), { virtual: true });

jest.mock('./markdown', () => ({
  getIconMarkdown: jest.fn(),
}), { virtual: true });