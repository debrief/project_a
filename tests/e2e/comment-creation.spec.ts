/**
 * @fileoverview E2E tests for BackChannel comment creation functionality
 * Tests the complete comment creation workflow including element selection, form submission, and visual feedback
 */

import { test, expect } from '@playwright/test';

test.describe('BackChannel Comment Creation', () => {
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

  test('should show capture feedback button in sidebar toolbar', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Check that capture button exists
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await expect(captureButton).toBeVisible();
    await expect(captureButton).toHaveClass(/primary/);
  });

  test('should initiate element selection when capture button is clicked', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar
    await icon.click();
    await expect(sidebar).toHaveAttribute('visible');
    
    // Click capture button
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Sidebar should hide during selection
    await expect(sidebar).not.toHaveAttribute('visible');
    
    // Cancel button should appear
    const cancelButton = page.locator('#backchannel-cancel-selection');
    await expect(cancelButton).toBeVisible();
    
    // Body should have crosshair cursor
    const bodyStyle = await page.evaluate(() => {
      return window.getComputedStyle(document.body).cursor;
    });
    expect(bodyStyle).toBe('crosshair');
  });

  test('should cancel element selection when cancel button is clicked', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Verify selection mode is active
    const cancelButton = page.locator('#backchannel-cancel-selection');
    await expect(cancelButton).toBeVisible();
    
    // Cancel selection
    await cancelButton.click();
    
    // Selection mode should be deactivated
    await expect(cancelButton).not.toBeVisible();
    
    // Sidebar should be visible again
    await expect(sidebar).toHaveAttribute('visible');
    
    // Body cursor should be normal (auto is the default)
    const bodyStyle = await page.evaluate(() => {
      return window.getComputedStyle(document.body).cursor;
    });
    expect(bodyStyle).toBe('auto');
  });

  test('should cancel element selection when Escape key is pressed', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Verify selection mode is active
    const cancelButton = page.locator('#backchannel-cancel-selection');
    await expect(cancelButton).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Selection mode should be deactivated
    await expect(cancelButton).not.toBeVisible();
    
    // Sidebar should be visible again
    await expect(sidebar).toHaveAttribute('visible');
  });

  test('should highlight elements on hover during selection', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Find a test element to hover over
    const testElement = page.locator('h1').first();
    
    // Hover over element
    await testElement.hover();
    
    // Element should have highlight class
    await expect(testElement).toHaveClass(/backchannel-highlight/);
    
    // Tooltip should be visible
    const hasTooltip = await testElement.evaluate(el => {
      const style = window.getComputedStyle(el, '::before');
      return style.content !== 'none' && style.content !== '';
    });
    expect(hasTooltip).toBe(true);
  });

  test('should show comment form when element is selected', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Sidebar should be visible again
    await expect(sidebar).toHaveAttribute('visible');
    
    // Comment form should be visible
    const commentForm = sidebar.locator('.comment-form');
    await expect(commentForm).toBeVisible();
    
    // Form should have required elements
    const formTitle = commentForm.locator('.comment-form-title');
    await expect(formTitle).toHaveText('Add Comment');
    
    const commentTextarea = commentForm.locator('#comment-text');
    await expect(commentTextarea).toBeVisible();
    await expect(commentTextarea).toHaveAttribute('required');
    
    const authorInput = commentForm.locator('#comment-author');
    await expect(authorInput).toBeVisible();
    
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    await expect(submitButton).toBeVisible();
    
    const cancelButton = commentForm.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
  });

  test('should show element information in comment form', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Comment form should show element info
    const commentForm = sidebar.locator('.comment-form');
    const elementInfo = commentForm.locator('.element-info');
    await expect(elementInfo).toBeVisible();
    
    // Should show element tag name
    await expect(elementInfo).toContainText('h1');
  });

  test('should validate comment form submission', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Try to submit empty form
    const commentForm = sidebar.locator('.comment-form');
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    await expect(submitButton).toBeDisabled();
    
    // Add comment text
    const commentTextarea = commentForm.locator('#comment-text');
    await commentTextarea.fill('This is a test comment');
    
    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should save comment and show success feedback', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Fill out comment form
    const commentForm = sidebar.locator('.comment-form');
    const commentTextarea = commentForm.locator('#comment-text');
    const authorInput = commentForm.locator('#comment-author');
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    
    await commentTextarea.fill('This is a test comment');
    await authorInput.fill('Test User');
    await submitButton.click();
    
    // Wait for success message
    const successMessage = page.locator('.form-success');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Comment saved successfully!');
    
    // Form should be hidden
    await expect(commentForm).not.toBeVisible();
    
    // Comment should appear in comments list
    const commentsList = sidebar.locator('.comments-list');
    await expect(commentsList).toBeVisible();
    
    const commentItem = commentsList.locator('.comment-item').first();
    await expect(commentItem).toContainText('This is a test comment');
    await expect(commentItem).toContainText('Test User');
  });

  test('should add visual feedback to commented elements', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Fill out and submit comment form
    const commentForm = sidebar.locator('.comment-form');
    const commentTextarea = commentForm.locator('#comment-text');
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    
    await commentTextarea.fill('This is a test comment');
    await submitButton.click();
    
    // Wait for success message to appear and disappear
    await page.waitForTimeout(3000);
    
    // Test element should have visual feedback
    await expect(testElement).toHaveClass(/backchannel-commented/);
    
    // Test element should have a comment badge
    const commentBadge = testElement.locator('.backchannel-comment-badge');
    await expect(commentBadge).toBeVisible();
    
    // Badge should show comment count
    const badgeCount = commentBadge.locator('.badge-count');
    await expect(badgeCount).toHaveText('1');
  });

  test('should handle character count validation', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Fill out comment form with long text
    const commentForm = sidebar.locator('.comment-form');
    const commentTextarea = commentForm.locator('#comment-text');
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    
    // Add text close to limit
    const longText = 'x'.repeat(850);
    await commentTextarea.fill(longText);
    
    // Character count should show warning
    const characterCount = commentForm.locator('.character-count');
    await expect(characterCount).toHaveClass(/warning/);
    
    // Submit button should still be enabled
    await expect(submitButton).toBeEnabled();
    
    // Add text over limit (use JavaScript to bypass maxlength)
    const tooLongText = 'x'.repeat(1001);
    await commentTextarea.evaluate((textarea, text) => {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }, tooLongText);
    
    // Wait for the component to update
    await page.waitForTimeout(100);
    
    // Character count should show error
    await expect(characterCount).toHaveClass(/error/);
    
    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should cancel comment creation', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Show sidebar and start capture
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    // Click on a test element
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    // Fill out comment form
    const commentForm = sidebar.locator('.comment-form');
    const commentTextarea = commentForm.locator('#comment-text');
    const cancelButton = commentForm.locator('button:has-text("Cancel")');
    
    await commentTextarea.fill('This comment will be cancelled');
    await cancelButton.click();
    
    // Form should be hidden
    await expect(commentForm).not.toBeVisible();
    
    // Comment should not appear in comments list
    const commentsList = sidebar.locator('.comments-list');
    const commentItems = commentsList.locator('.comment-item');
    await expect(commentItems).toHaveCount(0);
  });

  test('should load existing comments on page load', async ({ page }) => {
    await setupEnabledPage(page);
    
    const icon = page.locator('backchannel-icon');
    const sidebar = page.locator('backchannel-sidebar');
    
    // Add a comment first
    await icon.click();
    const captureButton = sidebar.locator('button:has-text("Capture Feedback")');
    await captureButton.click();
    
    const testElement = page.locator('h1').first();
    await testElement.click();
    
    const commentForm = sidebar.locator('.comment-form');
    const commentTextarea = commentForm.locator('#comment-text');
    const submitButton = commentForm.locator('button:has-text("Save Comment")');
    
    await commentTextarea.fill('Persistent test comment');
    await submitButton.click();
    
    // Wait for comment to be saved
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    
    // Wait for BackChannel to initialize
    await page.waitForFunction(() => {
      return typeof window.BackChannel !== 'undefined' && window.BackChannel.isEnabled;
    });
    
    // Wait for visual feedback to be applied after reload
    await page.waitForTimeout(2000);
    
    // Test element should still have visual feedback
    await expect(testElement).toHaveClass(/backchannel-commented/);
    
    // Test element should still have comment badge
    const commentBadge = testElement.locator('.backchannel-comment-badge');
    await expect(commentBadge).toBeVisible();
    
    // Show sidebar and check comments
    await icon.click();
    const commentsList = sidebar.locator('.comments-list');
    const commentItem = commentsList.locator('.comment-item').first();
    await expect(commentItem).toContainText('Persistent test comment');
  });
});