import { test, expect } from '@playwright/test';

test.describe('Welcome Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to BackChannel' })).toBeVisible();
    await expect(page.getByText('BackChannel is a lightweight, offline-first')).toBeVisible();
  });

  test('should have reinitialize plugin button', async ({ page }) => {
    const reinitButton = page.getByRole('button', { name: 'Reinitialize with Custom Config' });
    await expect(reinitButton).toBeVisible();
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

  test('should show plugin auto-initialized successfully', async ({ page }) => {
    await expect(page.getByText('Plugin auto-initialized successfully!')).toBeVisible();
  });


  test('should reinitialize plugin when button is clicked', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    
    // Click reinitialize button
    await page.getByRole('button', { name: 'Reinitialize with Custom Config' }).click();
    
    // Check that alert appears
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Plugin reinitialized with custom configuration!');
      await dialog.accept();
    });
    
    // Check that plugin configuration is updated
    await expect(page.locator('#plugin-config')).toContainText('backchannel-demo-custom');
  });

  test('should display plugin configuration after auto-initialization', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for the UI to update
    await page.waitForTimeout(200);
    
    // Check that configuration is displayed
    const configElement = page.locator('#plugin-config');
    await expect(configElement).not.toContainText('None');
    await expect(configElement).toContainText('requireInitials');
  });

  test('should display BackChannel icon after initialization', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    
    // Wait for plugin initialization
    await page.waitForTimeout(500);
    
    // Check that the BackChannel icon is present
    const icon = page.locator('#backchannel-icon');
    await expect(icon).toBeVisible();
    
    // Check that the icon has the correct initial state
    await expect(icon).toHaveClass(/inactive/);
  });

  test('should handle icon click and open package creation modal', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    
    // Wait for plugin initialization
    await page.waitForTimeout(500);
    
    const icon = page.locator('#backchannel-icon');
    await expect(icon).toBeVisible();
    
    // Initially should be inactive
    await expect(icon).toHaveClass(/inactive/);
    
    // Click to open package creation modal
    await icon.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(200);
    
    // Check that modal is visible
    const modal = page.locator('package-creation-modal');
    await expect(modal).toBeVisible();
    
    // Check modal title
    const title = modal.locator('#modal-title');
    await expect(title).toContainText('Create Feedback Package');
    
    // Close modal
    const closeButton = modal.locator('.backchannel-modal-close');
    await closeButton.click();
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
    
    // Icon should still be inactive
    await expect(icon).toHaveClass(/inactive/);
  });

  test('should verify demo database seeding', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    
    // Wait for plugin initialization and seeding
    await page.waitForTimeout(1000);
    
    // Check console logs for seeding confirmation
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Reload to trigger seeding again (if not already applied)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if seeding messages appear in console
    const hasSeeding = consoleLogs.some(log => 
      log.includes('demo database seeding') || 
      log.includes('seed version') ||
      log.includes('Demo database seeding completed')
    );
    
    expect(hasSeeding).toBeTruthy();
  });

  test('should position icon correctly on different screen sizes', async ({ page }) => {
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const icon = page.locator('#backchannel-icon');
    await expect(icon).toBeVisible();
    
    // Test desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(icon).toHaveCSS('top', '20px');
    await expect(icon).toHaveCSS('right', '20px');
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 600 });
    await expect(icon).toHaveCSS('top', '15px');
    await expect(icon).toHaveCSS('right', '15px');
    
    // Test mobile size
    await page.setViewportSize({ width: 480, height: 600 });
    await expect(icon).toHaveCSS('top', '10px');
    await expect(icon).toHaveCSS('right', '10px');
  });
});