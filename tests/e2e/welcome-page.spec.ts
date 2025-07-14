import { test, expect } from '@playwright/test';

test.describe('Welcome Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to BackChannel' })).toBeVisible();
    await expect(page.getByText('BackChannel is a lightweight, offline-first')).toBeVisible();
  });

  test('should have initialize plugin button', async ({ page }) => {
    const initButton = page.getByRole('button', { name: 'Initialize Plugin' });
    await expect(initButton).toBeVisible();
  });

  test('should display reviewable content sections', async ({ page }) => {
    await expect(page.getByText('Sample Document Section')).toBeVisible();
    await expect(page.getByText('Another Reviewable Section')).toBeVisible();
    await expect(page.getByText('Technical Features')).toBeVisible();
  });

  test('should have reviewable elements with correct class', async ({ page }) => {
    const reviewableElements = page.locator('.reviewable');
    await expect(reviewableElements).toHaveCount(3);
  });

  test('should show plugin not initialized initially', async ({ page }) => {
    await expect(page.getByText('Not initialized')).toBeVisible();
  });

  test('should load BackChannel script', async ({ page }) => {
    // Check if the script tag is present
    const scriptTag = page.locator('script[src="dist/backchannel.js"]');
    await expect(scriptTag).toBeVisible();
  });

  test('should initialize plugin when button is clicked', async ({ page }) => {
    // Wait for the script to load
    await page.waitForLoadState('networkidle');
    
    // Click initialize button
    await page.getByRole('button', { name: 'Initialize Plugin' }).click();
    
    // Check that status message appears
    await expect(page.getByText('Plugin initialized successfully!')).toBeVisible();
    
    // Check that plugin state is no longer "Not initialized"
    await expect(page.getByText('Not initialized')).not.toBeVisible();
  });

  test('should display plugin configuration after initialization', async ({ page }) => {
    // Wait for the script to load
    await page.waitForLoadState('networkidle');
    
    // Click initialize button
    await page.getByRole('button', { name: 'Initialize Plugin' }).click();
    
    // Check that configuration is displayed
    const configElement = page.locator('#plugin-config');
    await expect(configElement).not.toContainText('None');
    await expect(configElement).toContainText('requireInitials');
  });

  test('should handle missing plugin gracefully', async ({ page }) => {
    // Remove the script tag to simulate missing plugin
    await page.evaluate(() => {
      const script = document.querySelector('script[src="dist/backchannel.js"]');
      if (script) script.remove();
    });
    
    // Set up dialog handler for alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('BackChannel plugin not found');
      await dialog.accept();
    });
    
    // Click initialize button
    await page.getByRole('button', { name: 'Initialize Plugin' }).click();
  });
});