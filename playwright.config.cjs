// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for easy-seo end-to-end testing
 * 
 * Note: The dev environment can be unstable, so tests are configured with:
 * - Retries to handle flakiness
 * - Screenshots on failure for debugging
 * - Longer timeouts
 * 
 * See AGENTS.md for context about dev environment stability
 */
module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test file pattern
  testMatch: '**/*.spec.js',
  
  // Timeout for each test
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only (dev environment can be unstable)
  retries: process.env.CI ? 2 : 1,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:5173',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action such as `click()` can take
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 15000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Slow down operations to handle unstable dev environment
        launchOptions: {
          slowMo: 100,
        },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          slowMo: 100,
        },
      },
    },

    // Mobile viewports for responsive testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          slowMo: 100,
        },
      },
    },

    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        launchOptions: {
          slowMo: 100,
        },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    // By using a specific test config, we can run a proxy-less server for stable API mocking.
    command: 'vite --config vite.config.testing.mjs',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start (dev server can be slow)
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
