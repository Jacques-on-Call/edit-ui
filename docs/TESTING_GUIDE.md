# Playwright Testing Guide for the "Snag Relay"

This guide provides the official standards and best practices for writing Playwright end-to-end (E2E) tests for the `easy-seo` project. Following this guide is mandatory for all verification steps in the bug-fixing workflow.

## Philosophy: Isolate and Mock

Our primary goal for testing is **stability and determinism**. E2E tests must be able to run reliably in any environment without depending on live backend services. To achieve this, our entire testing strategy is built on a single principle: **isolate the frontend and mock all API calls.**

-   **Isolate:** We run the Vite dev server with a special configuration (`vite.config.testing.mjs`) that completely removes the API proxy. This prevents the dev server from trying to contact a live backend, which is a major source of test flakiness.
-   **Mock:** We use Playwright's `page.route()` to intercept every `fetch` request the application makes. We provide a predictable, static JSON response for each API endpoint. This ensures our tests are fast, repeatable, and only test the frontend UI's reaction to a known data state.

## Core Requirements for a Valid Test

Every Playwright test file (`*.spec.js`) **must** adhere to the following structure:

### 1. The `test.beforeEach` Setup

All mocking and initial setup must happen inside a `test.beforeEach` block.

```javascript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // All mocks go here
  });

  // Test cases go here
});
```

### 2. Essential API Mocks

At a minimum, every test file must mock the following essential API endpoints to prevent the application from redirecting to the `/login` page:

```javascript
// Mock user authentication
await page.route('/api/me', route => route.fulfill({ status: 200, json: { login: 'test-user' } }));

// Mock repository list
await page.route('/api/repos', route => route.fulfill({ status: 200, json: [{ full_name: 'test/repo' }] }));

// Mock the initial file list for the file explorer
await page.route('**/api/files?repo=test/repo&path=', route => {
  return route.fulfill({ status: 200, json: [/* array of mock file objects */] });
});

// CRITICAL: Mock the file details POST request. The UI depends on this.
await page.route('**/api/files/details', route => {
    const requestBody = route.request().postDataJSON();
    const responsePayload = {};
    // Build a valid response based on the paths the app requested
    for (const path of requestBody.paths) {
        responsePayload[path] = {
            sha: `sha-for-${path.split('/').pop()}`,
            lastCommit: { commit: { author: { name: 'test', date: new Date() } } }
        };
    }
    return route.fulfill({ status: 200, json: responsePayload });
});
```

### 3. Handling Race Conditions with `waitForResponse`

The application often performs an action (like selecting a repository) and then immediately makes a background API call to fetch more data. Tests must be written to account for this.

Use `Promise.all` to wrap the UI interaction and the `page.waitForResponse` for the subsequent API call. This guarantees the test will not proceed until the necessary data has been "loaded," preventing race conditions.

**Correct Way:**

```javascript
// ACT: Select the repository and wait for the files/details API call to complete
await Promise.all([
    page.getByRole('combobox').selectOption('test/repo'),
    page.waitForResponse(resp => resp.url().includes('/api/files/details') && resp.request().method() === 'POST')
]);

// ASSERT: Now it is safe to check for the results
await expect(page.getByText('my-file.astro')).toBeVisible();
```

**Incorrect Way (Prone to Failure):**

```javascript
// This might fail because the assertion runs before the API call finishes
await page.getByRole('combobox').selectOption('test/repo');
await expect(page.getByText('my-file.astro')).toBeVisible();
```

### 4. Running Your Test

Always run your specific test file to ensure it passes in isolation.

```bash
cd easy-seo
npx playwright test tests/my-new-feature.spec.js
```

By adhering to these principles, we can build a test suite that is fast, reliable, and provides a true verification of the frontend's behavior, fulfilling the core requirements of the Snag Relay workflow.
