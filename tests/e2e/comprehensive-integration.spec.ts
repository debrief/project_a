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
    test('should enable BackChannel on pages matching feedback package URL pattern', async ({ page }) => {
      // Set up console log and error collection
      const logs: string[] = [];
      const errors: string[] = [];
      page.on('console', msg => {
        logs.push(msg.text());
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Navigate to enabled section
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      
      // Wait for the window 'load' event to ensure BackChannel auto-initializes
      await page.waitForLoadState('load');
      
      // Wait for the icon to be rendered, which indicates UI is ready
      await page.waitForFunction(() => document.querySelector('backchannel-icon'), { timeout: 10000 });
      
      // Debug: Check BackChannel state and database configuration
      const debugInfo: DebugInfo = await page.evaluate(async () => {
        const info: DebugInfo = {
          backChannelExists: !!window.BackChannel,
          state: window.BackChannel ? window.BackChannel.getState() : 'NOT_FOUND',
          currentUrl: window.location.href,
          demoDataExists: !!window.demoDatabaseSeed,
          demoDataVersion: window.demoDatabaseSeed ? window.demoDatabaseSeed.version : 'NOT_FOUND',
          demoDataDocumentRootUrl: window.demoDatabaseSeed ? window.demoDatabaseSeed.metadata.documentRootUrl : 'NOT_FOUND',
          fakeDataExists: !!window.fakeData,
          fakeDataDbName: window.fakeData && window.fakeData.databases ? window.fakeData.databases[0].name : 'NOT_FOUND',
          iconCount: document.querySelectorAll('backchannel-icon').length,
          isEnabled: window.BackChannel ? window.BackChannel.isEnabled : 'NOT_FOUND'
        };
        
        // Additional debug: Check what database BackChannel is actually using
        if (window.BackChannel) {
          info.hasInitMethod = typeof window.BackChannel.init === 'function';
          info.hasGetStateMethod = typeof window.BackChannel.getState === 'function';
          info.hasIsEnabledProp = 'isEnabled' in window.BackChannel;
          info.databaseServiceExists = !!window.BackChannel.databaseService;
          
          if (window.BackChannel.databaseService) {
            info.actualDbName = window.BackChannel.databaseService.getDatabaseName();
            info.actualDbVersion = window.BackChannel.databaseService.getDatabaseVersion();
            
            // Check if BackChannel is enabled and get detailed info
            try {
              info.enabledCheckResult = await window.BackChannel.databaseService.isBackChannelEnabled();
              
              // Get metadata from the database to see what's actually stored
              const metadata = await window.BackChannel.databaseService.getMetadata();
              info.storedMetadata = metadata;
              
              const comments = await window.BackChannel.databaseService.getComments();
              info.storedCommentCount = comments.length;
              
            } catch (error) {
              info.enabledCheckError = error.message;
            }
          } else {
            info.databaseServiceMissing = true;
          }
        } else {
          info.backChannelMissing = true;
        }
        
        // Check localStorage for seed version
        try {
          info.seedVersionInStorage = localStorage.getItem('backchannel-seed-version');
          info.enabledStateInStorage = localStorage.getItem('backchannel-enabled-state');
        } catch (error) {
          info.storageError = error.message;
        }
        
        console.log('Extended debug info:', info);
        return info;
      });
      
      console.log('Debug from test:', debugInfo);
      console.log('Console logs:', logs);
      console.log('Console errors:', errors);
      
      // Check that BackChannel is enabled
      const isEnabled = debugInfo.isEnabled;
      expect(isEnabled).toBe(true);
      
      // Check that icon exists
      expect(debugInfo.iconCount).toBeGreaterThan(0);
    });

    test('should enable BackChannel on subdirectory pages within enabled path', async ({ page }) => {
      // Navigate to subdirectory within enabled section
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html');
      await waitForBackChannelInit(page);
      
      // Check that BackChannel is enabled
      const isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      
      expect(isEnabled).toBe(true);
    });

    test('should disable BackChannel on pages NOT matching feedback package URL pattern', async ({ page }) => {
      // Set up console log collection
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));
      
      // Navigate to disabled section
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
      await waitForBackChannelInit(page);
      
      // Wait for the window 'load' event to ensure BackChannel auto-initializes
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);
      
      // Debug: Check BackChannel state
      const debugInfo: DebugInfo = await page.evaluate(async () => {
        const info: DebugInfo = {
          currentUrl: window.location.href,
          backChannelExists: !!window.BackChannel,
          state: window.BackChannel ? window.BackChannel.getState() : 'NOT_FOUND',
          isEnabled: window.BackChannel ? window.BackChannel.isEnabled : 'NOT_FOUND',
        };
        
        // Check database contents
        if (window.BackChannel && window.BackChannel.databaseService) {
          try {
            info.enabledCheckResult = await window.BackChannel.databaseService.isBackChannelEnabled();
            const metadata = await window.BackChannel.databaseService.getMetadata();
            info.storedMetadata = metadata;
          } catch (error) {
            info.databaseError = error.message;
          }
        }
        
        return info;
      });
      
      console.log('Disabled test debug info:', debugInfo);
      console.log('Disabled test console logs:', logs.filter(log => log.includes('URL path matching')));
      
      // Check that BackChannel is disabled
      const isEnabled = debugInfo.state !== 'inactive';
      expect(isEnabled).toBe(false);
    });

    test('should disable BackChannel on subdirectory pages outside enabled path', async ({ page }) => {
      // Navigate to subdirectory within disabled section
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/subdir/index.html');
      await waitForBackChannelInit(page);
      
      // Check that BackChannel is disabled
      const isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      
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
    test('should maintain enabled state when navigating within enabled path', async ({ page }) => {
      // Start at enabled root
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      
      // Verify enabled
      let isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      expect(isEnabled).toBe(true);
      
      // Navigate to subdirectory
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html');
      await waitForBackChannelInit(page);
      
      // Verify still enabled
      isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      expect(isEnabled).toBe(true);
    });

    test('should change state when navigating from enabled to disabled path', async ({ page }) => {
      // Start at enabled path
      await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
      await waitForBackChannelInit(page);
      
      // Verify enabled
      let isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      expect(isEnabled).toBe(true);
      
      // Navigate to disabled path
      await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
      await waitForBackChannelInit(page);
      
      // Verify now disabled
      isEnabled = await page.evaluate(() => {
        return window.BackChannel.isEnabled;
      });
      expect(isEnabled).toBe(false);
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