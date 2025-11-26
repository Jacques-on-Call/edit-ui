# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page. Handles the file creation logic (now client-side drafts) and passes data down to the `FileExplorer` component.
-   **`src/pages/ContentEditorPage.jsx`**: The main shell for the content editor. Responsible for loading and saving full draft payloads to `localStorage` and providing the `EditorContext`.

### **Contexts**
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/contexts/EditorContext.jsx`**: Manages the currently active editor instance, allowing the global toolbar to communicate with the focused editor field.

### **Styling**

-   **`src/pages/ContentEditorPage.css`**: Contains the responsive styles for the content editor page, including the mobile-first grid layout and drawer animations.
-   **`src/components/EditorHeader.css`**: Styles specific to the `EditorHeader` component, including the toolbar button styles.
-   **`src/components/BottomActionBar.css`**: Styles specific to the `BottomActionBar` component.

### **Utilities**

-   **`src/lib/fetchJson.js`**: A robust, centralized utility for making `fetch` requests to the backend API.
-   **`src/lib/mockApi.js`**: A mock API for the content editor, used for fetching and saving page data to `localStorage`.

### **Components**

-   **`src/components/FileExplorer.jsx`**: The core file explorer component. Fetches repository files and merges them with client-side drafts from `localStorage` to create a unified file list.
-   **`src/components/FileTile.jsx`**: Renders a single file or folder tile. Now displays "Draft" and "Live" badges based on the file's status.
-   **`src/components/ReadmeDisplay.jsx`**: Renders the README.md file.
-   **`src/components/Icon.jsx`**: A wrapper for the lucide-preact icon library.
-   **`src/components/ContextMenu.jsx`**: Renders a right-click/long-press context menu.
-   **`src/components/CreateModal.jsx`**: Renders a modal for creating new files and folders.
-   **`src/components/SearchBar.jsx`**: A debounced search input component.
-   **`src/components/EditorHeader.jsx`**: The header component for the content editor. Now context-aware.
-   **`src/components/BlockTree.jsx`**: The component for displaying the block structure of a page.
-   **`src/components/BottomActionBar.jsx`**: The bottom action bar for the content editor.
-   **`src/components/editor-components/LexicalField.jsx`**: A self-contained, reusable rich-text field powered by Lexical. Replaced the former `EditableField`.

### **Hooks**

-   **`src/hooks/useFileManifest.js`**: Custom hook for fetching the file manifest of a repository.
-   **`src/hooks/useSearch.js`**: Custom hook for performing client-side search.
-   **`src/hooks/useAutosave.js`**: A debounced autosave hook for the content editor that also exposes an `isSaving` state.

### **Test & Verification Files**

-   **`/src/pages/_test/home.astro`**: A test file in the root repository to verify navigation to the editor.
-   **`public/preview/mock-preview.html`**: A static HTML file that acts as the target for the editor's preview iframe.
