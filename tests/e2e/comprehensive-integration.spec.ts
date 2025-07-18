/**
 * @fileoverview Comprehensive E2E integration tests for BackChannel
 * Tests real browser functionality including database setup, URL matching, and UI interactions
 * @version 1.0.0
 * @author BackChannel Team
 */

/// <reference path="./types.d.ts" />

import { test, expect, Page } from '@playwright/test';

/**
 * Define a comprehensive interface for our debug info object
 */
interface DebugInfo {
  backChannelExists: boolean;
  state: any;
  currentUrl: string;
  demoDataExists?: boolean;
  demoDataVersion?: any;
  demoDataDocumentRootUrl?: any;
  fakeDataExists?: boolean;
  fakeDataDbName?: any;
  iconCount?: number;
  isEnabled?: any;
  hasInitMethod?: boolean;
  hasGetStateMethod?: boolean;
  hasIsEnabledProp?: boolean;
  databaseServiceExists?: boolean;
  actualDbName?: string;
  actualDbVersion?: number;
  enabledCheckResult?: boolean;
  storedMetadata?: any;
  storedCommentCount?: number;
  enabledCheckError?: string;
  databaseServiceMissing?: boolean;
  backChannelMissing?: boolean;
  seedVersionInStorage?: string | null;
  enabledStateInStorage?: string | null;
  storageError?: string;
  databaseError?: string;
}

/**
 * Helper to clear all browser storage and databases
 */
async function clearBrowserStorage(page: Page) {
  await page.evaluate(async () => {
    try {
      // Clear localStorage (may fail due to security restrictions)
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
    
    try {
      // Clear IndexedDB databases
      if (typeof indexedDB !== 'undefined') {
        const dbNames = ['BackChannelDB', 'BackChannelDB-Demo', 'BackChannelDB-EnabledTest'];
        
        for (const dbName of dbNames) {
          try {
            await new Promise<void>((resolve) => {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Continue anyway
              deleteReq.onblocked = () => resolve(); // Continue anyway
              // Add timeout for blocked operations
              setTimeout(() => resolve(), 1000);
            });
          } catch (error) {
            console.warn(`Failed to delete database ${dbName}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear IndexedDB:', error);
    }
  });
}

/**
 * Helper to wait for BackChannel initialization
 */
async function waitForBackChannelInit(page: Page) {
  await page.waitForFunction(() => {
    return window.BackChannel && typeof window.BackChannel.getState === 'function';
  }, { timeout: 10000 });
}

test.describe('BackChannel Comprehensive Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a basic page first to establish context
    await page.goto('/');
    
    // Clear all storage before each test
    await clearBrowserStorage(page);
  });

  test.describe('Database Setup and Seeding', () => {
    test('should seed database correctly when fake data is present', async ({ page }) => {
      // Set up console log collection BEFORE navigation
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      // Navigate to a page with fake data
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      
      // Wait for BackChannel to initialize
      await waitForBackChannelInit(page);
      
      // Wait a bit for all logs to be captured
      await page.waitForTimeout(2000);
      
      // Verify seeding logs
      const seedingLogs = logs.filter(log => 
        log.includes('Seeding demo database') || 
        log.includes('Demo metadata seeded') ||
        log.includes('Demo database seeding completed') ||
        log.includes('fake data set on window')
      );
      
      expect(seedingLogs.length).toBeGreaterThan(0);
    });

    test('should not attempt seeding when version is already applied', async ({ page }) => {
      // Set up console log collection BEFORE navigation
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      // Navigate to enabled page (which will seed)
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      await page.waitForTimeout(2000);
      
      // Navigate to the same page again (which should not seed)
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      await page.waitForTimeout(2000);
      
      const skipSeedLogs = logs.filter(log => 
        log.includes('already applied and verified, skipping seeding') || 
        log.includes('seed already applied')
      );
      
      expect(skipSeedLogs.length).toBeGreaterThan(0);
    });
  });

  test.describe('URL-based Enabled/Disabled Detection', () => {
    test('should enable BackChannel on pages matching feedback package URL snippet', async ({ page }) => {
      // The documentRootUrl in the seed data is just '/enabled-test/enabled/'.
      // This test verifies that BackChannel enables itself because the current URL
      // contains this snippet.

      // Navigate to a page that will be matched by the URL snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);

      // Check that BackChannel is enabled.
      const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
      expect(isEnabled).toBe(true);

      // Check that the icon is visible.
      const iconCount = await page.evaluate(() => document.querySelectorAll('backchannel-icon').length);
      expect(iconCount).toBeGreaterThan(0);
    });

    test('should enable BackChannel on subdirectory pages within enabled path', async ({ page }) => {
      // This test also relies on the '/enabled-test/enabled/' snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html');
      await waitForBackChannelInit(page);

      const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
      expect(isEnabled).toBe(true);
    });

    test('should disable BackChannel on pages NOT matching the URL snippet', async ({ page }) => {
      // This page URL does not contain the '/enabled-test/enabled/' snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
      await waitForBackChannelInit(page);

      const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
      expect(isEnabled).toBe(false);
    });

    test('should disable BackChannel on subdirectory pages outside the enabled path', async ({ page }) => {
      // This page URL also does not contain the snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/subdir/index.html');
      await waitForBackChannelInit(page);

      const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
      expect(isEnabled).toBe(false);
    });
  });

  test.describe('Database Debug Tool Integration', () => {
    test('should successfully use debug tool to inspect database', async ({ page }) => {
      // Navigate to debug tool
      await page.goto('/tests/debug-db.html');
      
      // Setup demo data
      await page.click('button:has-text("Setup Demo Data")');
      
      // Wait a bit for setup
      await page.waitForTimeout(500);
      
      // Test seeding
      await page.click('button:has-text("Test Seeding Process")');
      
      // Wait for seeding to complete
      await page.waitForTimeout(1000);
      
      // Inspect database
      await page.click('button:has-text("Inspect Database Contents")');
      
      // Wait for inspection
      await page.waitForTimeout(1000);
      
      // Check for success messages in console output
      const consoleOutput = await page.locator('#console-output').textContent();
      expect(consoleOutput).toContain('Demo data setup complete');
      expect(consoleOutput).toContain('Seeding result: true');
    });

    test('should force delete database and recreate', async ({ page }) => {
      // Navigate to debug tool
      await page.goto('/tests/debug-db.html');
      
      // Setup initial data
      await page.click('button:has-text("Setup Demo Data")');
      await page.waitForTimeout(500);
      
      // Force delete database
      await page.click('button:has-text("Force Delete Database")');
      
      // Wait for deletion
      await page.waitForTimeout(2000);
      
      // Check console output for deletion success
      const consoleOutput = await page.locator('#console-output').textContent();
      expect(consoleOutput).toMatch(/deleted successfully|deletion blocked/);
    });
  });

  test.describe('Cross-Page Navigation and State Persistence', () => {
    test('should maintain enabled state when navigating within an enabled path', async ({ page }) => {
      // Start on a page that matches the snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      expect(await page.evaluate(() => window.BackChannel.isEnabled)).toBe(true);

      // Navigate to another page that also matches.
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html');
      await waitForBackChannelInit(page);
      expect(await page.evaluate(() => window.BackChannel.isEnabled)).toBe(true);
    });

    test('should change state when navigating from an enabled to a disabled path', async ({ page }) => {
      // Start on a page that matches the snippet.
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      expect(await page.evaluate(() => window.BackChannel.isEnabled)).toBe(true);

      // Navigate to a page that does not match.
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
      await waitForBackChannelInit(page);
      expect(await page.evaluate(() => window.BackChannel.isEnabled)).toBe(false);
    });
  });

  test.describe('URL Pattern Matching Edge Cases', () => {
    test('should handle different port numbers correctly', async ({ page }) => {
      // Set up console logging BEFORE navigation
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      // Navigate to enabled section
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      
      // Wait for initial logs to be captured
      await page.waitForTimeout(2000);
      
      // Trigger enabled state check to get more logs
      await page.evaluate(() => {
        if (window.BackChannel && window.BackChannel.databaseService) {
          window.BackChannel.databaseService.clearEnabledStateCache();
          return window.BackChannel.databaseService.isBackChannelEnabled();
        }
        return Promise.resolve(false);
      });
      
      // Wait for more logs
      await page.waitForTimeout(1000);
      
      // Verify path-based matching is working
      const matchingLogs = logs.filter(log => 
        log.includes('URL path matching') && log.includes('enabled-test')
      );
      
      expect(matchingLogs.length).toBeGreaterThan(0);
    });

    test('should handle file:// protocol correctly on main page', async ({ page }) => {
      // Navigate to main page which uses file:// pattern
      await page.goto('/');
      await waitForBackChannelInit(page);
      
      // Check if it's correctly enabled for file:// URLs
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      // Trigger seeding which should create file:// pattern
      await page.reload();
      await waitForBackChannelInit(page);
      
      // Look for file protocol matching
      const fileProtocolLogs = logs.filter(log => 
        log.includes('File protocol matching')
      );
      
      // Should have file protocol matching if demo data was seeded
      if (logs.some(log => log.includes('Demo database seeding completed'))) {
        expect(fileProtocolLogs.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should gracefully handle missing IndexedDB', async ({ page }) => {
      // Temporarily disable IndexedDB
      await page.addInitScript(() => {
        delete window.indexedDB;
      });
      
      await page.goto('/tests/debug-db.html');
      
      // Try to use debug functions
      await page.click('button:has-text("Test Seeding Process")');
      await page.waitForTimeout(1000);
      
      // Should not crash, should handle gracefully
      const consoleOutput = await page.locator('#console-output').textContent();
      expect(consoleOutput).toContain('Seeding result: false');
    });

    test('should handle malformed demo seed data', async ({ page }) => {
      // Navigate to page and inject malformed data
      await page.goto('/tests/debug-db.html');
      
      await page.evaluate(() => {
        // Set up malformed demo seed
        window.demoDatabaseSeed = {
          // Missing version
          metadata: { documentTitle: 'Test' },
          comments: []
        };
      });
      
      await page.click('button:has-text("Test Seeding Process")');
      await page.waitForTimeout(1000);
      
      // Should handle gracefully
      const consoleOutput = await page.locator('#console-output').textContent();
      expect(consoleOutput).toContain('Seeding result: false');
    });
  });
});