# Project Status: Fully Functional

After a comprehensive debugging process, the GitHub OAuth login and subsequent application flow are now fully functional. This document details the final, working architecture and provides a guide for future troubleshooting.

---

# GitHub OAuth Login for React SPA

This project implements a secure GitHub OAuth2 login flow for a React Single-Page Application (SPA). It uses a Cloudflare Worker as a backend proxy to handle the token exchange securely, avoiding exposure of the client secret on the frontend.

## The Problem and The Solution

The primary challenge in implementing this flow was a subtle but critical mismatch between the frontend and backend authentication protocols. Previous attempts used the **PKCE (Proof Key for Code Exchange)** flow, which is designed for native apps or SPAs *without* a secure backend. However, because this architecture uses a secure Cloudflare Worker, the correct and more robust approach is the **standard OAuth 2.0 Web Application Flow**.

This codebase has been refactored to correctly implement the standard Web Application Flow.

**Key Changes:**
1.  **Frontend Protocol:** The React application (`App.jsx`, `Callback.jsx`) no longer uses PKCE. Instead, it uses a `state` parameter for CSRF protection.
2.  **Backend Protocol:** The corresponding backend logic (provided in `cloudflare-worker-code.js`) was written to handle this standard flow, exchanging the temporary `code` and the `client_secret` for a valid `access_token`.
3.  **Secure Session Management:** The backend worker establishes a user session by setting a secure, `HttpOnly` cookie containing the access token. This is the recommended practice for SPAs with a backend, as it prevents the token from being accessed by client-side JavaScript, mitigating XSS risks.

---

## Architecture Overview

The authentication process works as follows:

1.  **Login Initiation (`App.jsx`):** The user clicks "Login with GitHub". A popup window is opened, directing the user to the GitHub authorization URL. A randomly generated `state` value is stored in `sessionStorage` and included in the URL.
2.  **User Authorization (GitHub):** The user approves the authorization request on GitHub.
3.  **Callback (`Callback.jsx`):** GitHub redirects the user's popup to the `redirect_uri` (e.g., `/callback`). This component retrieves the `code` and `state` from the URL parameters.
4.  **State Verification:** The `state` from the URL is compared with the `state` from `sessionStorage`. If they match, the flow continues. If not, it's aborted to prevent CSRF attacks.
5.  **Code-for-Token Exchange (Backend Worker):** `Callback.jsx` sends the `code` to the `/api/token` endpoint on the Cloudflare Worker.
6.  **Secure Token Handling (Backend Worker):** The worker receives the `code`, adds the `client_id` and `client_secret` (stored as secrets in Cloudflare), and sends a `POST` request to GitHub to get the `access_token`.
7.  **Session Creation (Backend Worker):** Upon receiving the `access_token`, the worker sets it in a secure, `HttpOnly` cookie (`gh_session`) in the user's browser. This cookie is scoped to the worker's domain.
8.  **Confirmation (`Callback.jsx` -> `App.jsx`):** The worker sends a success response to `Callback.jsx`. `Callback.jsx` then uses `window.opener.postMessage` to notify the main application window that login was successful.
9.  **Fetch User Data (`App.jsx`):** The main app, upon receiving the success message, makes a `GET` request to the `/me` endpoint on the Cloudflare Worker. Because this request is sent with `credentials: 'include'`, the browser automatically attaches the `gh_session` cookie.
10. **Authenticated API Call (Backend Worker):** The worker's `/me` endpoint reads the token from the cookie and uses it to make an authenticated request to the GitHub API to fetch the user's profile, which it then returns to the frontend.

---

## Technical Details of the Cloudflare Worker

The reference implementation is in `cloudflare-worker-code.js`. It is designed to be deployed as a Cloudflare Worker.

### Required Environment Variables:
The worker requires the following secrets to be configured in the Cloudflare dashboard:
-   `OAUTH_GITHUB_CLIENT_ID`: Your GitHub OAuth App's Client ID.
-   `OAUTH_GITHUB_CLIENT_SECRET`: Your GitHub OAuth App's Client Secret.

### Endpoints:
-   **`POST /api/token`**: Expects a JSON body with a `code` property. Handles the OAuth token exchange and sets the session cookie.
-   **`GET /api/me`**: Reads the session cookie and uses the token to fetch and return the authenticated user's GitHub profile.
-   **`GET /api/repos`**: Fetches the authenticated user's repositories from GitHub.
-   **`GET /api/files`**: Fetches the contents of a directory in a given repository. Requires query parameters `repo` and `path`.
-   **`GET /api/file`**: Fetches the content of a single file. Requires query parameters `repo` and `path`.
-   **`POST /api/file`**: Creates or updates a file in a given repository.
-   **`DELETE /api/file`**: Deletes a file in a given repository.
-   **`OPTIONS /*`**: Handles CORS preflight requests from the browser, which are necessary for cross-domain communication between the SPA and the worker.

### Cookie Security:
The session cookie (`gh_session`) is set with the following flags:
-   `HttpOnly`: Prevents access from client-side JavaScript.
-   `Secure`: Ensures the cookie is only sent over HTTPS.
-   `SameSite=None`: Required for the browser to send the cookie in cross-origin requests (i.e., from your SPA's domain to the worker's domain). Note: `SameSite=None` also requires the `Secure` flag.
-   `Path=/`: Makes the cookie available across the entire worker domain.
-   `Max-Age`: Sets an expiration time for the session (e.g., 1 day).

---

## Deployment & Troubleshooting

After making code changes, you may still encounter errors if the new code is not yet deployed or if the GitHub App configuration is incorrect.

### Issue: Secrets (like Client ID) Disappear After Deploy
-   **Symptom:** You set secrets like `OAUTH_GITHUB_CLIENT_ID` in the Cloudflare dashboard, but they are gone after you deploy the worker.
-   **Cause:** By default, Wrangler treats the `wrangler.toml` file as the absolute "source of truth". If secrets are not defined in the file, Wrangler deletes them from the dashboard on deploy.
-   **Solution:** Add `keep_vars = true` to the top-level of your `wrangler.toml` file. This tells Wrangler to preserve variables and secrets set in the UI.

### Issue: "redirect_uri is not associated with this application"
This error from GitHub means that the callback URL in your GitHub OAuth App settings does not exactly match the one the application is using.

-   **Solution:**
    1.  Go to your [GitHub OAuth App settings](https://github.com/settings/developers).
    2.  Find the field named **"Authorization callback URL"**.
    3.  Ensure it contains this **exact** value: `https://edit.strategycontent.agency/callback`
    4.  It must match perfectly. There can be no typos and **no slash at the end**.

### Issue: Login still fails, or old behavior is observed
If you see behavior consistent with old versions of the code (e.g., a `code_challenge` parameter appearing in the GitHub URL), it means your browser is still running the old, cached frontend code.

-   **Solution:**
    1.  **Build the project:** Navigate to the `react-login` directory in your terminal and run `npm run build`.
    2.  **Deploy to Cloudflare Pages:** This will create a `dist` (or `build`) folder. You must upload the contents of this folder to your Cloudflare Pages site that powers `edit.strategycontent.agency`.
    3.  **Clear Browser Cache:** After deploying, it's a good practice to clear your browser's cache or perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) on your site to ensure you are loading the latest version.

### Issue: Client ID Mismatch
The frontend application code reads its GitHub Client ID from an environment variable set by the hosting platform (Cloudflare Pages). If this variable does not exactly match the Client ID used by the backend worker and configured in GitHub, the login will fail.

-   **Solution:**
    1.  Go to your **Cloudflare Pages** settings for your site (`edit.strategycontent.agency`).
    2.  Navigate to **Settings > Environment variables**.
    3.  Ensure you have a variable named `VITE_GITHUB_CLIENT_ID`.
    4.  Ensure its value **exactly matches** the `OAUTH_GITHUB_CLIENT_ID` used by your worker and configured in your GitHub OAuth App (e.g., `Ov23li6LEsxbtoV7ITp1`).
    5.  If you make a change, you must **re-deploy** the Pages site for the new variable to take effect.

---

## Debugging

This project includes `vConsole`, a powerful on-screen debugging tool, to help diagnose issues directly on any device, especially mobile.

### Activating the On-Screen Console

To activate the debugger, append the `?debug=true` query parameter to the URL.

-   **Example:** `https://edit.strategycontent.agency/?debug=true`

When activated, a green "vConsole" button will appear in the bottom-right corner of the screen. Tapping it will open a full-featured console with tabs for logs, network requests, storage, and more.

### Key Feature: Debugging the Popup

A critical feature is that `vConsole` is also injected into the GitHub login popup window. This allows you to see console logs and network requests that are happening *inside* the popup, which is essential for debugging the token exchange process. When the popup appears, `vConsole` will be active there as well.

---

## A Note on Authentication Architecture (Standard Web Flow vs. PKCE)

There are two primary, secure methods for handling OAuth2 authentication for an application like this: the Standard Web Application Flow and the PKCE flow. It is critical that the frontend and backend are using the same method.

### 1. Standard Web Flow (This Project's Implementation)

*   **How it Works:** This is the industry-standard flow for applications with a **secure backend** (like a Cloudflare Worker). The backend proves its identity to GitHub using a `client_secret` that is never exposed to the browser. Security is guaranteed because the secret is stored and used exclusively on the server.
*   **Recommendation:** This is the recommended path for this project. The frontend code in this repository has been built to use this flow, and it should be paired with the matching backend worker provided in `cloudflare-worker-code.js`.

### 2. PKCE (Proof Key for Code Exchange) Flow

*   **How it Works:** This flow was designed for applications **without a secure backend** (e.g., mobile apps, pure SPAs). It adds an extra client-side verification step to compensate for the absence of a server-side secret. The `auth-worker` directory in the parent repository contains a worker that uses this flow.
*   **Security:** Both flows are considered highly secure when implemented correctly. The choice depends on the application's architecture. Since this project has a secure worker, using the Standard Web Flow is a more direct and traditional architecture.

### The Most Important Thing: Consistency

The login will fail if the frontend and backend are using different methods.

*   This `react-login` frontend speaks the **Standard Flow**.
*   The `auth-worker/index.js` in the root directory speaks **PKCE**.
*   The provided `cloudflare-worker-code.js` speaks the **Standard Flow**.

To ensure success, the frontend in this directory must be paired with a backend that also uses the Standard Web Flow.

---

## Developer & Agent Collaboration Notes

To ensure smooth collaboration and prevent accidental data loss, please adhere to the following guidelines:

*   **Deletion Policy:** Do not delete any files, or remove any content from this `README.md`, without explicit confirmation from the project owner.
*   **Branch Naming:** To improve traceability, all branches should follow the naming convention `yymmdd-descriptive-name` (e.g., `250916-update-readme-guidelines`).
