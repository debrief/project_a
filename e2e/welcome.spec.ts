import { test, expect } from '@playwright/test'

test.describe('BackChannel Welcome Page', () => {
  test('should load the welcome page correctly', async ({ page }) => {
    // Navigate to the welcome page
    await page.goto('/')
    
    // Check if the page title is correct
    await expect(page).toHaveTitle('BackChannel Demo')
    
    // Check if the main heading is present
    const heading = page.locator('h1')
    await expect(heading).toHaveText('BackChannel Demo')
    
    // Check if the reviewable sections are present
    const reviewableSections = page.locator('.reviewable')
    await expect(reviewableSections).toHaveCount(3)
    
    // Check if specific content is present
    await expect(page.locator('text=Introduction')).toBeVisible()
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=How to Use')).toBeVisible()
  })

  test('should have BackChannel available in window object', async ({ page }) => {
    // Navigate to the welcome page
    await page.goto('/')
    
    // Check if BackChannel is defined in the window object
    const backChannelDefined = await page.evaluate(() => {
      return typeof window.BackChannel !== 'undefined'
    })
    
    expect(backChannelDefined).toBeTruthy()
  })
})
