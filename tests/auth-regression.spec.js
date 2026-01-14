import { test, expect } from '@playwright/test';

test.describe('Authentication Regression', () => {
  test('should successfully log in and authenticate /api/me', async ({ page }) => {
    // 1. Navigate to the login page (or a page that redirects to it)
    await page.goto('/');

    // 2. Wait for the login page to load and click the login button
    await expect(page.locator('a[href="/api/login"]')).toBeVisible();
    await page.locator('a[href="/api/login"]').click();

    // 3. After redirection to GitHub, you would normally fill in credentials.
    // In a real test, you'd mock this. For now, we'll assume the user logs in.
    // The test will resume on the callback page.

    // 4. Wait for the application to redirect back and land on the repo-select page
    await page.waitForURL('/repo-select');

    // 5. Check for the presence of the 'gh_session' cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'gh_session');
    expect(sessionCookie).toBeDefined();

    // 6. Make a request to /api/me and assert that it returns a 200 OK status
    const meResponse = await page.request.get('/api/me');
    expect(meResponse.ok()).toBeTruthy();
  });
});
