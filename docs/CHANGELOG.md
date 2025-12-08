# Change Log

This document records significant changes, architectural decisions, and critical bug fixes for the `easy-seo` application. All developers (human or AI) should review this log before beginning work to understand the current context and history of the project.

---

### **2025-12-08**

**Author:** AI Agent (Copilot)

**Change:** Transformed both FloatingToolbar and VerticalToolbox into icon-only toolbars with liquid glass theme; fixed selection loop bug; added SlideoutToolbar component with collapsed/expanded states.

**Context & Learnings:**

1.  **Icon-Only Toolbar Redesign:**
    *   **Problem:** The existing FloatingToolbar and VerticalToolbox had text labels making them larger and less modern. User wanted compact icon-only buttons with a "liquid glass" visual aesthetic matching the app's design language.
    *   **Solution:** 
        - Updated FloatingToolbar.jsx to maintain all functionality while switching to icon-only buttons (no visible text, only aria-labels and titles)
        - Moved FloatingToolbar.css from styles/ to components/ directory
        - Rewrote FloatingToolbar.css with liquid glass theme: backdrop-filter blur, subtle gradients, glass-tint overlays, refined shadows
        - Created new SlideoutToolbar.jsx component to replace VerticalToolbox with two states: collapsed icon-rail (56px wide) and expanded slideout (260px wide)
        - Created SlideoutToolbar.css with matching liquid glass styling
        - Updated EditorCanvas.jsx to import and use SlideoutToolbar instead of VerticalToolbox

2.  **Selection Loop Bug Fix:**
    *   **Problem:** FloatingToolbar sometimes looped continuously with "Skipping - selection unchanged (dedupe)" console messages. The toolbar would sometimes never appear or spam position updates, degrading performance and UX.
    *   **Root Cause:** While selection deduplication existed, there was no cooldown period. Rapid events (especially on mobile with keyboard changes) could still trigger excessive position recalculations even with the same selection key.
    *   **Solution:** 
        - Added configurable `cooldownMs` prop (default 150ms) to FloatingToolbar
        - Implemented time-based throttling using `lastUpdateTimeRef` to track last update timestamp
        - Added cooldown check that skips updates if within the cooldown window
        - Combined with existing dedupe logic provides robust anti-loop protection
        - Added touchend event listener for better mobile text selection support
        - Added onTouchStart handler to prevent touch events from clearing selection

3.  **Runtime Debug Instrumentation:**
    *   **Problem:** Needed a way to toggle detailed console logging for debugging selection issues without editing code or redeploying.
    *   **Solution:** 
        - Changed debugMode from a prop to a runtime flag: `window.__EASY_SEO_TOOLBAR_DEBUG__`
        - Set this flag in browser console to enable/disable verbose logging: `window.__EASY_SEO_TOOLBAR_DEBUG__ = true`
        - Logs include selection state, positioning calculations, hide reasons, dedupe/cooldown status
        - Zero performance impact when disabled (flag is falsy by default)

4.  **Liquid Glass Visual Theme:**
    *   **Design Philosophy:** Implemented Apple-style glass morphism with:
        - `backdrop-filter: blur()` for frosted glass effect
        - High saturation (140-150%) for vibrant background colors through glass
        - Layered gradients: light highlight at top, subtle shadow at bottom
        - Inner pseudo-element with radial gradient for depth and thickness
        - Multiple box-shadow layers: outer drop shadow, inner highlight, inner depth shadow
        - Smooth transitions and micro-animations on hover/active states
        - Greenish tint (rgba(40, 120, 90, 0.18)) matching LiquidGlassButton reference
    *   **Components Styled:**
        - FloatingToolbar: compact icon buttons, dropdown menus, color pickers
        - SlideoutToolbar: hamburger trigger, collapsed rail, expanded slideout, category groups
        - Both maintain visual consistency with matching blur, borders, shadows, and glass tint

5.  **SlideoutToolbar Architecture:**
    *   **Three States:** 
        - Hidden (closed)
        - Collapsed: 56px wide icon-rail, all icons visible, no labels, no category headers
        - Expanded: 260px wide slideout with icons, labels, category headers, accordion groups
    *   **Interaction Flow:** 
        - Click hamburger → opens in collapsed state
        - Click hamburger again (or click any collapsed icon area) → expands to full slideout
        - Click hamburger third time or outside → closes completely
        - Select any action → auto-closes toolbar
    *   **Benefits:** 
        - Collapsed state provides quick icon-only access without obscuring content
        - Expanded state shows full labels for discoverability
        - Progressive disclosure pattern: users see icons first, expand if needed
        - Maintains same functionality as VerticalToolbox with improved UX

**Reflection:**

*   **Most Challenging Part:** The cooldown implementation required careful thought about the interaction between deduplication (comparing selection keys) and time-based throttling. Too short a cooldown doesn't prevent loops; too long makes the toolbar feel unresponsive. 150ms proved to be the sweet spot. Also, ensuring the liquid glass theme looked consistent across both toolbars and their various states (dropdowns, expanded/collapsed, hover/active) required iterative refinement of CSS layering and shadow values.

*   **Key Learning:** Selection loops on mobile are often caused by the visual viewport changing when the keyboard opens/closes, which fires selectionchange events even though the actual text selection hasn't changed. The combination of selection key deduplication + time-based cooldown + touchend listener provides robust protection against this. Runtime debug flags are invaluable for production debugging—they let you investigate issues without redeployment. For liquid glass effects, the secret is layering: outer shadows for depth, inner shadows for inset/carved feeling, pseudo-elements with blur for the glass thickness, and backdrop-filter for the actual frosted glass effect.

*   **Advice for Next Agent:** If toolbar positioning issues arise, first enable debug mode (`window.__EASY_SEO_TOOLBAR_DEBUG__ = true`) and watch the console. The detailed logs show exactly why the toolbar hides or shows. For liquid glass CSS, adjust the blur amount first (10-15px range), then the saturation (120-160% range), then fine-tune the shadows. The glass-tint color should be subtle (0.15-0.20 alpha). If performance is an issue, check if backdrop-filter is causing repaints—you may need to add `will-change: transform` or reduce blur amount. The SlideoutToolbar's progressive disclosure pattern (collapsed → expanded) is intentional; don't remove it even if it seems like extra clicks—it balances access with screen space economy.

---

### **2025-12-08 (Final UI Refinements)**

**Author:** AI Agent (Copilot)

**Change:** Final polish on FloatingToolbar and SlideoutToolbar: updated button sizes to 40x40px, increased default cooldown to 200ms, added visual debug instrumentation dot.

**Context & Learnings:**

1.  **Button Size Optimization:**
    *   **Problem:** FloatingToolbar buttons were 32x32px which felt cramped on mobile and didn't match the design spec requiring 40x40px for optimal touch targets.
    *   **Solution:** Updated `--toolbar-button-size` CSS variable from 32px to 40px in FloatingToolbar.css. This provides better accessibility (meeting WCAG 2.1 AA touch target size guidelines) and improved visual balance in the liquid glass container.

2.  **Cooldown Tuning:**
    *   **Problem:** Default cooldown of 150ms was slightly too aggressive on some mobile devices with noisy selection events, occasionally causing the toolbar to feel unresponsive.
    *   **Solution:** Increased default cooldownMs from 150ms to 200ms in FloatingToolbar.jsx and EditorCanvas.jsx. This value is still fast enough for responsive UX while providing better protection against selection event spam on mobile. Value remains configurable via prop for specific use cases.

3.  **Visual Debug Instrumentation:**
    *   **Problem:** Needed a clear visual indicator when debug mode is active without cluttering the UI in production.
    *   **Solution:** 
        - Added conditional debug dot in FloatingToolbar.jsx that only renders when `window.__EASY_SEO_TOOLBAR_DEBUG__` is truthy
        - Created `.floating-toolbar-debug-dot` style in FloatingToolbar.css: small pulsing red dot positioned in top-right corner
        - Dot uses gradient fill, glow shadow, and subtle pulse animation for visibility
        - Zero performance/UI impact when debug mode is off (element not rendered)
        - Makes it immediately obvious to developers when they've enabled debug logging

4.  **Runtime Instrumentation Best Practices:**
    *   Debug flags should be:
        - Runtime-toggled (no code changes needed)
        - Visible when active (debug dot)
        - Zero-cost when disabled (conditional rendering, no overhead)
        - Documented in recovery guide (so devs know how to enable)
    *   The pattern: `window.__EASY_SEO_TOOLBAR_DEBUG__ = true` is discoverable and can be typed directly in browser console

**Reflection:**

*   **Most Challenging Part:** Finding the right balance for the cooldown value—200ms is the sweet spot between preventing loops and maintaining responsiveness, but this may need tuning based on real-world mobile device testing. The debug dot positioning also required care to ensure it doesn't interfere with dropdown menus or other toolbar elements.

*   **Key Learning:** Touch target sizes matter more than you think. The jump from 32px to 40px buttons makes a significant difference in usability on mobile, especially for users with larger fingers or motor impairments. Visual debug indicators (like the pulsing dot) are much better than hidden console flags—developers can see at a glance that debug mode is active without checking DevTools.

*   **Advice for Next Agent:** The 200ms cooldown works well for most devices, but if users report toolbar lag on specific mobile models, try adjusting it via the cooldownMs prop (down to 150ms for faster devices, up to 250ms for very noisy selection events). The debug dot should always remain small and unobtrusive—if it feels distracting, reduce its size or pulse frequency, but never remove it entirely as it's valuable for production debugging. When adding new debug features, follow the same pattern: runtime flag + visual indicator + conditional rendering.

---

### **2025-12-06**

**Author:** AI Agent (Copilot)

**Change:** Fixed systematic whitespace typos in slug parsing and removed conflicting visualViewport JS hook that was preventing proper mobile header positioning.

**Context & Learnings:**

1.  **Slug Parsing Whitespace Typos (Critical Bug):**
    *   **Problem:** Throughout `ContentEditorPage.jsx`, there were 51 systematic whitespace typos in string operations (e.g., `pathIdentifier. split`, `'. astro'`, `/\. astro$/`). These typos prevented proper slug parsing for JSON pages like `home-from-json.astro`, causing the pageId to become `home-from-json.astro` instead of `home-from-json`, breaking editor mode detection and JSON page loading.
    *   **Solution:** Used sed to fix all 51 occurrences of the pattern `\. ([a-z])` to `.${1}` throughout the file. This ensures:
        - `.astro` extension is correctly stripped from file paths
        - `pageId` correctly becomes `home-from-json` for JSON pages in `src/pages/json-preview/`
        - Editor mode detection (`isTestFile` check) works properly
        - Preview URL generation correctly strips `.astro` and trailing `index`

2.  **Mobile Header CSS/JS Conflict:**
    *   **Problem:** The `useVisualViewportFix` hook in `EditorHeader.jsx` was attempting to set inline `top` style dynamically, but the CSS had `top: 0 !important` which overrode the inline style, making the JS hook completely ineffective. This created a conflict where the header could overlap the toolbar on iOS when the keyboard opened.
    *   **Solution:** Following the requirement to "avoid visual viewport JS hacks unless needed", I removed the `useVisualViewportFix` hook entirely and refactored the CSS to handle mobile positioning purely through CSS:
        - Updated header height to `calc(var(--header-h) + env(safe-area-inset-top, 0))` to account for iOS notch
        - Changed padding to `env(safe-area-inset-top, 0) 12px 0 12px`
        - Removed `!important` from `position`, `top`, and `overflow` properties to allow proper CSS cascade
        - Maintained `position: fixed` with GPU acceleration (`transform: translate3d`) for mobile stability
        - Kept iOS Safari and touch device media queries for enhanced compatibility

3.  **Additional Whitespace Typos Fixed:**
    *   Fixed 7 CSS whitespace typos in `index.css` (e.g., `body. noscroll`, `. orb-white`)
    *   Fixed 5 whitespace typos in `app.jsx` (e.g., `document.body. classList`, `import. meta`)
    *   These were causing CSS minification warnings and potential runtime issues

**Reflection:**

*   **Most Challenging Part:** The most challenging aspect was recognizing that the whitespace typos were systematic throughout the codebase (63 total occurrences across 3 files). Initially, I was fixing them one by one, but then realized using sed to fix them all at once was more efficient and less error-prone. The conflict between the CSS `!important` rule and the JS hook setting inline styles was also subtle and required understanding both the CSS cascade and the mobile viewport behavior.

*   **Key Learning:** Whitespace in JavaScript/CSS is not always insignificant. While `object. method` might look cosmetically similar to `object.method`, they are syntactically different and cause bugs. The systematic nature of these typos suggests they may have been introduced by a find-and-replace operation or a formatter issue. Always validate string operations and method calls carefully. Also, when dealing with mobile CSS positioning, prefer CSS-only solutions with `env(safe-area-inset-*)` and `dvh` units over JavaScript viewport manipulation, as CSS is more reliable across different mobile browsers and keyboard states.

*   **Advice for Next Agent:** If you encounter mysterious parsing failures or method call issues, check for whitespace typos using `grep "\. [a-z]" filename`. These typos can be subtle in code review but cause significant runtime failures. For mobile header positioning, resist the temptation to add JS viewport fixes unless CSS solutions are exhausted - the CSS spec now provides robust tools like `env(safe-area-inset-*)`, `dvh` units, and proper `position: fixed` with GPU acceleration that work reliably across devices.

---

### **2025-11-04**

**Author:** Jules #142

**Change:** Performed a comprehensive overhaul of the login functionality and the CI/CD deployment pipelines to resolve a complete system failure where the login page was non-functional and the production environment was stale.

**Context & Learnings:**

1.  **Login Functionality (`/api/login` 404 Error):**
    *   **Problem:** The login link was correctly pointing to `/api/login`, but the request resulted in a 404 error. The backend code in the repository was correct, but it was not being deployed.
    *   **Solution:** The investigation revealed that a series of cascading failures in the deployment pipelines were preventing any new code from reaching production. Fixing the pipelines resolved the 404 error.

2.  **Worker Build Failure (Dependency):**
    *   **Problem:** The `wrangler deploy` command was failing with an error `Could not resolve "gray-matter"`. This was a hard blocker preventing any new worker deployments.
    *   **Solution:** The `gray-matter` package, a dependency for the worker, was missing from the root `package.json`. I installed the dependency (`npm install gray-matter --save-exact`), which fixed the build.

3.  **Worker Deployment Trigger (CI/CD):**
    *   **Problem:** Even after fixing the build, the worker was not auto-deploying. The `.github/workflows/deploy-worker.yml` workflow was still watching the old, monolithic worker file (`cloudflare-worker-code.js`) and ignoring the new `cloudflare-worker-src/` directory.
    *   **Solution:** I updated the workflow's `paths` trigger to correctly monitor `index.js` and `cloudflare-worker-src/**`, ensuring that changes to the refactored worker code now trigger a deployment.

4.  **UI Deployment Workflow (CI/CD):**
    *   **Problem:** The frontend UI was stale, showing old code with visual bugs (inconsistent icon sizes) that had already been fixed in the `easy-seo` directory. The `.github/workflows/deploy-ui.yml` was discovered to be deploying a completely different project (`priority-engine-ui`).
    *   **Solution:** I completely rewrote the `deploy-ui.yml` workflow to correctly trigger on changes to `easy-seo/**`, build the `easy-seo` project, and deploy its `dist` directory to the correct Cloudflare Pages project (`edit-ui`).

5.  **Worker Asset Configuration (Deployment):**
    *   **Problem:** A final deployment blocker was an error stating the assets directory (`easy-seo/dist`) could not be found. This was because the `wrangler.toml` file was incorrectly configured to have the worker manage frontend assets, which are handled by a separate pipeline.
    *   **Solution:** I removed the `[assets]` configuration from `wrangler.toml`, fully decoupling the worker from the frontend deployment and resolving the error.

**Reflection:**

*   **Most Challenging Part:** The most challenging aspect was diagnosing a problem that had multiple, deeply nested root causes across different parts of the system (dependencies, CI/CD, and configuration). It required a systematic process of elimination to uncover each layer of the failure.
*   **Key Learning:** CI/CD and deployment configurations are just as critical as the application code itself. When a feature that works locally fails in production, the deployment pipeline is a primary suspect. A seemingly simple "stale frontend" issue was the symptom of a completely broken deployment strategy.
*   **Advice for Next Agent:** Always verify the CI/CD trigger paths (`paths:` in the `.yml` files) after a major code refactor that moves or renames directories. What is in the repository is not always what is being deployed.
### ***2025-11-02**
Reset to earlier branch to fix a mistake introduced but trying to improve the sign up button.

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
