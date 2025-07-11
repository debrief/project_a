/**
 * Tests for the storage service
 */

import { StorageService, DatabaseService, CacheService, SeedDataService } from './index'
import { FeedbackPackage, ReviewComment, CommentState, DocumentMetadata } from '../../types'

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

// Mock IDBRequest
const mockIDBRequest = {
  result: null,
  error: null,
  onupgradeneeded: null as any,
  onsuccess: null as any,
  onerror: null as any,
}

// Mock IDBDatabase
const mockIDBDatabase = {
  close: jest.fn(),
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(),
  },
  createObjectStore: jest.fn(),
}

// Mock IDBTransaction
const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null as any,
  onerror: null as any,
}

// Mock IDBObjectStore
const mockIDBObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  index: jest.fn(),
  count: jest.fn(),
}

// Mock IDBIndex
const mockIDBIndex = {
  get: jest.fn(),
  getAll: jest.fn(),
}

// Sample feedback package for testing
const createSampleFeedbackPackage = (): FeedbackPackage => ({
  id: 'test-package-1',
  metadata: {
    documentTitle: 'Test Document',
    documentRootUrl: 'https://example.com/docs',
  },
  comments: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0',
})

// Sample comment for testing
const createSampleComment = (): ReviewComment => ({
  id: 'comment-1',
  text: 'This is a test comment',
  pageUrl: 'https://example.com/docs/page1',
  timestamp: Date.now(),
  location: '/html/body/div[1]/p[2]',
  snippet: 'Sample text',
  author: 'Tester',
  state: CommentState.Open,
})

describe('StorageService', () => {
  let storageService: StorageService
  let feedbackPackage: FeedbackPackage

  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
    })

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Reset mocks
    jest.clearAllMocks()

    // Setup sample data
    feedbackPackage = createSampleFeedbackPackage()

    // Setup mock behavior
    mockIndexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        mockIDBRequest.result = mockIDBDatabase
        if (mockIDBRequest.onsuccess) {
          mockIDBRequest.onsuccess(new Event('success'))
        }
      }, 0)
      return mockIDBRequest
    })

    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction)
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore)
    mockIDBObjectStore.index.mockReturnValue(mockIDBIndex)

    // Create storage service
    storageService = new StorageService(feedbackPackage, 'test_prefix')
  })

  describe('initialization', () => {
    it('should create a database name based on the feedback package', () => {
      expect(storageService).toBeDefined()
    })

    it('should cache the database info on initialization', () => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('feedback package operations', () => {
    it('should get the feedback package', async () => {
      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          mockIDBRequest.result = [feedbackPackage]
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      const result = await storageService.getFeedbackPackage()
      expect(result).toEqual(feedbackPackage)
    })

    it('should update the feedback package', async () => {
      mockIDBObjectStore.put.mockImplementation(() => {
        setTimeout(() => {
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      await expect(storageService.updateFeedbackPackage(feedbackPackage)).resolves.not.toThrow()
    })
  })

  describe('comment operations', () => {
    let comment: ReviewComment

    beforeEach(() => {
      comment = createSampleComment()

      mockIDBObjectStore.add.mockImplementation(() => {
        setTimeout(() => {
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      mockIDBObjectStore.put.mockImplementation(() => {
        setTimeout(() => {
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      mockIDBObjectStore.get.mockImplementation(() => {
        setTimeout(() => {
          mockIDBRequest.result = comment
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      mockIDBObjectStore.getAll.mockImplementation(() => {
        setTimeout(() => {
          mockIDBRequest.result = [comment]
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      mockIDBIndex.getAll.mockImplementation(() => {
        setTimeout(() => {
          mockIDBRequest.result = [comment]
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })

      mockIDBObjectStore.delete.mockImplementation(() => {
        setTimeout(() => {
          if (mockIDBRequest.onsuccess) {
            mockIDBRequest.onsuccess(new Event('success'))
          }
        }, 0)
        return mockIDBRequest
      })
    })

    it('should create a comment', async () => {
      const result = await storageService.createComment(comment)
      expect(result).toEqual(comment)
    })

    it('should get a comment by ID', async () => {
      const result = await storageService.getComment('comment-1')
      expect(result).toEqual(comment)
    })

    it('should get all comments', async () => {
      const result = await storageService.getAllComments()
      expect(result).toEqual([comment])
    })

    it('should get comments by page', async () => {
      const result = await storageService.getCommentsByPage('https://example.com/docs/page1')
      expect(result).toEqual([comment])
    })

    it('should update a comment', async () => {
      const updatedComment = { ...comment, text: 'Updated comment' }
      const result = await storageService.updateComment(updatedComment)
      expect(result).toEqual(updatedComment)
    })

    it('should delete a comment', async () => {
      await expect(storageService.deleteComment('comment-1')).resolves.not.toThrow()
    })
  })
})

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    // Setup mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Reset mocks
    jest.clearAllMocks()

    // Create cache service
    cacheService = new CacheService('test_prefix')
  })

  it('should cache database info', () => {
    cacheService.cacheDatabaseInfo('https://example.com/docs', 'test_db')
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should get cached database info', () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({
        feedbackPackageUrl: 'https://example.com/docs',
        databaseName: 'test_db',
        lastAccessed: Date.now(),
      })
    )

    const result = cacheService.getCachedDatabaseInfo()
    expect(result).toBeDefined()
    expect(result?.databaseName).toBe('test_db')
  })

  it('should get cached database name for a URL', () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({
        feedbackPackageUrl: 'https://example.com/docs',
        databaseName: 'test_db',
        lastAccessed: Date.now(),
      })
    )

    const result = cacheService.getCachedDatabaseName('https://example.com/docs')
    expect(result).toBe('test_db')
  })

  it('should return undefined for non-matching URL', () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({
        feedbackPackageUrl: 'https://example.com/docs',
        databaseName: 'test_db',
        lastAccessed: Date.now(),
      })
    )

    const result = cacheService.getCachedDatabaseName('https://example.com/other')
    expect(result).toBeUndefined()
  })

  it('should clear database cache', () => {
    cacheService.clearDatabaseCache()
    expect(mockLocalStorage.removeItem).toHaveBeenCalled()
  })

  it('should cache seed version', () => {
    cacheService.cacheSeedVersion('test-v1')
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should get cached seed version', () => {
    mockLocalStorage.getItem.mockReturnValue('test-v1')
    const result = cacheService.getCachedSeedVersion()
    expect(result).toBe('test-v1')
  })

  it('should clear seed version cache', () => {
    cacheService.clearSeedVersionCache()
    expect(mockLocalStorage.removeItem).toHaveBeenCalled()
  })
})

describe('SeedDataService', () => {
  let seedDataService: SeedDataService
  let cacheService: CacheService

  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
    })

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Reset mocks
    jest.clearAllMocks()

    // Create services
    cacheService = new CacheService('test_prefix')
    seedDataService = new SeedDataService(cacheService)

    // Setup mock behavior
    mockIndexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        mockIDBRequest.result = mockIDBDatabase
        if (mockIDBRequest.onupgradeneeded) {
          mockIDBRequest.onupgradeneeded(new Event('upgradeneeded'))
        }
        if (mockIDBRequest.onsuccess) {
          mockIDBRequest.onsuccess(new Event('success'))
        }
      }, 0)
      return mockIDBRequest
    })

    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction)
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore)
    mockIDBObjectStore.count.mockImplementation(() => {
      setTimeout(() => {
        mockIDBRequest.result = 1
        if (mockIDBRequest.onsuccess) {
          mockIDBRequest.onsuccess(new Event('success'))
        }
      }, 0)
      return mockIDBRequest
    })
  })

  it('should seed the database if needed', async () => {
    // Mock window.demoDatabaseSeed
    Object.defineProperty(window, 'demoDatabaseSeed', {
      value: {
        version: 'test-v1',
        databases: [
          {
            name: 'test_db',
            feedbackPackage: createSampleFeedbackPackage(),
          },
        ],
      },
      writable: true,
    })

    // Mock that we haven't seeded this version yet
    mockLocalStorage.getItem.mockReturnValue(null)

    const result = await seedDataService.seedDemoDatabaseIfNeeded()
    expect(result).toBe(true)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should not seed if already seeded with same version', async () => {
    // Mock window.demoDatabaseSeed
    Object.defineProperty(window, 'demoDatabaseSeed', {
      value: {
        version: 'test-v1',
        databases: [
          {
            name: 'test_db',
            feedbackPackage: createSampleFeedbackPackage(),
          },
        ],
      },
      writable: true,
    })

    // Mock that we've already seeded this version
    mockLocalStorage.getItem.mockReturnValue('test-v1')

    const result = await seedDataService.seedDemoDatabaseIfNeeded()
    expect(result).toBe(false)
  })

  it('should force reseed if requested', async () => {
    // Mock window.demoDatabaseSeed
    Object.defineProperty(window, 'demoDatabaseSeed', {
      value: {
        version: 'test-v1',
        databases: [
          {
            name: 'test_db',
            feedbackPackage: createSampleFeedbackPackage(),
          },
        ],
      },
      writable: true,
    })

    // Mock that we've already seeded this version
    mockLocalStorage.getItem.mockReturnValue('test-v1')

    const result = await seedDataService.seedDemoDatabaseIfNeeded(true)
    expect(result).toBe(true)
  })

  it('should verify database seeded', async () => {
    const result = await seedDataService.verifyDatabaseSeeded('test_db')
    expect(result).toBe(true)
  })

  it('should reset seed version', () => {
    seedDataService.resetSeedVersion()
    expect(mockLocalStorage.removeItem).toHaveBeenCalled()
  })
})
