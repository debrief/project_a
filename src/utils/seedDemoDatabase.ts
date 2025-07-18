/**
 * @fileoverview Demo Database Seeding Utility
 * @version 2.0.0
 * @author BackChannel Team
 */

import {
  CaptureComment,
  DocumentMetadata,
  isCaptureComment,
  FakeDbStore,
} from '../types'
import { DatabaseService } from '../services/DatabaseService'

/**
 * Demo database seed structure (expected in window.demoDatabaseSeed)
 */
export interface DemoDatabaseSeed {
  version: string
  metadata: DocumentMetadata
  comments: CaptureComment[]
}

/**
 * localStorage key for tracking seed versions
 */
const SEED_VERSION_KEY = 'backchannel-seed-version'

/**
 * Validates and retrieves demo seed data from window.demoDatabaseSeed
 * @returns Validated demo seed data or null if not available or invalid
 */
function getDemoSeed(): DemoDatabaseSeed | null {
  if (typeof window === 'undefined' || !window.demoDatabaseSeed) {
    return null
  }

  const seed = window.demoDatabaseSeed as unknown as Record<string, unknown>

  // Validate seed structure
  if (!seed.version || typeof seed.version !== 'string') {
    console.warn('Demo seed missing or invalid version')
    return null
  }

  if (!seed.metadata || typeof seed.metadata !== 'object') {
    console.warn('Demo seed missing or invalid metadata')
    return null
  }

  if (!Array.isArray(seed.comments)) {
    console.warn('Demo seed missing or invalid comments array')
    return null
  }

  // Validate comments using type guard
  const validComments = (seed.comments as unknown[]).filter(
    (comment: unknown) => {
      if (!isCaptureComment(comment)) {
        console.warn('Invalid comment in demo seed:', comment)
        return false
      }
      return true
    }
  )

  return {
    version: seed.version as string,
    metadata: seed.metadata as DocumentMetadata,
    comments: validComments as CaptureComment[],
  }
}

/**
 * Extracts database configuration from window.fakeData for testing
 * @returns Database configuration object or null if not available
 */
function getFakeDbConfig(): { dbName: string; dbVersion: number } | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Check if fakeData is available with database configuration
  const fakeData = (window as unknown as { fakeData?: FakeDbStore }).fakeData
  if (fakeData && fakeData.databases && fakeData.databases.length > 0) {
    const firstDb = fakeData.databases[0]
    return {
      dbName: firstDb.name,
      dbVersion: firstDb.version,
    }
  }

  return null
}

/**
 * Checks if a database exists without opening it
 * @param dbName Name of the database to check
 * @returns Promise<boolean> true if database exists
 */
async function databaseExists(dbName: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      // Check if indexedDB is available (might not be in test environment)
      if (typeof indexedDB === 'undefined' || !indexedDB || !indexedDB.open) {
        // In test environment, assume database doesn't exist
        resolve(false)
        return
      }

      // Try to open database with version 1 to see if it exists
      const request = indexedDB.open(dbName)

      request.onsuccess = () => {
        const db = request.result
        const exists = db.version > 0
        db.close()
        resolve(exists)
      }

      request.onerror = () => {
        // Database doesn't exist or can't be opened
        resolve(false)
      }

      request.onblocked = () => {
        // Database exists but is blocked
        resolve(true)
      }
    } catch (error) {
      console.warn('Error checking database existence:', error)
      // Any error means we can't check, assume doesn't exist
      resolve(false)
    }
  })
}

/**
 * Closes any active database connections for the specified database
 * @param dbName Name of the database to close connections for
 */
function closeActiveConnections(dbName: string): void {
  try {
    // Check if BackChannel has an active database service that matches
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { BackChannel?: unknown }).BackChannel
    ) {
      const backChannel = (
        window as unknown as {
          BackChannel: {
            databaseService?: {
              getDatabaseName?: () => string
              close?: () => void
            }
          }
        }
      ).BackChannel
      if (
        backChannel.databaseService &&
        backChannel.databaseService.getDatabaseName &&
        backChannel.databaseService.getDatabaseName() === dbName
      ) {
        backChannel.databaseService.close()
      }
    }
  } catch (error) {
    console.warn('Error closing active connections:', error)
  }
}

/**
 * Completely deletes an IndexedDB database
 * @param dbName Name of the database to delete
 * @returns Promise that resolves when deletion is complete
 */
async function deleteDatabase(dbName: string): Promise<void> {
  // First close any active connections
  closeActiveConnections(dbName)

  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName)

    deleteRequest.onsuccess = () => {
      resolve()
    }

    deleteRequest.onerror = () => {
      console.error(`Failed to delete database ${dbName}:`, deleteRequest.error)
      reject(deleteRequest.error)
    }

    deleteRequest.onblocked = () => {
      console.warn(`Database ${dbName} deletion blocked - close other tabs`)
      // Add a timeout to resolve anyway after a few seconds
      setTimeout(() => {
        console.warn(`Database deletion timeout, continuing anyway`)
        resolve()
      }, 3000)
    }
  })
}

/**
 * Checks if a specific seed version has already been applied
 * This now includes verification that the database actually exists and contains data
 * @param version Version string to check
 * @returns true if version was previously applied AND database exists with data, false otherwise
 */
async function isVersionAlreadyApplied(version: string): Promise<boolean> {
  try {
    const appliedVersion = localStorage.getItem(SEED_VERSION_KEY)
    if (appliedVersion !== version) {
      return false
    }

    // localStorage indicates version was applied, but we need to verify the database actually exists
    const fakeDbConfig = getFakeDbConfig()
    const dbName = fakeDbConfig?.dbName || 'BackChannelDB'

    // Check if database exists
    const dbExists = await databaseExists(dbName)
    if (!dbExists) {
      // Clear the stale localStorage entry
      localStorage.removeItem(SEED_VERSION_KEY)
      return false
    }

    // Database exists, but let's verify it actually contains the expected data
    try {
      const dbService = new DatabaseService(
        undefined,
        dbName,
        fakeDbConfig?.dbVersion || 1
      )
      await dbService.initialize()

      const metadata = await dbService.getMetadata()
      const comments = await dbService.getComments()

      const hasData = metadata !== null && comments.length > 0

      if (!hasData) {
        localStorage.removeItem(SEED_VERSION_KEY)
        return false
      }

      return true
    } catch (error) {
      console.warn('Failed to verify database contents:', error)
      // If we can't verify, assume we need to re-seed
      localStorage.removeItem(SEED_VERSION_KEY)
      return false
    }
  } catch (error) {
    console.warn('Failed to check applied seed version:', error)
    return false
  }
}

/**
 * Marks a seed version as applied in localStorage
 * @param version Version string to mark as applied
 */
function markVersionAsApplied(version: string): void {
  try {
    localStorage.setItem(SEED_VERSION_KEY, version)
  } catch (error) {
    console.warn('Failed to mark seed version as applied:', error)
  }
}

/**
 * Seeds the database with demo data if the version hasn't been applied before
 * Deletes existing database and creates a fresh one for clean state
 * @returns true if seeding was performed, false if skipped
 */
export async function seedDemoDatabaseIfNeeded(): Promise<boolean> {
  // Step 1: Check if demo seed is available
  const demoSeed = getDemoSeed()
  if (!demoSeed) {
    return false
  }

  // Step 2: Check if version is already applied (with database verification)
  if (await isVersionAlreadyApplied(demoSeed.version)) {
    console.log(
      `Demo seed version ${demoSeed.version} already applied and verified, skipping seeding`
    )
    return false
  }

  try {
    // Step 3: Get database configuration
    const fakeDbConfig = getFakeDbConfig()
    const dbName = fakeDbConfig?.dbName || 'BackChannelDB'
    const dbVersion = fakeDbConfig?.dbVersion || 1

    // Step 4: Delete existing database (only if it exists)
    if (await databaseExists(dbName)) {
      try {
        await deleteDatabase(dbName)
      } catch (error) {
        console.warn('Database deletion failed:', error)
        // Try to continue anyway
      }
    }

    // Step 5: Create fresh database service
    const dbService = new DatabaseService(undefined, dbName, dbVersion)
    await dbService.initialize()

    // Step 6: Seed metadata
    await dbService.setMetadata(demoSeed.metadata)

    // Verify metadata was actually saved
    const savedMetadata = await dbService.getMetadata()
    if (!savedMetadata) {
      console.error('ERROR: Metadata was not saved to database!')
    }

    // Step 7: Seed comments
    for (const comment of demoSeed.comments) {
      await dbService.addComment(comment)
    }

    // Verify comments were actually saved
    const savedComments = await dbService.getComments()
    if (savedComments.length !== demoSeed.comments.length) {
      console.error('ERROR: Comment count mismatch!', {
        expected: demoSeed.comments.length,
        actual: savedComments.length,
      })
    }

    // Step 8: Mark version as applied
    markVersionAsApplied(demoSeed.version)

    return true
  } catch (error) {
    console.error('Failed to seed demo database:', error)
    return false
  }
}

/**
 * Forces reseeding by clearing version flag and calling main seeding function
 * @returns true if seeding was performed, false if failed
 */
export async function forceReseedDemoDatabase(): Promise<boolean> {
  // Clear the version flag
  try {
    localStorage.removeItem(SEED_VERSION_KEY)
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error)
  }

  // Perform seeding
  return await seedDemoDatabaseIfNeeded()
}

/**
 * Gets the currently applied seed version from localStorage
 * @returns Version string or null if no version applied
 */
export function getCurrentSeedVersion(): string | null {
  try {
    return localStorage.getItem(SEED_VERSION_KEY)
  } catch (error) {
    console.warn('Failed to get current seed version:', error)
    return null
  }
}

/**
 * Clears the seed version flag from localStorage
 * Used for debugging and testing scenarios
 */
export function clearSeedVersion(): void {
  try {
    localStorage.removeItem(SEED_VERSION_KEY)
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error)
  }
}

// Extend global window interface for TypeScript
declare global {
  interface Window {
    demoDatabaseSeed?: DemoDatabaseSeed
  }
}
