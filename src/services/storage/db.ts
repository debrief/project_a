/**
 * IndexedDB database connection and initialization
 */

import { FeedbackPackage, ReviewComment } from '../../types'

// Constants
const DB_VERSION = 1
const COMMENTS_STORE = 'comments'
const FEEDBACK_PACKAGE_STORE = 'feedbackPackage'

/**
 * Database connection interface
 */
interface DBConnection {
  db: IDBDatabase
  close: () => void
}

/**
 * Class for managing IndexedDB connections and operations
 */
export class DatabaseService {
  private dbName: string
  private feedbackPackage?: FeedbackPackage
  private connectionPool: Map<string, DBConnection> = new Map()

  /**
   * Creates a new DatabaseService instance
   * @param dbName - Name of the IndexedDB database
   * @param feedbackPackage - The single feedback package for this database (optional when opening existing database)
   */
  constructor(dbName: string, feedbackPackage?: FeedbackPackage) {
    this.dbName = dbName
    this.feedbackPackage = feedbackPackage
  }

  /**
   * Opens a connection to the database
   * @returns Promise resolving to an IDBDatabase instance
   */
  async connect(): Promise<IDBDatabase> {
    // Check if we already have an open connection
    const existingConnection = this.connectionPool.get(this.dbName)
    if (existingConnection) {
      return existingConnection.db
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, DB_VERSION)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(COMMENTS_STORE)) {
            const commentsStore = db.createObjectStore(COMMENTS_STORE, { keyPath: 'id' })
            commentsStore.createIndex('pageUrl', 'pageUrl', { unique: false })
          }

          if (!db.objectStoreNames.contains(FEEDBACK_PACKAGE_STORE)) {
            db.createObjectStore(FEEDBACK_PACKAGE_STORE, { keyPath: 'id' })
          }
        }

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Store the connection in the pool
          const connection: DBConnection = {
            db,
            close: () => {
              db.close()
              this.connectionPool.delete(this.dbName)
            },
          }

          this.connectionPool.set(this.dbName, connection)

          // Initialize with the feedback package
          this.initializeFeedbackPackage()
            .then(() => resolve(db))
            .catch(reject)
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to open database: ${(event.target as IDBOpenDBRequest).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Initializes the feedback package in the database if it doesn't exist
   * @returns Promise resolving when initialization is complete
   */
  private async initializeFeedbackPackage(): Promise<void> {
    try {
      const existingPackage = await this.getFeedbackPackage()

      if (existingPackage) {
        // If we're opening an existing database, store the feedback package
        if (!this.feedbackPackage) {
          this.feedbackPackage = existingPackage
        }
      } else if (this.feedbackPackage) {
        // Only try to initialize if we have a feedback package to store
        await this.updateFeedbackPackage(this.feedbackPackage)
      } else {
        throw new Error('No feedback package provided and none exists in the database')
      }
    } catch (error) {
      console.error('Failed to initialize feedback package:', error)
      throw error
    }
  }

  /**
   * Gets the feedback package from the database
   * @returns Promise resolving to the feedback package or undefined if not found
   */
  async getFeedbackPackage(): Promise<FeedbackPackage | undefined> {
    const db = await this.connect()

    return new Promise<FeedbackPackage | undefined>((resolve, reject) => {
      try {
        const transaction = db.transaction(FEEDBACK_PACKAGE_STORE, 'readonly')
        const store = transaction.objectStore(FEEDBACK_PACKAGE_STORE)
        const request = store.getAll()

        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result as FeedbackPackage[]
          resolve(result.length > 0 ? result[0] : undefined)
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to get feedback package: ${(event.target as IDBRequest).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Updates the feedback package
   * @param feedbackPackage - The feedback package to update
   * @returns Promise resolving when the update is complete
   */
  async updateFeedbackPackage(feedbackPackage: FeedbackPackage): Promise<void> {
    const db = await this.connect()

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(FEEDBACK_PACKAGE_STORE, 'readwrite')
        const store = transaction.objectStore(FEEDBACK_PACKAGE_STORE)

        // Update the timestamp
        feedbackPackage.updatedAt = Date.now()

        const request = store.put(feedbackPackage)

        request.onsuccess = () => {
          // Update our local reference to the feedback package
          this.feedbackPackage = feedbackPackage
          resolve()
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to update feedback package: ${(event.target as IDBRequest).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Creates a new comment in the database
   * @param comment - The comment to create
   * @returns Promise resolving to the created comment
   */
  async createComment(comment: ReviewComment): Promise<ReviewComment> {
    const db = await this.connect()

    return new Promise<ReviewComment>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readwrite')
        const store = transaction.objectStore(COMMENTS_STORE)
        const request = store.add(comment)

        request.onsuccess = () => {
          resolve(comment)
        }

        request.onerror = (event) => {
          reject(
            new Error(`Failed to create comment: ${(event.target as IDBRequest).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Gets a comment by ID
   * @param id - The ID of the comment to get
   * @returns Promise resolving to the comment or undefined if not found
   */
  async getComment(id: string): Promise<ReviewComment | undefined> {
    const db = await this.connect()

    return new Promise<ReviewComment | undefined>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readonly')
        const store = transaction.objectStore(COMMENTS_STORE)
        const request = store.get(id)

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result as ReviewComment | undefined)
        }

        request.onerror = (event) => {
          reject(new Error(`Failed to get comment: ${(event.target as IDBRequest).error?.message}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Gets all comments
   * @returns Promise resolving to an array of comments
   */
  async getAllComments(): Promise<ReviewComment[]> {
    const db = await this.connect()

    return new Promise<ReviewComment[]>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readonly')
        const store = transaction.objectStore(COMMENTS_STORE)
        const request = store.getAll()

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result as ReviewComment[])
        }

        request.onerror = (event) => {
          reject(
            new Error(`Failed to get all comments: ${(event.target as IDBRequest).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Gets comments for a specific page
   * @param pageUrl - The URL of the page to get comments for
   * @returns Promise resolving to an array of comments
   */
  async getCommentsByPage(pageUrl: string): Promise<ReviewComment[]> {
    const db = await this.connect()

    return new Promise<ReviewComment[]>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readonly')
        const store = transaction.objectStore(COMMENTS_STORE)
        const index = store.index('pageUrl')
        const request = index.getAll(pageUrl)

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result as ReviewComment[])
        }

        request.onerror = (event) => {
          reject(
            new Error(
              `Failed to get comments by page: ${(event.target as IDBRequest).error?.message}`
            )
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Updates a comment in the database
   * @param comment - The comment to update
   * @returns Promise resolving to the updated comment
   */
  async updateComment(comment: ReviewComment): Promise<ReviewComment> {
    const db = await this.connect()

    return new Promise<ReviewComment>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readwrite')
        const store = transaction.objectStore(COMMENTS_STORE)
        const request = store.put(comment)

        request.onsuccess = () => {
          resolve(comment)
        }

        request.onerror = (event) => {
          reject(
            new Error(`Failed to update comment: ${(event.target as IDBRequest).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Deletes a comment from the database
   * @param id - The ID of the comment to delete
   * @returns Promise resolving when the deletion is complete
   */
  async deleteComment(id: string): Promise<void> {
    const db = await this.connect()

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(COMMENTS_STORE, 'readwrite')
        const store = transaction.objectStore(COMMENTS_STORE)
        const request = store.delete(id)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = (event) => {
          reject(
            new Error(`Failed to delete comment: ${(event.target as IDBRequest).error?.message}`)
          )
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Closes the database connection
   */
  close(): void {
    const connection = this.connectionPool.get(this.dbName)
    if (connection) {
      connection.close()
    }
  }
}
