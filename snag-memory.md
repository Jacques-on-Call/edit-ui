---

### [2026-01-07] Snag: 8 - AuthDebugMonitor Not Rendering (DIAGNOSED)
* **Agent:** Snag 🛠️
* **Status:** [ROOT CAUSE IDENTIFIED]
* **Problem:** The `AuthDebugMonitor` component was imported in `app.jsx` but never actually rendered in the JSX tree. This meant console interceptors and logging were active (producing console logs), but the visual UI panel was never mounted to the DOM.
* **Root Cause:** Missing `<AuthDebugMonitor />` in the JSX return statement of `app.jsx`.
* **Why This Matters:** Without the visual monitor, debugging authentication and API flows requires manual console inspection, which is inefficient especially on mobile devices.
* **Solution:** Add `<AuthDebugMonitor />` component to the app.jsx return statement, positioned after the main content but before closing tags to ensure proper z-index stacking.
* **Anti-Pattern:** Importing debugging tools without actually rendering them. Always verify imports are used in the component tree.
