// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Environment Smoke Test', () => {
  test('should successfully load the homepage with a mocked API response', async ({ page }) => {
    // 1. Mock the user authentication endpoint to simulate a logged-in user.
    await page.route('/api/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isAuthenticated: true,
          user: {
            login: 'test-user',
            name: 'Test User',
            avatar_url: 'https://example.com/avatar.png',
          },
        }),
      });
    });

    // 2. Mock the repository endpoint to provide a list of repos.
    // The application needs this data to render the main file explorer page.
    await page.route('/api/repos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'test-repo-1',
            full_name: 'test-user/test-repo-1',
            private: false,
          },
          {
            name: 'test-repo-2',
            full_name: 'test-user/test-repo-2',
            private: true,
          },
        ]),
      });
    });

    // 3. Navigate to the application's base URL.
    await page.goto('/');

    // 4. Verify that the application has loaded correctly by checking the title.
    await expect(page).toHaveTitle(/Easy SEO/);

    // 5. Verify that the "Select a repository" text is visible,
    // which confirms the app has processed our mocked API responses and rendered the correct view.
    await expect(page.getByText('Select a repository')).toBeVisible();
  });
});
