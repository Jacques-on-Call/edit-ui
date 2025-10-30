# Change Log

This document records significant changes, architectural decisions, and critical bug fixes for the `easy-seo` application. All developers (human or AI) should review this log before beginning work to understand the current context and history of the project.

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
