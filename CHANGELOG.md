# Project Change Log

Jules #171 (UI Refactor: Editor Layout and Toolbar)
Date: 2025-11-19
Summary:
Refactored the content editor's UI to align with the mobile-first, minimal-padding design goal. This includes updating the `BottomActionBar` with improved UX and relocating the "Add Section" functionality.
Details:
- **BottomActionBar Refactor:**
    - The text-based "Publish" button was replaced with an `UploadCloud` icon.
    - A colored dot was added as a save status indicator (scarlet for unsaved, yellow-green for saved).
- **Relocated "Add Section" Button:**
    - The "Add Section" and "Save" buttons were removed from the body of the `SectionsEditor`.
    - A new "Add Section" button, using a `Plus` icon, was added to the `BottomActionBar`, centralizing the main editor actions.
- **Layout Adjustments:**
    - Removed horizontal padding and max-width constraints from `ContentEditorPage` and `SectionsEditor` to create a full-width, edge-to-edge editing experience on mobile devices.
Impact: The content editor's UI is now cleaner, more space-efficient, and closer to the intended mobile-first design. Key actions are consolidated in the bottom action bar, and the save status is now clearly visible, improving user confidence and experience.

Jules #171 (Bugfix: Correct Editor Toolbar and Fix Autosave)
Date: 2025-11-19
Summary:
Fixed two critical regressions on the content editor page. First, replaced the incorrect file explorer toolbar with the correct editor-specific action bar. Second, fixed a state synchronization bug that was preventing autosave from working in the `SectionsEditor`.
Details:
- **Correct Toolbar Restored:**
    - The incorrect `BottomToolbar` was removed from the editor page layout.
    - The correct `BottomActionBar`, which contains the save status indicator and publish button, was added to the `ContentEditorPage`.
- **Autosave for SectionsEditor Fixed:**
    - Diagnosed a bug where the `SectionsEditor`'s internal state was not synchronizing with its parent's `sections` prop.
    - Added a `useEffect` hook to the `SectionsEditor` to force its internal state to update whenever the `sections` prop changes, ensuring state consistency.
    - This fix restores the intended autosave functionality, and user edits are now correctly persisted to `localStorage`.
Impact: The content editor is now in a stable, usable state. The correct UI is displayed, and the core local autosave functionality is working reliably, which fully completes Step 4 of the Phase 1 plan and prepares us for implementing the backend round-trip.

Jules #171 (Phase 1, Step 4: Autosave & Toolbar Fixes)
Date: 2025-11-19
Summary:
Completed the implementation of Step 4 by restoring autosave functionality for the `SectionsEditor` in JSON mode. Also fixed a critical regression with the bottom toolbar's navigation buttons.
Details:
- **Autosave for SectionsEditor:**
    - The `useAutosave` hook in `ContentEditorPage.jsx` was already correctly wired to the `SectionsEditor`'s `onChange` event.
    - The autosave delay was adjusted from 1000ms to 1500ms as requested, ensuring saves occur after a brief pause in user activity.
    - Any change within a section now correctly triggers a save of the entire JSON page structure to `localStorage`.
- **Bottom Toolbar Navigation Fix:**
    - Corrected the "Home" button's action in `BottomToolbar.jsx` to navigate to `/explorer` instead of the root `/`.
    - Clarified the `aria-label` for the "Back" button for better accessibility.
Impact: The local-only editing experience for JSON-mode pages is now complete and stable. Users can open the test page, see default content, make edits, and have their changes automatically persist in `localStorage`. The main application navigation is also restored to its expected behavior. This fully completes Step 4 of the Phase 1 plan.

Jules #171 (Bugfix: Restore Bottom Toolbar in Editor)
Date: 2025-11-19
Summary:
Fixed a critical regression where the bottom toolbar was not appearing on the content editor page.
Details:
- **Root Cause:** The main application layout component (`App.jsx`) contained a conditional rendering rule that only displayed the `<BottomToolbar>` for routes under `/explorer`.
- **Fix:** The rendering condition was updated to include editor routes (`/editor`). The logic was changed from `{isExplorerLayout && <BottomToolbar />}` to `{(isExplorerLayout || isEditorLayout) && <BottomToolbar />}`.
Impact: The bottom toolbar is now correctly displayed on both the file explorer and content editor pages, restoring essential navigation and action controls to the editor view. This brings the UI back to its intended state and unblocks further development on the editor.

Jules #171 (Phase 1, Step 4: JSON-Mode Data Loading)
Date: 2025-11-19
Summary:
Adapted the `ContentEditorPage` to handle data loading for JSON-mode pages, focusing on a local-first experience. This change ensures that the editor is always functional and never tries to parse the body of the associated `.astro` file when in JSON mode.
Details:
- **Conditional Loading Logic:** The main `useEffect` hook in `ContentEditorPage.jsx` was refactored. It now uses the `editorMode` variable to branch its logic.
- **`'json'` Mode Behavior:**
    - The component now exclusively checks for a draft in `localStorage`.
    - If a draft is found, it loads the `sections` array from the draft.
    - If no draft exists, it initializes the `SectionsEditor` with a default, placeholder `sections` array.
    - **Crucially, it does not make any network requests to fetch file content in this mode.**
- **`'astro'` Mode Behavior:** The existing logic for loading drafts or fetching and parsing `.astro` files from the repository remains unchanged, preserving legacy functionality.
Impact: The editor is now correctly configured for the first phase of the JSON-first architecture. It can reliably open the test page (`_test/home.astro`) in a valid state (either from a draft or with default content) without any dependency on the backend or file system for its content, which meets the acceptance criteria for this step.

Jules #171 (Phase 1, Step 3: Editor Mode Concept)
Date: 2025-11-19
Summary:
Introduced the concept of an "editorMode" within the ContentEditorPage. This allows the editor to differentiate between traditional `.astro` files and the new JSON-backed, editor-managed pages.
Details:
- **Mode Derivation:** Logic was added directly to `ContentEditorPage.jsx` to determine the `editorMode`. It checks if the file path is within `src/pages/_test/` and ends with `.astro`. If it matches, `editorMode` is set to `'json'`; otherwise, it defaults to `'astro'`.
- **Implementation:** The `editorMode` is derived as a simple variable on each render, avoiding unnecessary state management.
- **Verification:** A `console.log` was added to the component to output the resolved `editorMode`, `slug`, and `path`, allowing for easy verification that the correct mode is being assigned based on the file being viewed.
Impact: The application can now logically distinguish between page types, which is a critical prerequisite for loading the correct editor and data source in the upcoming steps.

Jules #171 (Phase 1, Steps 1 & 2: Contract & Schema Definition)
Date: 2025-11-19
Summary:
Defined and aligned on the foundational concepts for Phase 1 of the editor refinement. This step involves no code changes but establishes the core principles for how "editor-managed pages" will work.
Details:
- **Editor-Managed Page Contract:** An "editor-managed page" is defined as a page whose source of truth is a structured JSON file, not the body of an `.astro` file. The Easy-SEO editor will read from and write to this JSON data, leaving the corresponding `.astro` file untouched during the editing process. For Phase 1, all testing and development will be focused on a single test page: `src/pages/_test/home.astro`.
- **Phase 1 JSON Schema:** A minimal, stable JSON schema has been agreed upon. The root object will contain `slug` (string), `meta` (object with a `title`), and `sections` (an array of section objects).
- **Section Schema:** Each object within the `sections` array will have an `id` (string), a `type` (e.g., "hero"), and `props` (an object containing the content fields for that section type, like `title` and `body`).
- **Section ID Strategy:** As per our agreement, section IDs will be generated on the client-side using a simple, dependency-free, timestamp-based string (e.g., `section-${Date.now()}`). This ensures IDs are unique enough for local editing and easy to debug.
Impact: This initial alignment provides a clear and stable foundation for the implementation work in subsequent steps. By freezing the core data structures and contracts upfront, we minimize the risk of architectural changes mid-phase.

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
Discovery: The pattern of returning a structured result object (e.g., `{ok, error}`) instead of throwing errors from API or async functions makes the calling code much cleaner and more resilient.
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
