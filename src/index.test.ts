// Test for index.ts
// We need to mock everything before the module is loaded

// Create a dynamic import function to reload the module after mocking
async function importIndex() {
  // Clear the module cache to ensure fresh imports
  jest.resetModules();
  
  // Mock all dependencies
  jest.doMock('reactive-vscode', () => ({
    defineExtension: (callback: () => any) => {
      // Execute the callback to trigger all internal logic when module loads
      callback();
      // Return an object with activate and deactivate functions
      return { activate: jest.fn(), deactivate: jest.fn() };
    },
  }));

  jest.doMock('./commands', () => ({
    useCommands: jest.fn(),
  }));

  jest.doMock('./config', () => ({
    useCustomCollections: jest.fn(),
    useCustomAliases: jest.fn(),
  }));

  jest.doMock('./completions', () => ({
    useCompletion: jest.fn(),
  }));

  jest.doMock('./annotation', () => ({
    useAnnotations: jest.fn(),
  }));

  jest.doMock('./collections', () => ({
    collections: [{ name: 'test-collection' }, { name: 'another-collection' }],
  }));

  jest.doMock('./utils', () => ({
    Log: {
      info: jest.fn(),
    },
  }));

  return await import('./index');
}

describe('index.ts', () => {
  let mockUseCommands: jest.Mock;
  let mockUseCustomCollections: jest.Mock;
  let mockUseCustomAliases: jest.Mock;
  let mockUseCompletion: jest.Mock;
  let mockUseAnnotations: jest.Mock;
  let mockLogInfo: jest.Mock;
  let mockCollections: any[];

  beforeEach(async () => {
    // Import the module with all mocks in place
    const modules = await importIndex();
    
    // Import the mocked modules to access their mocks
    const commandsModule = await import('./commands');
    const configModule = await import('./config');
    const completionsModule = await import('./completions');
    const annotationModule = await import('./annotation');
    const utilsModule = await import('./utils');
    const collectionsModule = await import('./collections');
    
    mockUseCommands = commandsModule.useCommands as jest.Mock;
    mockUseCustomCollections = configModule.useCustomCollections as jest.Mock;
    mockUseCustomAliases = configModule.useCustomAliases as jest.Mock;
    mockUseCompletion = completionsModule.useCompletion as jest.Mock;
    mockUseAnnotations = annotationModule.useAnnotations as jest.Mock;
    mockLogInfo = utilsModule.Log.info as jest.Mock;
    mockCollections = collectionsModule.collections;
    
    // Access the exports
    (global as any).activate = modules.activate;
    (global as any).deactivate = modules.deactivate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export activate and deactivate functions', () => {
    expect((global as any).activate).toBeDefined();
    expect((global as any).deactivate).toBeDefined();
    expect(typeof (global as any).activate).toBe('function');
    expect(typeof (global as any).deactivate).toBe('function');
  });

  it('should call all initialization functions during module load', () => {
    // All functions should have been called during the initial import when the module loads
    expect(mockUseCommands).toHaveBeenCalled();
    expect(mockUseCustomCollections).toHaveBeenCalled();
    expect(mockUseCustomAliases).toHaveBeenCalled();
    expect(mockUseCompletion).toHaveBeenCalled();
    expect(mockUseAnnotations).toHaveBeenCalled();
  });

  it('should log the activation message with version', () => {
    // Check that the activation message was logged (with the version from package.json)
    const logCalls = mockLogInfo.mock.calls;
    const activationMessages = logCalls.filter((call: any[]) => call[0].includes('Activated, v'));
    expect(activationMessages).toHaveLength(1);
    expect(activationMessages[0][0]).toMatch(/Activated, v\d+\.\d+\.\d+/);
  });

  it('should log the number of icon sets loaded after calling useCustomCollections', () => {
    const logCalls = mockLogInfo.mock.calls;
    // Find the log call that contains 'icon sets loaded'
    const iconSetLog = logCalls.find(call => call[0].includes('icon sets loaded'));
    expect(iconSetLog).toBeDefined();
    expect(iconSetLog![0]).toContain('2 icon sets loaded');
  });

  it('should log the number of aliases loaded after calling useCustomAliases', () => {
    const logCalls = mockLogInfo.mock.calls;
    // Find the log call that contains 'aliases loaded'
    const aliasesLog = logCalls.find(call => call[0].includes('aliases loaded'));
    expect(aliasesLog).toBeDefined();
    expect(aliasesLog![0]).toContain('2 aliases loaded');
  });
});