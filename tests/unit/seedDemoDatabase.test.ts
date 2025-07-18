/**
 * @fileoverview Unit tests for seedDemoDatabase utility
 * @version 1.0.0
 * @author BackChannel Team
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedDemoDatabaseIfNeeded, forceReseedDemoDatabase, getCurrentSeedVersion, clearSeedVersion } from '../../src/utils/seedDemoDatabase';

// Mock localStorage
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

// Mock DatabaseService with simulated persistence
let mockDatabaseState = {
  metadata: null as any,
  comments: [] as any[]
};

const mockDatabaseService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  setMetadata: vi.fn().mockImplementation(async (metadata: any) => {
    mockDatabaseState.metadata = metadata;
  }),
  addComment: vi.fn().mockImplementation(async (comment: any) => {
    mockDatabaseState.comments.push(comment);
  }),
  getMetadata: vi.fn().mockImplementation(async () => {
    return mockDatabaseState.metadata;
  }),
  getComments: vi.fn().mockImplementation(async () => {
    return [...mockDatabaseState.comments];
  })
};

vi.mock('../../src/services/DatabaseService', () => ({
  DatabaseService: vi.fn().mockImplementation(() => mockDatabaseService)
}));

// Mock indexedDB
const mockIndexedDB = {
  deleteDatabase: vi.fn().mockImplementation((name: string) => {
    const request = {
      onsuccess: null as any,
      onerror: null as any,
      onblocked: null as any,
      result: null,
      error: null
    };
    
    // Simulate successful deletion
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }),
  open: vi.fn().mockImplementation((name: string) => {
    const request = {
      onsuccess: null as any,
      onerror: null as any,
      onblocked: null as any,
      result: { 
        version: 1,
        close: vi.fn()
      },
      error: null
    };
    
    // Simulate successful database open
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  })
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('seedDemoDatabase', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Mock window (clear any existing properties)
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });
    
    // Clear window properties
    delete (global.window as any).demoDatabaseSeed;
    delete (global.window as any).fakeData;

    // Clear localStorage mock
    localStorageMock.store.clear();
    vi.clearAllMocks();
    
    // Reset indexedDB mock
    mockIndexedDB.deleteDatabase.mockClear();
    mockIndexedDB.open.mockClear();
    
    // Reset database service mocks to default values
    mockDatabaseState.metadata = null;
    mockDatabaseState.comments = [];
    vi.clearAllMocks();
  });

  describe('seedDemoDatabaseIfNeeded', () => {
    it('should return false when no demo seed is present', async () => {
      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(false);
    });

    it('should return false when demo seed version is already applied AND database has data', async () => {
      // Set up demo seed
      (global.window as any).demoDatabaseSeed = {
        version: 'demo-v1',
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: [
          {
            id: 'comment-1',
            text: 'Test comment',
            pageUrl: 'file:///test.html',
            timestamp: '2024-01-01T12:00:00.000Z',
            location: '/html/body/p[1]'
          }
        ]
      };

      // Set up fake data for database configuration
      (global.window as any).fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Test',
            version: 1,
            objectStores: []
          }
        ]
      };

      // Mark version as already applied
      localStorageMock.store.set('backchannel-seed-version', 'demo-v1');

      // Pre-populate mock database state to simulate existing data
      mockDatabaseState.metadata = {
        documentTitle: 'Test Doc',
        documentRootUrl: 'file://'
      };
      mockDatabaseState.comments = [
        {
          id: 'comment-1',
          text: 'Test comment',
          pageUrl: 'file:///test.html',
          timestamp: '2024-01-01T12:00:00.000Z',
          location: '/html/body/p[1]'
        }
      ];

      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(false);
    });

    it('should re-seed when version is applied but database is empty', async () => {
      // Set up demo seed
      (global.window as any).demoDatabaseSeed = {
        version: 'demo-v1',
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: [
          {
            id: 'comment-1',
            text: 'Test comment',
            pageUrl: 'file:///test.html',
            timestamp: '2024-01-01T12:00:00.000Z',
            location: '/html/body/p[1]'
          }
        ]
      };

      // Set up fake data for database configuration
      (global.window as any).fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Test',
            version: 1,
            objectStores: []
          }
        ]
      };

      // Mark version as already applied
      localStorageMock.store.set('backchannel-seed-version', 'demo-v1');

      // Keep mock database state empty (simulating database exists but is empty)
      // mockDatabaseState.metadata = null; // already null from beforeEach
      // mockDatabaseState.comments = []; // already empty from beforeEach

      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(true);
      
      // Verify localStorage was cleared due to empty database
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backchannel-seed-version');
    });

    it('should seed database when valid seed is present and version not applied', async () => {
      // Set up demo seed
      (global.window as any).demoDatabaseSeed = {
        version: 'demo-v1',
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: [
          {
            id: 'comment-1',
            text: 'Test comment',
            pageUrl: 'file:///test.html',
            timestamp: '2024-01-01T12:00:00.000Z',
            location: '/html/body/p[1]'
          }
        ]
      };

      // Set up fake data for database configuration
      (global.window as any).fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Test',
            version: 1,
            objectStores: []
          }
        ]
      };

      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(true);
      
      // Verify version was marked as applied
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backchannel-seed-version',
        'demo-v1'
      );
    });

    it('should handle invalid demo seed gracefully', async () => {
      // Set up invalid demo seed (missing version)
      (global.window as any).demoDatabaseSeed = {
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: []
      };

      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(false);
    });

    it('should filter out invalid comments', async () => {
      // Set up demo seed with invalid comment
      (global.window as any).demoDatabaseSeed = {
        version: 'demo-v1',
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: [
          {
            id: 'comment-1',
            text: 'Valid comment',
            pageUrl: 'file:///test.html',
            timestamp: '2024-01-01T12:00:00.000Z',
            location: '/html/body/p[1]'
          },
          {
            id: 'comment-2',
            text: 'Invalid comment'
            // Missing required fields
          }
        ]
      };

      // Set up fake data for database configuration
      (global.window as any).fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Test',
            version: 1,
            objectStores: []
          }
        ]
      };

      const result = await seedDemoDatabaseIfNeeded();
      expect(result).toBe(true);
    });
  });

  describe('forceReseedDemoDatabase', () => {
    it('should clear version flag and reseed', async () => {
      // Set up demo seed
      (global.window as any).demoDatabaseSeed = {
        version: 'demo-v1',
        metadata: {
          documentTitle: 'Test Doc',
          documentRootUrl: 'file://'
        },
        comments: []
      };

      // Set up fake data for database configuration
      (global.window as any).fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Test',
            version: 1,
            objectStores: []
          }
        ]
      };

      // Mark version as already applied
      localStorageMock.store.set('backchannel-seed-version', 'demo-v1');

      const result = await forceReseedDemoDatabase();
      expect(result).toBe(true);
      
      // Verify version flag was cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backchannel-seed-version');
    });
  });

  describe('getCurrentSeedVersion', () => {
    it('should return current seed version', () => {
      localStorageMock.store.set('backchannel-seed-version', 'demo-v2');
      
      const version = getCurrentSeedVersion();
      expect(version).toBe('demo-v2');
    });

    it('should return null when no version is set', () => {
      const version = getCurrentSeedVersion();
      expect(version).toBeNull();
    });
  });

  describe('clearSeedVersion', () => {
    it('should clear seed version flag', () => {
      localStorageMock.store.set('backchannel-seed-version', 'demo-v1');
      
      clearSeedVersion();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backchannel-seed-version');
    });
  });
});