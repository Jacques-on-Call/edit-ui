# Easy SEO - Astro Content Editor

This project is a React-based content editor designed to work with Astro sites. It provides a user-friendly interface for managing content stored in a GitHub repository.

## Architecture Overview

The application consists of two main parts:
1.  A **React single-page application (SPA)** built with Vite, responsible for the user interface.
2.  A **Cloudflare Worker backend** that handles authentication and acts as a secure proxy to the GitHub API.

### Project Structure & Key Concepts

To navigate this project effectively, it's important to understand the distinction between the two core editors and the different types of layouts they handle.

*   **Content Editor (`src/pages/EditorPage.jsx`)**
    *   **Purpose:** This is a WYSIWYG editor powered by TinyMCE, designed for editing the final, readable content of pages (e.g., blog posts, articles).
    *   **Handles:** `.md`, `.html`, and `.astro` files. For Astro files, it specifically targets the `sections` array in the frontmatter, allowing for structured content editing.

*   **Graphical Layout Editor (`src/pages/layout-editor/LayoutEditorPage.jsx`)**
    *   **Purpose:** This is a visual, drag-and-drop editor powered by Craft.js, designed for building and managing the reusable structure of pages.
    *   **Handles:** Two types of layouts that are managed via the **Layouts Dashboard** (`/layouts`):
        1.  **Graphical Templates:** These are JSON-based layouts stored in the D1 database. They are created and edited entirely within the graphical editor.
        2.  **Astro File-based Layouts:** These are standard `.astro` files located in the user's repository (e.g., in `src/layouts`). When you click "Edit" on one of these, the application opens a **blank canvas** in the graphical editor. This allows you to build a new graphical template inspired by the file-based one, but it does not (yet) parse the Astro file for direct graphical editing.

---

## Jules' Developer & Handover Notes

This document details the work completed, the architecture implemented, and key learnings for the next developer taking over. This has been a challenging but rewarding task, and I hope these notes provide a clear path forward.

### Core Architecture & Local Development

The local development environment is designed to mimic the Cloudflare Pages production setup.

*   **Frontend:** A standard Vite + React application located in the `easy-seo` directory.
*   **Backend:** A single Cloudflare Worker script, `easy-seo/worker.js`, handles all API logic.
*   **Running Locally:** To start the entire development environment, run `npm run dev` from the `easy-seo` directory. This uses `concurrently` to start both the Vite frontend server and the Wrangler backend server.
    *   **Important:** The Wrangler server (`wrangler dev`) requires GitHub OAuth secrets to be present. I've added a `.dev.vars` file for this purpose. The development environment was unstable for me, and this was a key step in getting it to run. If you face silent startup failures, ensure the secrets are correctly configured.

### Key Features Implemented

*   **File Explorer:** A full-featured file explorer (`ExplorerPage.jsx`) allows users to navigate their repository. It includes a "frameless" search bar in the header for a clean, modern look. `README.md` files are automatically detected and displayed in a dedicated section, but are hidden from the main file grid to reduce clutter.
*   **Editor Page:** A new editor (`EditorPage.jsx`) was built from the ground up using TinyMCE.
    *   **Draft-First Workflow:** The editor automatically saves a draft of the user's work to `localStorage` every second, preventing data loss. It loads from this draft if one is found.
    *   **Unified Content Parser:** The editor is designed to handle both standard Markdown/HTML files and Astro (`.astro`) files with JavaScript frontmatter. It uses a `unifiedParser.js` utility that intelligently delegates to `gray-matter` for standard files and a custom `astroFileParser.js` for Astro files. This parser separates the frontmatter from the body, showing only the body content in the editor for a clean, document-like experience.
    *   **Robust Error Handling:** The most critical feature is the **`ErrorBoundary.jsx` component**. This was the final solution to a persistent "Load failed" bug.
*   **Graphical Layout Editor:** A powerful, component-based layout editor for creating and managing reusable page templates.
    *   **Technology:** Built with **Craft.js**, providing a drag-and-drop interface for assembling pages from components.
    *   **Block Library:** Includes a set of standardized, reusable building blocks: `Hero`, `FeatureGrid`, `Testimonial`, `CTA`, and `Footer`. Each block is a fully serializable React component with editable content and style properties.
    *   **Persistent Templates:** Layouts can be saved as named templates to the Cloudflare D1 database. The editor serializes the entire layout state into a JSON object, which is sent to the backend API.
    *   **Reusable & Editable:** Saved templates can be loaded back into the editor via the `/layouts` dashboard, allowing users to create, view, and edit reusable structures for different pages.

### The "Smoking Gun" - A Journey in Debugging

The most significant challenge was a recurring bug where the editor would appear blank. My journey to the solution was as follows:

1.  **Initial Assumption (Parser Logic):** I first believed my content parsing logic was flawed. I went through several iterations, including a "defensive" parser, but the problem persisted.
2.  **Second Assumption (Character Encoding):** A hint from you about garbled characters (`â`) pointed me toward a character encoding issue. I implemented a `TextDecoder` to correctly handle UTF-8 when decoding the base64 content from the GitHub API. This was a necessary fix, but not the root cause.
3.  **The Realization (Invalid Source Content):** The final breakthrough came when we realized the source file itself (`index.astro`) contained JavaScript syntax errors (unclosed template literals). These errors were so severe that they were causing the entire React component to crash during the render phase.
4.  **The Correct Solution (`ErrorBoundary`):** My previous error handling was insufficient because it was *inside* the component that was crashing. The correct, robust solution was to wrap the entire editor route in a React `ErrorBoundary`. This component now catches any rendering crash, prevents a blank screen, and displays a detailed error report—the "smoking gun"—so the user can identify and fix the syntax error in the source file.

### Suggestions for the Next Developer

*   **Saving to GitHub:** The "Publish" button in the editor's `TopToolbar` is currently a placeholder. The next logical step is to wire this up to a new API endpoint in `worker.js` that uses the GitHub API to commit the changes back to the repository. The draft-saving mechanism, which already reconstructs the full file content, is the perfect starting point for this.
*   **Improve the `Icon.jsx` Component:** The current `Icon.jsx` is a simple placeholder that just displays the icon name as text (e.g., `[search]`). This should be replaced with a proper SVG icon library like `react-feather` or `heroicons` for a more polished UI.
*   **Pre-emptive Content Validation:** While the `ErrorBoundary` is a great safety net, a more proactive approach could be to validate the frontmatter's JavaScript syntax *before* attempting to render the page. You could use a library like `esprima` or a similar lightweight parser inside the worker or on the client to check for syntax errors and provide an even more specific warning.

It has been a privilege to work on this project. Thank you for your guidance and patience. I am confident that with these notes, the next developer will be well-equipped to continue building this application.

---

## Debugging Consultation with GitHub Copilot (Oct 5, 2025)

### Summary for GitHub Copilot

**The Problem:**
We are debugging the editor page in the `easy-seo` React application. After introducing new parsers to handle `.astro` file frontmatter, the editor fails to load content, displaying a generic "Load failed" message in the browser console. The goal is to make the editor functional again.

**What We Know:**
1.  **Root Cause:** The issue is almost certainly caused by syntax errors (e.g., unclosed template literals) within the JavaScript frontmatter of the `.astro` file being edited.
2.  **Failure Point:** The application uses a custom `astroFileParser.js` which attempts to parse the JavaScript frontmatter using the `Function()` constructor. When this encounters a syntax error, it throws a fatal error that crashes the entire application script.
3.  **Error Handling:** The application has a React `ErrorBoundary` and `try...catch` blocks within the editor component, but they are not successfully catching this crash, which is why we see a generic browser failure message instead of a detailed React error UI.

**What We Have Tried:**
1.  **Initial Fix (Graceful Crash):** We modified the `EditorPage` to catch the parsing error and load an empty string into the editor. This prevented the crash but left the user with a blank, unusable editor, which was not a complete solution.
2.  **Second Fix (Improved Error UI):** We enhanced the error handling to not only prevent the crash but also display the raw, problematic file content in a `<textarea>`. This was intended to help diagnose the content error.
3.  **Third Fix (Structural Correction):** We identified that the `EditorPage` was defined outside the main `AppLayout`, potentially missing critical rendering context. We moved the route inside the layout to ensure the page and its error boundaries would render correctly.

**Current Status:**
Despite implementing all three fixes (correcting the route and adding robust error handling), the user reports **no change**. The editor still shows "Load failed." This implies the crash is happening at a very fundamental level, even before our React application can properly mount and render our error-handling components.

### Questions to Ask GitHub Copilot

1.  Given that the Vite build is successful, but the application fails at runtime with a generic "Load failed" message, what could cause a crash so early that it bypasses both a component-level `try...catch` and a route-level React `ErrorBoundary`?
2.  The core of the parser uses `Function("use strict"; return (...))()` to evaluate the frontmatter object. Is there a more resilient alternative for parsing a string of a JavaScript object that would return a syntax error instead of throwing a process-crashing exception?
3.  Could there be a silent failure mode in the Vite dev server's interaction with the browser? For example, could a dependency with a critical flaw be bundled without error but fail immediately on execution in the browser?
4.  Considering the `concurrently` setup running `vite` and `wrangler dev`, could there be an issue with the proxy or the backend API response that is causing the frontend to fail before it can render? How could we best investigate this?

---

## Astro Development Standards

### **Using Idiomatic Layouts**

To ensure consistency and align with Astro best practices, all new pages should use the idiomatic layout system.

*   **Page (`src/pages/*.astro`):**
    *   Specify the layout file using the `layout` property in the frontmatter (e.g., `export const layout = '../../layouts/MainLayout.astro';`).
    *   Define all page-specific metadata (like `title`, `description`) as top-level `export const` variables.
    *   The body of the page should only contain the content to be injected into the layout's `<slot />`. Do not wrap the content in the layout component directly.

*   **Layout (`src/layouts/*.astro`):**
    *   The layout should access the page's frontmatter variables directly from `Astro.props` (e.g., `const { title } = Astro.props;`).
    *   Do not expect a single `frontmatter` object. This makes the layout more flexible and reusable.

This approach simplifies page structure and makes the relationship between pages and layouts clearer and more maintainable.

### The Preview System: A Deep Dive

One of the most significant features we implemented was a robust, workflow-driven preview system, replacing a manual command-line process.

**The Goal:**
To allow a content editor to generate a static preview of their changes with a single button click, without ever leaving the editor UI.

**The Architecture & The "Why":**
The initial plan was to add a build trigger to the Cloudflare Worker. However, a critical technical constraint makes this impossible: a Cloudflare Worker (even in local development) is a sandboxed environment and cannot execute local shell commands like `npm run build`.

To solve this, we implemented a standard and robust architectural pattern for local development environments:
1.  **A Local-Only Build Trigger Server (`easy-seo/build-trigger-server.js`):** A lightweight Node.js server was created. Its *only* job is to listen for an API call from the frontend and, in response, execute the build script on the local machine. This server runs concurrently with the Vite and Wrangler servers.
2.  **A Dedicated Build Script:** We added a `build:preview` script to the root `package.json`. This script contains the exact, correct command to build the main Astro website into the `easy-seo/public/preview` directory. Centralizing the command here makes it more reliable.
3.  **The Frontend Workflow (`EditorPage.jsx`):**
    *   When the user clicks "Generate Preview," the editor sends a request to the build trigger server.
    *   The UI then enters a "building" state, displaying a custom SVG animation.
    *   It polls a `build-status.json` file every few seconds to check the status.
    *   Once the status is "success" or "error", the UI updates to show either the preview in an `<iframe>` or a detailed error report.

**The Debugging Journey & Key Learnings:**
This feature's development was a masterclass in iterative debugging. We encountered and solved several issues:
1.  **Incorrect Build Target:** We initially built the wrong project (the editor instead of the Astro site).
2.  **Missing Dependencies:** We discovered the build was failing because we hadn't run `npm install` in the root directory to install Astro itself.
3.  **Pathing and Permissions:** The most persistent bug was related to the script's execution context. Our final, robust solution centralizes all path logic into the `build-trigger-server.js`, which then provides a clean, reliable environment for the `build-preview.js` script to execute in.

**The Final Polish - The "Smart" Loader:**
Your suggestion to create a more engaging loading animation was a brilliant touch. We implemented a custom `StatusLoader.jsx` component that:
*   Displays a "flowing documents" SVG animation while the build is in progress.
*   Intelligently switches to a red, static error state if the build fails, providing clear and immediate visual feedback.

This journey highlights the importance of understanding the execution environment and the value of persistent, collaborative debugging. The result is a feature that is not only functional but also a pleasure to use.