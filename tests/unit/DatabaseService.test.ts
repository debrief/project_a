/**
 * @fileoverview Unit tests for DatabaseService
 * @version 1.0.0
 * @author BackChannel Team
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '../../src/services/DatabaseService';
import { CaptureComment, DocumentMetadata } from '../../src/types';

/**
 * Mock IndexedDB implementation for testing
 */
class MockIndexedDB {
  private stores: Map<string, Map<string, any>> = new Map();
  
  open(name: string, version: number) {
    const request = {
      result: this,
      error: null,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any
    };

    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({
          target: { result: this }
        });
      }
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);

    return request;
  }

  transaction(storeNames: string | string[], mode: string) {
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockTransaction(this.stores, stores);
  }

  createObjectStore(name: string, options: any) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }
    return new MockObjectStore(this.stores.get(name)!);
  }

  get objectStoreNames() {
    return {
      contains: (name: string) => this.stores.has(name),
      length: this.stores.size,
      item: (index: number) => Array.from(this.stores.keys())[index] || null,
      [Symbol.iterator]: () => Array.from(this.stores.keys())[Symbol.iterator]()
    };
  }
}

class MockTransaction {
  private stores: Map<string, Map<string, any>>;
  private storeNames: string[];
  
  constructor(stores: Map<string, Map<string, any>>, storeNames: string[]) {
    this.stores = stores;
    this.storeNames = storeNames;
  }

  objectStore(name: string) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }
    return new MockObjectStore(this.stores.get(name)!);
  }

  onerror = null;
  onabort = null;
  error = null;
}

class MockObjectStore {
  private data: Map<string, any>;

  constructor(data: Map<string, any>) {
    this.data = data;
  }

  createIndex(name: string, keyPath: string, options: any) {
    // Mock implementation - indexes not needed for basic testing
  }

  get(key: string) {
    const request = {
      result: this.data.get(key),
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }

  getAll() {
    const request = {
      result: Array.from(this.data.values()),
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }

  add(value: any) {
    const key = value.id || value.documentRootUrl;
    const request = {
      result: key,
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      if (this.data.has(key)) {
        request.error = new Error('Key already exists');
        if (request.onerror) {
          request.onerror();
        }
      } else {
        this.data.set(key, value);
        if (request.onsuccess) {
          request.onsuccess();
        }
      }
    }, 0);
    
    return request;
  }

  put(value: any) {
    const key = value.id || value.documentRootUrl;
    const request = {
      result: key,
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      this.data.set(key, value);
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }

  delete(key: string) {
    const request = {
      result: null,
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      this.data.delete(key);
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }

  clear() {
    const request = {
      result: null,
      error: null,
      onsuccess: null as any,
      onerror: null as any
    };
    
    setTimeout(() => {
      this.data.clear();
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }
}

// Mock localStorage for testing
const localStorageMock = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => localStorageMock.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    localStorageMock.store.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageMock.store.clear();
  })
};

// Mock window and location
const mockWindow = {
  location: {
    href: 'file:///test-page.html',
    protocol: 'file:',
    hostname: '',
    port: ''
  }
};

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockIndexedDB: MockIndexedDB;

  beforeEach(() => {
    mockIndexedDB = new MockIndexedDB();
    dbService = new DatabaseService(mockIndexedDB);
    
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Mock window
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });

    // Clear localStorage mock
    localStorageMock.store.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(dbService.initialize()).resolves.toBeUndefined();
    });

    it('should cache basic info to localStorage on initialization', async () => {
      await dbService.initialize();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backchannel-db-id',
        'BackChannelDB_v1'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backchannel-url-root',
        'file:///test-page.html'
      );
    });

    it('should detect existing feedback correctly', async () => {
      // Set up existing cache
      localStorageMock.store.set('backchannel-enabled-state', 'true');
      localStorageMock.store.set('backchannel-last-url-check', 'file:///test-page.html');
      
      const isEnabled = await dbService.isBackChannelEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  describe('metadata operations', () => {
    const testMetadata: DocumentMetadata = {
      documentTitle: 'Test Document',
      documentRootUrl: 'file://',
      documentId: 'test-123',
      reviewer: 'Test User'
    };

    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should save and retrieve metadata', async () => {
      await dbService.setMetadata(testMetadata);
      const retrieved = await dbService.getMetadata();
      
      expect(retrieved).toEqual(testMetadata);
    });

    it('should return null when no metadata exists', async () => {
      const retrieved = await dbService.getMetadata();
      expect(retrieved).toBeNull();
    });
  });

  describe('comment operations', () => {
    const testComment: CaptureComment = {
      id: 'test-comment-1',
      text: 'This is a test comment',
      pageUrl: 'file:///test-page.html',
      timestamp: '2024-01-01T12:00:00.000Z',
      location: '/html/body/div[1]/p[1]',
      snippet: 'Test snippet',
      author: 'Test User'
    };

    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should add and retrieve comments', async () => {
      await dbService.addComment(testComment);
      const comments = await dbService.getComments();
      
      expect(comments).toHaveLength(1);
      expect(comments[0]).toEqual(testComment);
    });

    it('should add comments without validation (validation moved to type guards)', async () => {
      await dbService.initialize();
      
      const comment: CaptureComment = {
        id: 'test-comment-2',
        text: 'Another test comment',
        pageUrl: 'file:///test.html',
        timestamp: '2024-01-01T12:05:00.000Z',
        location: '/html/body/p[2]'
      };

      await expect(dbService.addComment(comment)).resolves.toBeUndefined();
      
      const comments = await dbService.getComments();
      expect(comments).toContainEqual(comment);
    });

    it('should update existing comments', async () => {
      await dbService.addComment(testComment);
      
      await dbService.updateComment('test-comment-1', {
        text: 'Updated comment text'
      });
      
      const comments = await dbService.getComments();
      expect(comments[0].text).toBe('Updated comment text');
    });

    it('should delete comments', async () => {
      await dbService.addComment(testComment);
      await dbService.deleteComment('test-comment-1');
      
      const comments = await dbService.getComments();
      expect(comments).toHaveLength(0);
    });
  });

  describe('enabled state operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should clear enabled state cache', async () => {
      // Set some cache
      localStorageMock.store.set('backchannel-enabled-state', 'true');
      localStorageMock.store.set('backchannel-last-url-check', 'file:///test.html');

      // Clear cache
      dbService.clearEnabledStateCache();

      // Verify cache is cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backchannel-enabled-state');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backchannel-last-url-check');
    });

    it('should determine enabled state from database when no cache', async () => {
      // Add metadata that matches current URL
      await dbService.setMetadata({
        documentTitle: 'Test',
        documentRootUrl: 'file:///'
      });

      const isEnabled = await dbService.isBackChannelEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should match URLs using flexible path-based matching', async () => {
      // Test path-based matching (ignoring protocol/host/port)
      await dbService.setMetadata({
        documentTitle: 'Path Test',
        documentRootUrl: '/test-page.html'
      });

      const isEnabled = await dbService.isBackChannelEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should match URLs with path segments', async () => {
      // Test path segment matching
      await dbService.setMetadata({
        documentTitle: 'Segment Test',
        documentRootUrl: '/fixtures/enabled-test'
      });

      // Mock current URL to contain the path segment
      const originalHref = mockWindow.location.href;
      mockWindow.location.href = 'http://localhost:3001/tests/e2e/fixtures/enabled-test/enabled/index.html';

      const isEnabled = await dbService.isBackChannelEnabled();
      expect(isEnabled).toBe(true);

      // Restore original URL
      mockWindow.location.href = originalHref;
    });
  });
});