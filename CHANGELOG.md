# Change Log

This document records significant changes, architectural decisions, and critical bug fixes for the `easy-seo` application. All developers (human or AI) should review this log before beginning work to understand the current context and history of the project.

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
