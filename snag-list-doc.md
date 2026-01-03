# Snag List (Bugs & Regressions)
Bug ID
Date Reported
Priority
Target Module
Status
BUG-003-251230
2025-12-30
P1: Critical
cloudflare-worker-src/routes/content.js
[FIXED - RE-AUDIT REQ]
BUG-002-251230
2025-12-30
P1: Critical
cloudflare-worker-src/routes/content.js
[RECURRING FAIL]
BUG-001-251230
2025-12-30
P2: High
easy-seo/src/hooks/useSearch.js
[FIXED - 2026-01-03]
BUG-004-260101
2026-01-01
P2: High
easy-seo/src/components/SidePanelToolbar.jsx
[FIXED - 2026-01-02]
BUG-005-260102
2026-01-02
P3: Medium
easy-seo/src/components/FileExplorer.jsx
[NEW REGRESSION]
BUG-006-260102
2026-01-02
P4: Low
easy-seo/src/contexts/LogContext.jsx
[POTENTIAL LEAK]

## Detailed Bug Insights:
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


### BUG-004-260101 (Mobile Toolbar Visibility): Presumed outstanding as no session logs or code changes were found for the agents assigned to this UI state.
📱 [BUG-004] Mobile Toolbar Visibility
Issue: Toolbar doesn't appear on mobile, or appears only when tripple clicking
Status: [UI REGRESSION]
| Date | Agent | Attempted Solution | Why it Failed |
|---|---|---|---|
| 2025-12-30 | Agent 3 | Changed onClick to onTouchStart. | CSS Stacking Context: The toolbar rendered behind the mobile header due to missing z-index. |
| 2026-01-02 | Agent 3 | Added selectionchange listener with debounce. | Event Target Mismatch: Attached listener to the container div instead of the document. "Triple tap" works, but "Double tap" (word select) fails. |
🏗️ Architect's Solution
 * Location: easy-seo/src/components/SidePanelToolbar.jsx
 * Logic:
   * Z-Index War: Set z-index: 50 explicitly in Tailwind (z-50).
   * Event Strategy: Do not use onClick or onTouch. Use a global effect:
     useEffect(() => {
  const handleSelection = () => {
     const text = window.getSelection().toString();
     setShowToolbar(text.length > 0);
  };
  document.addEventListener('selectionchange', handleSelection);
  return () => document.removeEventListener('selectionchange', handleSelection);
}, []);


### BUG-005-260102 (Fragmented Navigation): A recent fix for Snag #4 introduced new navigation controls in FileExplorer.jsx rather than fixing the shared BottomActionBar.jsx, creating a disjointed user experience.

## 🚀 Feature Requests & Architectural Improvements
These items focus on system health and future capabilities rather than immediate break-fixes.
### Visibility Strategy (Fail Visibly): Modify all backend handlers to forward actual JSON error messages instead of returning silent empty arrays.
### Consolidated Helper Registry: Perform a code quality check on cloudflare-worker-src/routes/content.js to merge redundant helper functions, specifically for Base64 encoding.
### Worker Logic Mapping: Create a comprehensive logic map for cloudflare-worker-src/router.js to document the introduction of the new authentication flow.
### Performance Optimization (Lexical): Investigate if typing delays are caused by the autosave debounce or excessive re-renders in the LexicalField component.
