import { test, expect } from '@playwright/test';

test.describe('Authentication Cookie Verification with Mocked OAuth', () => {

  test('should set session cookie correctly after mocked GitHub callback', async ({ page, context }) => {
    // --- MOCK API CALLS ---

    const FAKE_ACCESS_TOKEN = 'gho_mocked_test_token_1234567890';

    // 1. Mock the /api/callback endpoint.
    // This is the endpoint the user is redirected to after "logging in" on GitHub.
    // We will simulate the Cloudflare Worker's response, which is a 302 redirect
    // to the app's root, with a `Set-Cookie` header.
    await page.route('**/api/callback**', route => {
      const headers = {
        'Set-Cookie': `gh_session=${FAKE_ACCESS_TOKEN}; HttpOnly; Path=/; Max-Age=86400; Secure; SameSite=None; Domain=localhost`,
        'Location': '/' // Redirect back to the app's home page
      };
      route.fulfill({
        status: 302,
        headers: headers
      });
    });

    // 2. Mock the /api/me endpoint.
    // The application calls this endpoint after the cookie is set to verify the user.
    await page.route('**/api/me', route => {
      // Check if the request includes the cookie we just set.
      const headers = route.request().headers();
      const cookie = headers['cookie'];
      if (cookie && cookie.includes(`gh_session=${FAKE_ACCESS_TOKEN}`)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ login: 'test-user' })
        });
      } else {
        // If the cookie is missing, simulate a failure.
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No authentication cookie found' })
        });
      }
    });

    // 3. Mock the /api/repos endpoint
    await page.route('**/api/repos', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ full_name: 'test-user/repo1' }, { full_name: 'test-user/repo2' }])
        });
    });


    // --- TEST EXECUTION ---

    // Start with a clean slate.
    await context.clearCookies();

    // Navigate directly to the mocked callback URL as if we just came from GitHub.
    await page.goto('/api/callback?code=mock_code&state=mock_state');

    // After the mocked callback, we should be redirected to the root.
    // Wait for the URL to change back to the app's base URL.
    await page.waitForURL('/');

    // Get all cookies for the current browser context.
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'gh_session');

    // --- ASSERTIONS ---
    expect(sessionCookie, 'Session cookie should exist').toBeTruthy();
    expect(sessionCookie.value).toBe(FAKE_ACCESS_TOKEN);
    expect(sessionCookie.domain).toBe('localhost');
    expect(sessionCookie.sameSite).toBe('None');
    expect(sessionCookie.secure).toBe(true);
    expect(sessionCookie.httpOnly).toBe(true);

    // Verify the user is now authenticated and sees the repository selection page.
    await expect(page.locator('h1:has-text("Select Repository")')).toBeVisible({ timeout: 10000 });

    console.log('✅ All mocked cookie assertions passed');
  });
});
