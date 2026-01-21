import { test, expect } from '@playwright/test';

test.describe('Auth0 Authentication Flow', () => {

  test('user should be able to log in, select a repo, and see the file explorer', async ({ page }) => {
    // Mock the initial state: user is not authenticated
    await page.route('/Get/ShowUp/api/me', route => {
      route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
    });

    // Go to the login page
    await page.goto('/Get/ShowUp/');
    await expect(page.locator('button:has-text("Sign Up Free Use")')).toBeVisible();

    // Intercept the call to the login API endpoint
    await page.route('/Get/ShowUp/api/login', route => {
      // Prevent the actual redirect to Auth0 and simulate a successful callback instead
      // This is faster and more stable than going to the actual Auth0 page
      page.goto('/Get/ShowUp/api/callback?code=testcode&state=teststate');
      // Fulfill the request to avoid errors
      route.fulfill({ status: 200 });
    });

    // Mock the callback logic
    await page.route('/Get/ShowUp/api/callback?code=testcode&state=teststate', route => {
        // After the "callback", the app will check auth status again.
        // This time, we mock a successful response.
        page.route('/Get/ShowUp/api/me', innerRoute => {
            innerRoute.fulfill({ status: 200, json: { nickname: 'testuser', name: 'Test User', picture: '', sub: 'auth0|123' } });
        });
        // We also need to mock the repositories endpoint
        page.route('/api/repos', innerRoute => {
            innerRoute.fulfill({ status: 200, json: [{ name: 'test-repo', full_name: 'testuser/test-repo' }] });
        });
        // Redirect back to the app's root
        route.fulfill({
            status: 200,
            headers: { 'Content-Type': 'text/html' },
            body: `
              <!DOCTYPE html><html><head><title>Redirecting...</title>
              <script>window.location.href = '/Get/ShowUp/';</script>
              </head><body>Redirecting...</body></html>
            `
        });
    });

    // Click the login button
    await page.locator('button:has-text("Sign Up Free Use")').click();

    // After the simulated login and callback, the app should land on the repo-select page
    // Look for a heading or unique element on the repository selection page.
    await expect(page.locator('h1:has-text("Welcome, testuser")')).toBeVisible({ timeout: 10000 });

    // Verify that the URL is correct
    await expect(page).toHaveURL('/Get/ShowUp/repo-select', { timeout: 5000 });

    // Click the repository button
    await page.locator('button:has-text("test-repo")').click();

    // Verify that the URL is now the file explorer
    await expect(page).toHaveURL('/Get/ShowUp/explorer', { timeout: 5000 });

    // Verify that the file explorer is visible
    await expect(page.locator('h2:has-text("File Explorer")')).toBeVisible({ timeout: 10000 });
  });

});
