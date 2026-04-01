import { test, expect } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test('should block non-admin users from admin page', async ({ page }) => {
    // Mock non-admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('mock_user', JSON.stringify({
        email: 'user@example.com',
        role: 'user'
      }));
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should show access denied or redirect
    const hasAccessDenied = await page.locator('text=/access denied|forbidden|admin only/i').isVisible({ timeout: 3000 }).catch(() => false);
    const isRedirected = page.url().includes('/admin') === false;
    
    expect(hasAccessDenied || isRedirected).toBeTruthy();
  });

  test('should allow admin users to access admin page', async ({ page }) => {
    // Mock admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('mock_user', JSON.stringify({
        email: 'admin@example.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should show admin content (tabs, management UI, etc.)
    const hasAdminContent = await page.locator('text=/admin|manage|hero background|game catalog/i').count() > 0;
    
    expect(hasAdminContent).toBeTruthy();
  });
});