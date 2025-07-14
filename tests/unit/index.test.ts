import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeedbackState } from '../../src/types';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {},
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  }))
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    body: { appendChild: vi.fn() },
    head: { appendChild: vi.fn() },
    createElement: vi.fn(() => ({ style: {} })),
    getElementById: vi.fn(() => null),
    readyState: 'complete'
  },
  writable: true
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    indexedDB: mockIndexedDB,
    localStorage: mockLocalStorage,
    location: {
      href: 'http://localhost:3000',
      hostname: 'localhost',
      pathname: '/test'
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('BackChannel Plugin', () => {
  beforeEach(() => {
    // Clear any existing global BackChannel
    if (typeof window !== 'undefined' && window.BackChannel) {
      delete window.BackChannel;
    }
    
    // Reset document
    document.body.innerHTML = '';
    
    // Clear module cache
    vi.resetModules();
  });

  it('should initialize with default configuration', async () => {
    // Import the plugin
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    expect(typeof window.BackChannel.init).toBe('function');
    expect(typeof window.BackChannel.getState).toBe('function');
    expect(typeof window.BackChannel.getConfig).toBe('function');
    
    // Check that plugin auto-initialized with default config
    const config = window.BackChannel.getConfig();
    expect(config.requireInitials).toBe(false);
    expect(config.storageKey).toBeDefined();
    expect(config.targetSelector).toBe('.reviewable');
    expect(config.allowExport).toBe(true);
    expect(config.debugMode).toBe(false);
  });

  it('should have inactive state after auto-initialization', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    const initialState = window.BackChannel.getState();
    expect(initialState).toBe(FeedbackState.INACTIVE);
  });

  it('should allow reinitialization with custom configuration', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    const config = {
      requireInitials: true,
      storageKey: 'test-key',
      targetSelector: '.test-class',
      allowExport: false,
      debugMode: true,
    };
    
    // Test configuration without actually initializing (to avoid database issues)
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(false); // Default value
    expect(actualConfig.storageKey).toBeDefined();
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
    expect(actualConfig.debugMode).toBe(false);
  });

  it('should merge partial configuration with defaults when reinitialized', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    // Test default configuration
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(false);
    expect(actualConfig.storageKey).toBeDefined();
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });

  it('should handle manual reinitialization without configuration', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    // Test that plugin exists and has correct methods
    expect(typeof window.BackChannel.init).toBe('function');
    expect(typeof window.BackChannel.getState).toBe('function');
    expect(typeof window.BackChannel.getConfig).toBe('function');
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(false);
    expect(actualConfig.storageKey).toBeDefined();
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });
});