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
  });

  it('should have inactive state initially', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    const initialState = window.BackChannel.getState();
    expect(initialState).toBe(FeedbackState.INACTIVE);
  });

  it('should initialize with custom configuration', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    const config = {
      requireInitials: true,
      storageKey: 'test-key',
      targetSelector: '.test-class',
      allowExport: false,
    };
    
    window.BackChannel.init(config);
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(true);
    expect(actualConfig.storageKey).toBe('test-key');
    expect(actualConfig.targetSelector).toBe('.test-class');
    expect(actualConfig.allowExport).toBe(false);
  });

  it('should merge configuration with defaults', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    const partialConfig = {
      requireInitials: true,
    };
    
    window.BackChannel.init(partialConfig);
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(true);
    expect(actualConfig.storageKey).toBe('backchannel-feedback');
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });

  it('should handle initialization without configuration', async () => {
    await import('../../src/index');
    
    expect(window.BackChannel).toBeDefined();
    
    window.BackChannel.init();
    
    const actualConfig = window.BackChannel.getConfig();
    expect(actualConfig.requireInitials).toBe(false);
    expect(actualConfig.storageKey).toBe('backchannel-feedback');
    expect(actualConfig.targetSelector).toBe('.reviewable');
    expect(actualConfig.allowExport).toBe(true);
  });
});