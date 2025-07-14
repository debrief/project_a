import { test, expect } from '@playwright/test';

test.describe('Package Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the script to load and auto-initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Clear any existing metadata to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
      return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase('BackChannelDB');
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    });
    
    // Reload to initialize with clean state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should open package creation modal when icon is clicked from inactive state', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/inactive/);

    // Click the icon to trigger modal
    await icon.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(200);
    
    // Check that modal is visible
    const modal = page.locator('package-creation-modal');
    await expect(modal).toBeVisible();
    
    // Check modal title
    const title = modal.locator('#modal-title');
    await expect(title).toContainText('Create Feedback Package');
    
    // Check form fields are present
    await expect(modal.locator('#document-title')).toBeVisible();
    await expect(modal.locator('#reviewer-name')).toBeVisible();
    await expect(modal.locator('#url-prefix')).toBeVisible();
  });

  test('should pre-populate URL prefix with parent folder', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    const urlPrefixInput = modal.locator('#url-prefix');
    
    // Check that URL prefix is pre-populated
    const urlPrefixValue = await urlPrefixInput.inputValue();
    expect(urlPrefixValue).toContain('http://localhost');
    expect(urlPrefixValue).toMatch(/.*\/$/); // Should end with /
  });

  test('should validate required fields', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    const submitButton = modal.locator('button[type="submit"]');
    
    // Try to submit empty form
    await submitButton.click();
    
    // Check for validation errors
    const titleError = modal.locator('#document-title-error');
    const nameError = modal.locator('#reviewer-name-error');
    
    await expect(titleError).toContainText('required');
    await expect(nameError).toContainText('required');
  });

  test('should validate URL format', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    const urlPrefixInput = modal.locator('#url-prefix');
    const submitButton = modal.locator('button[type="submit"]');
    
    // Fill in valid title and name
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('Test User');
    
    // Enter invalid URL
    await urlPrefixInput.fill('invalid-url');
    await submitButton.click();
    
    // Check for URL validation error
    const urlError = modal.locator('#url-prefix-error');
    await expect(urlError).toContainText('valid URL');
  });

  test('should validate field length limits', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    const titleInput = modal.locator('#document-title');
    const nameInput = modal.locator('#reviewer-name');
    
    // Test title max length (200 chars)
    await titleInput.fill('a'.repeat(201));
    await titleInput.blur();
    
    const titleError = modal.locator('#document-title-error');
    await expect(titleError).toContainText('Maximum 200 characters');
    
    // Test name max length (100 chars)
    await nameInput.fill('b'.repeat(101));
    await nameInput.blur();
    
    const nameError = modal.locator('#reviewer-name-error');
    await expect(nameError).toContainText('Maximum 100 characters');
  });

  test('should successfully create package with valid data', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in valid form data
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('John Doe');
    await modal.locator('#url-prefix').fill('http://localhost:3000/docs/');
    
    // Submit form
    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for form processing
    await page.waitForTimeout(500);
    
    // Check that modal is closed
    await expect(modal).not.toBeVisible();
    
    // Check that icon state has changed to capture
    await expect(icon).toHaveClass(/capture/);
    
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
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in some data
    await modal.locator('#document-title').fill('Test Document');
    
    // Cancel form
    const cancelButton = modal.locator('button', { hasText: 'Cancel' });
    await cancelButton.click();
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
    
    // Icon should still be inactive
    await expect(icon).toHaveClass(/inactive/);
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
    const backdrop = modal.locator('.backchannel-modal-backdrop');
    await backdrop.click({ position: { x: 10, y: 10 } });
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should warn about unsaved changes', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in some data to trigger unsaved changes
    await modal.locator('#document-title').fill('Test Document');
    
    // Set up dialog handler to cancel the close
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss(); // Cancel the close
    });
    
    // Try to close modal
    const closeButton = modal.locator('.backchannel-modal-close');
    await closeButton.click();
    
    // Modal should still be visible
    await expect(modal).toBeVisible();
  });

  test('should show loading state during form submission', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in valid form data
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('John Doe');
    await modal.locator('#url-prefix').fill('http://localhost:3000/docs/');
    
    // Submit form
    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check loading state (briefly)
    const loadingSpinner = modal.locator('.backchannel-spinner');
    const loadingText = modal.locator('.backchannel-btn-loading');
    
    // Loading elements should be visible during submission
    await expect(loadingText).toBeVisible();
    await expect(loadingSpinner).toBeVisible();
    
    // Button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should handle database errors gracefully', async ({ page }) => {
    // Mock database error
    await page.evaluate(() => {
      // Override the setMetadata method to simulate an error
      (window as any).BackChannel = {
        ...((window as any).BackChannel || {}),
        _mockDatabaseError: true
      };
    });
    
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in valid form data
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('John Doe');
    await modal.locator('#url-prefix').fill('http://localhost:3000/docs/');
    
    // Set up dialog handler for error alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Failed to create feedback package');
      await dialog.accept();
    });
    
    // Submit form
    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for error handling
    await page.waitForTimeout(500);
    
    // Modal should still be visible after error
    await expect(modal).toBeVisible();
  });

  test('should maintain form data when reopening modal', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill in some data
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('John Doe');
    
    // Close modal
    const closeButton = modal.locator('.backchannel-modal-close');
    await closeButton.click();
    
    // Reopen modal
    await icon.click();
    await page.waitForTimeout(200);
    
    // Check that URL prefix is reset to default but other fields are cleared
    const urlPrefixInput = modal.locator('#url-prefix');
    const urlPrefixValue = await urlPrefixInput.inputValue();
    expect(urlPrefixValue).toContain('http://localhost');
    
    // Title and name should be cleared
    const titleValue = await modal.locator('#document-title').inputValue();
    const nameValue = await modal.locator('#reviewer-name').inputValue();
    expect(titleValue).toBe('');
    expect(nameValue).toBe('');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Check modal has proper ARIA attributes
    await expect(modal.locator('[role="dialog"]')).toBeVisible();
    await expect(modal.locator('[aria-modal="true"]')).toBeVisible();
    await expect(modal.locator('[aria-labelledby="modal-title"]')).toBeVisible();
    await expect(modal.locator('[aria-describedby="modal-description"]')).toBeVisible();
    
    // Check form fields have proper labels and descriptions
    const titleInput = modal.locator('#document-title');
    await expect(titleInput).toHaveAttribute('aria-describedby', 'document-title-error');
    
    const nameInput = modal.locator('#reviewer-name');
    await expect(nameInput).toHaveAttribute('aria-describedby', 'reviewer-name-error');
    
    const urlInput = modal.locator('#url-prefix');
    await expect(urlInput).toHaveAttribute('aria-describedby', 'url-prefix-error url-prefix-help');
  });

  test('should skip modal if metadata already exists', async ({ page }) => {
    // First, create a package
    const icon = page.locator('#backchannel-icon');
    await icon.click();
    
    await page.waitForTimeout(200);
    
    const modal = page.locator('package-creation-modal');
    
    // Fill and submit form
    await modal.locator('#document-title').fill('Test Document');
    await modal.locator('#reviewer-name').fill('John Doe');
    await modal.locator('#url-prefix').fill('http://localhost:3000/docs/');
    
    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for completion
    await page.waitForTimeout(500);
    
    // Icon should be in capture state
    await expect(icon).toHaveClass(/capture/);
    
    // Go back to inactive state
    await icon.click(); // capture -> review
    await icon.click(); // review -> inactive
    
    await expect(icon).toHaveClass(/inactive/);
    
    // Now click again - should skip modal and go directly to capture
    await icon.click();
    
    // Should NOT show modal this time
    await expect(modal).not.toBeVisible();
    
    // Should go directly to capture state
    await expect(icon).toHaveClass(/capture/);
  });
});