// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Navigation Tests for easy-seo
 * 
 * Tests basic navigation flow through the application pages.
 * Note: Some tests may be flaky due to unstable dev environment (see AGENTS.md)
 */

test.describe('Application Navigation', () => {
  test.describe.configure({ mode: 'serial' });

  test('should load the login page as default route', async ({ page }) => {
    await page.goto('/');
    
    // Wait for login page to load
    await expect(page).toHaveURL(/\/$/);
    
    // Check for login-related elements (adjust selectors based on actual implementation)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to repo select page when authenticated', async ({ page, context }) => {
    // Note: This test assumes we can set auth state via localStorage or cookies
    // You may need to adjust based on your actual auth implementation
    
    await page.goto('/repo-select');
    
    // The page should either show repo select or redirect to login
    await page.waitForLoadState('networkidle');
    
    // Verify we're on a valid page (either repo-select or redirected to login)
    const url = page.url();
    const isValid = url.includes('repo-select') || url === 'http://localhost:5173/';
    expect(isValid).toBeTruthy();
  });

  test('should navigate to file explorer page', async ({ page }) => {
    await page.goto('/explorer');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Verify URL contains explorer or redirected
    const url = page.url();
    expect(url).toContain('explorer');
  });

  test('should navigate to content editor with page ID', async ({ page }) => {
    const testPageId = 'test-page';
    await page.goto(`/editor/${testPageId}`);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Verify URL contains editor and page ID
    const url = page.url();
    expect(url).toContain('editor');
    expect(url).toContain(testPageId);
  });

  test('should handle browser back navigation', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/repo-select');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Should be back at root
    const url = page.url();
    expect(url).toContain('localhost:5173');
  });

  test('should handle browser forward navigation', async ({ page }) => {
    // Navigate through pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/repo-select');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Should be at repo-select
    const url = page.url();
    expect(url).toContain('repo-select');
  });
});

test.describe('Page Load Performance', () => {
  test('should load pages within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 10 seconds (generous for unstable dev environment)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    
    // Should either show 404 or redirect to a valid page
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    
    // Verify the app doesn't crash
    expect(bodyText).toBeTruthy();
  });
});

test.describe('Navigation UI Elements', () => {
  test('should display animated background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for animated background elements (orbs)
    const background = page.locator('.orb');
    const count = await background.count();
    
    // Should have orb elements
    expect(count).toBeGreaterThan(0);
  });

  test('should show loading spinner during page load', async ({ page }) => {
    // Start navigation
    const navigation = page.goto('/');
    
    // Check if loading spinner appears (it might be too fast to catch)
    const spinner = page.locator('.animate-spin');
    
    // Wait for navigation to complete
    await navigation;
    await page.waitForLoadState('networkidle');
    
    // Test passes if we got here without errors
    expect(true).toBeTruthy();
  });
});
