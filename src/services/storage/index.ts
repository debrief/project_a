/**
 * Storage service for BackChannel
 *
 * This module provides a unified interface for all storage operations,
 * including IndexedDB database access and localStorage caching.
 */

import { FeedbackPackage, ReviewComment } from '../../types'
import { DatabaseService } from './db'
import { CacheService } from './cache'
import { SeedDataService } from './seedData'

/**
 * Main storage service that coordinates database and cache operations
 */
export class StorageService {
  private dbService: DatabaseService
  private cacheService: CacheService
  private seedService: SeedDataService
  private dbName: string
  private feedbackPackageUrl?: string

  /**
   * Creates a new StorageService instance
   * @param feedbackPackageOrDbName - Either a feedback package or a database name to open
   * @param storagePrefix - Prefix for localStorage keys (default: 'backchannel')
   */
  constructor(feedbackPackageOrDbName: FeedbackPackage | string, storagePrefix?: string) {
    this.cacheService = new CacheService(storagePrefix)

    if (typeof feedbackPackageOrDbName === 'string') {
      // We're opening an existing database by name
      this.dbName = feedbackPackageOrDbName
      this.dbService = new DatabaseService(this.dbName)
    } else {
      // We're creating/opening a database with a feedback package
      const feedbackPackage = feedbackPackageOrDbName
      this.feedbackPackageUrl = feedbackPackage.metadata.documentRootUrl
      this.dbName = `backchannel_${this.generateDatabaseName(feedbackPackage)}`
      this.dbService = new DatabaseService(this.dbName, feedbackPackage)

      // Cache the database info
      if (this.feedbackPackageUrl) {
        this.cacheService.cacheDatabaseInfo(this.feedbackPackageUrl, this.dbName)
      }
    }

    this.seedService = new SeedDataService(this.cacheService)
  }

  /**
   * Generates a database name from a feedback package
   * @param feedbackPackage - The feedback package
   * @returns A unique database name
   */
  private generateDatabaseName(feedbackPackage: FeedbackPackage): string {
    // Create a deterministic name based on the document URL and ID
    const baseString = `${feedbackPackage.metadata.documentRootUrl}_${feedbackPackage.id}`

    // Simple hash function to generate a shorter string
    let hash = 0
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * Gets the URL of the current feedback package
   * @returns The URL of the current feedback package
   */
  async getFeedbackPackageUrl(): Promise<string | undefined> {
    if (this.feedbackPackageUrl) {
      return this.feedbackPackageUrl
    }

    // Try to get it from the feedback package
    try {
      const feedbackPackage = await this.getFeedbackPackage()
      this.feedbackPackageUrl = feedbackPackage.metadata.documentRootUrl
      return this.feedbackPackageUrl
    } catch (error) {
      console.error('Failed to get feedback package URL:', error)
      return undefined
    }
  }

  /**
   * Initializes the storage service
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // Connect to the database to ensure it's ready
      await this.dbService.connect()
    } catch (error) {
      console.error('Failed to initialize storage service:', error)
      throw error
    }
  }

  /**
   * Gets the feedback package
   * @returns Promise resolving to the feedback package
   */
  async getFeedbackPackage(): Promise<FeedbackPackage> {
    try {
      const feedbackPackage = await this.dbService.getFeedbackPackage()

      if (!feedbackPackage) {
        throw new Error('Feedback package not found')
      }

      return feedbackPackage
    } catch (error) {
      console.error('Failed to get feedback package:', error)
      throw error
    }
  }

  /**
   * Updates the feedback package
   * @param feedbackPackage - The updated feedback package
   * @returns Promise resolving when the update is complete
   */
  async updateFeedbackPackage(feedbackPackage: FeedbackPackage): Promise<void> {
    try {
      await this.dbService.updateFeedbackPackage(feedbackPackage)
    } catch (error) {
      console.error('Failed to update feedback package:', error)
      throw error
    }
  }

  /**
   * Creates a new comment
   * @param comment - The comment to create
   * @returns Promise resolving to the created comment
   */
  async createComment(comment: ReviewComment): Promise<ReviewComment> {
    try {
      return await this.dbService.createComment(comment)
    } catch (error) {
      console.error('Failed to create comment:', error)
      throw error
    }
  }

  /**
   * Gets a comment by ID
   * @param id - The ID of the comment to get
   * @returns Promise resolving to the comment or undefined if not found
   */
  async getComment(id: string): Promise<ReviewComment | undefined> {
    try {
      return await this.dbService.getComment(id)
    } catch (error) {
      console.error('Failed to get comment:', error)
      throw error
    }
  }

  /**
   * Gets all comments
   * @returns Promise resolving to an array of comments
   */
  async getAllComments(): Promise<ReviewComment[]> {
    try {
      return await this.dbService.getAllComments()
    } catch (error) {
      console.error('Failed to get all comments:', error)
      throw error
    }
  }

  /**
   * Gets comments for a specific page
   * @param pageUrl - The URL of the page to get comments for
   * @returns Promise resolving to an array of comments
   */
  async getCommentsByPage(pageUrl: string): Promise<ReviewComment[]> {
    try {
      return await this.dbService.getCommentsByPage(pageUrl)
    } catch (error) {
      console.error('Failed to get comments by page:', error)
      throw error
    }
  }

  /**
   * Updates a comment
   * @param comment - The comment to update
   * @returns Promise resolving to the updated comment
   */
  async updateComment(comment: ReviewComment): Promise<ReviewComment> {
    try {
      return await this.dbService.updateComment(comment)
    } catch (error) {
      console.error('Failed to update comment:', error)
      throw error
    }
  }

  /**
   * Deletes a comment
   * @param id - The ID of the comment to delete
   * @returns Promise resolving when the deletion is complete
   */
  async deleteComment(id: string): Promise<void> {
    try {
      await this.dbService.deleteComment(id)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      throw error
    }
  }

  /**
   * Seeds the database with test data if needed
   * @param forceReseed - Whether to force reseeding even if the version matches
   * @returns Promise resolving to true if seeding was performed, false otherwise
   */
  async seedDatabaseIfNeeded(forceReseed = false): Promise<boolean> {
    try {
      return await this.seedService.seedDemoDatabaseIfNeeded(forceReseed)
    } catch (error) {
      console.error('Failed to seed database:', error)
      throw error
    }
  }

  /**
   * Verifies that the database was seeded correctly
   * @returns Promise resolving to true if verification passed, false otherwise
   */
  async verifyDatabaseSeeded(): Promise<boolean> {
    try {
      return await this.seedService.verifyDatabaseSeeded(this.dbName)
    } catch (error) {
      console.error('Failed to verify database seeded:', error)
      throw error
    }
  }

  /**
   * Resets the seed version cache to force reseeding
   */
  resetSeedVersion(): void {
    this.seedService.resetSeedVersion()
  }

  /**
   * Gets the database name for a feedback package URL from cache
   * @param feedbackPackageUrl - URL of the feedback package
   * @returns The cached database name or undefined if not found
   */
  static getCachedDatabaseName(
    feedbackPackageUrl: string,
    storagePrefix?: string
  ): string | undefined {
    const cacheService = new CacheService(storagePrefix)
    return cacheService.getCachedDatabaseName(feedbackPackageUrl)
  }

  /**
   * Creates a StorageService instance for an existing database
   * @param feedbackPackageUrl - URL of the feedback package
   * @param storagePrefix - Prefix for localStorage keys
   * @returns StorageService instance or undefined if not found in cache
   */
  static fromExistingDatabase(
    feedbackPackageUrl: string,
    storagePrefix?: string
  ): StorageService | undefined {
    const dbName = StorageService.getCachedDatabaseName(feedbackPackageUrl, storagePrefix)

    if (dbName) {
      return new StorageService(dbName, storagePrefix)
    }

    return undefined
  }

  /**
   * Closes the database connection
   */
  close(): void {
    this.dbService.close()
  }
}

// Export all components
export { DatabaseService } from './db'
export { CacheService } from './cache'
export { SeedDataService } from './seedData'
