# Authentication Flow: Debugging and Solutions

This document provides a detailed history of the authentication flow bugs, the steps taken to diagnose them, and the final, correct implementation. It is intended as a guide for future developers to prevent regressions.

---

## The Problem: The Infinite Authentication Loop

The core issue was a persistent, infinite loop immediately after a user successfully logged in via GitHub. This manifested in several ways throughout the debugging process:

1.  **Initial State:** An infinite loop of `/api/me` requests returning `401 Unauthorized`.
2.  **Intermediate State:** An infinite loop of `/api/me` and `/api/repos` requests returning `200 OK`, but the UI remained stuck on the login callback page.
3.  **Final State:** The loop was fixed, but navigation away from the callback page was silently failing.

This document breaks down each stage of the problem, the fix, and the critical learnings.

---

### Part 1: The `401 Unauthorized` Loop

**Symptoms:**
- After GitHub login, the user is redirected to the app.
- The browser's network tab shows a continuous stream of requests to `/api/me`.
- Each request fails with a `401 Unauthorized` error.
- This was sometimes masked by a `429 Too Many Requests` error when the backend rate limiter was triggered.

**Investigation & Root Cause:**
The `401` error indicated that the `gh_session` cookie, which should contain the user's GitHub access token, was not being sent with the `/api/me` requests. This was traced to several interconnected issues:

1.  **Incorrect Cookie Domain:** The `Set-Cookie` header was being configured with `Domain=edit.strategycontent.agency`. Modern browsers are strict about this; for a cookie to be sent to subdomains (or in more complex scenarios), it often requires a leading dot (e.g., `.strategycontent.agency`).
2.  **Incorrect `SameSite` Attribute:** The `SameSite` attribute was initially set to `None`, which is intended for cross-site requests. However, this often requires the `Secure` flag and can be rejected by browsers in same-site contexts. It was later determined that `Lax` was more appropriate.
3.  **Fragile Backend Auth Logic:** The `validateAuth` function in the Cloudflare worker was using a `throw new Response(...)` pattern. This is an anti-pattern that can make control flow difficult to reason about and debug.
4.  **Inconsistent Frontend Fetch Calls:** Not all `fetch` calls in the frontend were being made with the `credentials: 'include'` option, which is mandatory for the browser to send cookies with a request.

**Solution Part 1:**
- **Refactor `validateAuth`:** The function in `cloudflare-worker-src/utils/auth.js` was changed to return a result object (`{ success, token, response }`) instead of throwing. The `withAuth` middleware was updated to handle this.
- **Use `fetchJson` Wrapper:** The frontend `AuthContext.jsx` was updated to use the existing `fetchJson` utility, which guarantees `credentials: 'include'` is always set.

---

### Part 2: The `200 OK` Loop

**Symptoms:**
- After implementing the first set of fixes, the `401` errors disappeared.
- The `/api/me` and `/api/repos` endpoints now returned `200 OK`.
- However, the infinite loop persisted. The app was still stuck on the login callback page (`/?login=success`), making successful API calls over and over.

**Investigation & Root Cause:**
This pointed to a new problem: the authentication was now working, but there was a state management issue in the frontend causing the application to re-trigger the authentication check on every render.

1.  **React 18 Strict Mode & `useEffect`:** React 18's Strict Mode intentionally double-mounts components in development to expose bugs related to side effects. The `useEffect` hook in `AuthContext.jsx` was re-running, causing the auth check to fire twice on initial load.
2.  **Race Condition in `CallbackPage.jsx`:** The `CallbackPage.jsx` component, which is responsible for handling the `?login=success` redirect, was *also* calling the `checkAuthStatus` function. This created a race condition where both the global `AuthContext` and the page-level component were trying to manage the same authentication state, leading to an unpredictable and infinite loop.

**Solution Part 2:**
- **Prevent Re-initialization in `AuthContext`:** A `useRef` flag (`hasInitialized`) was added to `AuthContext.jsx`. The `useEffect` hook was updated to only run the `checkAuthStatus` function if `hasInitialized.current` was `false`, ensuring the global auth check only ever runs once on the initial application load.
- **Simplify `CallbackPage.jsx`:** The redundant and problematic `checkAuthStatus` call was removed from `CallbackPage.jsx`. The component was refactored to be purely reactive to the state provided by `AuthContext`. It now simply waits for `isLoading` to be `false` and `isAuthenticated` to be `true` before redirecting.

---

### Part 3: The Silent Navigation Failure

**Symptoms:**
- After fixing the state management loops, the infinite network requests stopped.
- The application would load, perform one successful auth check, and then... nothing.
- It remained stuck on the `/?login=success` URL, even though the console logs clearly showed that the redirect logic (`route('/repo-select', true)`) was being executed.

**Investigation & Root Cause:**
The final bug was the most subtle. The logic was correct, but the navigation itself was failing silently. The `route()` function from `preact-router` was being called, but it was not triggering a navigation. This is likely due to a timing issue where the `route()` function is called before the `Router` component has fully initialized and its context is available to the rest of the application.

**Solution Part 3:**
- **Force Native Browser Navigation:** The `route()` function in `CallbackPage.jsx` was replaced with a direct call to the browser-native `window.location.href = '/repo-select'`. This is a more forceful and reliable method that bypasses the Preact Router's context, guaranteeing that the navigation occurs. This results in a full page load, which is acceptable and even desirable in this post-login context, as it ensures a clean application state.

---

## 🛑 Critical Code Zones: Do Not Edit Without Understanding!

The following code snippets represent the final, stable solution. Editing them without a full understanding of the issues described above will likely re-introduce the infinite loop bugs.

### 1. Backend: Cookie Generation (`cloudflare-worker-src/routes/auth.js`)

```javascript
// Removed Domain attribute - let browser set it automatically
const cookieString = `gh_session=\${accessToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`;
```

**WARNING:**
- **DO NOT** add a `Domain` attribute to this string. The authentication flow is same-site, and letting the browser set the domain to the exact hostname (`edit.strategycontent.agency`) proved to be the most reliable solution. Adding `Domain=.strategycontent.agency` caused browsers to reject or ignore the cookie.
- **DO NOT** change `SameSite=Lax` to `None`. For a same-domain context, `Lax` is the correct and most compatible setting. `None` is for cross-domain scenarios and caused issues.

### 2. Frontend: Global Auth Check (`easy-seo/src/contexts/AuthContext.jsx`)

```javascript
export const AuthProvider = ({ children }) => {
  // ... state declarations
  const hasInitialized = useRef(false); // NEW: Track initialization

  // ...

  useEffect(() => {
    // Only run once on initial mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      checkAuthStatus();
    }
  }, []); // Empty deps - only run on mount/unmount
```

**WARNING:**
- The `if (!hasInitialized.current)` guard is **CRITICAL**. It prevents React 18's Strict Mode from running the authentication check twice on initial load. Removing this will re-introduce the "200 OK" infinite loop.
- The `useEffect` dependency array **MUST** be empty (`[]`). Adding any dependencies will cause this effect to re-run on state changes, leading to an infinite loop.

### 3. Frontend: Login Redirect Handler (`easy-seo/src/pages/CallbackPage.jsx`)

```javascript
export function CallbackPage(props) {
  const { isAuthenticated, isLoading } = useAuth();
  const params = new URLSearchParams(location.search || '');
  const loginParam = params.get('login');

  useEffect(() => {
    if (isLoading) return;

    if (loginParam === 'success' && isAuthenticated) {
      // USE NATIVE NAVIGATION INSTEAD OF route()
      window.location.href = '/repo-select';
      return;
    }
    // ...
  }, [isAuthenticated, isLoading, loginParam]);
```

**WARNING:**
- This component **MUST NOT** call `checkAuthStatus()`. Its only job is to react to the state provided by `AuthContext`. Calling the auth check here creates a race condition and will re-introduce an infinite loop.
- The navigation **MUST** be done with `window.location.href`. Using the `preact-router` `route()` function was proven to fail silently in this specific lifecycle context. Changing this back to `route()` will re-introduce the bug where the user is stuck on the callback page.
