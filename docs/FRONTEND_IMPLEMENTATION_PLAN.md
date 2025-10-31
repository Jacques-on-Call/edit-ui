# easy-seo: Frontend Implementation Plan

This document outlines the strategy for developing a mobile-first, intuitive, and modular user interface for the `easy-seo` application. It addresses existing issues and provides a clear roadmap for bringing the File Explorer, Content Editor, and Visual Editor components to a market-ready state.

## 1. Foundational Fixes and Core UX

This phase focuses on resolving critical usability issues and establishing a solid, scalable frontend architecture.

*   **File Explorer Scrolling Fix:**
    *   **Problem:** The File Explorer currently has a non-functional scroll, making it unusable for navigating file lists on any device, especially mobile.
    *   **Solution:** The component will be refactored to ensure the main file list is the single source of scrolling. This will be achieved by applying `overflow-auto` to the primary list container and `overscroll-behavior: contain` to prevent nested scroll traps, a common issue on iOS.

*   **Modular Component Architecture:**
    *   **Strategy:** All UI elements will be built as small, reusable Preact components. A clear directory structure will be established to organize components by feature (e.g., `src/components/FileExplorer/`, `src/components/ContentEditor/`).
    *   **State Management:** Local component state will be used for UI-specific data. For global state (e.g., authenticated user, current repository), a lightweight state management library like Zustand will be implemented to ensure a predictable and unidirectional data flow.

*   **UI/Icon Library Standardization:**
    *   **Problem:** The current UI lacks consistency.
    *   **Solution:** We will standardize on the `lucide-preact` library for all icons, leveraging the existing `Icon.jsx` component. For UI components (buttons, modals, etc.), we will build a small, reusable component library to ensure a consistent look and feel across the application, adhering to the design principles outlined in the project's strategy documents.

## 2. Content Editor Enhancements

This phase will upgrade the Content Editor from a basic text area to a powerful, mobile-friendly, and intuitive tool.

*   **Sticky, Mobile-First Header:**
    *   **Problem:** The current editor lacks persistent navigation, forcing users to scroll to the top to save or exit.
    *   **Solution:** A sticky header will be implemented that remains visible at all times. It will be designed with mobile-first principles, featuring large, tappable icons for core actions like "Home," "Save Draft," and "Publish." It will also be safe-area aware to avoid overlapping with native mobile UI elements on devices like the iPhone.

*   **Context-Aware Toolbar:**
    *   **Problem:** The current editor has a very basic, static toolbar.
    *   **Solution:** The TinyMCE toolbar will be reconfigured to be context-aware. It will be positioned in a horizontal, sliding bar at the bottom of the screen for easy mobile access. The tools displayed will change based on the user's current selection (e.g., showing text formatting options when text is selected, and table options when a table is selected).

*   **"Add" Modal for Content Blocks:**
    *   **Problem:** There is no easy way to insert complex content blocks.
    *   **Solution:** An "Add" button will be implemented that opens a simple, icon-based modal. From this modal, users can easily insert common content blocks like images, tables, buttons, and reusable sections, streamlining the content creation process.

## 3. Visual Editor Architecture

This phase will architect a robust, market-ready Visual Editor, tackling the current preview and interactivity issues head-on.

*   **Full-Screen Iframe Preview with Correct Asset Pathing:**
    *   **Problem:** The current preview is broken; images and CSS do not load correctly.
    *   **Solution:** The Visual Editor will use a full-screen, frameless iframe to render the real Astro preview build. To fix the broken asset paths, the `VITE_PREVIEW_BASE_URL` will be correctly configured, and a cache-busting query (e.g., `?v=<timestamp>`) will be appended to the iframe's `src` URL after every rebuild. This ensures all assets are loaded from the correct origin and that the preview is always up-to-date.

*   **Interactive Overlay and Component Selection:**
    *   **Problem:** Component editing is non-functional.
    *   **Solution:** A transparent overlay will be placed on top of the preview iframe. This overlay will be responsible for detecting user interactions. When a user clicks, the overlay will identify the underlying component in the iframe and draw a border around it, visually indicating that it has been selected. This approach decouples the editor UI from the actual preview, preventing conflicts.

*   **Editor-to-Preview Communication Bridge:**
    *   **Strategy:** The editor overlay and the preview iframe will communicate using the browser's `postMessage` API. This allows for secure, cross-origin communication. When a user modifies a component's properties in the editor, the editor will send a message to the iframe with the updated style information. The iframe will have a listener that receives this message and applies the changes to the appropriate component in real-time.

*   **Dynamic, Context-Aware Properties Panel:**
    *   **Design:** When a component is selected, a properties panel will slide in. This panel will be context-aware, displaying only the editable properties for the selected component (e.g., text content, image source, colors, spacing).
    *   **Implementation:** The properties in this panel will be bound to the application's state. When a user makes a change (e.g., using a color picker), the state will be updated, and the new style will be sent to the iframe via the communication bridge, providing instant visual feedback. This creates a seamless and intuitive "what you see is what you get" editing experience.
