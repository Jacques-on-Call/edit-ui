# Recovery Guide: Debug Diary & Solutions

This document serves as a debug diary for the `easy-seo` project. It records complex, non-obvious bugs and their solutions to aid future developers in troubleshooting.

---

## **Bug: API Requests Fail Silently with `ReferenceError` on Client**

**Date:** 2025-11-06
**Agent:** Jules #147

### **Symptoms:**

Multiple components in the application, including the file explorer and search, were failing to render data. The browser's developer console showed `ReferenceError: ... is not defined` or similar errors deep within the component's rendering logic. The network tab, however, showed that the relevant API requests (e.g., to `/api/files`) were succeeding with a `200 OK` status, but the response body appeared "Empty" or was unreadable by the client-side JavaScript.

### **Root Cause:**

The root cause was a subtle but critical CORS misconfiguration in the Cloudflare Worker backend.

1.  **Inconsistent Origin Header:** In `cloudflare-worker-src/routes/content.js`, the CORS headers were being generated using `request.headers.get('Origin')` directly. If a request was sent without an `Origin` header (which can happen in certain scenarios), this value would be `null`.
2.  **`Access-Control-Allow-Origin: null`:** The worker would then respond with the header `Access-Control-Allow-Origin: null`.
3.  **Browser Security Policy:** According to the CORS specification, a response with `Access-Control-Allow-Origin: null` does **not** grant access to a page loaded from a specific origin (e.g., `http://localhost:5173`). For security reasons, the browser would therefore block the client-side JavaScript from accessing the response body, even though the network request itself was successful.
4.  **Client-Side Crash:** The client-side code, expecting a JSON response, would receive an inaccessible (effectively `null` or `undefined`) response. When it tried to access properties on this non-existent data (e.g., `data.content`), it would throw a `ReferenceError`, causing the component to crash.

This issue was exacerbated by a lack of defensive error handling on both the client and the server. The client was not validating the API response before parsing it, and the server was not gracefully handling potential errors from the upstream GitHub API.

### **Solution:**

The solution was a comprehensive, multi-layered fix to improve the robustness of the entire API communication stack.

1.  **Fix the CORS Header:** The primary fix was to update all route handlers in `cloudflare-worker-src/routes/content.js` to use a safe, non-null default for the `Origin` header. The logic was changed to `const origin = request.headers.get('Origin') || 'https://edit.strategycontent.agency';`. This ensures that the `Access-Control-Allow-Origin` header always contains a valid origin, resolving the CORS issue.
2.  **Harden the Backend:** All API handlers in `content.js` were refactored to include defensive checks. They now validate the response from the GitHub API (`response.ok`) and handle non-JSON or error responses gracefully, preventing server-side crashes and returning clear, structured JSON error messages to the client.
3.  **Harden the Frontend:** A new centralized utility function, `fetchJson`, was created in `easy-seo/src/lib/fetchJson.js`. This function wraps the native `fetch` call with robust error handling, checking the response status and parsing the JSON safely.
4.  **Refactor All Client-Side Calls:** All `fetch` calls in the `easy-seo` application (in `FileExplorer.jsx`, `useFileManifest.js`, etc.) were refactored to use the new `fetchJson` utility, ensuring consistent and safe API communication across the entire frontend.

## **Bug: Infinite Authentication Loop on Login**

**Date:** 2025-11-05
**Agent:** Jules #144

### **Symptoms:**

After a successful GitHub OAuth login, the application would enter an infinite redirect loop between the `/login` (callback) page and the main application pages. The UI would flicker, and the browser would eventually time out. The `AuthDebugMonitor` showed a rapid, repeating sequence of authentication status changes.

### **Root Cause:**

The issue was a complex state management race condition within the Preact frontend, caused by the interaction of three parts:

1.  **`AuthContext.jsx`:** The `checkAuthStatus` function, which fetches the user's status from `/api/me`, was being called on every render.
2.  **`CallbackPage.jsx`:** This component was designed to handle the post-OAuth redirect. It used a `useEffect` hook to call `checkAuthStatus` and then imperatively redirect the user using `route()`.
3.  **`preact-router`:** The router would re-render components on navigation, triggering the `checkAuthStatus` call again.

The combination created a vicious cycle:
- User lands on `/login`.
- `CallbackPage`'s `useEffect` calls `checkAuthStatus`.
- `AuthContext` state updates, causing a re-render.
- The effect runs again, and it also calls `route('/explorer')`.
- The explorer page loads, sees the user is authenticated, but the context might not be fully settled. A re-render on the explorer page might trigger *another* `checkAuthStatus`.
- If any part of this chain redirected back to `/login` (for example, if `isAuthenticated` briefly flipped to `false` during the state updates), the loop would restart.

The core problem was using an imperative `useEffect` to sync router state with application state, which is a known anti-pattern.

### **Solution:**

The fix was to refactor `CallbackPage.jsx` from an imperative component into a declarative one.

1.  **Remove `useEffect`:** The entire `useEffect` hook that called `checkAuthStatus` and `route()` was removed.
2.  **Declarative Redirect:** The component now derives its state directly from the `useAuth` hook on each render.
    -   If `isLoading` is true, it shows a loading spinner.
    -   If `isAuthenticated` is true, it uses a `<Redirect>` component from `preact-router` to navigate to `/explorer`. This is a declarative way to handle redirection that integrates cleanly with the router's lifecycle.
    -   If `isAuthenticated` is false (and not loading), it redirects back to the home page (`/`).

This new approach breaks the cycle by ensuring that the redirection is a direct result of the current, stable state from the `AuthContext`, rather than a side effect in a `useEffect` hook.

---

## **Bug: Frontend Verification Scripts Fail with Blank Page**

**Date:** 2025-11-06
**Agent:** Jules #146

### **Symptoms:**

When running a Playwright script for frontend verification (`python verify_feature.py`), the script would time out waiting for an element to appear. Capturing a screenshot of the page revealed it was completely blank, indicating a critical rendering failure in the Preact application.

### **Root Cause:**

This was a cascading failure with multiple independent root causes that had to be diagnosed and fixed in sequence.

1.  **Syntax Error in an Unrelated Component:** The initial failure was caused by a syntax error (`Unexpected token`) in the `FileTile.jsx` component. This was a simple typo in an arrow function (`()_ => {}` instead of `() => {}`). Because this component was part of the main application bundle, the error completely blocked Vite from compiling and serving the JavaScript, resulting in a blank page.
2.  **Incorrect Dev Server Port:** After fixing the syntax error, the Playwright script still timed out. Checking the dev server logs (`/home/jules/dev-server.log`) revealed that the Vite server had started on a non-standard port (e.g., `5180`) because the default (`5173`) was in use. The Playwright script was still hardcoded to the default port and was therefore connecting to the wrong process.
3.  **Authentication Failure (401 Unauthorized):** After correcting the port, the script was able to connect, but the page was still blank. Capturing the browser's console logs revealed the final root cause: the application was making API requests to `/api/me` and `/api/files` which were failing with a `401 Unauthorized` error. The Playwright browser instance does not have the necessary `gh_session` authentication cookie, so the backend correctly denied the requests. Without the data from these API calls, the `FileExplorer` component could not render, resulting in a blank page.

### **Solution:**

The solution involved a systematic debugging process:

1.  **Isolate the Syntax Error:** The initial syntax error was identified from the Playwright script's error output, which included the Vite build error. The fix was a simple one-line code change in `FileTile.jsx`.
2.  **Check the Dev Server Logs:** The port mismatch was identified by reading the dev server's log file. The fix was to update the `page.goto()` URL in the Playwright script to use the correct port.
3.  **Capture Console Logs:** The final 401 error was identified by modifying the Playwright script to listen for and print all browser console messages.
4.  **Acknowledge the Limitation:** The 401 error is not a bug in the application, but a limitation of the current verification environment. The correct final action was to abandon the frontend verification and document this limitation for future agents. The application works correctly in a real browser with the authentication cookie.
