import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user authentication to simulate a logged-out state
    await page.route('/api/me', route => route.fulfill({ status: 401, json: { error: 'Not authenticated' } }));
    // Mock repository list to prevent errors
    await page.route('/api/repos', route => route.fulfill({ status: 200, json: [] }));
  });

  test('should display the login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("ShowUp")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up Free Use")')).toBeVisible();
    await expect(page.locator('button:has-text("Already have an account? Login")')).toBeVisible();
  });

  test('should navigate to the login API on "Sign Up" button click', async ({ page }) => {
    await page.goto('/');

    // Start waiting for the navigation before clicking
    const navigationPromise = page.waitForNavigation({ url: '**/Get/ShowUp/api/login' });

    await page.locator('button:has-text("Sign Up Free Use")').click();

    await navigationPromise;
  });

  test('should navigate to the login API on "Login" button click', async ({ page }) => {
    await page.goto('/');

    // Start waiting for the navigation before clicking
    const navigationPromise = page.waitForNavigation({ url: '**/Get/ShowUp/api/login' });

    await page.locator('button:has-text("Already have an account? Login")').click();

    await navigationPromise;
  });
});
