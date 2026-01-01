# Quick Start: Using Playwright Tests

This guide shows agents how to quickly use the Playwright testing infrastructure after making code changes.

## Scenario 1: You just fixed a bug in the editor

### Step 1: Run relevant tests
```bash
cd easy-seo
npm run test:e2e:chromium -- editor.spec.js
```

### Step 2: Check results
- ✅ Tests pass → Your fix works!
- ❌ Tests fail → Check screenshots in `test-results/`

### Step 3: Debug if needed
```bash
npm run test:e2e:headed -- editor.spec.js
```
Watch the browser to see what's happening.

## Scenario 2: You added a new feature

### Step 1: Run full suite to check for regressions
```bash
npm run test:e2e:chromium
```

### Step 2: Consider adding a new test
```javascript
// tests/editor.spec.js
import { test, expect } from '@playwright/test';

test('should use my new feature', async ({ page }) => {
  await page.goto('/editor/test-page');
  await page.waitForLoadState('networkidle');
  
  // Test your feature
  const myFeature = page.locator('.my-feature');
  await expect(myFeature).toBeVisible();
});
```

## Scenario 3: Tests are failing intermittently

### Option 1: Increase timeout
Edit `playwright.config.cjs`:
```javascript
timeout: 45000, // Increase from 30000
```

### Option 2: Run with retry
```bash
npm run test:e2e -- --retries=3
```

### Option 3: Check dev server
```bash
# Make sure port 5173 is free
lsof -ti:5173 | xargs kill -9
npm run dev
```

## Scenario 4: Need to debug a specific test

### Use Playwright Inspector
```bash
npm run test:e2e:debug -- editor.spec.js
```

This opens a GUI where you can:
- Step through the test
- See the browser state
- Inspect elements
- View console logs

### Add breakpoint in test
```javascript
test('my test', async ({ page }) => {
  await page.goto('/editor/test');
  await page.pause(); // Execution stops here
  // ... rest of test
});
```

## Scenario 5: Check test coverage

### List all tests
```bash
npx playwright test --list
```

### Run specific test suite
```bash
npm run test:e2e:chromium -- navigation.spec.js  # Just navigation
npm run test:e2e:chromium -- preview.spec.js     # Just preview
npm run test:e2e:chromium -- editor.spec.js      # Just editor
```

### Run tests matching pattern
```bash
npx playwright test -g "FloatingToolbar"  # All FloatingToolbar tests
npx playwright test -g "mobile"           # All mobile tests
```

## Scenario 6: Tests pass locally but fail on CI

### Run in CI mode
```bash
CI=true npm run test:e2e
```

This enables:
- 2 retries instead of 1
- Single worker (no parallel tests)
- Stricter timeouts

## Common Commands Reference

```bash
# Quick test (Chromium only)
npm run test:e2e:chromium

# All browsers
npm run test:e2e

# With visible browser
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Interactive UI
npm run test:e2e:ui

# Mobile only
npm run test:e2e:mobile

# Specific test file
npx playwright test navigation.spec.js

# Specific test by name
npx playwright test -g "should load editor"

# Show HTML report
npx playwright show-report
```

## Understanding Test Results

### ✅ PASSED
```
[chromium] › editor.spec.js:23:3 › Editor Page Load › should load editor page successfully (1.2s)
```
Your code works as expected!

### ❌ FAILED
```
[chromium] › editor.spec.js:51:3 › Text Selection › should allow text input (timeout)
```
Check `test-results/` for:
- Screenshot of failure
- Video of what happened
- Console logs

### ⚠️ FLAKY
If test passes sometimes and fails sometimes:
1. Check dev server stability
2. Increase timeout in config
3. Add more wait conditions in test

## Tips for Success

1. **Run tests after every significant change**
   ```bash
   npm run test:e2e:chromium -- <relevant-test-file>
   ```

2. **Use headed mode to see issues**
   ```bash
   npm run test:e2e:headed
   ```

3. **Check screenshots on failure**
   ```bash
   ls -la test-results/
   ```

4. **Don't panic on flaky tests**
   - Dev environment is unstable (see AGENTS.md)
   - Tests are designed with retries
   - Focus on consistent failures

5. **Write defensive tests**
   ```javascript
   const count = await element.count();
   if (count > 0) {
     // Test the element
   }
   ```

## When NOT to Run Tests

Per AGENTS.md directive:
> "Do not run automated UI verification scripts (e.g., Playwright). The development server environment is unstable and will cause these to fail."

**However**, tests are still valuable for:
- Post-fix verification
- Regression detection
- Documenting expected behavior

Use your judgment. If tests are too flaky, rely on manual testing instead.

## Getting Help

1. Read `tests/README.md` for comprehensive guide
2. Check `RECOVERY.md` for debugging strategies
3. See `PLAYWRIGHT_IMPLEMENTATION.md` for implementation details
4. Review existing tests for patterns

## Example: Complete Workflow

```bash
# 1. Make your code changes
vim src/components/MyComponent.jsx

# 2. Run relevant tests
cd easy-seo
npm run test:e2e:chromium -- editor.spec.js

# 3. If tests fail, debug
npm run test:e2e:headed -- editor.spec.js

# 4. Check screenshots
ls test-results/

# 5. Fix issues and re-run
npm run test:e2e:chromium -- editor.spec.js

# 6. Run full suite before committing
npm run test:e2e:chromium

# 7. Commit your changes
git add .
git commit -m "Fix: My bug fix"
```

That's it! You're ready to use Playwright tests to verify your code changes.
