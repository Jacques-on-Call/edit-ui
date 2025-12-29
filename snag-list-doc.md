# Snag List & Technical Jargon

This document outlines a list of known issues ("snags") and their agreed-upon solutions, including a detailed technical plan for each. It also serves as a glossary for technical terms used during development.

NB: Follow Agents.md instructions 
---

## Snag List
 
Search currently works like this, and term is highlighted. But “let’s” returns nothing.  EDITING_GUIDE.md should be EDITING_GUIDE and Get/README

🔍 Let
Search Results
EDITING_GUIDE.md
...visual design (the components) is completely separate from the content (the fron...
README.md
Get/README.md
...ges where users can sign up for a newsletter, a trial, or an account.



## Context Menu: Rename & Move

*   **Problem:** The context menu is missing a "Rename" option. The "Move" modal is broken: it shows the entire repo tree instead of just `src/pages`, and folders within the tree do not expand.
*   **Agreed Solution:** Add a "Rename" feature that uses a simple modal. Fix the "Move" modal to be scoped to `src/pages` and ensure its folder tree is fully expandable.

#### Technical Implementation Plan

1.  **Implement Rename:**
    *   **Frontend (`FileContextMenu.jsx`):** Add a "Rename" menu item.
    *   **Frontend (`FileExplorer.jsx`):**
        *   Add a `'rename'` case to `handleContextMenuAction`.
        *   This will trigger a new state, e.g., `setFileToRename(file)`.
        *   Create a new component, `RenameModal.jsx`. It will render when `fileToRename` is set.
        *   The modal will contain a text input (pre-filled with the current name) and a "Save" button. On save, it will call a new backend endpoint.
    *   **Backend (`cloudflare-worker-src/router.js`):**
        *   Create a new endpoint: `POST /api/files/rename`.
        *   **Logic:** The GitHub API does not have a native rename/move operation. It must be implemented as a "create new, then delete old" sequence. The handler will:
            1.  Read the content of the original file (`GET /repos/{owner}/{repo}/contents/{path}`).
            2.  Create a new file with the new name but the same content (`PUT /repos/{owner}/{repo}/contents/{new_path}`).
            3.  Delete the original file (`DELETE /repos/{owner}/{repo}/contents/{path}`).
2.  **Fix Move Modal:**
    *   **Backend (`cloudflare-worker-src/router.js`):** Create a new, dedicated endpoint to fetch the directory structure for the move modal, e.g., `GET /api/files/tree?path=src/pages`. This endpoint will recursively fetch and return the directory structure starting only from `src/pages`.
    *   **Frontend (`MoveModal.jsx`):**
        *   Update the component to call the new `/api/files/tree` endpoint instead of the generic file list endpoint.
        *   Investigate and fix the file tree rendering logic to correctly handle state for expanding and collapsing nested folders.
3.  **Testing Steps:**
    *   **Rename:** Verify the "Rename" option appears and opens a modal. Confirm that saving a new name successfully renames the file in the UI and the repo.
    *   **Move:** Verify the "Move" modal only shows the `src/pages` directory. Confirm that all folders are expandable. Confirm that moving a file works as expected.

---

## Creating New Files

*   **Problem:** The "Create" menu creates files in a hardcoded location, not the user's current directory.
*   **Agreed Solution:** New files and folders should be created within the directory the user is currently viewing in the File Explorer.

#### Technical Implementation Plan

1.  **Modify Frontend Logic:**
    *   **File:** `easy-seo/src/pages/FileExplorerPage.jsx`
    *   **Function:** `handleCreate`
    *   **Action:** The function currently uses hardcoded paths to construct the new file locations. This needs to be changed to use the `currentPath` state variable, which is already available in the component.
    *   **Logic:** The `jsonPath` and `astroPath` variables will be dynamically constructed by joining `currentPath` with the new file name provided by the user.
2.  **Testing Steps:**
    *   **Test:** Navigate into a subdirectory (e.g., `src/pages/blog`).
    *   **Test:** Use the "Create" menu to create a new file.
    *   **Confirm:** Verify the new file is created inside the `blog` directory, both in the UI and in the physical repository structure.

---

## Content Editor Toolbar

*   **Problem:** The experimental floating toolbar is unreliable and difficult to use.
*   **Agreed Solution:** [DONE - 2025-12-29] Shelve the floating toolbar. Implement a new "Side Panel" toolbar that slides out from the left app edge when text is selected. This panel will contain the full set of styling options and will slide *over* the content.

#### Technical Implementation Plan

1.  **Shelve Floating Toolbar:**
    *   **File:** `easy-seo/src/pages/ContentEditorPage.jsx` (or its parent).
    *   **Action:** Locate where the `<FloatingToolbar />` component is being rendered and comment it out. Do not delete the component's file.
2.  **Create a Reusable Toolbar Component:**
    *   **Refactor:** Extract the button and dropdown logic from `easy-seo/src/components/EditorHeader.jsx` into a new, reusable component named `StyleToolbarContent.jsx`. This will prevent code duplication.
3.  **Create the Side Panel Component:**
    *   **File:** Create `easy-seo/src/components/SidePanelToolbar.jsx`.
    *   **Content:** This component will import and render `<StyleToolbarContent />`.
    *   **Styling (CSS):**
        *   Use `position: fixed` or `position: absolute`.
        *   Position it off-screen to the left: `left: 0; transform: translateX(-100%);`.
        *   Add a `transition: transform 0.3s ease-in-out;` for smooth animation.
        *   Create an `is-open` CSS class that changes the transform to `translateX(0)`.
4.  **Implement Show/Hide Logic:**
    *   **File:** `easy-seo/src/contexts/EditorContext.jsx` or `easy-seo/src/pages/ContentEditorPage.jsx`.
    *   **State:** Introduce a new state variable, `isSidePanelOpen`.
    *   **Logic:**
        *   Use a `useEffect` hook to monitor the `selectionState` from the `EditorContext`.
        *   If the selection is not collapsed (i.e., text is selected), set `isSidePanelOpen` to `true`.
        *   If the selection is collapsed, set `isSidePanelOpen` to `false`.
    *   **Rendering:** Render `<SidePanelToolbar />` in `ContentEditorPage.jsx` and pass `isSidePanelOpen` as a prop, which will be used to toggle the `is-open` class.
5.  **Implement Closing Behavior:**
    *   Add an 'X' button to the `SidePanelToolbar` that sets `isSidePanelOpen` to `false`.
    *   In `SidePanelToolbar.jsx`, add a `useEffect` hook that, when the panel is open, adds a global `mousedown` event listener to the `document`. If a mousedown event occurs outside the panel, it will set `isSidePanelOpen` to `false`. Remember to clean up this listener when the component unmounts or the panel closes.
6.  **Testing Steps:**
    *   **Verify:** Confirm the old floating toolbar no longer appears.
    *   **Test:** Select text in the editor. A panel should slide in smoothly from the left.
    *   **Verify:** The panel should contain all the styling options (Bold, Italic, etc.).
    *   **Test:** Use the buttons in the panel to apply styles. Confirm they work correctly.
    *   **Test:** Click the 'X' button. The panel should slide away.
    *   **Test:** Click anywhere on the page outside the panel. The panel should slide away.
    *   **Test:** Deselect the text. The panel should slide away.

---

## Incorrect Preview Page Displayed

*   **Problem:** Clicking "Preview" for a specific page (e.g., `_new-index.astro`) incorrectly shows the site's main index page instead of the page being edited.
*   **Agreed Solution:** The preview `<iframe>` must load the correct URL corresponding to the file being edited.

#### Technical Implementation Plan

1.  **Investigate Frontend URL Generation:**
    *   **File:** `easy-seo/src/pages/ContentEditorPage.jsx`
    *   **Variable:** `previewUrl` (created with `useMemo`).
    *   **Function:** `generatePreviewPath`.
    *   **Action:** Analyze the logic inside `generatePreviewPath`. The issue likely stems from how filenames containing "index" (like `_new-index.astro`) are processed. The current logic may be too aggressive, incorrectly treating it like a standard `index.astro` file.
2.  **Modify URL Generation Logic:**
    *   **File:** `easy-seo/src/pages/ContentEditorPage.jsx`
    *   **Action:** Refine the `generatePreviewPath` function to be more precise.
        *   It should specifically check if a path segment *ends with* `/index`, not just if it contains "index".
        *   It should correctly handle filenames that start with an underscore.
        *   The final generated path for `src/pages/_new-index.astro` should resolve to `/_new-index/`, not `/`.
3.  **Testing Steps:**
    *   **Test:** Create a new page with a name like `_test-page.astro`.
    *   **Test:** Open this page in the editor.
    *   **Test:** Click the "Preview" button.
    *   **Confirm:** The `<iframe>`'s `src` attribute should point to a URL like `https://strategycontent.pages.dev/_test-page/`.
    *   **Confirm:** The content displayed in the iframe must be from the `_test-page.astro` file, not the site's homepage.

---

## Editor UI Visible in Preview Mode

*   **Problem:** Editor-specific UI elements (like the slide-out toolbar's hamburger icon) are visible on top of the preview `<iframe>`.
*   **Agreed Solution:** All editor-specific UI must be hidden when the `viewMode` is set to `livePreview`.

#### Technical Implementation Plan

1.  **Isolate Editor UI Components:**
    *   **File:** `easy-seo/src/components/EditorCanvas.jsx` and `easy-seo/src/pages/ContentEditorPage.jsx`.
    *   **Action:** Inspect the JSX structure to identify all components that are part of the "editor UI". This includes the header, any menu toggles (like the hamburger icon), the bottom action bar, and the planned side panel.
2.  **Implement Conditional Rendering:**
    *   **File:** `easy-seo/src/components/EditorCanvas.jsx`.
    *   **Logic:** The component already receives a `viewMode` prop. Wrap all identified editor UI components in a conditional render block based on this prop.
    *   **Example:** `{viewMode === 'editor' && <EditorUIComponent />}`.
    *   **Action:** This ensures these components are completely removed from the DOM when `viewMode` is `'livePreview'`, preventing them from appearing over the `<iframe>`.
3.  **Testing Steps:**
    *   **Test:** Open any page in the editor.
    *   **Verify:** Confirm the complete editor UI (header, bottom bar, etc.) is visible.
    *   **Test:** Click the "Preview" button.
    *   **Confirm:** The `<iframe>` should be visible, and absolutely no editor-specific UI elements should be visible.
    *   **Test:** Toggle back to the editor view.
    *   **Confirm:** The complete editor UI should reappear correctly.

---

## Repository selection snag

• Observed problem: The repository picker lists incompatible or empty repositories and sometimes surfaces the wrong project (e.g., Edit UI / easy-SEO) while the intended site repo (Strategy Content) is missing, creating confusion and blocking the editing flow.
• Desired behavior: Only show repositories that are valid for the editor. Strategy Content should appear; Edit UI (easy-SEO) should not, unless it meets the editor criteria.


---

### Eligibility rule for repos

• Primary rule: Include repositories that have a root-level src/pages/ directory.
• Optional fallback: If src/pages/ is missing, allow a repo with a valid site entry point (e.g., src/content/ or a pages/ at root) if we explicitly support it. Otherwise, exclude.


---

### Technical implementation plan

1. Backend filtering• File: cloudflare-worker-src/router.js
• Endpoint: /api/user/repos
• Logic:• Fetch: Get user repos (as is).
• Validate: For each repo, call GET /repos/{owner}/{repo}/contents/src/pages.• 200 OK: Include repo.
• 404 Not Found: Exclude repo.

• Optional extensions: Support additional allowed paths via a small whitelist array (e.g., ['src/pages', 'pages']) so Strategy Content isn’t wrongly excluded if it uses a supported alternative.

• Performance:• Batch: Limit concurrent validation calls.
• Cache: Memoize successful directory checks per repo commit SHA for short TTL to avoid rate limits.


2. Frontend display• Filter: Render only the validated repo list.
• Ranking:• Promote: Place Strategy Content at the top if it matches eligibility.
• Demote: Push non-eligible repos out of the list entirely (no greyed-out noise).


3. Testing• API verification: Confirm /api/user/repos returns only repos with allowed directories.
• UI verification: Ensure Strategy Content is visible; Edit UI (easy-SEO) is hidden when ineligible.
• Edge cases: Private repos, rate limits, nested src/pages (reject), monorepos (see below).



---

### Empty state and creation flow

• Empty state trigger: If the filtered list is empty after validation.
• UI guidance:• Message: “No compatible repositories found.”
• Actions:• Create new repo: Offer a “Create site repo” button.
• Use template: Provide a starter with src/pages/ pre-populated to ensure eligibility.
• Manual setup help: Short checklist to convert an existing repo.


• Backend support (optional):• Create via API: POST /user/repos with name and description.
• Initialize content: Commit a minimal scaffold (src/pages/index.md, basic config) via PUT /repos/{owner}/{repo}/contents/... with a single initial commit.
• Return new repo: Re-run validation and show the newly created repo immediately.



---

### Monorepo consideration

• Policy: Only accept repos where src/pages/ exists at the repo root.
• Future extension: If monorepos are common, add a directory picker after repo selection to choose a valid subpath, then store that path for the editor session.


---

### Acceptance criteria

• Visibility: Strategy Content appears in the list; Edit UI (easy-SEO) does not unless it has src/pages/.
• Signal: No empty or incompatible repos are shown.
• Resilience: If no eligible repos exist, the user can create a compatible repo in one step and start editing immediately.


If Strategy Content uses a slightly different structure, share its exact path layout and we’ll add it to the whitelist so it’s recognized without weakening the rule.


## File rename 
when i renamed a file i noticed that the new file with the new name was a new file and not a copy of the old file. so blank new file with empty componenets. 

## move file
I noticed when I move a file the file moves to where I select but the paths within the the file dont update causing the file in the new location to become an invalid file that cant be opened in the editor.

## debug feature modal
looks good so far but when i click submit nothing happens modal stays on screen none of the buttons do anything and I cant copy logs, that said I hope last lines of console can be included in bug submits as Im sure that would be very helpful. as I can see the new modal also has no log calls. also it only is in the content editor why not in all sections/ pages as it can be a very useful tool to commision agents to tackle isues as the appear.

