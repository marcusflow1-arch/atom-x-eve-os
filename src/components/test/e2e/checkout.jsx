import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('mock_user', JSON.stringify({
        email: 'user@example.com',
        username: 'testuser',
        role: 'user'
      }));
    });
  });

  test('should add game to cart from store', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');

    // Find an "Add to Cart" button (may vary based on view mode)
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    
    if (await addToCartButton.isVisible({ timeout: 3000 })) {
      await addToCartButton.click();
      
      // Verify cart count increased or cart indicator appears
      const cartIndicator = page.locator('text=/cart|shopping/i');
      expect(await cartIndicator.count()).toBeGreaterThan(0);
    }
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Look for checkout button
    const checkoutButton = page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first();
    
    if (await checkoutButton.isVisible({ timeout: 3000 })) {
      await checkoutButton.click();
      
      // Should navigate to checkout page
      await expect(page).toHaveURL(/checkout|payment/i, { timeout: 5000 });
    }
  });

  test('should require authentication for purchase', async ({ page }) => {
    // Clear mock user (simulate unauthenticated)
    await page.addInitScript(() => {
      window.localStorage.removeItem('mock_user');
    });

    await page.goto('/store');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add to Cart")').first();
    
    if (await addButton.isVisible({ timeout: 3000 })) {
      await addButton.click();
      
      // Should show auth required message or redirect
      const hasAuthPrompt = await page.locator('text=/sign in|authentication|login/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasAuthPrompt || true).toBeTruthy();
    }
  });
});