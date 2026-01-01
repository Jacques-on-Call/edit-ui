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

This is a critical "Stop the Bleeding" moment. The "Rogue Agent" didn't just break a feature; they broke the application state model.
By analyzing the behavior you described (Back button acting like a browser, Ghost Header reappearing, Mobile Toolbar firing on "empty space"), I have constructed the forensic analysis and the recovery plan.
1. The "Crime Scene" Analysis
 * The "Browser Back" Sabotage (FileExplorer.jsx):
   * The Crime: The agent replaced the internal setCurrentPath(parentPath) logic with window.history.back(). This is why clicking "Back" takes you out of the app to the "Repository Selection" screen instead of just up one folder.
   * The DOM Injection: They likely added a <Link href=".."> or an <a> tag inside the FileExplorer header or BottomActionBar instead of using the onClick handler linked to the UIContext.
 * The "Ghost Header" Resurrection (ContentEditorPage.jsx):
   * The Crime: The agent found the commented-out <EditorHeader /> (lines ~120-130) and "fixed" it by uncommenting it. This header was deprecated, which is why it blinks and stretches—it conflicts with the newer EditorCanvas layout.
   * Impact: It’s eating up 60px of your Preview space and causing the layout thrashing.
 * The "Mobile Toolbar" Phantom Click:
   * The Crime: The event listener for the toolbar is attached to the Editor Container (<div>), not the Lexical Editor Instance. That's why tapping "empty space" (the container) triggers it, but selecting text (the editor instance) does not. The z-index is also likely trapped inside a container with overflow: hidden.
 * Whitespace Typos (Silent Killers):
   * Look for search .query or file .name in easy-seo/src/hooks/useSearch.js. This is breaking the "let's" vs "let’s" normalization because the code is crashing silently before it runs the normalization logic.
2. Logical Contradictions
 * The "Fixed" Move Logic: Agent 5 claimed to fix "File Rename Data Loss" by updating the Base64 encoding. However, they ignored the Move logic. The "File already exists" error happens because the backend checks for the destination folder's existence but fails to check if the specific filename is free, or it fails to move the shadow .json file along with the .astro file, leaving a "Ghost JSON" that blocks the move.
 * The UI Context Mismatch: The BottomActionBar thinks it is navigating a "History Stack" (Browser), but the FileExplorerPage is trying to manage a "Path State" (App). They are fighting, and the Browser Stack is winning.
3. The "Recovery" Snag List (Formatted for the Squad)
Paste this into snag-list-doc.md immediately.
Step 1: Kill the "Browser Back" & Fix Nav
 * Target: easy-seo/src/components/BottomActionBar.jsx (Lines 40-60)
 * The Revert: Remove any usage of window.history.back() or useLocation for navigation.
 * The Fix: Restore the UIContext integration. The "Back" button onClick must execute:
   const parentPath = currentPath.split('/').slice(0, -1).join('/');
setCurrentPath(parentPath || 'src/pages');

 * Acceptance Test: Go to src/pages/blog. Click Back. You must land in src/pages, NOT the Repo Selection screen.
Step 2: Exorcise the "Ghost Header"
 * Target: easy-seo/src/pages/ContentEditorPage.jsx (Lines ~120)
 * The Revert: Find the <EditorHeader /> component. Comment it out or Delete it. Do not wrap it in logic; kill it. It is deprecated.
 * The Fix: Ensure only EditorCanvas is rendering the toolbar.
 * Acceptance Test: Open Preview. The top 60px grey bar must be gone.
Step 3: Fix Preview URL & Search Normalization
 * Target: easy-seo/src/pages/ContentEditorPage.jsx (generatePreviewPath) AND easy-seo/src/hooks/useSearch.js.
 * The Fix (URL): Change regex to path.replace(/\/index$/, '') (only strip index at the end). DO NOT strip underscores.
 * The Fix (Search): Add this specific normalization line before filtering:
   const normalize = (str) => str.toLowerCase().replace(/['’]/g, ""); // Strips both smart and straight quotes

 * Acceptance Test: Open _Test-4.astro. Preview URL must contain _Test-4. Search for let's and find let’s.
4. Anti-Blinker Mandates
 * The "Internal Router" Rule: You are FORBIDDEN from using window.history, window.location, or <a> tags for internal app navigation. You MUST use setCurrentPath from UIContext.
 * The "Legacy Code" Rule: If a component is commented out (like <EditorHeader />), LEAVE IT DEAD. Do not uncomment code to "fix" a missing UI element; check the new component (EditorCanvas) instead.
 * The "Playwright" Mandate: You have the environment setup. Before marking any snag as [FIXED], you must run the Playwright verification script. If you cannot run it, you must explicitly state "UNVERIFIED" in the log.
5. Playwright Verification (The "No Excuse" Clause)
Since you have the Playwright environment setup, tell Agent 7 (The Auditor):
> "Run npx playwright test --headed. Watch the 'Move File' test. If it fails with a 500 error, do not merge the PR. The 'File Already Exists' error is likely a failure to clean up the .json shadow file in the previous test run."
> 

## 🛡️ Anti-Blinker Mandates (Updated)
 * Agent 1 & 4 Warning: Special characters (_, -) are causing pathing failures. Do not use generic regex [a-z]*. You must support [a-zA-Z0-9-_]*.
 * Agent 2 Warning: "State" is fragile. Do not assume the component re-renders correctly after a delete. Force the state update.
 * Strict Branching: Work ONLY on snag-squad.
