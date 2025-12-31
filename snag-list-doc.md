# Snag List 

This document outlines a list of known issues ("snags") and their agreed-upon solutions, including a detailed technical plan for each. It also serves as a glossary for technical terms used during development

NB: Follow Agents.md instructions 

note from Gemini: To the Council of Jules (Agents 1-6 on branch: snag-squad):
The architecture is currently drifting. You are fixing individual lines but breaking the system logic. Before you touch a single file tonight, you must read these 3 mandates:
1. Stop the "Silent Failures": * NotebookLM identified that our backend handlers are returning empty arrays instead of errors.
• Mandate: If a function fails (like the Move or Rename logic), you MUST make it throw a visible error. Do not let it fail silently.
2. State Management Lockdown: * The SidePanelToolbar is dead because the state wasn't connected in the parent ContentEditorPage.jsx.
• Mandate: Agent #3 (Toolbar specialist), you must coordinate with Agent #1. Do not just style the component; fix the Props and State flow in the parent container.
3. Pathing Integrity: * We have a regression in src/pages navigation and URL generation (_new-index.astro).
• Mandate: Any agent touching generatePreviewPath must test for underscores and index filenames specifically.
Tonight's Goal: Move the needle from "Red" to "Yellow." Polish is secondary; System Integrity is primary.
---

## Snags
 
This is excellent news that the "Grey Header" is gone. That means the "Grid Demolition" is over, and we can focus entirely on repairing functionality.
Since Agent 1 is now free, I have re-balanced the workload. We will combine the two "Preview" issues into one task for Agent 1, ensuring every agent has a specific, separate domain to fix.
📋 The Council of Jules: Revised Mission Plan (2025-12-31)
Protocol: Sequential Relay on snag-squad.
Status: 🔴 RED (Functional Regressions).
## 👓 AGENT 1: The Preview Specialist (Re-assigned)
 * Targets: easy-seo/src/pages/ContentEditorPage.jsx & EditorCanvas.jsx
 * The Problems:
   * URL Logic: _Test files are loading the index page because the regex strips underscores or fails to match them.
   * UI Clutter: The Editor Header remains visible in "Live Preview," taking up valuable screen space.
 * Action:
   * Fix URL: Update generatePreviewPath regex to explicitly allow filenames starting with _ (underscore).
   * Fix UI: In EditorCanvas.jsx, wrap the <Header /> component in a conditional check: {viewMode !== 'livePreview' && <Header />}.
 * Verification: Open _Test-4-loss-2.astro in Preview. The URL must be correct, and the top header must be gone.
## 🧭 AGENT 2: The State Navigator
 * Targets: easy-seo/src/pages/FileExplorerPage.jsx (Delete Handler)
 * The Problem: The "Back" and "Home" buttons die after a file is deleted. This happens because the delete action updates the list but likely wipes the currentPath or history state, leaving the buttons pointing to undefined.
 * Action:
   * In the handleDelete function, ensure that after the await deleteFile(...) call, you explicitly re-set the currentPath state to the current folder (or parent).
   * Verify UIContext is not being reset to null.
 * Verification: Delete a test file inside a folder. Immediately click "Back." It should take you up one level, not do nothing.
## 📱 AGENT 3: The Mobile Mechanic
 * Targets: easy-seo/src/components/SidePanelToolbar.jsx
 * The Problem: The toolbar is not opening on mobile devices.
 * Action:
   * Event Listeners: Check if the "Touch" event is triggering the same toggle function as the "Click" event.
   * CSS Visibility: Ensure the toolbar has a Z-Index higher than the mobile navigation bar (suggest z-50) and isn't being pushed off-screen by a transform: translateX error.
 * Verification: Switch browser to Mobile View. Tap the toolbar toggle. It must slide out over the content.
## ⚙️ AGENT 4: The Backend Engineer (Move Logic)
 * Targets: cloudflare-worker-src/router.js (Move Handler)
 * The Problem: HTTP 500 when moving _Test-4-loss.astro.
 * Analysis: The backend likely fails to handle the underscore _ or the hyphen - in the filename during the rename operation, or it's losing the file extension.
 * Action:
   * Log the exact incoming source and destination paths in the worker.
   * Ensure the file move logic treats the filename as a raw string and does not try to split/parse it (which breaks on special chars).
 * Verification: Move _Test-4-loss.astro to a new folder. It must return 200 OK.
## 🔍 AGENT 5: The Query Specialist (Search)
 * Targets: easy-seo/src/components/FileExplorer.jsx (Search Filter)
 * The Problem: Search finds "let" but fails on "let’s" (smart quote vs straight quote mismatch).
 * Action:
   * Normalize Strings: In the search filter function, normalize both the filename and the search term.
   * Replace smart quotes (’) and straight quotes (') with a unified placeholder or just strip them for comparison.
   * const normalize = (str) => str.toLowerCase().replace(/['’]/g, '');
 * Verification: Search for "lets" or "let's". It should find the file "let’s-do-this.md".
## 📝 AGENT 6: The Archivist (Debug Fix)
 * Targets: easy-seo/src/utils/debugLogger.js OR Backend PUT Handler
 * The Problem: Submitting a log deletes the entire history (Overwrites snag-list-doc.md).
 * Action:
   * Read-Modify-Write: The backend MUST read the existing file content first.
   * Append: Concatenate New Log + \n\n + Existing Content.
   * Write: Save the combined string. Never just save the new log alone.
 * Verification: Submit a log. Check the file. The old snags must still be there.
## 🛡️ Anti-Blinker Mandates (Updated)
 * Agent 1 & 4 Warning: Special characters (_, -) are causing pathing failures. Do not use generic regex [a-z]*. You must support [a-zA-Z0-9-_]*.
 * Agent 2 Warning: "State" is fragile. Do not assume the component re-renders correctly after a delete. Force the state update.
 * Strict Branching: Work ONLY on snag-squad.
