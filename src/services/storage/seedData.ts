/**
 * Database seeding utility for BackChannel
 */

import { FeedbackPackage } from '../../types'
import { CacheService } from './cache'

/**
 * Demo database seed structure
 */
interface DemoDatabaseSeed {
  /** Version of the seed data */
  version: string
  /** Database definitions */
  databases: {
    /** Name of the database */
    name: string
    /** Feedback package data */
    feedbackPackage: FeedbackPackage
  }[]
}

/**
 * Utility for seeding the database with test data
 */
export class SeedDataService {
  private cacheService: CacheService

  /**
   * Creates a new SeedDataService instance
   * @param cacheService - Cache service for tracking seed versions
   */
  constructor(cacheService: CacheService) {
    this.cacheService = cacheService
  }

  /**
   * Seeds the database if needed based on the window.demoDatabaseSeed object
   * @param forceReseed - Whether to force reseeding even if the version matches
   * @returns Promise resolving to true if seeding was performed, false otherwise
   */
  async seedDemoDatabaseIfNeeded(forceReseed = false): Promise<boolean> {
    // Check if the demo database seed is available
    const demoSeed = (window as any).demoDatabaseSeed as DemoDatabaseSeed | undefined

    if (!demoSeed) {
      console.log('No demo database seed found')
      return false
    }

    // Check if we've already seeded this version
    const cachedVersion = this.cacheService.getCachedSeedVersion()

    if (!forceReseed && cachedVersion === demoSeed.version) {
      console.log(`Database already seeded with version ${demoSeed.version}`)
      return false
    }

    try {
      // Seed each database defined in the demo seed
      for (const db of demoSeed.databases) {
        await this.seedDatabase(db.name, db.feedbackPackage)
      }

      // Cache the seed version
      this.cacheService.cacheSeedVersion(demoSeed.version)

      console.log(`Successfully seeded database with version ${demoSeed.version}`)
      return true
    } catch (error) {
      console.error('Failed to seed database:', error)
      throw error
    }
  }

  /**
   * Seeds a specific database with a feedback package
   * @param dbName - Name of the database to seed
   * @param feedbackPackage - Feedback package to seed the database with
   * @returns Promise resolving when seeding is complete
   */
  private async seedDatabase(dbName: string, feedbackPackage: FeedbackPackage): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const request = indexedDB.open(dbName, 1)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create object stores
          if (!db.objectStoreNames.contains('comments')) {
            const commentsStore = db.createObjectStore('comments', { keyPath: 'id' })
            commentsStore.createIndex('pageUrl', 'pageUrl', { unique: false })
          }

          if (!db.objectStoreNames.contains('feedbackPackage')) {
            db.createObjectStore('feedbackPackage', { keyPath: 'id' })
          }
        }

        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          try {
            // Clear existing data
            await this.clearDatabase(db)

            // Seed the feedback package
            await this.seedFeedbackPackage(db, feedbackPackage)

            // Seed the comments
            await this.seedComments(db, feedbackPackage.comments)

            db.close()
            resolve()
          } catch (error) {
            db.close()
            reject(error)
          }
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to open database for seeding: ${
                (event.target as IDBOpenDBRequest).error?.message
              }`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Clears all data from the database
   * @param db - Database to clear
   * @returns Promise resolving when clearing is complete
   */
  private async clearDatabase(db: IDBDatabase): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(['comments', 'feedbackPackage'], 'readwrite')

        // Clear comments
        const commentsStore = transaction.objectStore('comments')
        const clearCommentsRequest = commentsStore.clear()

        // Clear feedback package
        const feedbackPackageStore = transaction.objectStore('feedbackPackage')
        const clearFeedbackPackageRequest = feedbackPackageStore.clear()

        transaction.oncomplete = () => {
          resolve()
        }

        transaction.onerror = (event) => {
          reject(
            new Error(
              `Failed to clear database: ${(event.target as IDBTransaction).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Seeds the feedback package store
   * @param db - Database to seed
   * @param feedbackPackage - Feedback package to seed
   * @returns Promise resolving when seeding is complete
   */
  private async seedFeedbackPackage(
    db: IDBDatabase,
    feedbackPackage: FeedbackPackage
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction('feedbackPackage', 'readwrite')
        const store = transaction.objectStore('feedbackPackage')
        const request = store.add(feedbackPackage)

        transaction.oncomplete = () => {
          resolve()
        }

        transaction.onerror = (event) => {
          reject(
            new Error(
              `Failed to seed feedback package: ${(event.target as IDBTransaction).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Seeds the comments store
   * @param db - Database to seed
   * @param comments - Comments to seed
   * @returns Promise resolving when seeding is complete
   */
  private async seedComments(db: IDBDatabase, comments: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction('comments', 'readwrite')
        const store = transaction.objectStore('comments')

        // Add each comment
        comments.forEach((comment) => {
          store.add(comment)
        })

        transaction.oncomplete = () => {
          resolve()
        }

        transaction.onerror = (event) => {
          reject(
            new Error(`Failed to seed comments: ${(event.target as IDBTransaction).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Verifies that the database was seeded correctly
   * @param dbName - Name of the database to verify
   * @returns Promise resolving to true if verification passed, false otherwise
   */
  async verifyDatabaseSeeded(dbName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const request = indexedDB.open(dbName)

        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          try {
            // Check if the feedback package exists
            const feedbackPackageExists = await this.verifyFeedbackPackageExists(db)

            // Check if comments exist
            const commentsExist = await this.verifyCommentsExist(db)

            db.close()
            resolve(feedbackPackageExists && commentsExist)
          } catch (error) {
            db.close()
            reject(error)
          }
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to open database for verification: ${
                (event.target as IDBOpenDBRequest).error?.message
              }`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Verifies that the feedback package exists in the database
   * @param db - Database to verify
   * @returns Promise resolving to true if the feedback package exists, false otherwise
   */
  private async verifyFeedbackPackageExists(db: IDBDatabase): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = db.transaction('feedbackPackage', 'readonly')
        const store = transaction.objectStore('feedbackPackage')
        const request = store.count()

        request.onsuccess = (event) => {
          const count = (event.target as IDBRequest).result as number
          resolve(count > 0)
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to verify feedback package: ${(event.target as IDBRequest).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Verifies that comments exist in the database
   * @param db - Database to verify
   * @returns Promise resolving to true if comments exist, false otherwise
   */
  private async verifyCommentsExist(db: IDBDatabase): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = db.transaction('comments', 'readonly')
        const store = transaction.objectStore('comments')
        const request = store.count()

        request.onsuccess = (event) => {
          const count = (event.target as IDBRequest).result as number
          resolve(count > 0)
        }

        request.onerror = (event) => {
          reject(
            new Error(`Failed to verify comments: ${(event.target as IDBRequest).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Resets the seed version cache to force reseeding
   */
  resetSeedVersion(): void {
    this.cacheService.clearSeedVersionCache()
  }
}
