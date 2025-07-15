/**
 * @fileoverview E2E tests for the feedback package creation workflow.
 * @version 1.0.0
 * @author BackChannel Team
 */

/// <reference path="./types.d.ts" />

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to wait for BackChannel initialization
 */
async function waitForBackChannelInit(page: Page) {
  await page.waitForFunction(() => {
    return window.BackChannel && typeof window.BackChannel.getState === 'function';
  }, { timeout: 10000 });
}

test.describe('Feedback Package Creation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the debug tool to prepare the environment
    await page.goto('/tests/debug-db.html');

    // Clear local storage and database before each test
    await page.click('button:has-text("Force Delete Database")');
    await page.click('button:has-text("Clear localStorage")');

    // Wait for cleanup to complete
    await page.waitForTimeout(1000);
  });

  test('should allow a user to create and save a feedback package', async ({ page }) => {
    // 1. Setup demo data
    await page.click('button:has-text("Setup Demo Data")');
    await page.waitForSelector('#console-output:has-text("Demo data setup complete")');

    // 2. Test the seeding process, which creates the package
    await page.click('button:has-text("Test Seeding Process")');
    await page.waitForSelector('#console-output:has-text("Seeding result: true")');

    // 3. Inspect the database to verify the package was created
    await page.click('button:has-text("Inspect Database Contents")');

    // 4. Verify the console output shows the correct metadata and comments
    await page.waitForSelector('#console-output:has-text("Metadata store contents:")');
    const consoleOutput = await page.locator('#console-output').textContent();

    // Check for metadata
    expect(consoleOutput).toContain('"documentTitle": "Debug Test Document"');
    expect(consoleOutput).toContain('"documentId": "debug-001"');

    // Check for comments
    expect(consoleOutput).toContain('"id": "debug-comment-001"');
    expect(consoleOutput).toContain('"text": "This is a debug comment"');
  });
});
