import { describe, it, expect, jest } from '@jest/globals'
import { defineLogger } from 'reactive-vscode'
import { displayName } from '../generated/meta'

// Mock reactive-vscode to verify it's called with correct parameters
jest.mock('reactive-vscode', () => ({
  defineLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
  }))
}));

// Import Log after the mock is set up
import { Log } from './Log'

describe('Log', () => {
  it('should create logger with correct displayName', () => {
    expect(defineLogger).toHaveBeenCalledWith(displayName);
    expect(displayName).toBe('Iconify IntelliSense');
  });

  it('should export a logger object', () => {
    expect(Log).toBeDefined();
  });

  it('should have expected logger methods', () => {
    // We can't access the methods directly in this test environment due to how
    // reactive-vscode sets up the logger, but we verify the basic structure
    expect(Log).toHaveProperty('info');
    expect(Log).toHaveProperty('warn');
    expect(Log).toHaveProperty('error');
    expect(Log).toHaveProperty('show');
    expect(Log).toHaveProperty('hide');
  });
});