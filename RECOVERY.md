# Recovery Guide: Debug Diary & Solutions

This document serves as a debug diary for the `easy-seo` project. It records complex, non-obvious bugs and their solutions to aid future developers in troubleshooting.

---

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
