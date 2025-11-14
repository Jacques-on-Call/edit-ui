# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout.
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page.
-   **`src/pages/ContentEditorPage.jsx`**: The main shell for the content editor. Orchestrates the block tree, content area, inspector, and preview panes.

### **Styling**

-   **`src/pages/ContentEditorPage.css`**: Contains the responsive styles for the content editor page, including the mobile-first grid layout and drawer animations.
-   **`src/components/EditorHeader.css`**: Styles specific to the `EditorHeader` component.
-   **`src/components/BottomActionBar.css`**: Styles specific to the `BottomActionBar` component.

### **Utilities**

-   **`src/lib/fetchJson.js`**: A robust, centralized utility for making `fetch` requests to the backend API.
-   **`src/lib/mockApi.js`**: A mock API for the content editor, used for fetching and saving page data to `localStorage`.

### **Components**

-   **`src/components/FileExplorer.jsx`**: The core file explorer component.
-   **`src/components/FileTile.jsx`**: Renders a single file or folder tile.
-   **`src/components/ReadmeDisplay.jsx`**: Renders the README.md file.
-   **`src/components/Icon.jsx`**: A wrapper for the lucide-preact icon library.
-   **`src/components/ContextMenu.jsx`**: Renders a right-click/long-press context menu.
-   **`src/components/CreateModal.jsx`**: Renders a modal for creating new files and folders.
-   **`src/components/SearchBar.jsx`**: A debounced search input component.
-   **`src/components/EditorHeader.jsx`**: The header component for the content editor.
-   **`src/components/BlockTree.jsx`**: The component for displaying the block structure of a page.
-   **`src/components/BottomActionBar.jsx`**: The bottom action bar for the content editor.

### **Hooks**

-   **`src/hooks/useFileManifest.js`**: Custom hook for fetching the file manifest of a repository.
-   **`src/hooks/useSearch.js`**: Custom hook for performing client-side search.
-   **`src/hooks/useAutosave.js`**: A debounced autosave hook for the content editor that also exposes an `isSaving` state.

### **Test & Verification Files**

-   **`/src/pages/_test/home.astro`**: A test file in the root repository to verify navigation to the editor.
-   **`public/preview/mock-preview.html`**: A static HTML file that acts as the target for the editor's preview iframe.
