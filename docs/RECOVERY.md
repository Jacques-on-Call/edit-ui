# RECOVERY.md: The Debug Diary

This document is a living log of common failure modes, known bugs, and the patterns used to diagnose and resolve them. Before starting a deep debugging session, consult this diary. If you solve a new or complex bug, you **must** add your findings here.

---

### 0. **FloatingToolbar Selection Loop and Mobile Keyboard Issues**

**Date:** 2025-12-08
**Agent:** GitHub Copilot

**Symptoms:**

FloatingToolbar exhibits unstable behavior on mobile and desktop:
- Console shows repeated "Skipping - selection unchanged (dedupe)" log messages
- Toolbar sometimes never appears when text is selected
- Toolbar flickers or updates continuously on mobile when keyboard opens/closes
- Performance degradation from excessive position recalculations
- Floating hamburger and toolbar may disappear when mobile keyboard opens
- Toolbar may appear in wrong position during pinch-zoom

**Root Cause:**

Multi-layered issue with several contributing factors:

1. **Insufficient Loop Protection:** The toolbar had selection deduplication (comparing selection keys) but no time-based cooldown. Mobile devices fire rapid selectionchange events when the visual viewport changes (keyboard opening/closing), even when the text selection itself hasn't changed. The dedupe logic catches identical selections, but slight variations in selection object properties (e.g., visualViewport offsets) could bypass it and trigger continuous updates.

2. **Mobile Keyboard Events:** When the mobile keyboard opens/closes, iOS Safari and Android Chrome fire visualViewport resize events and selectionchange events even for collapsed selections (just a cursor). Without proper filtering, the toolbar tries to position itself on every event, creating a loop.

3. **Visual Viewport Not Accounted:** The toolbar positioning didn't account for window.visualViewport offsets, causing incorrect positioning during pinch-zoom and when the mobile keyboard is open.

**Solution:**

Implemented a comprehensive multi-layer anti-loop protection and mobile support system:

1. **Selection Deduplication (Layer 1):**
   - Compare selection keys to skip identical selections
   - Selection key includes: anchorNode name, anchorOffset, focusNode name, focusOffset, text length
   - Prevents redundant position calculations for same selection

2. **Cooldown Period (Layer 2):**
   - Time-based throttling to prevent updates within configurable window
   - Default: 200ms (configurable via cooldownMs prop)
   - Tracks last update time and skips updates within cooldown window
   - Provides safety net that works regardless of selection object variations

3. **Mobile-Specific Protection (Layer 3):**
   - **Critical:** Only show toolbar when `selection.toString().trim().length > 0`
   - Hide on collapsed selection (just a cursor) unless caretMode=true
   - Added touchend event listener for mobile text selection support
   - Prevent mousedown/touchstart on toolbar from clearing selection

4. **Visual Viewport Support:**
   - Account for window.visualViewport offsets (offsetLeft, offsetTop)
   - Correctly position toolbar during pinch-zoom
   - Toolbar remains visible and correctly positioned when keyboard opens

```javascript
// FloatingToolbar.jsx - Anti-loop implementation
const cooldownMs = 200; // Configurable cooldown (default 200ms)
const lastUpdateTimeRef = useRef(0);
const lastSelectionKeyRef = useRef(null);

// In updatePosition():
const selection = window.getSelection();
const selectionText = selection?.toString() || '';
const hasTextSelection = selectionText.trim().length > 0;

// Mobile keyboard loop prevention: CRITICAL
if (selection.isCollapsed && !caretMode) {
  if (debugMode) {
    console.debug('[FloatingToolbar] Hiding - collapsed selection and caretMode=false (prevents mobile keyboard loops)');
  }
  setPosition(prev => ({ ...prev, visible: false }));
  return;
}

// Only show when selection has non-empty text
if (!hasTextSelection && !caretMode) {
  if (debugMode) {
    console.debug('[FloatingToolbar] Hiding - no text in selection (prevents caret loops)');
  }
  setPosition(prev => ({ ...prev, visible: false }));
  return;
}

// Selection deduplication
const selectionKey = selection?.rangeCount > 0 
  ? `${selection.anchorNode?.nodeName}-${selection.anchorOffset}-${selection.focusNode?.nodeName}-${selection.focusOffset}-${selectionText.length}`
  : null;

if (selectionKey && selectionKey === lastSelectionKeyRef.current) {
  if (debugMode) {
    console.debug('[FloatingToolbar] Skipping - selection unchanged (dedupe)', { selectionKey });
  }
  return;
}

// Cooldown check
const now = Date.now();
const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
if (lastUpdateTimeRef.current > 0 && timeSinceLastUpdate < cooldownMs) {
  if (debugMode) {
    console.debug('[FloatingToolbar] Skipping - within cooldown period', { 
      timeSinceLastUpdate, 
      cooldownMs,
      selectionKey 
    });
  }
  return;
}

lastSelectionKeyRef.current = selectionKey;
lastUpdateTimeRef.current = now;

// Visual viewport support
const viewport = window.visualViewport || { 
  offsetLeft: 0, 
  offsetTop: 0, 
  pageLeft: window.scrollX,
  pageTop: window.scrollY
};

const viewportOffsetX = viewport.offsetLeft || 0;
const viewportOffsetY = viewport.offsetTop || 0;

// Position toolbar with viewport offsets
const top = rect.top + window.scrollY - toolbarElement.offsetHeight - offset.y + viewportOffsetY;
const left = rect.left + window.scrollX + (rect.width / 2) + viewportOffsetX + offset.x;
```

**How to Enable Runtime Instrumentation:**

1. Open browser console (F12 or Cmd+Option+I)
2. Enable debug mode: `window.__EASY_SEO_TOOLBAR_DEBUG__ = true`
3. Select text in the editor
4. **Visual confirmation:** A small red pulsing dot appears in the top-right corner of the FloatingToolbar
5. **Console logs:** Watch detailed logs showing:
   - Selection state (collapsed, text content, range info, node names)
   - Dedupe status (whether selection key changed)
   - Cooldown status (whether update was throttled, time since last update)
   - Position calculations (viewport offsets, scroll position, computed top/left)
   - Hide reasons (explicit explanation for each early return case)
6. Look for patterns: if logs repeat rapidly, increase cooldownMs; if toolbar feels sluggish, decrease cooldownMs

**To disable debug mode:**
```javascript
window.__EASY_SEO_TOOLBAR_DEBUG__ = false
// or simply reload the page
```

**Recommended cooldownMs values:**
- **Desktop:** 150-200ms (default: 200ms)
- **Mobile:** 200-250ms
- **High-frequency update scenarios** (e.g., mobile with aggressive selection events): 250-300ms
- **Low-latency scenarios** (desktop with good hardware): 150ms

**Tuning cooldownMs:**
- Pass as prop to FloatingToolbar in EditorCanvas.jsx: `<FloatingToolbar cooldownMs={250} ... />`
- Or modify default value in FloatingToolbar.jsx for global change

**Key Insights:**

1. **Dedupe alone isn't enough on mobile:** Visual viewport changes can create slight selection variations that bypass key-based deduplication.
2. **Cooldown is essential:** Time-based throttling provides a safety net that works regardless of selection object changes.
3. **Three layers required:** All three protection layers (dedupe + cooldown + mobile checks) work together. Any one alone is insufficient.
4. **200ms sweet spot:** Long enough to prevent loops on most devices, short enough to feel responsive. Originally 150ms, increased after testing on mobile devices with noisy selection events.
5. **Visual debug indicators > hidden flags:** The pulsing red dot makes it immediately obvious that debug mode is active, eliminating "did I enable it?" confusion.
6. **Runtime debug flags are invaluable:** Being able to toggle verbose logging in production without redeployment makes debugging customer issues possible.
7. **Touch targets matter:** 40x40px buttons (updated from 32px) meet WCAG 2.1 AA guidelines and significantly improve mobile usability.
8. **Empty text check is CRITICAL:** The `selection.toString().trim().length > 0` check prevents infinite keyboard loops on mobile. Without it, the toolbar tries to position on every keyboard event.

**Verification:**
1. Enable debug mode in console
2. Select text on mobile with keyboard open - toolbar should appear once and logs should show single position update
3. Open/close keyboard - toolbar should remain stable, no console spam
4. Try collapsed selection (just cursor) - toolbar should hide with "collapsed selection" log message
5. Check for red debug dot in toolbar top-right when debug enabled

**Prevention:**
- Always test toolbar changes on actual mobile devices with on-screen keyboard
- Monitor console for selection event spam
- Use debug mode during development to catch issues early
- Test with different cooldownMs values to find optimal setting for target devices

---

### 1. **Whitespace Typos in Method Calls and String Operations**

-   **Symptom:** Mysterious parsing failures, incorrect string comparisons, or pages not loading properly. For example, JSON pages like `home-from-json.astro` fail to load in the editor, or file paths are not processed correctly.
-   **Root Cause:** Systematic whitespace typos in code where there is a space before the dot in method calls or property access (e.g., `object. method()` instead of `object.method()`, or `'. astro'` instead of `'.astro'`). While these may look cosmetically similar in code, they are syntactically incorrect and cause runtime failures.
-   **Verification:** 
    1.  Search for the pattern using: `grep "\. [a-z]" filename.jsx` or `grep -n "\. [a-z-]" filename.css`
    2.  Check string literals and regex patterns for spaces before dots: `grep "'\. " filename`
    3.  Look for method calls with spaces: `grep "[a-zA-Z0-9_]\. [a-z]" filename`
-   **Fix:** 
    1.  For individual files: `sed -E 's/\. ([a-z])/.\1/g' filename > filename.tmp && mv filename.tmp filename`
    2.  For CSS files: `sed -E 's/\. ([a-z-])/.\1/g' filename.css > filename.css.tmp && mv filename.css.tmp filename.css`
    3.  Manual fixes may be needed for specific cases like regex patterns: `/\. astro$/` → `/\.astro$/`
-   **Prevention:** Always validate code carefully when using find-and-replace operations. These systematic typos suggest they were introduced by an automated tool or formatter issue.

---

### 5. **Authentication Loop after Login**

-   **Symptom:** After a successful login and repository selection, the user is immediately redirected back to the login page, which then sends them back to the repository selection page, creating an infinite loop.
-   **Root Cause:** This is a race condition caused by a stale global authentication state.
    1.  The app's global state (`AuthContext`) is initialized on first load when the user is unauthenticated (`isAuthenticated: false`).
    2.  The user logs in via a popup, which sets a session cookie.
    3.  The app's global state is *not* updated after the login.
    4.  When the user tries to access a protected route (like `/explorer`), the `ProtectedRoute` component reads the stale global state and incorrectly determines the user is unauthenticated, redirecting them to `/login`.
-   **Verification:** Use the `AuthDebugMonitor`. The logs will clearly show that the global state is `isAuthenticated: false` even after the OAuth callback succeeds. You will see the navigation to the protected route immediately followed by a redirect back to login.
-   **Fix:** The global authentication state must be explicitly refreshed after a successful login.
    1.  Modify the `AuthContext` to expose a function that can manually trigger the `/api/me` check (e.g., `checkAuthStatus`).
    2.  In the `LoginPage` component, after the OAuth popup sends its "login-success" message, call this `checkAuthStatus` function *before* navigating to the next page. This ensures the global state is up-to-date.

### 6. **Build Fails with `[vite]: Rollup failed to resolve import`**

-   **Symptom:** The `npm run build` command fails with an error message like `Rollup failed to resolve import "some-package" from "/path/to/some/component.jsx"`.
-   **Root Cause:** This error has two primary causes:
    1.  **Missing Dependency:** The required package (e.g., `lucide-preact`) is not listed in the `dependencies` section of `easy-seo/package.json`.
    2.  **Incorrect File Path:** A developer has created a new file (e.g., a new Context or Component) but has made a typo in the directory path, causing the build tool to be unable to locate it.
-   **Verification:**
    1.  **Check `package.json`:** Open `easy-seo/package.json` and ensure the package mentioned in the error message is listed as a dependency.
    2.  **Verify File Paths:** If the import is for a local file, use the `list_files` command to meticulously check the exact spelling and location of the file and its parent directories. The build tool's path resolution is case-sensitive and exact.
-   **Fix:**
    1.  **Install Dependency:** Run `npm install --prefix ./easy-seo some-package` to add the missing package.
    2.  **Correct Paths:** Use the `rename_file` or `move_file` commands to fix any typos in the file or directory names. Then, correct the `import` statements in the code to match.

### 7. **API Call "Succeeds" but Returns No Data**

-   **Symptom:** A page that fetches data (e.g., the repository selection page) gets stuck or shows an empty list. The browser's network tab shows a `200 OK` status for the relevant API call (e.g., `/api/repos`), but the response body is an empty array `[]`.
-   **Root Cause:** This is a "silent failure" in the backend. The Cloudflare Worker is catching an error from the upstream API (e.g., the GitHub API) but is programmed to return a `200 OK` with an empty array instead of propagating the error. This completely hides the real problem.
-   **Verification:** Check the code for the relevant API handler in `cloudflare-worker-code.js`. Look for `try...catch` blocks or `.catch()` statements that return a successful response with empty data.
-   **Fix:** Modify the backend handler to be more transparent. If the upstream API call fails, the worker should grab the error message and status code from that failure and forward it to the frontend in a proper error response (e.g., a `502 Bad Gateway` or the original status code from GitHub). Then, update the frontend component to handle this specific error and display an informative message to the user.

## 🐞 Common Failure Modes & Fixes

### 1. **Cloudflare Worker throws `1101` Exception during Login**

-   **Symptom:** The user clicks "Login with GitHub," is redirected to GitHub, authorizes the app, but upon returning to the `/api/callback` endpoint, the application crashes with a Cloudflare Worker `1101` error.
-   **Root Cause:** This is almost always a `Content-Type` mismatch when communicating with the GitHub OAuth API. The `fetch` request to `https://github.com/login/oauth/access_token` is likely being sent with a body format other than `application/x-www-form-urlencoded`.
-   **Verification:** Read the `handleGitHubCallback` function in `cloudflare-worker-code.js`. Check the `headers` and `body` of the `fetch` request.
-   **Fix:**
    1.  Ensure the `Content-Type` header is set to `"application/x-w  ww-form-urlencoded"`.
    2.  Ensure the request `body` is a `URLSearchParams` object, not a JSON string.

---

### 2. **File Explorer is Empty or Shows Incorrect Directory**

-   **Symptom:** After logging in and selecting a repository, the File Explorer shows an empty directory, or it shows the root of the repository instead of the expected `src/pages` directory.
-   **Root Cause:** This is a frontend logic issue. The `FileExplorer.jsx` component's initial state is controlled by the `?path=` URL query parameter. If this parameter is missing or incorrect, the explorer will default to the root (`/`).
-   **Verification:**
    1.  Check the browser's URL bar when the File Explorer is loaded. Does it contain `?path=src/pages`?
    2.  Inspect the `RepositorySelectionPage.jsx` component. Check the `navigate` call in the `handleRepoSelect` function to ensure it is correctly appending the `?path=` parameter.
    3.  Inspect the `FileExplorer.jsx` component. Ensure its `useEffect` hook is correctly parsing the path from `useLocation()`.
-   **Fix:** The fix is usually in `RepositorySelectionPage.jsx`. Ensure the navigation logic is as follows: `navigate(\`/explorer?path=src/pages\`, { state: { selectedRepo: repo } });`

---

### 3. **API Requests Fail with `401 Unauthorized`**

-   **Symptom:** The application appears to load, but any action that requires fetching data from the backend (e.g., listing files, opening a file) fails with a `401` or `404` error in the network tab.
-   **Root Cause:** The frontend has **no central authentication**. This means a page may have loaded without a valid user session. This can happen if a user navigates directly to a protected page.
-   **Verification:**
    1.  Check the page component in question (e.g., `ExplorerPage.jsx`).
    2.  Does it have a `useEffect` hook that calls the `/api/me` endpoint?
    3.  If it does, how does it handle a failed response? It should redirect to `/login`.
-   **Fix:** Wrap the protected page component with an authentication check. This can be done with a Higher-Order Component (`withAuth`) or a `useEffect` hook at the top of the component that verifies the user's session with the backend and redirects if necessary.

---

### 4. **File Explorer is Empty (Multi-Part Bug)**

-   **Symptom:** After a successful login, the file explorer page loads but remains permanently empty. The browser's network tab may show a `200 OK` for the file-listing API call, but the response body is empty, or the call may not happen at all.
-   **Root Cause:** This was a complex bug with three distinct causes that created a "perfect storm" of failure.
    1.  **Frontend Component Crash:** A CSS conflict in `ExplorerPage.jsx` between a parent `div` with `padding` and the `FileExplorer.jsx` child component with `h-screen` caused a silent rendering crash. This prevented the `useEffect` hook responsible for fetching files from ever running.
    2.  **Brittle Backend Routing:** The Cloudflare worker's router used a strict equality check (`url.pathname === '/api/list-files-in-repo/'`). A subtle difference in the incoming request path (e.g., a missing trailing slash) caused the check to fail. The request then fell through to the static asset handler, which returned an empty `200 OK` response, causing the frontend to fail when parsing the expected JSON.
    3.  **Hardcoded GitHub Branch:** The worker's logic for fetching repository contents hardcoded `ref=main`. This would fail for any repository whose default branch is `master` or another name.
-   **Verification & Fix:**
    1.  **Check for CSS Conflicts:** Inspect parent components for `padding` when a child component needs to fill the screen height (`h-screen` or `h-full`). Remove the padding from the parent to fix the component crash.
    2.  **Make Routing Robust:** In `cloudflare-worker-code.js`, change strict path checks (`===`) to more flexible ones (`.startsWith()`) for API routes to prevent silent fall-throughs.
    3.  **Fetch Default Branch:** Before fetching repository contents, implement a helper function to call the `/repos/{repo}` GitHub API endpoint to get the `default_branch` name. Use this dynamic branch name in all subsequent calls to the contents API.

---

## 🔧 How to Verify Subsystems

-   **Cloudflare Worker Deployment:**
    1.  After a deployment, do not assume the new code is live.
    2.  Run `npx wrangler tail` in your terminal.
    3.  Perform an action in the application that triggers the worker. You should see log output from the new version, confirming it is active.
-   **GitHub API Token (`DEV_MODE`):**
    1.  To test functionality that requires elevated permissions (like accessing a private repository), you can enable `DEV_MODE`.
    2.  In your `wrangler.toml`, set `DEV_MODE = true`.
    3.  Ensure you have a `GITHUB_TOKEN` secret configured in your Cloudflare Worker environment with the necessary repository permissions. The worker will then use this token instead of the user's session cookie.
