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

## Snag List
 
revised snags by Notebook LLM: Based on the latest reports and technical findings, the system health is currently rated as **🔴 Red**, indicating significant architectural drift and unresolved critical bugs [1, 2]. 

Below is the updated, detailed **Snag List** followed by strategic questions for the Jules team to ensure tomorrow's tasks are executed with precision.

### **Updated Detailed Snag List**

#### **1. Non-Functional SidePanelToolbar (Critical UI Regression)**
*   **Problem:** The recently added "Side Panel" toolbar is completely non-functional [2].
*   **Location:** `easy-seo/src/pages/ContentEditorPage.jsx`, `easy-seo/src/components/EditorCanvas.jsx`, and `SidePanelToolbar.jsx` [2, 3].
*   **Analysis:** The issue stems from **missing state management logic** in the main `ContentEditorPage.jsx` shell, preventing the toolbar from interacting with the editor's active state [1, 2].
*   **Requirement:** Compare implementation details across these files to reconcile state flow [3].

#### **2. UI Overlap in Preview Mode**
*   **Problem:** Editor-specific UI elements (like the hamburger icon) remain visible on top of the preview `<iframe>` [4].
*   **Location:** `easy-seo/src/components/EditorCanvas.jsx` [1, 4].
*   **Analysis:** `EditorCanvas.jsx` lacks the **conditional rendering logic** needed to hide the editor interface when `viewMode` is set to `livePreview` [1, 5].

#### **3. Incorrect Preview URL Generation**
*   **Problem:** The preview loads the main index page instead of the specific page being edited, particularly for files like `_new-index.astro` [6].
*   **Location:** `generatePreviewPath` function in `ContentEditorPage.jsx` [6, 7].
*   **Analysis:** The logic `result.endsWith('index')` is too aggressive and **insufficient to handle all filenames**, especially those starting with underscores [3, 7].

#### **4. File Explorer Navigation Regression**
*   **Problem:** The "Back" and "Home" buttons in the file explorer bottom action bar have stopped working specifically for `src/pages` folders [8].
*   **Location:** `easy-seo/src/components/BottomActionBar.jsx` or parent navigation logic [8].
*   **Analysis:** This is a suspected regression introduced during recent snag fixes [8].

#### **5. Debug Modal and Log Copy Failure**
*   **Problem:** Clicking "Submit" does nothing; the modal remains on screen. Additionally, logs cannot be copied, and the modal lacks log calls [9].
*   **Requirement:** Integrate the last lines of the console in bug submissions and ensure functionality across all app sections, not just the content editor [9].

#### **6. File Rename Data Loss**
*   **Problem:** Renaming a file creates a blank new file with empty components instead of duplicating the original file's content [10].
*   **Requirement:** Ensure the backend uses a "read-write-delete" atomic sequence to maintain content integrity [11, 12].

#### **7. Search Logic Failure (Apostrophes)**
*   **Problem:** Searching for terms containing apostrophes (e.g., "let’s") returns zero results despite the term existing in files [13].
*   **Location:** Search utility/backend search handler [13].

---

### **Questions for the Jules Team**

To ensure we move from **"Silent Failure"** to **"Visible Success,"** please address the following technical queries:

1.  **Path Logic:** Regarding the `handleCreate` function in `FileExplorerPage.jsx`, how is the path constructed when `currentPath` is highly nested? Is there a risk of double-slashes or incorrect relative paths? [3]
2.  **State Reconcilliation:** Why was the state management logic required for the `SidePanelToolbar` omitted from `ContentEditorPage.jsx` during the last implementation phase? [2, 3]
3.  **Worker Documentation:** The introduction of the Cloudflare worker and new authentication flow happened in a single commit without documentation. Can you provide the **logic map** for `cloudflare-worker-src/router.js` to help identify suspected regressions? [2, 14]
4.  **Performance Bottlenecks:** Users are reporting a typing delay on computers that isn't present in standard word processors. Is this caused by the **autosave debounce** or excessive re-renders in `LexicalField`? [8, 15]
5.  **Visibility Strategy:** To avoid future "Red" health ratings, how can we modify the backend handlers to **fail visibly** (forwarding actual error messages) rather than returning empty arrays? [16, 17]

**Analogy for Today's Stand-up:**
Implementing these fixes without answering these questions is like **trying to fix a car engine while the hood is locked**. The Auditor's report has given us the "Check Engine" light (The Snag List); now we need the Jules team to provide the **mechanic's manual** (The Technical Details) so we can actually reach in and fix the parts that are broken.
