/**
 * @fileoverview Demo Database Seeding Utility
 * @version 1.0.0
 * @author BackChannel Team
 */

import { CaptureComment, DocumentMetadata, isCaptureComment } from '../types';
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
 * Check if a demo database seed is present in window object
 */
function getDemoSeed(): DemoDatabaseSeed | null {
  if (typeof window === 'undefined' || !window.demoDatabaseSeed) {
    return null;
  }

  const seed = window.demoDatabaseSeed as Record<string, unknown>;

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

  // Validate comments
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
    version: seed.version,
    metadata: seed.metadata,
    comments: validComments,
  };
}

/**
 * Check if the seed version has already been applied
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
 * Mark a seed version as applied
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
 * Seed the database with demo data if needed
 * Only seeds if the version is not yet present in localStorage
 */
export async function seedDemoDatabaseIfNeeded(): Promise<boolean> {
  console.log('Checking if demo database seeding is needed...');

  // Check if demo seed is available
  const demoSeed = getDemoSeed();
  if (!demoSeed) {
    console.log('No demo seed found in window.demoDatabaseSeed');
    return false;
  }

  // Check if version is already applied
  if (isVersionAlreadyApplied(demoSeed.version)) {
    console.log(
      `Demo seed version ${demoSeed.version} already applied, skipping seeding`
    );
    return false;
  }

  try {
    console.log(`Seeding demo database with version ${demoSeed.version}...`);

    // Initialize database service
    const dbService = new DatabaseService();
    await dbService.initialize();

    // Clear existing data to ensure clean state
    await dbService.clear();
    console.log('Cleared existing data for fresh seeding');

    // Seed metadata
    await dbService.setMetadata(demoSeed.metadata);
    console.log('Demo metadata seeded successfully');

    // Seed comments
    for (const comment of demoSeed.comments) {
      await dbService.addComment(comment);
    }
    console.log(
      `${demoSeed.comments.length} demo comments seeded successfully`
    );

    // Mark version as applied
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
 * Force reseed demo database (for debugging purposes)
 * This will clear the version flag and reseed even if already applied
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
 * Get the currently applied seed version
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
 * Clear seed version flag (for testing/debugging)
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
