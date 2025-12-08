# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page. Handles the file creation logic (now client-side drafts) and passes data down to the `FileExplorer` component.
-   **`src/pages/ContentEditorPage.jsx`**: The main shell for the content editor. Responsible for loading and saving full draft payloads to `localStorage` and providing the `EditorContext`. Supports two view modes: editor and livePreview.

### **Contexts**
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/contexts/EditorContext.jsx`**: Manages the currently active editor instance, selection state, and handleAction function. Provides central routing for all toolbar actions (formatting, insert) to the active Lexical editor API. Critical for dual toolbar system.
-   **`src/contexts/UIContext.jsx`**: Manages the state of global UI elements, such as modals.

### **Styling**

-   **`src/pages/ContentEditorPage.css`**: Contains the responsive styles for the content editor page, including the mobile-first grid layout and drawer animations.
-   **`src/components/EditorHeader.css`**: DEPRECATED - Previously contained toolbar styles. Merged into editor.css.
-   **`src/styles/editor.css`**: Comprehensive editor styling including FloatingToolbar, VerticalToolbox, HamburgerTrigger, and animations. Includes proper z-index layering and responsive styles.
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
-   **`src/components/AddSectionModal.jsx`**: Renders a modal for selecting and configuring new content sections before adding them to a page. Supports image upload for both Hero and Text sections. In edit mode, shows ImageEditor for existing images.
-   **`src/components/ImageUploader.jsx`**: Component for uploading new images to the repository. Shows upload status (idle, uploading, success, error). Includes SEO score, alt text, filename, title, description, and resize options.
-   **`src/components/ImageEditor.jsx`**: Component for editing existing images in sections. Shows image preview, allows editing filename (SEO-friendly), alt text, title, description, and loading strategy. Includes SEO score and option to replace the image.
-   **`src/components/SearchBar.jsx`**: A debounced search input component.
-   **`src/components/EditorHeader.jsx`**: DEPRECATED - Previously contained the fixed header toolbar. Replaced by FloatingToolbar and VerticalToolbox in December 2025.
-   **`src/components/FloatingToolbar.jsx`**: Comprehensive context-aware formatting toolbar that appears above text selection. Features include: text formatting (bold, italic, underline, strikethrough, code), block format dropdown (Normal, H1-H6), alignment dropdown (left/center/right/justify), lists (bullet/numbered), link insertion, text/highlight color pickers with predefined palettes, and clear formatting. Includes debugMode for detailed console logging of selection and positioning. Uses window.visualViewport for accurate mobile positioning. Validates selection is within editorRootSelector before showing. Renders via portal to document.body with proper z-index layering. Auto-positions and follows scroll/resize.
-   **`src/components/VerticalToolbox.jsx`**: Comprehensive slide-out left sidebar for cursor-position insert actions. Organized by categories: Headings (H2-H6), Lists (bullet/numbered), Structure (horizontal rule, page break, table), Media (image), Layout (columns, collapsible), Utility (date), History (undo/redo - only in vertical toolbar). Accessed via HamburgerTrigger. Features backdrop overlay, keyboard navigation (Escape to close), click-outside-to-close, and auto-close after action selection.
-   **`src/components/HamburgerTrigger.jsx`**: Floating hamburger button in top-left corner that opens/closes the VerticalToolbox. Fixed positioning with hover and active states.
-   **`src/components/BlockTree.jsx`**: The component for displaying the block structure of a page.
-   **`src/components/BottomActionBar.jsx`**: The bottom action bar for the content editor. Supports editor and preview view modes with appropriate icons.
-   **`src/components/SectionsEditor.jsx`**: The main component for rendering and managing the different sections of a page.
-   **`src/components/LexicalEditor.jsx`**: The core rich-text editor component, built on Lexical.
-   **`src/components/ColorPicker.jsx`**: A cross-platform color picker component for text and highlight colors. Features:
    - Preset color swatches with touch-optimized selection
    - Hex input for custom colors
    - Native HTML5 color input fallback (works on iOS Safari and all browsers)
    - EyeDropper API support (Chrome/Edge only)
    - Portal-based rendering for reliable mobile/keyboard handling
-   **`src/components/Dropdown.jsx`**: A reusable dropdown component for toolbar menus. Uses a portal pattern for reliable mobile rendering.

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
