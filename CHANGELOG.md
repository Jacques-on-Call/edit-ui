# Project Change Log

Jules #169 (Editor Routing Fix)
Date: 2025-11-18
Summary:
Successfully refactored the editor's routing mechanism to use the full, URL-encoded file path instead of a simple slug. This is a foundational step for enabling the editor to load real file content from the repository.
Details:
- Modified `FileExplorer.jsx` to change the navigation target from `/editor/<slug>` to `/editor/<encodedFilePath>`.
- Updated `ContentEditorPage.jsx` to correctly decode the `filePath` from the URL, derive the `slug` for backward compatibility with drafts and the mock API, and prepare the component for future data fetching logic.
- The change was implemented as a small, isolated "baby step" to minimize risk, and was verified via a successful production build and user confirmation.
Impact: The editor is now correctly receiving the full, unique path of the file to be edited. This unblocks the next step of replacing the mock data with a real API call to fetch file content.

Reflection:
Challenge: The primary challenge was procedural, not technical. After a major regression caused by bundling too many changes, it was critical to slow down and implement this change with extreme care and focus, ensuring it was a single, verifiable, and isolated step.
Discovery: Re-affirming the power of the "baby steps" approach. By isolating this routing change, we were able to implement, test, and verify it with high confidence and zero side effects.
Advice: Always follow the established process, especially after a failure. Small, focused commits are the bedrock of a stable and maintainable codebase.

Jules #169 (Workspace Reset & Process Correction)
Date: 2025-11-18
Summary:
Performed a full workspace reset to recover from a corrupted state caused by sandbox git instability. This entry documents the key learnings from the failure and establishes a renewed commitment to the "baby steps" development process.
Details:
- **Problem:** A series of attempts to implement routing and data-fetching changes resulted in a major regression (broken CSS, non-functional editor). The root cause was identified as the sandbox's unstable `git` environment, which prevented small, atomic commits and led to a tangled, incorrect state being submitted.
- **Solution:** A "scorched earth" reset (`reset_all`) was performed to revert the entire workspace to a known-good state. This provides a clean foundation to re-implement the features correctly.
- **Process Reinforcement:** This incident highlighted the absolute necessity of adhering to the "one small change per branch/commit" rule. The failure was not in the code's logic, but in the process of its implementation. Future work will proceed with extreme caution, ensuring each logical change is isolated, built, verified, and submitted independently.

Reflection:
Challenge: The most challenging part was recovering from a state of cascading failures. When the application is broken and the underlying tools (like git) are unreliable, it's very difficult to debug and move forward. The decision to perform a full reset was difficult but necessary.
Discovery: The "baby steps" principle is not just a suggestion; it's a critical safety mechanism. Attempting to bundle even closely related changes can lead to unpredictable outcomes and make rollbacks nearly impossible. The process is as important as the code.
Advice: If the development environment's tools become unstable, do not try to fight them. Fall back to a known-good state. A full reset, while seemingly drastic, is often faster and safer than trying to untangle a corrupted workspace. Always, always, always make the smallest possible change and verify it completely before moving on.

Jacques 25/11/18 reset for the third time the process of getting the home.astro live is breaking the app in vaious ways . the ideal is to do this process safly so as to be able to solve the challenges without serios regression. after being burnt by days of bug hunting im taking the reset path now.
Jules #167 (Draft Workflow Implementation)
Date: 2025-11-16
Summary:
Implemented the foundational client-side draft workflow. This includes fixing a persistent autosave bug, displaying file status (Draft/Live) in the UI, and ensuring new files are created as local drafts instead of being committed directly to the repository.
Details:
- **Robust Autosave:** Fixed a complex autosave bug in the Content Editor that caused infinite loops and redundant saves. The final solution uses a multi-layered guard system, including a `lastSavedContentRef`, to ensure saves only happen when content has genuinely changed.
- **File State Badges:** The File Explorer now displays "Draft" and "Live" badges next to each file, providing clear visual feedback on the status of content. This is driven by checking for draft and published keys in `localStorage`.
- **Create as Draft:** The file creation process has been modified to be a client-only operation. New files are now saved as drafts to `localStorage` and no longer trigger backend API calls or repository commits, preventing premature builds.
- **Path-Aware Drafts:** The draft system is now path-aware, storing the full file path in the `localStorage` payload and ensuring that drafts only appear in their correct directory, fixing a duplication bug.
- **Editor-Draft Sync:** The Content Editor now loads and saves the complete draft payload from `localStorage`, making it the single source of truth for client-side drafts.
Impact: The application now has a safe, robust, and user-friendly client-side draft system. This prevents accidental live publishes, provides users with clear status indicators, and lays the groundwork for a full repository-backed publishing workflow.

Reflection:
Challenge: The most challenging part was debugging the subtle autosave race conditions. It required multiple iterations and a deep, methodical approach with telemetry to finally isolate the root cause. It was a powerful lesson in not underestimating the complexity of state management in reactive UIs.
Discovery: The user's guidance to use a `lastSavedContentRef` was the key insight. Comparing against the last *persisted* state is a much more robust pattern than comparing against the last *rendered* state, and it elegantly solves a whole class of race conditions.
Advice: For complex state interactions, especially those involving user input, debouncing, and asynchronous operations, add temporary, detailed logging first. Don't rush to a solution until you can clearly see the sequence of events. The logs will reveal the true nature of the problem.

Jules #165 (Autosave Loop Fix)
Date: 2025-11-14
Summary:
Fixed a critical bug where the Content Editor would enter an infinite autosave loop due to messages from the preview iframe. Implemented a robust, idempotent messaging protocol to prevent this and similar feedback loops.
Details:
- **Idempotent Messaging:** The editor now attaches a unique ID to each `preview-patch` message it sends.
- **Strict Message Handling:** The editor's `message` event listener now only accepts and processes known message types (`preview-ready`, `preview-ack`).
- **ACK Validation:** The editor now validates incoming `preview-ack` messages, ignoring any that do not correspond to the most recently sent message ID. This prevents echoed or delayed messages from re-triggering the save process.
- **Readiness Flag:** The editor will not send any `preview-patch` messages until it has received a `preview-ready` message from the iframe, ensuring the preview is initialized before communication begins.
Impact: The Content Editor is now stable and immune to autosave feedback loops caused by iframe communication. This makes the editing experience reliable and prevents unnecessary network requests and local storage writes.

Reflection:
Challenge: The most difficult part of this fix was the extensive debugging required to verify it in a broken development environment. The backend server was non-functional, and the frontend had a hard dependency on it, requiring multiple patches and workarounds just to get the component to render for testing.
Discovery: When dealing with `postMessage` between frames, it's essential to treat it like a network protocol. Assume messages can be delayed, duplicated, or unexpected. A simple handshake (`ready`) and message IDs (`ack`) are critical for robust communication.
Advice: Never trust cross-origin messages. Always validate the message `type` and, if necessary, the `origin`. For stateful interactions like saving, use unique identifiers to make the communication idempotent.

Jules #164 (Final Sprint 1 Patch)
Date: 2025-11-14
Summary:
Applied a final, comprehensive patch to stabilize the Content Editor, eliminate re-render loops, harden the mock API and autosave logic, and optimize the mobile workspace for a true full-screen experience.
Details:
- **Performance Stabilization:** Resolved a critical re-render loop by implementing state guards in `ContentEditorPage`. State is now only updated when values actually change, preventing unnecessary renders from `window.matchMedia` and `onInput` events. A `mounted` ref was also added to prevent state updates after the component has unmounted.
- **Robust Autosave:** Hardened the `mockApi.saveDraft` function to never throw an error, instead returning a structured `{ok, error}` object. The `useAutosave` hook and `ContentEditorPage` now handle save failures gracefully without crashing or entering an inconsistent state.
- **Mobile UX Optimization:** The mobile editor workspace has been refined to provide a near full-screen experience (~90vh). The `EditorHeader` is now more compact, and the duplicate `Publish` button has been removed from the header on mobile.
- **Clean Navigation:** The `BottomActionBar` now includes a `Home` icon, providing a clear and consistent primary navigation point on mobile.
- **Guarded PostMessage:** The call to `postMessage` for the preview iframe is now guarded to ensure the `iframeRef` and its `contentWindow` are available, preventing potential race conditions and errors.
Impact: The Content Editor is now stable, performant, and provides a polished, full-screen workspace on mobile devices. This completes all objectives for Sprint 1.

Reflection:
Challenge: The most challenging part was diagnosing the subtle re-render loop. The combination of unguarded state updates from multiple sources created a feedback loop that was difficult to trace without targeted diagnostics.
Discovery: The pattern of returning a structured result object (e.g., `{ok, error}`) instead of throwing errors from API or async functions makes the calling code much cleaner and more resilient. The defensive `saveDraft` is a perfect example of this.
Advice: For complex components with multiple `useEffect` hooks and event handlers, always add guards to `setState` calls. A simple `if (newValue !== currentState)` check can prevent a cascade of performance problems. When in doubt, add `console.trace()` to identify the source of state updates.

Jacques 251114 reset to undo a bad edit that causes app to not open login
Jules #162, The Finisher
Date: 2025-11-13
Summary:
Addressed several UI and backend issues, including fixing search snippet generation, refining the bottom toolbar's style and functionality, and enhancing the UI for selected files.
Details:
Search Snippets: Fixed a bug where search result snippets incorrectly included frontmatter. The backend now uses a robust line-by-line parser to strip frontmatter before generating snippets.
Bottom Toolbar: Restyled the toolbar with a top-to-bottom dark blue to black gradient and increased backdrop blur. Added functional Home, Back, and an animated "Create" button.
UI Polish: Enhanced the selected state of files and folders with a thin border for better visual feedback.
Impact: The search feature is now more reliable, and the UI is more polished and functional.
Reflection:
Challenge: The main challenge was ensuring all the small UI tweaks and bug fixes were implemented correctly and didn't introduce any regressions.
Discovery: A well-structured component system makes it easy to apply consistent styling and behavior across the application.
Advice: When making a series of small changes, it's important to test each one individually to ensure it's working as expected before moving on to the next.

Jules #161, The Debugging Dynamo
Date: 2025-11-12
Summary:
Resolved a critical, non-obvious bug where the search query state would not propagate to the FileExplorer component.
Implemented a series of related fixes to improve UI responsiveness, mobile usability, and touch interactions.
Details:
The "Zombie Component" Bug: The root cause of the search failure was a silent DOMException being thrown within the fetchDetailsForFile function in FileExplorer.jsx. When parsing certain files (like images or binary files), the TextDecoder would fail, throwing an exception that was not caught. This error put the component into a "zombie" state where it would no longer re-render in response to new props, such as the updated searchQuery. The fix was to wrap the parsing logic in a robust try...catch block, ensuring that file parsing errors are handled gracefully without crashing the component's render lifecycle.
Responsive UI: Fixed the layout of the FileExplorer page to prevent the Readme component from overflowing and causing horizontal scrolling on smaller screens.
Mobile UX:
Re-enabled and fixed the long-press/touch interaction on FileTile components for mobile devices.
Fixed the "Create" button in the bottom toolbar, which was unresponsive on mobile.
Restored file and folder icons that were missing on mobile, which was a side-effect of the main "zombie component" bug.
Impact: The file explorer is now fully functional and robust. The search feature works reliably, the UI is responsive across all screen sizes, and the mobile user experience is significantly improved. The application is more resilient to unexpected file types.
Reflection:
Challenge: This was a classic "heisenbug." The component wasn't crashing loudly; it was silently breaking its own render loop. The breakthrough came from methodical, "scorched earth" debugging—stripping the component down to its bare essentials and rebuilding it piece by piece until the faulty function was isolated.
Discovery: A component can fail in a way that stops it from receiving new props without crashing the entire app. Uncaught exceptions inside async utility functions called from useEffect can be particularly dangerous.
Advice: When state stops propagating, look for silent errors. Check the browser console for exceptions that might not seem fatal but could be interrupting the render cycle. Also, when debugging a component, systematically removing its children is a powerful way to isolate the source of a problem.
This document records significant changes, architectural decisions, and critical bug fixes for the project.

Note for Developers: This is a monrovia. When working within a specific application directory (e.g., easy-seo/,priority-engine/), please consult the documentation within that directory (e.g., easy-seo/docs/) for the most detailed and relevant information.

**Jules #160, Security Virtuoso:** Started v0.1 on 2025-11-10. Changes: 1) I will fix the cookie domain in the OAuth callback to ensure it's shared across subdomains. 2) I will refactor the `validateAuth` function to return a result object instead of throwing a `Response` object. 3) I will update the `withAuth` middleware to handle the new return signature of `validateAuth`. 4) I will add a temporary debug endpoint to help verify that the browser is sending the `gh_session` cookie with requests.
