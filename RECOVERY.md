# RECOVERY.md: The Debug Diary

This document is a living log of common failure modes, known bugs, and the patterns used to diagnose and resolve them. Before starting a deep debugging session, consult this diary. If you solve a new or complex bug, you **must** add your findings here.

---

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

## 🔧 How to Verify Subsystems

-   **Cloudflare Worker Deployment:**
    1.  After a deployment, do not assume the new code is live.
    2.  Run `npx wrangler tail` in your terminal.
    3.  Perform an action in the application that triggers the worker. You should see log output from the new version, confirming it is active.
-   **GitHub API Token (`DEV_MODE`):**
    1.  To test functionality that requires elevated permissions (like accessing a private repository), you can enable `DEV_MODE`.
    2.  In your `wrangler.toml`, set `DEV_MODE = true`.
    3.  Ensure you have a `GITHUB_TOKEN` secret configured in your Cloudflare Worker environment with the necessary repository permissions. The worker will then use this token instead of the user's session cookie.
