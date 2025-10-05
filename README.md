# Easy SEO - Astro Content Editor

This project is a React-based content editor designed to work with Astro sites. It provides a user-friendly interface for managing content stored in a GitHub repository.

## Architecture Overview

*(This section is a placeholder for the original architectural notes.)*

The application consists of two main parts:
1.  A **React single-page application (SPA)** built with Vite, responsible for the user interface.
2.  A **Cloudflare Worker backend** that handles authentication and acts as a secure proxy to the GitHub API.

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