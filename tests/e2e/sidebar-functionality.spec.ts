/**
 * @fileoverview E2E tests for BackChannel sidebar functionality
 * Tests sidebar visibility, persistence, and icon state coordination
 * Only tests implemented functionality (steps 1-2 of Task 2.3)
 */

import { test, expect } from '@playwright/test';

test.describe('BackChannel Sidebar Functionality', () => {
  // Test setup helper
  const setupEnabledPage = async (page) => {
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/index.html');
    
    // Wait for BackChannel to initialize
    await page.waitForFunction(() => {
      return typeof window.BackChannel !== 'undefined' && window.BackChannel.isEnabled;
    });
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to a basic page first to establish context
    await page.goto('/');
    
    // Clear localStorage before each test (handle security restrictions)
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    });
  });

  test('should create sidebar when feedback package exists', async ({ page }) => {
    await setupEnabledPage(page);
    
    // Check that sidebar element exists in DOM
    const sidebar = page.locator('backchannel-sidebar');
    await expect(sidebar).toBeAttached();
    
    // Check that sidebar is hidden by default (no visible attribute)
    await expect(sidebar).not.toHaveAttribute('visible');
    
    // Check that icon is visible by default
    const icon = page.locator('backchannel-icon');
    await expect(icon).toBeVisible();
  });

  test('should show sidebar when icon is clicked', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Initial state: icon visible, sidebar hidden
    await expect(icon).toBeVisible();
    await expect(sidebar).not.toHaveAttribute('visible');
    
    // Click icon to show sidebar
    await icon.click();
    
    // Wait for sidebar to be visible
    await expect(sidebar).toHaveAttribute('visible');
    
    // Icon should be hidden when sidebar is visible
    await expect(icon).not.toBeVisible();
  });

  test('should hide sidebar when close button is clicked', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar first
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    await expect(icon).not.toBeVisible();
    
    // Click close button
    const closeButton = sidebar.locator('.close-button');
    await closeButton.click();
    
    // Wait for sidebar to be hidden
    await expect(sidebar).not.toHaveAttribute('visible');
    
    // Icon should be visible again
    await expect(icon).toBeVisible();
  });

  test('should persist sidebar visibility state in localStorage', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Check localStorage
    const sidebarVisible = await page.evaluate(() => {
      try {
        return localStorage.getItem('backchannel-sidebar-visible');
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
        return null;
      }
    });
    expect(sidebarVisible).toBe('true');
    
    // Hide sidebar
    const closeButton = sidebar.locator('.close-button');
    await closeButton.click();
    await expect(sidebar).not.toHaveAttribute('visible');
    
    // Check localStorage again
    const sidebarHidden = await page.evaluate(() => {
      try {
        return localStorage.getItem('backchannel-sidebar-visible');
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
        return null;
      }
    });
    expect(sidebarHidden).toBe('false');
  });

  test('should restore sidebar visibility state on page reload', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    await expect(icon).not.toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Wait for BackChannel to initialize again
    await page.waitForFunction(() => {
      return typeof window.BackChannel !== 'undefined' && window.BackChannel.isEnabled;
    });
    
    // Sidebar should be visible after reload
    await expect(sidebar).toHaveAttribute('visible');
    await expect(icon).not.toBeVisible();
  });

  test('should restore hidden sidebar state on page reload', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar then hide it
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    const closeButton = sidebar.locator('.close-button');
    await closeButton.click();
    await expect(sidebar).not.toHaveAttribute('visible');
    await expect(icon).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Wait for BackChannel to initialize again
    await page.waitForFunction(() => {
      return typeof window.BackChannel !== 'undefined' && window.BackChannel.isEnabled;
    });
    
    // Sidebar should remain hidden after reload
    await expect(sidebar).not.toHaveAttribute('visible');
    await expect(icon).toBeVisible();
  });

  test('should show sidebar header with title and close button', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Check sidebar header elements
    const sidebarTitle = sidebar.locator('.sidebar-title');
    await expect(sidebarTitle).toBeVisible();
    await expect(sidebarTitle).toContainText('BackChannel Feedback');
    
    const closeButton = sidebar.locator('.close-button');
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
  });

  test('should handle keyboard accessibility for close button', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Focus and activate close button with Enter key
    const closeButton = sidebar.locator('.close-button');
    await closeButton.focus();
    await page.keyboard.press('Enter');
    
    // Sidebar should be hidden
    await expect(sidebar).not.toHaveAttribute('visible');
    await expect(icon).toBeVisible();
  });

  test('should maintain state consistency across page navigation', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Navigate to subdirectory
    await page.goto('/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html');
    
    // Wait for BackChannel to initialize
    await page.waitForFunction(() => {
      return typeof window.BackChannel !== 'undefined' && window.BackChannel.isEnabled;
    });
    
    // Sidebar should still be visible
    await expect(sidebar).toHaveAttribute('visible');
    await expect(icon).not.toBeVisible();
  });
});