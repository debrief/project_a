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
} from '../types';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Demo database seed structure (expected in window.demoDatabaseSeed)
 */
export interface DemoDatabaseSeed {
  version: string;
  metadata: DocumentMetadata;
  comments: CaptureComment[];
}

/**
 * localStorage key for tracking seed versions
 */
const SEED_VERSION_KEY = 'backchannel-seed-version';

/**
 * Validates and retrieves demo seed data from window.demoDatabaseSeed
 * @returns Validated demo seed data or null if not available or invalid
 */
function getDemoSeed(): DemoDatabaseSeed | null {
  if (typeof window === 'undefined' || !window.demoDatabaseSeed) {
    return null;
  }

  const seed = window.demoDatabaseSeed as unknown as Record<string, unknown>;

  // Validate seed structure
  if (!seed.version || typeof seed.version !== 'string') {
    console.warn('Demo seed missing or invalid version');
    return null;
  }

  if (!seed.metadata || typeof seed.metadata !== 'object') {
    console.warn('Demo seed missing or invalid metadata');
    return null;
  }

  if (!Array.isArray(seed.comments)) {
    console.warn('Demo seed missing or invalid comments array');
    return null;
  }

  // Validate comments using type guard
  const validComments = (seed.comments as unknown[]).filter(
    (comment: unknown) => {
      if (!isCaptureComment(comment)) {
        console.warn('Invalid comment in demo seed:', comment);
        return false;
      }
      return true;
    }
  );

  return {
    version: seed.version as string,
    metadata: seed.metadata as DocumentMetadata,
    comments: validComments as CaptureComment[],
  };
}

/**
 * Extracts database configuration from window.fakeData for testing
 * @returns Database configuration object or null if not available
 */
function getFakeDbConfig(): { dbName: string; dbVersion: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if fakeData is available with database configuration
  const fakeData = (window as unknown as { fakeData?: FakeDbStore }).fakeData;
  if (fakeData && fakeData.databases && fakeData.databases.length > 0) {
    const firstDb = fakeData.databases[0];
    return {
      dbName: firstDb.name,
      dbVersion: firstDb.version,
    };
  }

  return null;
}

/**
 * Completely deletes an IndexedDB database
 * @param dbName Name of the database to delete
 * @returns Promise that resolves when deletion is complete
 */
async function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);

    deleteRequest.onsuccess = () => {
      console.log(`Database ${dbName} deleted successfully`);
      resolve();
    };

    deleteRequest.onerror = () => {
      console.error(
        `Failed to delete database ${dbName}:`,
        deleteRequest.error
      );
      reject(deleteRequest.error);
    };

    deleteRequest.onblocked = () => {
      console.warn(`Database ${dbName} deletion blocked - close other tabs`);
      // Could add timeout here if needed
    };
  });
}

/**
 * Checks if a specific seed version has already been applied
 * @param version Version string to check
 * @returns true if version was previously applied, false otherwise
 */
function isVersionAlreadyApplied(version: string): boolean {
  try {
    const appliedVersion = localStorage.getItem(SEED_VERSION_KEY);
    return appliedVersion === version;
  } catch (error) {
    console.warn('Failed to check applied seed version:', error);
    return false;
  }
}

/**
 * Marks a seed version as applied in localStorage
 * @param version Version string to mark as applied
 */
function markVersionAsApplied(version: string): void {
  try {
    localStorage.setItem(SEED_VERSION_KEY, version);
    console.log(`Seed version ${version} marked as applied`);
  } catch (error) {
    console.warn('Failed to mark seed version as applied:', error);
  }
}

/**
 * Seeds the database with demo data if the version hasn't been applied before
 * Deletes existing database and creates a fresh one for clean state
 * @returns true if seeding was performed, false if skipped
 */
export async function seedDemoDatabaseIfNeeded(): Promise<boolean> {
  console.log('Checking if demo database seeding is needed...');

  // Step 1: Check if demo seed is available
  const demoSeed = getDemoSeed();
  if (!demoSeed) {
    console.log('No demo seed found in window.demoDatabaseSeed');
    return false;
  }

  // Step 2: Check if version is already applied
  if (isVersionAlreadyApplied(demoSeed.version)) {
    console.log(
      `Demo seed version ${demoSeed.version} already applied, skipping seeding`
    );
    return false;
  }

  try {
    console.log(`Seeding demo database with version ${demoSeed.version}...`);

    // Step 3: Get database configuration
    const fakeDbConfig = getFakeDbConfig();
    const dbName = fakeDbConfig?.dbName || 'BackChannelDB';
    const dbVersion = fakeDbConfig?.dbVersion || 1;

    console.log(`Using database configuration: ${dbName} v${dbVersion}`);

    // Step 4: Delete existing database
    try {
      await deleteDatabase(dbName);
    } catch (error) {
      // Database may not exist, continue anyway
      console.log('Database deletion failed (may not exist):', error);
    }

    // Step 5: Create fresh database service
    const dbService = new DatabaseService(undefined, dbName, dbVersion);
    await dbService.initialize();

    // Step 6: Seed metadata
    await dbService.setMetadata(demoSeed.metadata);
    console.log('Demo metadata seeded successfully');

    // Step 7: Seed comments
    for (const comment of demoSeed.comments) {
      await dbService.addComment(comment);
    }
    console.log(
      `${demoSeed.comments.length} demo comments seeded successfully`
    );

    // Step 8: Mark version as applied
    markVersionAsApplied(demoSeed.version);
    console.log(
      `Demo database seeding completed for version ${demoSeed.version}`
    );

    return true;
  } catch (error) {
    console.error('Failed to seed demo database:', error);
    return false;
  }
}

/**
 * Forces reseeding by clearing version flag and calling main seeding function
 * @returns true if seeding was performed, false if failed
 */
export async function forceReseedDemoDatabase(): Promise<boolean> {
  console.log('Force reseeding demo database...');

  // Clear the version flag
  try {
    localStorage.removeItem(SEED_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error);
  }

  // Perform seeding
  return await seedDemoDatabaseIfNeeded();
}

/**
 * Gets the currently applied seed version from localStorage
 * @returns Version string or null if no version applied
 */
export function getCurrentSeedVersion(): string | null {
  try {
    return localStorage.getItem(SEED_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to get current seed version:', error);
    return null;
  }
}

/**
 * Clears the seed version flag from localStorage
 * Used for debugging and testing scenarios
 */
export function clearSeedVersion(): void {
  try {
    localStorage.removeItem(SEED_VERSION_KEY);
    console.log('Seed version flag cleared');
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error);
  }
}

// Extend global window interface for TypeScript
declare global {
  interface Window {
    demoDatabaseSeed?: DemoDatabaseSeed;
  }
}
