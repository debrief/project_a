import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeedbackState } from '../../src/types';

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
    
    // Reinitialize with custom config
    window.BackChannel.init(config);
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(true);
    expect(actualConfig.storageKey).toBe('test-key');
    expect(actualConfig.targetSelector).toBe('.test-class');
    expect(actualConfig.allowExport).toBe(false);
    expect(actualConfig.debugMode).toBe(true);
  });

  it('should merge partial configuration with defaults when reinitialized', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    const partialConfig = {
      requireInitials: true,
    };
    
    // Reinitialize with partial config
    window.BackChannel.init(partialConfig);
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(true);
    expect(actualConfig.storageKey).toBeDefined();
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });

  it('should handle manual reinitialization without configuration', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    // Manually reinitialize without config (should use defaults)
    window.BackChannel.init();
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(false);
    expect(actualConfig.storageKey).toBeDefined();
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });
});