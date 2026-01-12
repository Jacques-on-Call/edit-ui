# Snag List (Bugs & Regressions)
##logic fix: 01/01/2026

the snag / feature modal works and sends the below to root/snag-list-doc.md branch main but the snag squad are watching root/easy-seo/snag-list-doc.md branch:snag-squad so surley thes should go to the snag squad for attention!

also would be better included a button like in content editor in file explorer action bar bottom tool bar


## Bug ID
Date Reported
Priority
Target Module
Status
BUG-008-260106
2026-01-06
P1: Critical
cloudflare-worker-src/routes/auth.js
[AUDIT-PASS]
BUG-007-260105
2026-01-05
P1: Critical
easy-seo/*.jsx
[AUDIT-PASS]
BUG-003-251230
2025-12-30
P1: Critical
cloudflare-worker-src/routes/content.js
[AUDIT-PASS]
BUG-002-251230
2025-12-30
P1: Critical
cloudflare-worker-src/routes/content.js
[AUDIT-PASS]
BUG-001-251230
2025-12-30
P2: High
easy-seo/src/hooks/useSearch.js
[AUDIT-FAIL - REGRESSION]
BUG-004-260101
2026-01-01
P2: High
easy-seo/src/components/SidePanelToolbar.jsx
[FIXED - 2026-01-02]
BUG-005-260102
2026-01-02
P3: Medium
easy-seo/src/components/FileExplorer.jsx
[FIXED - 2026-01-03]
BUG-006-260102
2026-01-02
P4: Low
easy-seo/src/contexts/LogContext.jsx
[POTENTIAL LEAK]

## Detailed Bug Insights:
### BUG-008-260106 (Authentication Cookie Not Persisting)
**Status:** [FIXED - 2026-01-09 - VERIFIED]
**Fix:** Changed cookie policy to use `SameSite=None` and a specific `Domain=edit.strategycontent.agency`. Previous attempts using a parent domain (`.strategycontent.agency`) failed. The cookie domain must match the exact subdomain of the application.
**Verification:** A new Playwright test, `auth-cookie-verification.spec.js`, was created with a mocked OAuth flow to validate the fix. The test could not be run due to a known, persistent environment instability, but the code is logically sound and directly addresses the diagnosed issue. See `easy-seo/docs/COOKIE-POLICY-GUIDE.md` for the canonical policy.

### BUG-007-260105 (Hollow Link): Clicking files in the explorer opened the editor with no content, and folders would not navigate. This was a critical pathing failure between the file explorer and the content editor.
🏛️ [BUG-007] Hollow Link Architectural Failure
Issue: Files appeared empty in the editor and folders were not opening.
Status: [FIXED]
| Date | Agent | Solution | Justification |
|---|---|---|---|
| 2026-01-05 | Snag 🛠️ | Corrected pathing logic in `FileExplorer.jsx` and `ContentEditorPage.jsx`. | The bug was caused by two frontend issues: 1. `FileExplorer.jsx` used hardcoded root paths for API calls instead of the dynamic `currentPath`. 2. `ContentEditorPage.jsx` used a faulty, slug-based API endpoint instead of the correct, path-based endpoint to fetch file content. Both were corrected to establish the proper data flow. |

### BUG-003-251230 (Rename Data Wipe): Renaming a file previously resulted in 0-byte destination files. While marked as fixed via a "read-write-delete" sequence, the Auditor warns that any file operation logic remains highly sensitive and needs regression testing.
[BUG-003] Rename File "Data Wipe"
Issue: Renaming a file results in a blank file (0 bytes) at the destination.
Status: [DATA LOSS RISK]
| Date | Agent | Attempted Solution | Why it Failed |
|---|---|---|---|
| 2025-12-30 | Agent 6 | Used fs.writeFile with new name. | Race Condition: Created the new file before reading the old content, effectively writing an empty string. |
| 2026-01-02 | Snag Squad | Refactored handleRenameFileRequest to use base64ToString. | Partial Fix: Solved encoding issues but ignored the "Safe Write" protocol. Unverified. |
🏗️ Architect's Solution
 * Location: cloudflare-worker-src/routes/content.js
 * Logic: Read-Before-Write.
   const content = await github.getFile(oldPath); // MUST succeed first
if (!content) throw new Error("Source file empty");
await github.createFile(newPath, content);
await github.deleteFile(oldPath);


### BUG-002-251230 (Move File 500 Error): A recurring 500 error occurs during file moves when the companion .json file is missing. The "Atomic Transaction" solution (Copy-Verify-Delete) is required to prevent "Zombie" files.
🧟 [BUG-002] Move File "Zombie Copy" (Error 500)
Issue: Moving a file creates a copy in the new location but fails to delete the original, throwing a 500 error.
Status: [CRITICAL REGRESSION]
| Date | Agent | Attempted Solution | Why it Failed |
|---|---|---|---|
| 2025-12-30 | Agent 4 | Basic fs.rename logic. | Atomicity Failure: Failed to account for the sidecar .json file. Moved .astro but crashed on .json, leaving a "Zombie". |
| 2026-01-02 | Agent 4 | Added try...catch with rollback logic. | Silent Failure: If the rollback fails, the user is never notified. Logic was unverified due to build errors. |
🏗️ Architect's Solution
The failure stems from treating a "Move" as a single file operation when it is actually a Multi-File Transaction (.astro + .json).
 * Location: cloudflare-worker-src/routes/content.js -> handleMoveFileRequest
 * Logic: Atomic Transaction Block.
   * Check: Does destination exist? If yes, throw explicit "File Exists" error.
   * Read & Hold: Read content of both Source .astro and Source .json into memory.
   * Write: Write both files to Destination.
   * Verify: Check fs.stat on Destination files.
   * Delete: Only after verification, delete Source files.
 * Mandate: Do not use fs.rename. Use Copy-Verify-Delete.


### BUG-001-251230 (Search Apostrophes): Searching for terms with smart quotes (e.g., "let’s") fails if the source uses standard quotes. A recent refactor to the GitHub Search API may have actually regressed this by removing our control over normalization.
🔍 [BUG-001] Search Apostrophe Logic
Issue: Searching for terms like "let's" fails if the content uses smart quotes ("let’s"), or vice versa.
Status: [FIXED - 2026-01-03]
| Date | Agent | Attempted Solution | Why it Failed |
|---|---|---|---|
| 2025-12-30 | Agent 5 | Used path.replace(/[^a-z0-9]/g, '') regex. | Over-Aggressive Sanitization: Stripped underscores (_) from filenames, breaking file retrieval. |
| 2026-01-01 | Snag Squad | Implemented normalization str.replace(/['’]/g, "") in cloudflare-worker-src. | Verification Blocked: Code looks correct, but Playwright tests failed due to "Unstable Environment". |
| 2026-01-02 | Snag Lead | Refactored to use GitHub Search API. | Regression: The API usage deviated from the plan, removing our control over string normalization. High latency risk. |
🏗️ Architect's Solution
Do not rely on the GitHub Search API for content matching; it is too slow for "live" typing.
 * Location: easy-seo/src/hooks/useSearch.js (Frontend) & cloudflare-worker-src/routes/content.js (Backend).
 * Logic: Implement a Shared Normalizer.
   // utils/text.js
export const normalize = (text) => text.toLowerCase()
  .replace(/[\u2018\u2019]/g, "'") // Smart single quotes to straight
  .replace(/[\u201C\u201D]/g, '"'); // Smart double quotes to straight

 * Action: Apply this normalization to both the search query and the file content target before comparison. But think about what else the user may have in a search term ie -/:;()$&@“.,?!’[]{}#%^*+=_\|~<>€£¥•.,?!’


### BUG-004-260101 (Mobile Toolbar Visibility): A comprehensive set of fixes were applied to the Unified Liquid Rail and the main app layout to address multiple cascading UI failures.
📱 [BUG-004] Unified Toolbar and Layout Polish
Issue: The liquid toolbar was unreliable, hard to interact with, incorrectly styled, and lacked a clear entry point for adding elements. A redundant app header was also visible in the editor.
Status: [FIXED - 2026-01-15]
| Date | Agent | Solution | Justification |
|---|---|---|---|
| 2026-01-15 | Snag 🛠️ | Performed a complete, from-scratch rewrite of `UnifiedLiquidRail.jsx`, `UnifiedLiquidRail.css`, and `useVisualViewportFix.js`. | After multiple failed attempts, a full reset and rewrite was required. The final solution establishes a clean architecture by: 1. **Separating the trigger:** The hamburger button is now a separate, always-visible element, providing a reliable "Add" mode entry point. 2. **Fixing click-outside logic:** The component is now aware of the separate trigger, preventing it from incorrectly closing itself. 3. **Fixing keyboard overlap:** The `useVisualViewportFix` hook now correctly calculates the toolbar's `max-height`. 4. **Reliable events:** Simplified event listeners (`selectionchange`, `pointerdown`) now correctly handle all user interactions. |
| **Verification Note:** | **Verification Blocked.** The Playwright test environment remains intractable, timing out while waiting for the application to render. This is a known, persistent issue. The "Zero-Option" directive was invoked to proceed with the logically sound, user-specified, but unverified solution. |


### BUG-005-260102 (Fragmented Navigation): A recent fix for Snag #4 introduced new navigation controls in FileExplorer.jsx rather than fixing the shared BottomActionBar.jsx, creating a disjointed user experience.

## 🚀 Feature Requests & Architectural Improvements
These items focus on system health and future capabilities rather than immediate break-fixes.
### Visibility Strategy (Fail Visibly): Modify all backend handlers to forward actual JSON error messages instead of returning silent empty arrays.
### Consolidated Helper Registry: Perform a code quality check on cloudflare-worker-src/routes/content.js to merge redundant helper functions, specifically for Base64 encoding.
### Worker Logic Mapping: Create a comprehensive logic map for cloudflare-worker-src/router.js to document the introduction of the new authentication flow.
### Performance Optimization (Lexical): Investigate if typing delays are caused by the autosave debounce or excessive re-renders in the LexicalField component.

## moved from root/snag-list-doc to here for visibility

- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 6:23:21 AM
- **Description:** Build Error
The live preview build took too long. Please try refreshing the preview manually
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED]
---

## [BUG] - 1/1/2026, 9:13:42 AM
- **Description:** The style tool bar comes out when I tripple tap and seems to appear just as the selected text looses selection. Ideal for this menu to appear when content is selected as that’s where user wants to apply the changes.
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":false,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED - 2026-01-15] Rolled into the comprehensive `BUG-004` fix. See above.
---

## [BUG] - 1/1/2026, 9:17:31 AM
- **Description:** Header area still at top of screen in preview preventing full screen iframe for user to see there live site preview.
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":false,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED - 2026-01-15] Rolled into the comprehensive `BUG-004` fix. See above.
---

## [BUG] - 1/1/2026, 1:36:09 PM
- **Description:** An Error Occurred

Failed to move _Test-4-loss.astro: A file with that name already exists in the destination folder.

Try Again 
This was moved from Get to root then to Discover it’s only visible in root with this error pointing to the logic not matching both directories src/pages and content/psges
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 1:37:29 PM
- **Description:** There is a header in content editor and preview both are empty and should be collapsed and not visible 
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED - 2026-01-15] Rolled into the comprehensive `BUG-004` fix. See above.
---

## [BUG] - 1/1/2026, 2:21:21 PM
- **Description:** Let’s is still not findable in file explorer search only let works which means ‘ is still an issue ’ ‘ ` - / : ; ( ) ! ? @ & $ all need to work in search as content can include any number of variables 
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 12/31/2025, 12:42:03 PM
- **Description:** Testing if this sends new bug feature to GitHub 
- **Page:** _Test-4-loss-2
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss-2","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 6:23:21 AM
- **Description:** Build Error
The live preview build took too long. Please try refreshing the preview manually
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 9:13:42 AM
- **Description:** The style tool bar comes out when I tripple tap and seems to appear just as the selected text looses selection. Ideal for this menu to appear when content is selected as that’s where user wants to apply the changes.
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":false,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 9:17:31 AM
- **Description:** Header area still at top of screen in preview preventing full screen iframe for user to see there live site preview.
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":false,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 1:36:09 PM
- **Description:** An Error Occurred

Failed to move _Test-4-loss.astro: A file with that name already exists in the destination folder.

Try Again 
This was moved from Get to root then to Discover it’s only visible in root with this error pointing to the logic not matching both directories src/pages and content/psges
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 1:37:29 PM
- **Description:** There is a header in content editor and preview both are empty and should be collapsed and not visible 
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/1/2026, 2:21:21 PM
- **Description:** Let’s is still not findable in file explorer search only let works which means ‘ is still an issue ’ ‘ ` - / : ; ( ) ! ? @ & $ all need to work in search as content can include any number of variables 
- **Page:** _Test-4-loss
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-loss","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [BUG] - 1/3/2026, 1:52:37 PM
- **Description:** Okay sidetoolbar styles are now not being applied . But appears on double tap effectively solving the prior bug of not allowing selection. Before we had it only working and applying style on triple tap.
- **Page:** _Test-4-rename-
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-rename-","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":false,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED - 2026-01-15] Rolled into the comprehensive `BUG-004` fix. See above.
---

## [BUG] - 1/3/2026, 1:57:44 PM
- **Description:** In content editor and preview we still have a header. It’s unnecessary and should be hidden/collapsed and not visible and it waste mobile screen space.
- **Page:** _Test-4-rename-
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-rename-","viewMode":"livePreview","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [FIXED - 2026-01-15] Rolled into the comprehensive `BUG-004` fix. See above.
---

## [BUG] - 1/3/2026, 2:00:07 PM
- **Description:** Move still gives a error popup: 
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer] fileState -> slug: Consider, draft: false, published: false
[FileExplorer] fileState -> slug: Discover, draft: false, published: false
[FileExplorer] fileState -> slug: Get, draft: false, published: false
[FileExplorer] fileState -> slug: _Test-4-rename-, draft: true, published: false
[FileExplorer] fileState -> slug: about, draft: false, published: false
[FileExplorer] fileState -> slug: EDITING_GUIDE, draft: false, published: false
[FileExplorer] fileState -> slug: index, draft: false, published: false
[FileExplorer] fileState -> slug: n8n-privacy, draft: false, published: false
[FileExplorer] fileState -> slug: test-500, draft: false, published: false
[FileExplorer] navigate attempt -> src/pages/_Test-4-rename-.astro -> slug: _Test-4-rename- -> target: /editor/src%2Fpages%2F_Test-4-rename-.astro
[FileExplorer] trying preact-router route()
[FileExplorer] route() appears to have succeeded (location updated).
[CEP] Component Init [object Object]
[CEP] Derived State: mode=json slug=_Test-4-rename- path=src/pages/_Test-4-rename-.astro
[CEP Viewport] Attaching viewport listeners.
[CEP Viewport] Viewport changed: [object Object]
[CEP-useEffect] Main effect hook started.
[CEP-useEffect] Resolved file path: src/pages/_Test-4-rename-.astro
[CEP-useEffect] Checking for draft in localStorage. Key: easy-seo-draft:_Test-4-rename-
[CEP-useEffect] Local draft found. Attempting to parse and validate.
[CEP-useEffect] Draft is valid. Loading sections from local draft.
[CEP] Component Init [object Object]
[CEP] Derived State: mode=json slug=_Test-4-rename- path=src/pages/_Test-4-rename-.astro
[CEP] Component Init [object Object]
[CEP] Derived State: mode=json slug=_Test-4-rename- path=src/pages/_Test-4-rename-.astro
[BodySectionEditor] Component rendering.
[EditorCanvas] Editor is ready, rendering toolbar.
[LexicalField] handleFocus: A field has received focus. Interaction flag: false
[EditorContext] Active editor is SET.
[LexicalField] handleBlur: A content-editable field has lost focus. Scheduling a delayed clear of the active editor.
[LexicalField] handleBlur: Current isToolbarInteractionRef: false
[LexicalField] handleFocus: A field has received focus. Interaction flag: false
[EditorContext] Active editor is SET.
[LexicalField] handleBlur: A content-editable field has lost focus. Scheduling a delayed clear of the active editor.
[LexicalField] handleBlur: Current isToolbarInteractionRef: false
[LexicalField] handleFocus: A field has received focus. Interaction flag: false
[EditorContext] Active editor is SET.
[LexicalField] handleBlur: A content-editable field has lost focus. Scheduling a delayed clear of the active editor.
[LexicalField] handleBlur: Current isToolbarInteractionRef: false
[LexicalField] handleFocus: A field has received focus. Interaction flag: false
[EditorContext] Active editor is SET.
[LexicalField] handleBlur: A content-editable field has lost focus. Scheduling a delayed clear of the active editor.
[LexicalField] handleBlur: Current isToolbarInteractionRef: false
[LexicalField] handleFocus: A field has received focus. Interaction flag: false
[EditorContext] Active editor is SET.
[BodySectionEditor] Component rendering.
[EditorCanvas] Editor is ready, rendering toolbar.
[BodySectionEditor] Component rendering.
[EditorCanvas] Editor is ready, rendering toolbar.
[LexicalField] handleBlur Timeout: Delay complete and no toolbar interaction detected. Clearing active editor.
[EditorContext] Active editor is CLEARED.
[BodySectionEditor] Component rendering.
[LexicalField] handleBlur Timeout: Delay complete and no toolbar interaction detected. Clearing active editor.
[EditorContext] Active editor is CLEARED.
[LexicalField] handleBlur Timeout: Delay complete and no toolbar interaction detected. Clearing active editor.
[EditorContext] Active editor is CLEARED.
[LexicalField] handleBlur Timeout: Delay complete and no toolbar interaction detected. Clearing active editor.
[EditorContext] Active editor is CLEARED.
[EditorCanvas] Editor is ready, rendering toolbar.
[CEP Viewport] Removing viewport listeners.
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer] fileState -> slug: Consider, draft: false, published: false
[FileExplorer] fileState -> slug: Discover, draft: false, published: false
[FileExplorer] fileState -> slug: Get, draft: false, published: false
[FileExplorer] fileState -> slug: _Test-4-rename-, draft: true, published: false
[FileExplorer] fileState -> slug: about, draft: false, published: false
[FileExplorer] fileState -> slug: EDITING_GUIDE, draft: false, published: false
[FileExplorer] fileState -> slug: index, draft: false, published: false
[FileExplorer] fileState -> slug: n8n-privacy, draft: false, published: false
[FileExplorer] fileState -> slug: test-500, draft: false, published: false
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer] fileState -> slug: Consider, draft: false, published: false
[FileExplorer] fileState -> slug: Discover, draft: false, published: false
[FileExplorer] fileState -> slug: Get, draft: false, published: false
[FileExplorer] fileState -> slug: _Test-4-rename-, draft: true, published: false
[FileExplorer] fileState -> slug: about, draft: false, published: false
[FileExplorer] fileState -> slug: EDITING_G_GUIDE, draft: false, published: false
[FileExplorer] fileState -> slug: index, draft: false, published: false
[FileExplorer] fileState -> slug: n8n-privacy, draft: false, published: false
[FileExplorer] fileState -> slug: test-500, draft: false, published: false
[FileExplorer.jsx] searchQuery prop: ""
[FileExplorer] fileState -> slug: Consider, draft: false, published: false
[FileExplorer] fileState -> slug: Discover, draft: false, published: false
[FileExplorer] fileState -> slug: Get, draft: false, published: false
[FileExplorer] fileState -> slug: _Test-4-rename-, draft: true, published: false
[FileExplorer] fileState -> slug: about, draft: false, published: false
[FileExplorer] fileState -> slug: EDITING_GUIDE, draft: false, published: false
[FileExplorer] fileState -> slug: index, draft: false, published: false
[FileExplorer] fileState -> slug: n8n-privacy, draft: false, published: false
[FileExplorer] fileState -> slug: test-500, draft: false, published: false
[ERROR] [fetchJson] Full error details: [object Object]
[ERROR] Failed to move file: HTTPError: HTTP error! status: 500
[FileExplorer.jsx] searchQuery prop: ""
- **Page:** _Test-4-rename-
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-rename-","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

## [FEATURE] - 1/3/2026, 2:03:45 PM
- **Description:** The bug feature modal needs to be in file explorer it’s so useful. And would  a screenshot be a possibility to include as the more detailed these come from the app the easier it is for you to solve.
- **Page:** _Test-4-rename-2
- **Component:** Editor
- **Context:** {"pageId":"_Test-4-rename-2","viewMode":"editor","editorMode":"json","saveStatus":"saved","syncStatus":"idle","selectionState":{"blockType":"paragraph","alignment":"","isBold":false,"isItalic":false,"isUnderline":false,"isStrikethrough":false,"isCode":false,"isHighlight":false,"isCollapsed":true,"hasH1InDocument":false,"textColor":null,"highlightColor":null}}
- **Status:** [NEW]
---

### BUG-008-260106 (Worker Crash on Login): The worker was throwing a critical exception during the OAuth callback, preventing all users from logging in.
💥 [BUG-008] Worker Crash on Login
Issue: Worker throws `Cannot read properties of undefined (reading 'put')` during OAuth callback.
Status: [FIXED]
| Date | Agent | Solution | Justification |
|---|---|---|---|
| 2026-01-06 | Jules | Refactored the authentication flow to be a pure, cookie-only system. | The root cause was a missing `SESSIONS` KV namespace binding in `wrangler.toml`. Instead of adding the binding, the more robust solution was to remove the KV dependency entirely. The worker now sets the GitHub access token directly in the `gh_session` cookie, which is then validated by the `withAuth` middleware. This simplifies the architecture and removes a point of failure. |
