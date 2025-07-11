/**
 * LocalStorage caching implementation for BackChannel
 */

// Default storage key prefix
const DEFAULT_STORAGE_PREFIX = 'backchannel'

/**
 * Cache entry for database information
 */
interface DatabaseCacheEntry {
  feedbackPackageUrl: string
  databaseName: string
  lastAccessed: number
}

/**
 * Service for caching database information in localStorage
 */
export class CacheService {
  private storagePrefix: string

  /**
   * Creates a new CacheService instance
   * @param storagePrefix - Prefix for localStorage keys (default: 'backchannel')
   */
  constructor(storagePrefix: string = DEFAULT_STORAGE_PREFIX) {
    this.storagePrefix = storagePrefix
  }

  /**
   * Gets the full storage key for a given key
   * @param key - The key to get the full storage key for
   * @returns The full storage key
   */
  private getStorageKey(key: string): string {
    return `${this.storagePrefix}_${key}`
  }

  /**
   * Caches database information for quick access
   * @param feedbackPackageUrl - URL of the feedback package
   * @param databaseName - Name of the database
   */
  cacheDatabaseInfo(feedbackPackageUrl: string, databaseName: string): void {
    try {
      const entry: DatabaseCacheEntry = {
        feedbackPackageUrl,
        databaseName,
        lastAccessed: Date.now(),
      }

      localStorage.setItem(this.getStorageKey('database_info'), JSON.stringify(entry))
    } catch (error) {
      console.error('Failed to cache database info:', error)
    }
  }

  /**
   * Gets cached database information
   * @returns The cached database information or undefined if not found
   */
  getCachedDatabaseInfo(): DatabaseCacheEntry | undefined {
    try {
      const data = localStorage.getItem(this.getStorageKey('database_info'))

      if (data) {
        return JSON.parse(data) as DatabaseCacheEntry
      }

      return undefined
    } catch (error) {
      console.error('Failed to get cached database info:', error)
      return undefined
    }
  }

  /**
   * Gets the cached database name for a feedback package URL
   * @param feedbackPackageUrl - URL of the feedback package
   * @returns The cached database name or undefined if not found
   */
  getCachedDatabaseName(feedbackPackageUrl: string): string | undefined {
    const cacheEntry = this.getCachedDatabaseInfo()

    if (cacheEntry && cacheEntry.feedbackPackageUrl === feedbackPackageUrl) {
      // Update the last accessed timestamp
      this.cacheDatabaseInfo(feedbackPackageUrl, cacheEntry.databaseName)
      return cacheEntry.databaseName
    }

    return undefined
  }

  /**
   * Clears the cached database information
   */
  clearDatabaseCache(): void {
    try {
      localStorage.removeItem(this.getStorageKey('database_info'))
    } catch (error) {
      console.error('Failed to clear database cache:', error)
    }
  }

  /**
   * Caches the seed version to prevent reseeding
   * @param version - The seed version
   */
  cacheSeedVersion(version: string): void {
    try {
      localStorage.setItem(this.getStorageKey('seed_version'), version)
    } catch (error) {
      console.error('Failed to cache seed version:', error)
    }
  }

  /**
   * Gets the cached seed version
   * @returns The cached seed version or undefined if not found
   */
  getCachedSeedVersion(): string | undefined {
    try {
      return localStorage.getItem(this.getStorageKey('seed_version')) || undefined
    } catch (error) {
      console.error('Failed to get cached seed version:', error)
      return undefined
    }
  }

  /**
   * Clears the cached seed version
   */
  clearSeedVersionCache(): void {
    try {
      localStorage.removeItem(this.getStorageKey('seed_version'))
    } catch (error) {
      console.error('Failed to clear seed version cache:', error)
    }
  }
}
