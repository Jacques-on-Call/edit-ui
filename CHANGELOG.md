# Project Change Log

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
