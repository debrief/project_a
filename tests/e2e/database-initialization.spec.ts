/**
 * @fileoverview E2E tests for database initialization requirements
 * Verifies that BackChannel meets the new requirements for database and localStorage creation
 * @version 1.0.0
 * @author BackChannel Team
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to clear all browser storage
 */
async function clearBrowserStorage(page: Page) {
  await page.evaluate(async () => {
    try {
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    try {
      // Clear IndexedDB databases
      if (typeof indexedDB !== 'undefined') {
        const dbNames = [
          'BackChannelDB',
          'BackChannelDB-Demo',
          'BackChannelDB-EnabledTest',
        ];

        for (const dbName of dbNames) {
          try {
            await new Promise<void>(resolve => {
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Continue anyway
              deleteReq.onblocked = () => resolve(); // Continue anyway
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
  await page.waitForFunction(
    () => {
      return (
        window.BackChannel && typeof window.BackChannel.getState === 'function'
      );
    },
    { timeout: 10000 }
  );
}

/**
 * Helper to check database and localStorage state via debug-db.html
 */
async function checkStorageState(page: Page) {
  await page.goto('/tests/debug-db.html');
  await page.waitForLoadState('networkidle');

  return await page.evaluate(() => {
    // Check localStorage for BackChannel keys
    const localStorageKeys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('backchannel-')) {
          localStorageKeys.push({
            key,
            value: localStorage.getItem(key),
          });
        }
      }
    } catch (error) {
      console.warn('Failed to check localStorage:', error);
    }

    // Check IndexedDB databases
    return new Promise(resolve => {
      const dbNames = [
        'BackChannelDB',
        'BackChannelDB-Demo',
        'BackChannelDB-EnabledTest',
      ];
      const dbResults = [];
      let completed = 0;

      const checkComplete = () => {
        if (completed === dbNames.length) {
          resolve({
            localStorageKeys,
            databases: dbResults,
          });
        }
      };

      for (const dbName of dbNames) {
        const request = indexedDB.open(dbName);

        request.onerror = () => {
          dbResults.push({ name: dbName, exists: false, error: true });
          completed++;
          checkComplete();
        };

        request.onsuccess = () => {
          const db = request.result;
          const objectStoreNames = Array.from(db.objectStoreNames);

          // Check if database has any stores (empty database vs non-existent)
          const hasStores = objectStoreNames.length > 0;

          dbResults.push({
            name: dbName,
            exists: true,
            hasStores,
            objectStoreNames,
            version: db.version,
          });

          db.close();
          completed++;
          checkComplete();
        };

        request.onupgradeneeded = () => {
          // Database exists but is being upgraded - close it
          request.result.close();
          dbResults.push({ name: dbName, exists: true, needsUpgrade: true });
          completed++;
          checkComplete();
        };
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({
          localStorageKeys,
          databases: dbResults,
          timeout: true,
        });
      }, 5000);
    });
  });
}

test.describe('Database Initialization Requirements', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.goto('/');
    await clearBrowserStorage(page);
  });

  test('should NOT create IndexedDB or localStorage on disabled page', async ({
    page,
  }) => {
    // Navigate to a page that should NOT have BackChannel enabled
    await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
    await waitForBackChannelInit(page);

    // Wait a bit to ensure any initialization would have completed
    await page.waitForTimeout(2000);

    // Check storage state via debug-db.html
    const storageState = await checkStorageState(page);

    // Verify NO BackChannel localStorage entries exist
    expect(storageState.localStorageKeys).toHaveLength(0);

    // Verify NO BackChannel databases exist or are empty
    const backChannelDbs = storageState.databases.filter(
      db => db.name.startsWith('BackChannel') && db.exists && db.hasStores
    );
    expect(backChannelDbs).toHaveLength(0);

    // Verify BackChannel is disabled
    await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
    await waitForBackChannelInit(page);

    const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
    expect(isEnabled).toBe(false);
  });

  test('should CREATE IndexedDB and localStorage on enabled page with seed data', async ({
    page,
  }) => {
    // Navigate to a page that should have BackChannel enabled (has seed data)
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    await waitForBackChannelInit(page);

    // Wait a bit to ensure initialization completes
    await page.waitForTimeout(2000);

    // Check storage state via debug-db.html
    const storageState = await checkStorageState(page);

    // Verify BackChannel localStorage entries exist
    expect(storageState.localStorageKeys.length).toBeGreaterThan(0);

    // Verify at least one BackChannel database exists with proper structure
    const backChannelDbs = storageState.databases.filter(
      db => db.name.startsWith('BackChannel') && db.exists && db.hasStores
    );
    expect(backChannelDbs.length).toBeGreaterThan(0);

    // Verify the database has the expected object stores
    const mainDb = backChannelDbs.find(db =>
      db.objectStoreNames.includes('metadata')
    );
    expect(mainDb).toBeDefined();
    expect(mainDb.objectStoreNames).toContain('metadata');
    expect(mainDb.objectStoreNames).toContain('comments');

    // Verify BackChannel is enabled
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    await waitForBackChannelInit(page);

    const isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
    expect(isEnabled).toBe(true);
  });

  test('should transition from disabled to enabled when navigating between pages', async ({
    page,
  }) => {
    // Step 1: Start on disabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
    await waitForBackChannelInit(page);
    await page.waitForTimeout(1000);

    // Verify disabled state
    let isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
    expect(isEnabled).toBe(false);

    // Check storage state - should be empty
    let storageState = await checkStorageState(page);
    expect(storageState.localStorageKeys).toHaveLength(0);

    // Step 2: Navigate to enabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    await waitForBackChannelInit(page);
    await page.waitForTimeout(2000);

    // Verify enabled state
    isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
    expect(isEnabled).toBe(true);

    // Check storage state - should now have data
    storageState = await checkStorageState(page);
    expect(storageState.localStorageKeys.length).toBeGreaterThan(0);

    const backChannelDbs = storageState.databases.filter(
      db => db.name.startsWith('BackChannel') && db.exists && db.hasStores
    );
    expect(backChannelDbs.length).toBeGreaterThan(0);

    // Step 3: Navigate back to disabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
    await waitForBackChannelInit(page);
    await page.waitForTimeout(1000);

    // Verify disabled state
    isEnabled = await page.evaluate(() => window.BackChannel.isEnabled);
    expect(isEnabled).toBe(false);

    // Check storage state - localStorage should be cleared, but IndexedDB should remain
    storageState = await checkStorageState(page);
    expect(storageState.localStorageKeys).toHaveLength(0);

    // The IndexedDB should still exist (it's not deleted, just not used)
    const remainingDbs = storageState.databases.filter(
      db => db.name.startsWith('BackChannel') && db.exists && db.hasStores
    );
    expect(remainingDbs.length).toBeGreaterThan(0);
  });

  test('should verify static method hasExistingFeedbackPackage works correctly', async ({
    page,
  }) => {
    // Test on disabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/disabled/index.html');
    await waitForBackChannelInit(page);

    const hasPackageDisabled = await page.evaluate(async () => {
      const { DatabaseService } = await import(
        '/src/services/DatabaseService.ts'
      );
      return await DatabaseService.hasExistingFeedbackPackage();
    });

    expect(hasPackageDisabled).toBe(false);

    // Test on enabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    await waitForBackChannelInit(page);

    const hasPackageEnabled = await page.evaluate(async () => {
      const { DatabaseService } = await import(
        '/src/services/DatabaseService.ts'
      );
      return await DatabaseService.hasExistingFeedbackPackage();
    });

    expect(hasPackageEnabled).toBe(true);
  });

  test('should verify localStorage contents are valid when created', async ({
    page,
  }) => {
    // Navigate to enabled page
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    await waitForBackChannelInit(page);
    await page.waitForTimeout(2000);

    // Check localStorage contents
    const localStorageData = await page.evaluate(() => {
      const bcKeys = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('backchannel-')) {
          bcKeys[key] = localStorage.getItem(key);
        }
      }
      return bcKeys;
    });

    // Verify expected keys exist with reasonable values
    expect(localStorageData['backchannel-enabled-state']).toBe('true');
    expect(localStorageData['backchannel-last-url-check']).toContain(
      'enabled-test/enabled'
    );

    // Verify other keys if they exist
    if (localStorageData['backchannel-db-id']) {
      expect(localStorageData['backchannel-db-id']).toContain('BackChannel');
    }
    if (localStorageData['backchannel-url-root']) {
      // Should contain the document root from metadata, not the current URL
      expect(localStorageData['backchannel-url-root']).toBe('/tests/e2e/fixtures/enabled-test/enabled');
    }
  });
});
