# Recovery Guide: Debug Diary & Solutions

This document serves as a debug diary for the `easy-seo` project. It records complex, non-obvious bugs and their solutions to aid future developers in troubleshooting.

---

## **Bug: 500 Error on `/api/trigger-build` and 404 Error on `/api/page-json/update`**

**Date:** 2025-11-26
**Agent:** GitHub Copilot

### **Symptoms:**

API calls from the frontend were returning unexpected errors:
- `/api/trigger-build` → **500 Internal Server Error**
- `/api/page-json/update` → **404 Not Found** (intermittent)

The browser console showed:
```
[fetchJson] An HTTP error occurred: { url: "/api/trigger-build", status: 500, responseData: {…} }
```

However, other endpoints like `/api/me`, `/api/repos`, and `/api/files` worked correctly.

### **Root Cause Analysis:**

After investigation, the following findings were identified:

#### **1. `/api/trigger-build` 500 Error:**
The most likely cause is a **missing `CLOUDFLARE_DEPLOY_HOOK` environment variable**. The handler in `cloudflare-worker-src/routes/content.js` (lines 113-117) explicitly returns a 500 error if this secret is not configured:

```javascript
if (!env.CLOUDFLARE_DEPLOY_HOOK) {
  const errorMessage = 'Configuration Error: The CLOUDFLARE_DEPLOY_HOOK secret is missing...';
  return safeJsonResponse({ message: errorMessage }, 500, origin);
}
```

**How to verify:** Visit `https://edit.strategycontent.agency/_debug/version` in your browser. If `hasDeployHook` is `false`, the secret is not configured.

**Solution:** 
1. Go to Cloudflare Dashboard → Workers & Pages → [Your Worker] → Settings → Variables
2. Add a new variable named `CLOUDFLARE_DEPLOY_HOOK` with type "Encrypt" (secret)
3. Set the value to your Cloudflare Pages deploy hook URL (format: `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/{hook-id}`)

#### **2. `/api/page-json/update` 404 Error (Intermittent):**

This 404 may be caused by:
- **Duplicate API calls:** The sync flow calls both `/api/page-json/update` AND then `triggerBuild()` which calls `/api/trigger-build`. If the second call fails immediately after the first succeeds, it may appear as a 404 on the wrong endpoint in console logs.
- **Worker deployment mismatch:** The deployed worker may not match the repository code.

**How to verify:** 
1. Check `/_debug/version` to confirm the worker has the expected routes listed
2. Watch browser DevTools Network tab to see the exact sequence of API calls
3. Check Cloudflare Worker logs (Dashboard → Workers → [Worker] → Logs → Real-time logs)

### **Diagnostic Endpoints Added:**

A new debug endpoint was added to help diagnose these issues:

**`/_debug/version`** - Returns:
```json
{
  "version": "2025-11-26-debug-v1",
  "routes": ["/api/page-json/update", "/api/trigger-build", ...],
  "hasDeployHook": true/false,
  "timestamp": "ISO timestamp"
}
```

⚠️ **Note:** This debug endpoint should be removed or secured before production deployment.

### **Enhanced Logging:**

Additional logging was added to help trace API issues:

1. **Router logging:** Every request now logs `[ROUTER] METHOD /path` to Cloudflare Worker logs
2. **fetchJson logging:** Enhanced error logging now shows full error details including status, statusText, and response body (truncated for security)
3. **ContentEditorPage logging:** Sync and build operations now log timestamps and sanitized payload info

### **Solution Summary:**

1. **For 500 on trigger-build:** Configure `CLOUDFLARE_DEPLOY_HOOK` secret in Cloudflare dashboard
2. **For 404 issues:** Verify worker deployment using `/_debug/version` endpoint
3. **For debugging:** Check browser console for enhanced error logs and Cloudflare Worker logs for server-side traces

---

## **Bug: Infinite Autosave Loop on `contentEditable` Element**

**Date:** 2025-11-16
**Agent:** Jules #167

### **Symptoms:**

In the `ContentEditorPage`, any user input would trigger a continuous, rapid-fire sequence of autosave calls, and the "save status" dot would flicker endlessly. This happened both on initial page load and during user typing.

### **Root Cause:**

This was a subtle and complex bug with multiple contributing factors, ultimately boiling down to a race condition between Preact's state updates and the browser's handling of `contentEditable` elements.

1.  **Save-on-Load:** An early attempt to fix the bug involved a `useEffect` that watched for content changes. This was an anti-pattern because the initial asynchronous loading of content would trigger this `useEffect`, causing an unwanted save immediately on page load.
2.  **Infinite Re-render Loop:** The core issue was a missing guard in the `onInput` handler. Calling `setContent` on every input event caused a re-render. The re-render would update the `innerHTML` of the `contentEditable` div. The browser would then interpret this programmatic `innerHTML` change as a *new* input event, firing the `onInput` handler again and creating an infinite loop.
3.  **Redundant Saves:** Even after fixing the loop, the save status dot would flicker because the debounced autosave would fire even if the content hadn't changed since the last *successful save*.

### **Solution:**

The final, robust solution required a multi-layered guard system to address each of these issues independently.

1.  **Programmatic-Write Guard (`isProgrammaticUpdateRef`):** A `useRef` boolean flag is set to `true` immediately before the application programmatically sets the `editorRef.current.innerHTML` on initial content load. It is set back to `false` immediately after. The `onInput` handler now checks this flag at the very beginning and returns immediately if it's true, effectively ignoring the input event caused by the initial render.
2.  **Last-Accepted-Content Guard (`lastAcceptedContentRef`):** A second `useRef` is used to track the last content string that was accepted by the `onInput` handler. The handler now compares the current `innerHTML` to this ref (`if (newContent !== lastAcceptedContentRef.current)`). This prevents race conditions where multiple input events might fire before the component has had a chance to re-render with the new `content` state.
3.  **Last-Saved-Content Guard (`lastSavedContentRef`):** A third `useRef` is used to track the content of the last successful save. Inside the debounced `autosaveCallback`, the very first step is now a guard that checks if the incoming content is identical to the last saved content (`if (newContent === lastSavedContentRef.current)`). If they are the same, the function returns immediately, preventing a redundant `localStorage` write and the associated UI flicker.

This combination of guards makes the editor component stable, efficient, and free of race conditions.

---

## **Bug: Infinite Autosave Loop Triggered by Preview Iframe**

**Date:** 2025-11-14
**Agent:** Jules #165

### **Symptoms:**

In the `ContentEditorPage`, any user input would trigger an initial autosave, but this would be followed by a continuous, rapid-fire sequence of additional autosave calls, even with no further user interaction. This was visible in the browser's console logs and network tab, showing repeated calls to `mockApi.saveDraft`.

### **Root Cause:**

The issue was a classic feedback loop caused by insecure `postMessage` communication between the editor and its preview iframe.

1.  **Editor Sends Patch:** On autosave, the editor would send a `preview-patch` message to the iframe.
2.  **Iframe Responds:** The preview iframe would receive the patch and, in addition to acknowledging it, would also send other unrelated messages back to the parent (e.g., messages about its internal state, like scroll position or scale).
3.  **Editor Reacts Indiscriminately:** The editor's `window.addEventListener('message', ...)` was not filtering incoming messages. It was reacting to *any* message from the iframe.
4.  **Loop:** An unrelated message from the iframe would be misinterpreted by the editor's logic, causing a state change that would re-trigger the `useEffect` hook responsible for scheduling an autosave, thus restarting the cycle.

### **Solution:**

The fix was to implement a robust, idempotent messaging protocol for iframe communication, treating it with the same caution as a network API.

1.  **Readiness Handshake:** The editor now waits for a `preview-ready` message from the iframe before attempting to send any data. A `previewReady` ref is used to track this state.
2.  **Unique Message IDs:** Each `preview-patch` message sent from the editor now includes a unique, timestamp-based ID (e.g., `{ id: 'p-1678886400000', ... }`). The ID of the last sent message is stored in a `lastSentPreviewId` ref.
3.  **Strict Message Filtering:** The editor's `onMessage` handler now explicitly checks `data.type` and only acts on known, expected types (`preview-ready`, `preview-ack`). All other message types are ignored.
4.  **ACK Validation:** When the editor receives a `preview-ack` message, it compares the `id` in the message with the `lastSentPreviewId`. If they match, the ACK is considered valid and the communication cycle for that update is complete. If they do not match, the ACK is ignored, preventing duplicate or out-of-order messages from causing issues.

This pattern breaks the feedback loop by ensuring the editor only acts on specific, expected, and verifiable messages from the preview iframe, making the communication channel stable and predictable.

---

## **Bug: Excessive Re-Renders Causing Performance Issues**

**Date:** 2025-11-14
**Agent:** Jules #164

### **Symptoms:**

The application was experiencing performance issues, particularly in the `ContentEditorPage`, manifesting as a "looping" console output and potential UI jitter. Logs from `App.jsx` and `EditorHeader.jsx` were appearing repeatedly, indicating that the entire component tree was re-rendering frequently and unnecessarily.

### **Root Cause:**

The root cause was a series of redundant `setState` calls in the `ContentEditorPage` component that were being triggered by various events, even when the state value had not actually changed.

1.  **`window.matchMedia` Listener:** The `useEffect` hook that listened for changes to the viewport size was calling `setIsMobile(e.matches)` on every `change` event, regardless of whether the `matches` boolean was different from the current state.
2.  **`onInput` Handler:** The `handleEditorInput` function was calling `setContent(e.currentTarget.innerHTML)` on every `input` event from the `contentEditable` div, even if the user's action (e.g., pressing an arrow key) did not change the inner HTML.

Each of these unnecessary `setState` calls would trigger a full re-render of the `ContentEditorPage` and its children, leading to the observed performance degradation and console spam.

### **Solution:**

The fix was to introduce "state guards" to prevent `setState` from being called if the new value is the same as the current value.

1.  **Guarded `matchMedia` Listener:** The `onChange` handler was updated to compare the incoming `e.matches` value with the current `isMobile` state before calling `setIsMobile`.

    ```javascript
    const onChange = (e) => {
      const newVal = !!e.matches;
      // guard: only update when changed
      setIsMobile(prev => {
        if (prev === newVal) {
          console.log('[ContentEditor] isMobile change event ignored (no change).');
          return prev;
        }
        console.log('[ContentEditor] isMobile changed ->', newVal);
        return newVal;
      });
    };
    ```

2.  **Guarded Input Handler:** The `handleEditorInput` function was updated to compare the current `innerHTML` of the editor with the current `content` state before calling `setContent`.

    ```javascript
    function handleEditorInput(e) {
      const val = e.currentTarget.innerHTML;
      if (val === content) {
        return; // avoid noisy setState
      }
      setContent(val);
    }
    ```

3. **Mounted Ref Guard:** A `mounted` ref was added to the component to prevent state updates from promises (`fetchPageJson`) that might resolve after the component has unmounted, which is another potential source of errors and instability.

---

## **Bug: Missing gh_session Token Causes Authentication Failures**

**Date:** 2025-11-09
**Agent:** GitHub Copilot

### **Symptoms:**

Multiple pages in the application were failing with authentication errors. Specifically:
- Repository selection page showing "No Repositories Found" despite user having repos
- File explorer page showing authentication errors or empty file lists
- Search functionality not working
- Context menu on file tiles not appearing
- Create button not opening modal

The browser's network tab showed that API requests to protected endpoints like `/api/repos`, `/api/files`, etc. were returning `401 Unauthorized` responses, even though the user had successfully logged in via GitHub OAuth.

### **Root Cause:**

The root cause was that the `gh_session` cookie was not being sent with API requests from the browser. This cookie is set by the backend after successful OAuth authentication and contains the GitHub access token.

The issue was in the `fetchJson` utility function (`src/lib/fetchJson.js`). By default, the browser's `fetch` API does NOT send cookies with cross-origin requests, even to the same domain. You must explicitly set `credentials: 'include'` in the fetch options.

While some API calls in the codebase were explicitly passing `credentials: 'include'`, many were not, leading to inconsistent authentication behavior.

### **Solution:**

The fix was to update the `fetchJson` utility to include `credentials: 'include'` by default:

```javascript
export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include', // Always include cookies (gh_session token)
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  // ... rest of function
}
```

This ensures that ALL API calls made through this utility automatically send the authentication cookie, fixing the authentication issues across the entire application.

As a cleanup step, all explicit `credentials: 'include'` parameters were removed from individual API calls since they're now redundant.

### **Additional Fixes:**

While investigating, several related issues were also fixed:
1. **Context Menu:** The `ContextMenu` component was receiving incorrect props (`file`, `onDelete`) instead of the expected `options` array.
2. **Create Modal:** The create file/folder logic was split between `FileExplorer` and `FileExplorerPage`, causing state management issues. This was refactored to properly flow through the page component.

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
