# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page. Handles the file creation logic (now client-side drafts) and passes data down to the `FileExplorer` component.
-   **`src/pages/ContentEditorPage.jsx`**: The main shell for the content editor. Responsible for loading and saving full draft payloads to `localStorage` and providing the `EditorContext`. Supports three view modes: editor, localPreview, and livePreview.

### **Contexts**
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/contexts/EditorContext.jsx`**: Manages the currently active editor instance, allowing the global toolbar to communicate with the focused editor field.
-   **`src/contexts/UIContext.jsx`**: Manages the state of global UI elements, such as modals.

### **Styling**

-   **`src/pages/ContentEditorPage.css`**: Contains the responsive styles for the content editor page, including the mobile-first grid layout and drawer animations.
-   **`src/components/EditorHeader.css`**: Styles specific to the `EditorHeader` component, including the toolbar button styles.
-   **`src/components/BottomActionBar.css`**: Styles specific to the `BottomActionBar` component.

### **Utilities**

-   **`src/lib/fetchJson.js`**: A robust, centralized utility for making `fetch` requests to the backend API.
-   **`src/lib/mockApi.js`**: A mock API for the content editor, used for fetching and saving page data to `localStorage`.
-   **`src/lib/imageHelpers.js`**: Helper functions for transforming repository image paths to GitHub raw URLs for editor preview.

### **Components**

-   **`src/components/FileExplorer.jsx`**: The core file explorer component. Fetches repository files and merges them with client-side drafts from `localStorage` to create a unified file list.
-   **`src/components/FileTile.jsx`**: Renders a single file or folder tile. Now displays "Draft" and "Live" badges based on the file's status.
-   **`src/components/ReadmeDisplay.jsx`**: Renders the README.md file.
-   **`src/components/Icon.jsx`**: A wrapper for the lucide-preact icon library.
-   **`src/components/ContextMenu.jsx`**: Renders a right-click/long-press context menu.
-   **`src/components/CreateModal.jsx`**: Renders a modal for creating new files and folders.
-   **`src/components/AddSectionModal.jsx`**: Renders a modal for selecting and configuring new content sections before adding them to a page. Supports image upload for both Hero and Text sections.
-   **`src/components/ImageUploader.jsx`**: Component for uploading images to the repository. Shows upload status (idle, uploading, success, error).
-   **`src/components/LocalPreview.jsx`**: Renders content locally for instant feedback before syncing to GitHub. No build required.
-   **`src/components/SearchBar.jsx`**: A debounced search input component.
-   **`src/components/EditorHeader.jsx`**: The header component for the content editor. Now context-aware.
-   **`src/components/BlockTree.jsx`**: The component for displaying the block structure of a page.
-   **`src/components/BottomActionBar.jsx`**: The bottom action bar for the content editor. Supports three view modes with appropriate icons.
-   **`src/components/SectionsEditor.jsx`**: The main component for rendering and managing the different sections of a page.
-   **`src/components/LexicalEditor.jsx`**: The core rich-text editor component, built on Lexical.

#### **Editor Components (`src/components/editor-components`)**
-   **`registry.js`**: Maps section type strings (e.g., 'hero', 'bodySection') to their corresponding editor components.
-   **`BodySectionEditor.jsx`**: The editor component for a standard block of text with a title and a body. Includes error handling for images.
-   **`HeroEditor.jsx`**: The editor component for the hero section. Supports feature images and background images with error handling.
-   **`FooterEditor.jsx`**: The editor component for the footer section.
-   **`LexicalField.jsx`**: A self-contained, reusable rich-text field powered by Lexical.

### **Hooks**

-   **`src/hooks/useFileManifest.js`**: Custom hook for fetching the file manifest of a repository.
-   **`src/hooks/useSearch.js`**: Custom hook for performing client-side search.
-   **`src/hooks/useAutosave.js`**: A debounced autosave hook for the content editor that also exposes an `isSaving` state.

### **Test & Verification Files**

-   **`/src/pages/_test/home.astro`**: A test file in the root repository to verify navigation to the editor.
-   **`public/preview/mock-preview.html`**: A static HTML file that acts as the target for the editor's preview iframe.
