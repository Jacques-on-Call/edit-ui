# File Registry

This document lists all significant files in the `easy-seo` project, along with their purpose.

---

### **Core Application Logic**

-   **`src/app.jsx`**: The main application component. Handles routing and global layout. **Modified in this task** to conditionally hide the global `<header>` and remove its associated top padding on any route starting with `/editor`. This provides a true, full-screen experience and resolves a bug where a blank space would appear when scrolling.
-   **`src/pages/LoginPage.jsx`**: The user login page.
-   **`src/pages/RepoSelectPage.jsx`**: The repository selection page.
-   **`src/pages/FileExplorerPage.jsx`**: The main file explorer page. This is a container component that manages the `currentPath` state for the file explorer and provides the navigation logic (`handleGoBack`, `handleGoHome`) to the `BottomActionBar`.
-   **`src/pages/ContentEditorPage.jsx`**: The main shell for the content editor. Responsible for loading file content based on the full file path received from the explorer. It uses a path-based API endpoint (`/api/get-file-content`) to reliably fetch draft or live content. Manages local drafts in `localStorage` and provides the `EditorContext`. Supports two view modes: editor and livePreview.

### **Contexts**
-   **`src/contexts/AuthContext.jsx`**: Manages global authentication state.
-   **`src/contexts/EditorContext.jsx`**: Manages the currently active editor instance, selection state, and handleAction function. Provides central routing for all toolbar actions (formatting, insert) to the active Lexical editor API. Critical for dual toolbar system.
-   **`src/contexts/UIContext.jsx`**: Manages the state of global UI elements, such as modals.

### **Styling**

-   **`src/components/UnifiedLiquidRail.css`**: Stylesheet for the **Unified Liquid Rail**. **Modified in this task** to implement the new "Double-Decker" capsule design. This includes the "gluing" logic for dynamic corner radii, the two-button trigger group, and the `dvh`-based, keyboard-safe scrolling fix.
-   **`src/pages/ContentEditorPage.css`**: Contains the responsive styles for the content editor page, including the mobile-first grid layout and drawer animations.
-   **`src/styles/editor.css`**: Comprehensive editor styling including VerticalToolbox, HamburgerTrigger, collapsible category groups, and animations. Includes proper z-index layering and responsive styles.
-   **`src/styles/FloatingToolbar.css`**: Dedicated stylesheet for FloatingToolbar component. Includes toolbar container, buttons, dropdowns (block format, alignment), color pickers (text and highlight), toolbar dividers, and fade-in animations. High z-index (10000 for toolbar, 10001 for dropdowns) ensures proper layering above content.
-   **`src/components/BottomActionBar.css`**: Styles specific to the `BottomActionBar` component.

### **Utilities**

-   **`src/lib/fetchJson.js`**: A robust, centralized utility for making `fetch` requests to the backend API.
-   **`src/lib/mockApi.js`**: A mock API for the content editor, used for fetching and saving page data to `localStorage`.
-   **`src/lib/imageHelpers.js`**: Helper functions for transforming repository image paths to GitHub raw URLs for editor preview.
-   **`src/utils/text.js`**: Shared text utility functions, including a `normalize` function for consistent search behavior.
-   **`docs/COOKIE-POLICY-GUIDE.md`**: Canonical guidance for required cookie attributes for OAuth (`gh_session`) and CSRF state (`gh_oauth_state`) cookies.

### **Components**

-   **`src/components/FileExplorer.jsx`**: The core file explorer component. Fetches repository files for the current directory by using a dynamic `currentPath` prop in its API calls. It merges client-side drafts from `localStorage` to create a unified file list and handles folder navigation by updating the `currentPath` state via its parent, `FileExplorerPage`.
-   **`src/components/FileTile.jsx`**: Renders a single file or folder tile. Now displays "Draft" and "Live" badges based on the file's status.
-   **`src/components/ReadmeDisplay.jsx`**: Renders the README.md file.
-   **`src/components/Icon.jsx`**: A wrapper for the lucide-preact icon library.
-   **`src/components/ContextMenu.jsx`**: Renders a right-click/long-press context menu.
-   **`src/components/CreateModal.jsx`**: Renders a modal for creating new files and folders.
-   **`src/components/AddSectionModal.jsx`**: Renders a modal for selecting and configuring new content sections before adding them to a page. Supports image upload for both Hero and Text sections. In edit mode, shows ImageEditor for existing images.
-   **`src/components/ImageUploader.jsx`**: Component for uploading new images to the repository. Shows upload status (idle, uploading, success, error). Includes SEO score, alt text, filename, title, description, and resize options.
-   **`src/components/ImageEditor.jsx`**: Component for editing existing images in sections. Shows image preview, allows editing filename (SEO-friendly), alt text, title, description, and loading strategy. Includes SEO score and option to replace the image.
-   **`src/components/SearchBar.jsx`**: A debounced search input component.
-   **`src/components/UnifiedLiquidRail.jsx`**: The primary editor toolbar. **Modified in this task** to implement the new "Double-Decker" capsule architecture. It now renders a two-button trigger for "Style" and "Add" modes and uses a simplified `activeMode` state for cleaner logic. It also includes a critical `useEffect` hook to automatically open the "Style" mode on text selection.
-   **`src/components/FloatingToolbar.jsx`**: Comprehensive context-aware formatting toolbar that appears above text selection. Features include: text formatting (bold, italic, underline, strikethrough, code), block format dropdown (Normal, H1-H6), alignment dropdown (left/center/right/justify), lists (bullet/numbered), link insertion, text/highlight color pickers with predefined palettes, and clear formatting. **Mobile optimizations:** Only shows when selection text is non-empty (`selection.toString().trim().length > 0`) to prevent keyboard loops. Selection deduplication using unique key tracking. Rate limiting with requestAnimationFrame cancellation. Includes debugMode for detailed console logging with explicit hide reasons. Uses window.visualViewport for accurate mobile positioning during pinch-zoom. Validates selection is within editorRootSelector before showing. Optional caretMode prop (default: false) to show on collapsed selection. Renders via portal to document.body with proper z-index layering. Auto-positions and follows scroll/resize. Imports FloatingToolbar.css.
-   **`src/components/VerticalToolbox.jsx`**: Comprehensive slide-out left sidebar for cursor-position insert actions. **Collapsible category groups (accordion pattern):** Click group header to expand/collapse, reduces height on mobile. History group (Undo/Redo) at top, expanded by default. Organized by categories: History (undo/redo - only in vertical toolbar, NOT in floating toolbar), Headings (H2-H6, duplicates from FloatingToolbar), Lists (bullet/numbered), Structure (horizontal rule, page break, table), Media (image), Layout (columns, collapsible), Utility (date). Accessed via HamburgerTrigger. Features smooth expand/collapse animations with chevron rotation. Backdrop overlay, keyboard navigation (Escape to close), click-outside-to-close, and auto-close after action selection. Proper ARIA attributes for accessibility.
-   **`src/components/HamburgerTrigger.jsx`**: Floating hamburger button in top-left corner that opens/closes the VerticalToolbox. Fixed positioning with hover and active states.
-   **`src/components/BlockTree.jsx`**: The component for displaying the block structure of a page.
-   **`src/components/BottomActionBar.jsx`**: The bottom action bar for the content editor. It now also supports a file navigation mode, which is activated by the `showFileNav` prop. In this mode, it displays "Go Back" and "Go Home" buttons.
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
-   **`LexicalField.jsx`**: A self-contained, reusable rich-text field. **Modified in this task** to implement a robust, synchronous `handleBlur` logic. It no longer uses an unreliable `setTimeout` and instead immediately checks the shared `isToolbarInteractionRef`, preventing the editor from deactivating during a toolbar action. This was the core of the fix for the style application bug.

### **Hooks**

-   **`src/hooks/useFileManifest.js`**: Custom hook for fetching the file manifest of a repository.
-   **`src/hooks/useSearch.js`**: Custom hook for performing debounced searches. Normalizes search queries (e.g., converts smart quotes to standard quotes) before sending them to the backend API.
-   **`src/hooks/useAutosave.js`**: A debounced autosave hook for the content editor that also exposes an `isSaving` state.
-   **`src/hooks/useVisualViewportFix.js`**: **Modified in this task.** A custom hook that adjusts a fixed-position element to respect the virtual keyboard. It now accepts a `railRef` and a `scrollAreaRef` to dynamically calculate and set the `max-height` of the scrollable area, preventing it from being obscured by the keyboard.

### **Test & Verification Files**

-   **`/src/pages/_test/home.astro`**: A test file in the root repository to verify navigation to the editor.
-   **`public/preview/mock-preview.html`**: A static HTML file that acts as the target for the editor's preview iframe.

### **Playwright E2E Tests**

-   **`playwright.config.cjs`**: Playwright test configuration with browser setup, timeouts, retries, and dev server integration.
-   **`tests/navigation.spec.js`**: End-to-end tests for page navigation, routing, browser history, and UI elements.
-   **`tests/preview.spec.js`**: Tests for editor/preview mode switching, iframe rendering, and content display.
-   **`tests/editor.spec.js`**: Tests for rich-text editor features including FloatingToolbar, VerticalToolbox, text formatting, color picker, and undo/redo.
-   **`tests/test-utils.js`**: Helper functions and utilities for writing E2E tests.
-   **`tests/README.md`**: Comprehensive guide for running, debugging, and writing Playwright tests.
-   **`tests/phase3-preview.spec.js`**: A comprehensive Playwright test to verify the on-demand preview system. It runs on both desktop and mobile viewports and mocks all necessary API endpoints to isolate and validate the frontend logic.
-   **`tests/auth-cookie-policy.spec.js`**: Focused Playwright test validating OAuth cookies (`gh_oauth_state`, `gh_session`) for correct SameSite, Secure, Domain, and Max-Age attributes across production and localhost flows.
-   **`tests/architect-spec.spec.js`**: The final, targeted Playwright test to validate the architect's `onPointerDown` focus management solution. **Note:** This test currently fails due to an intractable issue with Playwright's ability to simulate the event in a way the Lexical editor recognizes. It is not a reflection of a flaw in the component's logic.
-   **`tests/unified-rail.spec.js`**: A targeted Playwright test to verify the core functionality of the Unified Liquid Rail, including selection and tap-based activation, on a mobile viewport.
-   **`easy-seo/src/components/SearchBar.jsx`**:
- **Change:** Added a clear button to the search input.
- **Reason:** To improve the user experience of the search functionality, as requested in `[BUG-001]`.
