// @ts-check
import { test, expect } from '@playwright/test';
import { handleLoginRequest, handleGitHubCallback } from '../../cloudflare-worker-src/routes/auth.js';

const env = {
  OAUTH_GITHUB_CLIENT_ID: 'test-client-id',
  OAUTH_GITHUB_CLIENT_SECRET: 'test-client-secret',
};

const getSetCookie = (response) => response.headers.get('Set-Cookie') || '';

test.describe('Authentication cookie policy', () => {
  test('login sets state cookie for cross-site redirect', async () => {
    const request = new Request('https://edit.strategycontent.agency/api/login');
    const response = await handleLoginRequest(request, env);
    const cookie = getSetCookie(response);

    expect(cookie).toContain('gh_oauth_state=');
    expect(cookie).toContain('SameSite=None');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=600');
    expect(cookie).toContain('Domain=.strategycontent.agency');
  });

  test('callback sets session cookie with correct attributes', async () => {
    const stateValue = 'state-123';
    const request = new Request(
      `https://edit.strategycontent.agency/api/callback?code=fake-code&state=${stateValue}`,
      {
        headers: {
          Cookie: `gh_oauth_state=${stateValue}`,
          Origin: 'https://edit.strategycontent.agency',
        },
      },
    );

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ access_token: 'gho_testtoken' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    let response;
    try {
      response = await handleGitHubCallback(request, env);
    } finally {
      global.fetch = originalFetch;
    }

    const cookie = getSetCookie(response);

    expect(cookie).toContain('gh_session=gho_testtoken');
    expect(cookie).toContain('SameSite=None');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=86400');
    expect(cookie).toContain('Domain=.strategycontent.agency');
    expect(response.headers.get('Location')).toBe('/');
  });

  test('local development host omits Domain attribute to allow cookie set', async () => {
    const loginRequest = new Request('https://localhost:8787/api/login');
    const response = await handleLoginRequest(loginRequest, env);
    const cookie = getSetCookie(response);

    expect(cookie).not.toContain('Domain=');
    expect(cookie).toContain('SameSite=None');
  });
});
