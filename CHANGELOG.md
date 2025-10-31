# Change Log

This document records significant changes, architectural decisions, and critical bug fixes for the `easy-seo` application. All developers (human or AI) should review this log before beginning work to understand the current context and history of the project.

---

### **2025-10-31**

**Author:** Jules #136

**Change:** Implemented critical security fixes to the Cloudflare worker to create a secure global authentication shell. This resolves persistent, intermittent authentication failures and closes a significant vulnerability.

**Context & Learnings:**

1.  **Disabled `DEV_MODE` Vulnerability (Security):**
    *   **Problem:** The Cloudflare worker had a `DEV_MODE` flag in `wrangler.toml` that, when enabled, bypassed all cookie-based authentication for certain API endpoints (e.g., `/api/get-file-content`). This created a major security hole and caused inconsistent behavior between development and production environments.
    *   **Solution:** I permanently set `DEV_MODE = "false"` in `wrangler.toml` and removed the corresponding bypass logic from the worker code. All API endpoints now consistently enforce the same cookie-based authentication, making `getAuthenticatedToken` the single source of truth.

2.  **`SameSite` Cookie Policy Fix (Authentication):**
    *   **Problem:** The `gh_session` authentication cookie was being set with `SameSite=Lax`. This is the default in many browsers, but it prevents the cookie from being sent on cross-origin requests, such as the redirect that occurs after the GitHub OAuth flow. This was the root cause of the intermittent `401 Unauthorized` errors on the `/api/me` endpoint.
    *   **Solution:** I modified the `handleGitHubCallback` function in `cloudflare-worker-code.js` to explicitly set the cookie with `SameSite=None; Secure`. This ensures the cookie is reliably sent on all subsequent API requests, stabilizing the login process.

**Reflection:**

*   **Most Challenging Part:** The most challenging aspect was understanding the subtle but critical interaction between the `DEV_MODE` flag and the `SameSite` cookie policy. The intermittent nature of the `401` errors was a classic sign of a race condition or a browser policy issue, which led me to investigate the cookie configuration as the primary suspect.
*   **Key Learning:** Security cannot be an afterthought or have "development-only" exceptions. A feature like `DEV_MODE` that bypasses the core security model is a significant vulnerability. All authentication and authorization logic must be centralized and consistently applied.
*   **Advice for Next Agent:** When debugging authentication issues, always check the browser's developer tools (Network tab) to see if the `Cookie` header is being sent with your API requests. If it's missing, the `SameSite` policy is almost always the reason. Also, be wary of any configuration that changes the security model between environments.

### **2025-10-30 (Handoff)**

**Author:** Jules #135

**Change:** Performed a major refactor of the application's authentication system to be global and more secure. Implemented a feature-rich, on-screen debug monitor. Fixed a series of critical bugs related to build stability and the authentication flow.

**Context & Learnings:**

1.  **Global Authentication System (Architectural Shift):**
    *   **Problem:** The application's authentication was previously handled by individual components making API calls. This led to race conditions, stale state, and an authentication loop where users were redirected from the repository selection page back to the login page.
    *   **Solution:** I implemented a global authentication system using a Preact Context (`AuthContext.jsx`).
        *   An `AuthProvider` now wraps the entire application, managing a global state (`isAuthenticated`, `user`, `isLoading`).
        *   A `ProtectedRoute` component now wraps all authenticated routes, centralizing access control and redirecting unauthenticated users.
        *   The `LoginPage` was updated to explicitly trigger a refresh of the global auth state after a successful login, resolving the stale state and fixing the redirect loop.

2.  **Global `AuthDebugMonitor` (New Feature):**
    *   **Problem:** A lack of visibility into the application's internal state, API calls, and auth flow made debugging difficult.
    *   **Solution:** I created and integrated a new `AuthDebugMonitor.jsx` component.
        *   It is rendered at the application's root (`App.jsx`) to be available on all pages, including the login screen.
        *   It automatically intercepts and logs all `fetch` requests and `localStorage` operations.
        *   It provides a global `window.authDebug` API for adding custom logs from any component.
        *   It starts minimized as a bug icon and can be expanded for detailed inspection, filtering, and exporting of logs.

3.  **Repository Selection Bug (Silent API Failure):**
    *   **Problem:** The repository selection page would get stuck, showing a loading state indefinitely. The backend (`/api/repos`) was returning a `200 OK` status with an empty array `[]` even when the upstream GitHub API call failed, masking the real error.
    *   **Solution:**
        *   I modified the Cloudflare worker (`cloudflare-worker-code.js`) to stop catching errors silently. It now forwards the actual error message and status code from the GitHub API to the frontend.
        *   I updated the frontend (`RepoSelector.jsx`) to correctly parse and display these more detailed error messages, providing clear feedback to the user.

4.  **Build Failures (Dependency & Path Issues):**
    *   **Problem:** The Cloudflare deployment was failing due to a missing `lucide-preact` dependency that was required by the new `AuthDebugMonitor`. A significant amount of time was also lost to build failures caused by incorrect file paths during development.
    *   **Solution:** The missing dependency was added to `package.json`. The path issues were a result of typos during file creation, which is a critical lesson in carefulness.

**Reflection:**

*   **Most Challenging Part:** Diagnosing the authentication loop was the most complex part of this task. The debugger logs were essential in revealing the stale state and the race condition between the login process and the rendering of the protected routes.
*   **Key Learning:** Global state management for authentication is not optional in a single-page application; it's a requirement for stability. Attempting to manage auth on a per-page or per-component basis is prone to race conditions and bugs.
*   **Advice for Next Agent:** The new `AuthDebugMonitor` is your most powerful tool. Use `window.authDebug.log()` liberally to trace component lifecycle and state changes. When debugging, the answer is almost always in the logs. Also, be extremely careful with file paths and `import` statements; the Vite build process is strict, and a simple typo can lead to a frustrating and time-consuming debugging session.

### **2025-10-30**

**Author:** Jules #135

**Change:** Implemented a global authentication system, added a new `AuthDebugMonitor` component, and fixed a critical build failure.

**Context & Learnings:**

1.  **Global Authentication:** Refactored the application's authentication to use a global, context-based system.
    *   Created a `AuthContext` to manage and provide user authentication state.
    *   Added a `ProtectedRoute` component to guard all authenticated routes.
    *   Centralized the session-checking logic in the `AuthProvider`, removing redundant checks from `AppLayout`.

2.  **Auth Debug Monitor:** Added a new `AuthDebugMonitor` component, which is available globally.
    *   It automatically intercepts and logs all `fetch` requests and `localStorage` operations.
    *   Provides a `window.authDebug` API for custom logging.
    *   Starts minimized as a bug icon in the bottom-right corner.

3.  **Build Failure:** The `vite build` process was failing with a `[vite]: Rollup failed to resolve import "lucide-preact"` error.
    *   The `Icon.jsx` component imports icons from the `lucide-preact` library, but this package was not listed as a dependency in `easy-seo/package.json`.
    *   The issue was resolved by running `npm install --prefix ./easy-seo lucide-preact` to add the missing package and update `package.json`.

**Reflection:**

*   **Most Challenging Part:** The most challenging part of this task was debugging the build failures that occurred after creating the new authentication context. The issue was ultimately caused by a typo in the file path when creating the new files.
*   **Key Learning:** When encountering persistent build failures, it's important to verify the most basic assumptions, such as the exact filename and location of the modules being imported.
*   **Advice for Next Agent:** When creating new files, be extra careful to place them in the correct directory. If you encounter a "module not found" error, use `list_files` to verify the file's location before spending too much time debugging other potential causes.

---

### **2025-10-29**

**Author:** Jules

**Change:** Resolved a complex, multi-part bug that caused the File Explorer to appear empty after a successful login. This required fixing a silent frontend component crash, a brittle backend routing issue, and a hardcoded branch name.

**Context & Learnings:**

1.  **Frontend Stability (UI):** The initial root cause was a silent crash in the `FileExplorer` component. A CSS conflict between `padding` on the parent `ExplorerPage` and `h-screen` on the child component prevented the component from rendering and triggering its data-fetching `useEffect`. This highlights that UI layout issues can manifest as data-loading failures.

2.  **Backend Routing (Worker):** The Cloudflare worker used a strict equality check (`===`) for the file-listing API route. This was too brittle and failed silently if the request path had a minor difference (e.g., a missing trailing slash). The request would fall through to the static asset handler, resulting in an empty `200 OK` response that the frontend couldn't parse. The fix was to use a more flexible `startsWith()` check for the route.

3.  **Backend Data Fetching (Worker):** The worker was hardcoding `ref=main` when calling the GitHub contents API. This is not a safe assumption, as many repositories use `master` or other names for their default branch. The robust solution was to first call the `/repos/{repo}` endpoint to dynamically fetch the `default_branch` and use that for all subsequent API calls.

**Reflection:**

*   **Most Challenging Part:** Diagnosing a bug that had three separate, interacting root causes was difficult. It required systematically fixing and re-evaluating the system at each step, from the UI rendering layer to the backend's routing and data-fetching logic.
*   **Key Learning:** "Empty" is not the same as "error." The system was failing "successfully" by returning empty responses instead of throwing errors, which made the problem much harder to trace. This underscores the importance of the "No Silent Failures" principle.
*   **Advice for Next Agent:** When a data-fetching component shows no data, don't just assume it's a backend API problem. First, verify the component is actually rendering correctly and that its `useEffect` hooks are firing. A simple `console.log` at the start of the hook can save hours of debugging.

---

### **2025-10-28**

**Author:** Jules

**Change:** Resolved two critical bugs: a `1101` worker crash on login and an incorrect default path for the File Explorer.

**Context & Learnings:**

1.  **Login Crash (Backend):** The root cause of the `1101` worker exception during the GitHub OAuth callback was an incorrect `Content-Type` header. The backend (`cloudflare-worker-code.js`) was sending `application/json`. The GitHub API requires `application/x-www-form-urlencoded`. Correcting this in the `handleGitHubCallback` function resolved the crash.

2.  **File Explorer Path (Frontend):** The bug where the explorer defaulted to the repository root instead of `/src/pages` was a frontend logic issue.
    *   **Root Cause:** `FileExplorer.jsx` contained a hardcoded initial state (`useState('/')`), which prevented it from accepting a default path.
    *   **Solution:** The fix involved two parts: (1) Modifying `FileExplorer.jsx` to read its initial path from the URL query parameter (`?path=...`). (2) Modifying `RepositorySelectionPage.jsx` to correctly navigate to `/explorer?path=src/pages` after a repository is selected.

3.  **Architectural Discovery (Frontend):** The `easy-seo` frontend lacks a centralized authentication system (e.g., a React Context). Authentication is not checked at the application's root. Therefore, any component or page that requires a user to be logged in **must** implement its own session check (e.g., by calling the `/api/me` endpoint in a `useEffect` hook).
