/**
 * @fileoverview Unit tests for BackChannel Plugin (UI and Icon functionality)
 * @version 1.0.0
 * @author BackChannel Team
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackChannelIcon } from '../../src/components/BackChannelIcon';
import { FeedbackState } from '../../src/types';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock Lit components
vi.mock('lit', () => ({
  LitElement: class {
    render() { return {}; }
    connectedCallback() {}
    disconnectedCallback() {}
    setAttribute() {}
    removeAttribute() {}
    updateComplete = Promise.resolve();
    requestUpdate() {}
  },
  html: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
  css: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
}));

vi.mock('lit/decorators.js', () => ({
  customElement: () => (target: any) => target,
  property: () => (target: any, key: string) => {},
  state: () => (target: any, key: string) => {},
  query: () => (target: any, key: string) => {},
}));

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {},
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  }))
};

// Mock document
const mockDocument = {
  body: { appendChild: vi.fn() },
  head: { appendChild: vi.fn() },
  createElement: vi.fn(() => ({
    id: '',
    className: '',
    title: '',
    innerHTML: '',
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    },
    setAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    parentNode: { removeChild: vi.fn() }
  })),
  getElementById: vi.fn(() => null),
  readyState: 'complete'
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    indexedDB: mockIndexedDB,
    localStorage: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
  },
  writable: true
});

describe('BackChannelIcon', () => {
  let icon: BackChannelIcon;
  let mockDatabaseService: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabaseService = new DatabaseService();
    icon = new BackChannelIcon();
    icon.databaseService = mockDatabaseService;
  });

  it('should create icon with inactive state', () => {
    expect(icon.getState()).toBe(FeedbackState.INACTIVE);
  });

  it('should update state and appearance', () => {
    icon.setState(FeedbackState.CAPTURE);
    expect(icon.getState()).toBe(FeedbackState.CAPTURE);
    
    icon.setState(FeedbackState.REVIEW);
    expect(icon.getState()).toBe(FeedbackState.REVIEW);
    
    icon.setState(FeedbackState.INACTIVE);
    expect(icon.getState()).toBe(FeedbackState.INACTIVE);
  });

  it('should handle click handlers', () => {
    const clickHandler = vi.fn();
    icon.setClickHandler(clickHandler);
    
    // Test that the handler is set properly
    expect(icon.clickHandler).toBe(clickHandler);
  });

  it('should open package modal', () => {
    // Test that openPackageModal method exists
    expect(typeof icon.openPackageModal).toBe('function');
  });
});