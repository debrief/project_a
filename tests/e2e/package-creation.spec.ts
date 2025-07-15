import { test, expect } from '@playwright/test';

test.describe('Package Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Clear any existing metadata to ensure clean state
    await page.evaluate(async () => {
      localStorage.clear();
      // Clear enabled state cache specifically
      localStorage.removeItem('backchannel-enabled-state');
      localStorage.removeItem('backchannel-last-url-check');
      
      // Use a shorter timeout for database deletion
      try {
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase('BackChannelDB');
          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false); // Don't reject, just resolve
          // Set a shorter timeout to prevent hanging
          setTimeout(() => resolve(false), 2000);
        });
      } catch (error) {
        // Ignore cleanup errors for now
        console.log('Database cleanup failed, continuing anyway');
      }
    });
    
    // Reload to initialize with clean state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should open package creation modal when icon is clicked from inactive state', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('state', 'inactive');

    // Click the icon to trigger modal
    await icon.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(200);
    
    // Check that modal is visible
    const modal = page.locator('package-creation-modal');
    await expect(modal).toBeVisible();
    
    // Check modal title (inside shadow DOM)
    const title = page.locator('package-creation-modal #modal-title');
    await expect(title).toContainText('Create Feedback Package');
    
    // Check form fields are present (inside shadow DOM)
    await expect(page.locator('package-creation-modal #document-title')).toBeVisible();
    await expect(page.locator('package-creation-modal #reviewer-name')).toBeVisible();
    await expect(page.locator('package-creation-modal #url-prefix')).toBeVisible();
  });

  test('should pre-populate URL prefix with parent folder', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const urlPrefixInput = page.locator('package-creation-modal #url-prefix');
    
    // Check that URL prefix is pre-populated
    const urlPrefixValue = await urlPrefixInput.inputValue();
    expect(urlPrefixValue).toContain('http://localhost');
    expect(urlPrefixValue).toMatch(/.*\/$/); // Should end with /
  });

  test('should validate required fields', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const submitButton = page.locator('package-creation-modal button[type="submit"]');
    
    // Try to submit empty form
    await submitButton.click();
    
    // Check for validation errors
    const titleError = page.locator('package-creation-modal #document-title-error');
    const nameError = page.locator('package-creation-modal #reviewer-name-error');
    
    await expect(titleError).toContainText('required');
    await expect(nameError).toContainText('required');
  });

  test('should validate URL format', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const urlPrefixInput = page.locator('package-creation-modal #url-prefix');
    const submitButton = page.locator('package-creation-modal button[type="submit"]');
    
    // Fill in valid title and name
    await page.locator('package-creation-modal #document-title').fill('Test Document');
    await page.locator('package-creation-modal #reviewer-name').fill('Test User');
    
    // Enter invalid URL
    await urlPrefixInput.fill('invalid-url');
    await submitButton.click();
    
    // Check for URL validation error
    const urlError = page.locator('package-creation-modal #url-prefix-error');
    await expect(urlError).toContainText('valid URL');
  });

  test('should validate field length limits', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const titleInput = page.locator('package-creation-modal #document-title');
    const nameInput = page.locator('package-creation-modal #reviewer-name');
    
    // Test title max length (200 chars)
    await titleInput.fill('a'.repeat(201));
    await titleInput.blur();
    
    const titleError = page.locator('package-creation-modal #document-title-error');
    await expect(titleError).toContainText('Maximum 200 characters');
    
    // Test name max length (100 chars)
    await nameInput.fill('b'.repeat(101));
    await nameInput.blur();
    
    const nameError = page.locator('package-creation-modal #reviewer-name-error');
    await expect(nameError).toContainText('Maximum 100 characters');
  });

  test('should successfully create package with valid data', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    // Fill in valid form data
    await page.locator('package-creation-modal #document-title').fill('Test Document');
    await page.locator('package-creation-modal #reviewer-name').fill('John Doe');
    await page.locator('package-creation-modal #url-prefix').fill('http://localhost:3000/docs/');
    
    // Submit form
    const submitButton = page.locator('package-creation-modal button[type="submit"]');
    await submitButton.click();
    
    // Wait for form processing
    await page.waitForTimeout(500);
    
    // Check that modal is closed
    const modal = page.locator('package-creation-modal');
    await expect(modal).not.toBeVisible();
    
    // Check that icon state has changed to capture
    await expect(icon).toHaveAttribute('state', 'capture');
    
    // Verify database was updated by checking console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Should have success message in console
    const hasSuccess = consoleLogs.some(log => 
      log.includes('Package created successfully') || 
      log.includes('Metadata saved successfully')
    );
    
    expect(hasSuccess).toBeTruthy();
  });

  test('should handle form cancellation', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    // Fill in some data
    await page.locator('package-creation-modal #document-title').fill('Test Document');
    
    // Cancel form
    const cancelButton = page.locator('package-creation-modal button', { hasText: 'Cancel' });
    await cancelButton.click();
    
    // Modal should be closed
    const modal = page.locator('package-creation-modal');
    await expect(modal).not.toBeVisible();
    
    // Icon should still be inactive
    await expect(icon).toHaveAttribute('state', 'inactive');
  });

  test('should close modal with Escape key', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    await expect(modal).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    await expect(modal).toBeVisible();
    
    // Click on backdrop (outside modal content)
    const backdrop = page.locator('package-creation-modal .backchannel-modal-backdrop');
    await backdrop.click({ position: { x: 10, y: 10 } });
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should show loading state during form submission', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    // Fill in valid form data
    await page.locator('package-creation-modal #document-title').fill('Test Document');
    await page.locator('package-creation-modal #reviewer-name').fill('John Doe');
    await page.locator('package-creation-modal #url-prefix').fill('http://localhost:3000/docs/');
    
    // Submit form
    const submitButton = page.locator('package-creation-modal button[type="submit"]');
    await submitButton.click();
    
    // Check loading state (briefly)
    const loadingSpinner = page.locator('package-creation-modal .backchannel-spinner');
    const loadingText = page.locator('package-creation-modal .backchannel-btn-loading');
    
    // Loading elements should be visible during submission
    await expect(loadingText).toBeVisible();
    await expect(loadingSpinner).toBeVisible();
    
    // Button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Check modal has proper ARIA attributes
    await expect(page.locator('package-creation-modal [role="dialog"]')).toBeVisible();
    await expect(page.locator('package-creation-modal [aria-modal="true"]')).toBeVisible();
    await expect(page.locator('package-creation-modal [aria-labelledby="modal-title"]')).toBeVisible();
    await expect(page.locator('package-creation-modal [aria-describedby="modal-description"]')).toBeVisible();
    
    // Check form fields have proper labels and descriptions
    const titleInput = page.locator('package-creation-modal #document-title');
    await expect(titleInput).toHaveAttribute('aria-describedby', 'document-title-error');
    
    const nameInput = page.locator('package-creation-modal #reviewer-name');
    await expect(nameInput).toHaveAttribute('aria-describedby', 'reviewer-name-error');
    
    const urlInput = page.locator('package-creation-modal #url-prefix');
    await expect(urlInput).toHaveAttribute('aria-describedby', 'url-prefix-error url-prefix-help');
  });

  test('should skip modal if metadata already exists', async ({ page }) => {
    // First, create a package
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill and submit form
    await page.locator('package-creation-modal #document-title').fill('Test Document');
    await page.locator('package-creation-modal #reviewer-name').fill('John Doe');
    await page.locator('package-creation-modal #url-prefix').fill('http://localhost:3000/docs/');
    
    const submitButton = page.locator('package-creation-modal button[type="submit"]');
    await submitButton.click();
    
    // Wait for completion
    await page.waitForTimeout(500);
    
    // Icon should be in capture state
    await expect(icon).toHaveAttribute('state', 'capture');
    
    // Go back to inactive state
    await icon.click(); // capture -> review
    await icon.click(); // review -> inactive
    
    await expect(icon).toHaveAttribute('state', 'inactive');
    
    // Now click again - should skip modal and go directly to capture
    await icon.click();
    
    // Should NOT show modal this time
    await expect(modal).not.toBeVisible();
    
    // Should go directly to capture state
    await expect(icon).toHaveAttribute('state', 'capture');
  });
});