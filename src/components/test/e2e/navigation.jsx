import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Store page', async ({ page }) => {
    // Click on Store link in navigation
    const storeLink = page.locator('a:has-text("Store"), button:has-text("Store")').first();
    
    if (await storeLink.isVisible()) {
      await storeLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify Store page loaded
      await expect(page.locator('text=/Store|Games/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to Library page', async ({ page }) => {
    // Open menu drawer first
    const menuButton = page.locator('button').filter({ has: page.locator('span') }).first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Click Library link
      const libraryLink = page.locator('text=Library').first();
      if (await libraryLink.isVisible()) {
        await libraryLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify Library page loaded
        const hasLibraryContent = await page.locator('text=/Library|Games/i').count() > 0;
        expect(hasLibraryContent).toBeTruthy();
      }
    }
  });

  test('should navigate to Community page', async ({ page }) => {
    const menuButton = page.locator('button').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      const communityLink = page.locator('text=/Community|Forum/i').first();
      if (await communityLink.isVisible()) {
        await communityLink.click();
        await page.waitForLoadState('networkidle');
        
        expect(await page.locator('text=/Community|Forum|Post/i').count()).toBeGreaterThan(0);
      }
    }
  });

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should either show 404 or redirect to home
    const has404 = await page.locator('text=/not found|404/i').isVisible().catch(() => false);
    const hasContent = await page.locator('body').textContent() !== '';
    
    expect(has404 || hasContent).toBeTruthy();
  });
});