/**
 * @fileoverview E2E integration tests for DatabaseService and seedDemoDatabase
 * Tests real browser IndexedDB functionality and seeding process
 * @version 1.0.0
 * @author BackChannel Team
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to evaluate database operations in browser context
 */
async function evaluateInBrowser<T>(page: Page, fn: () => Promise<T>): Promise<T> {
  return await page.evaluate(fn);
}

/**
 * Helper to clear all browser storage
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
 * Helper to setup demo data in browser context
 */
async function setupDemoData(page: Page) {
  await page.evaluate(() => {
    window.demoDatabaseSeed = {
      version: 'e2e-test-v1',
      metadata: {
        documentTitle: 'E2E Test Document',
        documentRootUrl: 'http://localhost:3001/',
        documentId: 'e2e-test-001',
        reviewer: 'E2E Test User'
      },
      comments: [
        {
          id: 'e2e-comment-001',
          text: 'First E2E test comment',
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          location: '/html/body/h1',
          snippet: 'Database Integration Test',
          author: 'E2E Test User'
        },
        {
          id: 'e2e-comment-002',
          text: 'Second E2E test comment',
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          location: '/html/body/div[1]',
          snippet: 'Test content area',
          author: 'E2E Test User'
        }
      ]
    };

    window.fakeData = {
      version: 1,
      databases: [
        {
          name: 'BackChannelDB-Demo',
          version: 1,
          objectStores: [
            {
              name: 'metadata',
              keyPath: 'documentRootUrl',
              data: [window.demoDatabaseSeed.metadata]
            },
            {
              name: 'comments',
              keyPath: 'id',
              data: window.demoDatabaseSeed.comments
            }
          ]
        }
      ]
    };
  });
}

test.describe('Database Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page first to establish context
    await page.goto('/tests/debug-db.html');
    
    // Clear all storage before each test
    await clearBrowserStorage(page);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should initialize DatabaseService successfully', async ({ page }) => {
    const result = await evaluateInBrowser(page, async () => {
      // Import DatabaseService dynamically
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      
      // Create and initialize database service
      const dbService = new DatabaseService(undefined, 'BackChannelDB-E2ETest', 1);
      await dbService.initialize();
      
      // Verify initialization
      const currentUrl = dbService.getCurrentPageUrl();
      return {
        initialized: true,
        currentUrl: currentUrl,
        hasUrl: currentUrl.length > 0
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.hasUrl).toBe(true);
    expect(result.currentUrl).toContain('localhost');
  });

  test('should perform full CRUD operations on metadata', async ({ page }) => {
    const result = await evaluateInBrowser(page, async () => {
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      
      const dbService = new DatabaseService(undefined, 'BackChannelDB-CRUDTest', 1);
      await dbService.initialize();
      
      // Test metadata operations
      const testMetadata = {
        documentTitle: 'CRUD Test Document',
        documentRootUrl: 'http://localhost:3001/',
        documentId: 'crud-test-001',
        reviewer: 'CRUD Test User'
      };
      
      // Create metadata
      await dbService.setMetadata(testMetadata);
      
      // Read metadata
      const retrievedMetadata = await dbService.getMetadata();
      
      // Update metadata
      const updatedMetadata = {
        ...testMetadata,
        documentTitle: 'Updated CRUD Test Document',
        reviewer: 'Updated Test User'
      };
      await dbService.setMetadata(updatedMetadata);
      
      // Read updated metadata
      const finalMetadata = await dbService.getMetadata();
      
      return {
        originalMetadata: retrievedMetadata,
        finalMetadata: finalMetadata,
        titleMatches: finalMetadata?.documentTitle === 'Updated CRUD Test Document',
        reviewerMatches: finalMetadata?.reviewer === 'Updated Test User'
      };
    });

    expect(result.originalMetadata).toBeTruthy();
    expect(result.originalMetadata?.documentTitle).toBe('CRUD Test Document');
    expect(result.titleMatches).toBe(true);
    expect(result.reviewerMatches).toBe(true);
  });

  test('should perform full CRUD operations on comments', async ({ page }) => {
    const result = await evaluateInBrowser(page, async () => {
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      
      const dbService = new DatabaseService(undefined, 'BackChannelDB-CommentTest', 1);
      await dbService.initialize();
      
      const testComments = [
        {
          id: 'crud-comment-001',
          text: 'First CRUD test comment',
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          location: '/html/body/h1',
          snippet: 'Test snippet 1',
          author: 'Test User'
        },
        {
          id: 'crud-comment-002',
          text: 'Second CRUD test comment',
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          location: '/html/body/div[1]',
          snippet: 'Test snippet 2',
          author: 'Test User'
        }
      ];
      
      // Create comments
      await dbService.addComment(testComments[0]);
      await dbService.addComment(testComments[1]);
      
      // Read all comments
      let allComments = await dbService.getComments();
      
      // Update a comment
      await dbService.updateComment('crud-comment-001', {
        text: 'Updated first comment',
        author: 'Updated Test User'
      });
      
      // Read comments after update
      const updatedComments = await dbService.getComments();
      const updatedComment = updatedComments.find(c => c.id === 'crud-comment-001');
      
      // Delete a comment
      await dbService.deleteComment('crud-comment-002');
      
      // Read final comments
      const finalComments = await dbService.getComments();
      
      return {
        initialCount: allComments.length,
        updatedText: updatedComment?.text,
        updatedAuthor: updatedComment?.author,
        finalCount: finalComments.length,
        remainingCommentId: finalComments[0]?.id
      };
    });

    expect(result.initialCount).toBe(2);
    expect(result.updatedText).toBe('Updated first comment');
    expect(result.updatedAuthor).toBe('Updated Test User');
    expect(result.finalCount).toBe(1);
    expect(result.remainingCommentId).toBe('crud-comment-001');
  });

  test('should seed demo database successfully', async ({ page }) => {
    // Setup demo data
    await setupDemoData(page);
    
    const result = await evaluateInBrowser(page, async () => {
      // Import seeding utilities
      const { seedDemoDatabaseIfNeeded, getCurrentSeedVersion } = await import('/src/utils/seedDemoDatabase.ts');
      
      // Check initial seed version
      const initialVersion = getCurrentSeedVersion();
      
      // Perform seeding
      const seedResult = await seedDemoDatabaseIfNeeded();
      
      // Check final seed version
      const finalVersion = getCurrentSeedVersion();
      
      // Import DatabaseService to verify seeded data
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      const dbService = new DatabaseService(undefined, 'BackChannelDB-Demo', 1);
      await dbService.initialize();
      
      // Verify seeded metadata
      const metadata = await dbService.getMetadata();
      
      // Verify seeded comments
      const comments = await dbService.getComments();
      
      return {
        initialVersion,
        seedResult,
        finalVersion,
        metadata: metadata,
        commentCount: comments.length,
        commentIds: comments.map(c => c.id),
        firstCommentText: comments[0]?.text
      };
    });

    expect(result.initialVersion).toBeNull();
    expect(result.seedResult).toBe(true);
    expect(result.finalVersion).toBe('e2e-test-v1');
    expect(result.metadata).toBeTruthy();
    expect(result.metadata?.documentTitle).toBe('E2E Test Document');
    expect(result.commentCount).toBe(2);
    expect(result.commentIds).toContain('e2e-comment-001');
    expect(result.commentIds).toContain('e2e-comment-002');
    expect(result.firstCommentText).toBe('First E2E test comment');
  });

  test('should handle enabled/disabled detection correctly', async ({ page }) => {
    // Setup demo data
    await setupDemoData(page);
    
    const result = await evaluateInBrowser(page, async () => {
      // Seed the database first
      const { seedDemoDatabaseIfNeeded } = await import('/src/utils/seedDemoDatabase.ts');
      await seedDemoDatabaseIfNeeded();
      
      // Import DatabaseService
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      const dbService = new DatabaseService(undefined, 'BackChannelDB-Demo', 1);
      await dbService.initialize();
      
      // Test enabled detection (should be true since current URL matches seeded data)
      const isEnabledFirst = await dbService.isBackChannelEnabled();
      
      // Clear cache and test again
      dbService.clearEnabledStateCache();
      const isEnabledAfterClear = await dbService.isBackChannelEnabled();
      
      // Test with different URL context
      const originalHref = window.location.href;
      
      return {
        currentUrl: originalHref,
        isEnabledFirst,
        isEnabledAfterClear,
        cacheCleared: true
      };
    });

    expect(result.isEnabledFirst).toBe(true);
    expect(result.isEnabledAfterClear).toBe(true);
    expect(result.currentUrl).toContain('localhost:3001');
  });

  test('should handle database recreation during seeding', async ({ page }) => {
    const result = await evaluateInBrowser(page, async () => {
      // Setup demo data
      window.demoDatabaseSeed = {
        version: 'recreation-test-v1',
        metadata: {
          documentTitle: 'Recreation Test',
          documentRootUrl: 'http://localhost:3001/',
          documentId: 'recreation-001',
          reviewer: 'Recreation User'
        },
        comments: [
          {
            id: 'recreation-comment-001',
            text: 'Recreation test comment',
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            location: '/html/body',
            author: 'Recreation User'
          }
        ]
      };

      window.fakeData = {
        version: 1,
        databases: [
          {
            name: 'BackChannelDB-Demo',
            version: 1,
            objectStores: [
              {
                name: 'metadata',
                keyPath: 'documentRootUrl',
                data: [window.demoDatabaseSeed.metadata]
              },
              {
                name: 'comments',
                keyPath: 'id',
                data: window.demoDatabaseSeed.comments
              }
            ]
          }
        ]
      };
      
      // Import seeding utilities
      const { forceReseedDemoDatabase, getCurrentSeedVersion } = await import('/src/utils/seedDemoDatabase.ts');
      
      // Force reseed (which should delete and recreate)
      const reseedResult = await forceReseedDemoDatabase();
      
      // Verify seeding worked
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      const dbService = new DatabaseService(undefined, 'BackChannelDB-Demo', 1);
      await dbService.initialize();
      
      const metadata = await dbService.getMetadata();
      const comments = await dbService.getComments();
      const seedVersion = getCurrentSeedVersion();
      
      return {
        reseedResult,
        seedVersion,
        metadataTitle: metadata?.documentTitle,
        commentCount: comments.length,
        commentText: comments[0]?.text
      };
    });

    expect(result.reseedResult).toBe(true);
    expect(result.seedVersion).toBe('recreation-test-v1');
    expect(result.metadataTitle).toBe('Recreation Test');
    expect(result.commentCount).toBe(1);
    expect(result.commentText).toBe('Recreation test comment');
  });

  test('should handle localStorage caching correctly', async ({ page }) => {
    const result = await evaluateInBrowser(page, async () => {
      const { DatabaseService } = await import('/src/services/DatabaseService.ts');
      
      const dbService = new DatabaseService(undefined, 'BackChannelDB-CacheTest', 1);
      await dbService.initialize();
      
      // Check that localStorage was populated during initialization
      const dbId = localStorage.getItem('backchannel-db-id');
      const urlRoot = localStorage.getItem('backchannel-url-root');
      
      // Test enabled state caching
      const isEnabled1 = await dbService.isBackChannelEnabled();
      
      // Check if enabled state was cached
      const cachedEnabledState = localStorage.getItem('backchannel-enabled-state');
      const cachedUrlCheck = localStorage.getItem('backchannel-last-url-check');
      
      // Test cache hit by calling again
      const isEnabled2 = await dbService.isBackChannelEnabled();
      
      // Clear cache and test
      dbService.clearEnabledStateCache();
      const clearedEnabledState = localStorage.getItem('backchannel-enabled-state');
      const clearedUrlCheck = localStorage.getItem('backchannel-last-url-check');
      
      return {
        dbId,
        urlRoot,
        isEnabled1,
        isEnabled2,
        cachedEnabledState,
        cachedUrlCheck: !!cachedUrlCheck,
        clearedEnabledState,
        clearedUrlCheck
      };
    });

    expect(result.dbId).toBe('BackChannelDB-CacheTest_v1');
    expect(result.urlRoot).toContain('localhost');
    expect(result.isEnabled1).toBe(result.isEnabled2); // Should be consistent
    expect(result.cachedEnabledState).toBeTruthy();
    expect(result.cachedUrlCheck).toBe(true);
    expect(result.clearedEnabledState).toBeNull();
    expect(result.clearedUrlCheck).toBeNull();
  });
});