# Easy-SEO Application Architecture

This document provides a detailed architectural overview of the `easy-seo` application. It is intended to be a comprehensive guide for developers to understand the project's structure, data flow, and key components.

## 1. High-Level Architecture

The `easy-seo` application is a **headless CMS** built on a decoupled architecture, using **GitHub as the content repository**. It consists of two primary components:

1.  **Frontend**: A modern **React application** built with Vite. It provides the user interface for authentication, repository selection, file exploration, and content editing.
2.  **Backend**: A **Cloudflare Worker** that acts as a secure intermediary between the frontend and the GitHub API. It handles authentication, proxies API requests, and manages data persistence for layout templates using Cloudflare D1.

### Core Concepts

*   **GitHub as a CMS**: The application treats a user's GitHub repository as the single source of truth for content. All file and content modifications are performed by making commits to the user's repository via the GitHub API.
*   **Authentication Flow**: The application uses a standard **GitHub OAuth 2.0 flow** to authenticate users. The frontend initiates the flow, and the backend worker securely exchanges the authorization code for an access token, which is then stored in an `HttpOnly` cookie (`gh_session`).
*   **Dual Editor System**:
    *   **Content Editor (`EditorPage.jsx`)**: A WYSIWYG editor (TinyMCE) for modifying the content of Markdown (`.md`) and Astro (`.astro`) files. It features a draft-first workflow using `localStorage` and a live preview.
    *   **Layout Editor (`LayoutEditorPage.jsx`)**: A graphical, drag-and-drop editor (@craftjs/core) for building and modifying page layouts. These layouts are saved as JSON structures in the Cloudflare D1 database.

---

## 2. File & Directory Breakdown

### 2.1. Root Directory (`/`)

This directory contains the backend worker and the overall project configuration.

| File/Directory                | Purpose                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cloudflare-worker-code.js`   | **[Backend Core]** The single entry point for the Cloudflare Worker. It contains all backend logic: API routing, GitHub API proxying, OAuth token handling, and D1 database interactions.          |
| `wrangler.toml`               | **[Backend Config]** The configuration file for the Cloudflare Worker. It defines the worker's name, entry point, routes, and bindings (e.g., the `DB` binding for the D1 database).                |
| `easy-seo/`                     | **[Frontend App]** The directory containing the entire React + Vite frontend application. See the detailed breakdown below.                                                                        |
| `package.json`                | Defines the dependencies and scripts for the *entire project*, including the root Astro site and the worker. It's distinct from the `easy-seo/package.json`.                                       |

### 2.2. Frontend Application (`/easy-seo/`)

This directory contains the complete source code for the React frontend.

#### 2.2.1. Configuration Files (`/easy-seo/*.{js,json,html}`)

| File                  | Purpose                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`          | The main HTML entry point for the Vite application. It includes the root div (`<div id="root">`) and loads the main JavaScript module (`src/main.jsx`). It also loads the TinyMCE editor script from a CDN.                         |
| `package.json`        | Manages the frontend application's dependencies (e.g., `react`, `vite`, `@tinymce/tinymce-react`, `@craftjs/core`) and scripts (`dev`, `build`, `lint`).                                                                           |
| `vite.config.js`      | The configuration file for Vite. Crucially, it sets up the **proxy** that forwards all `/api/*` requests from the frontend to the Cloudflare Worker backend running on `localhost:8787` during development.                     |
| `tailwind.config.js`  | Configures Tailwind CSS, including custom color palettes (e.g., `bark-blue`) and plugins (`@tailwindcss/forms`, `@tailwindcss/typography`).                                                                                        |
| `postcss.config.js`   | Configures PostCSS, primarily to integrate Tailwind CSS and Autoprefixer into the Vite build process.                                                                                                                             |
| `eslint.config.js`    | Configuration for ESLint, used for static code analysis and enforcing code style.                                                                                                                                               |

#### 2.2.2. Source Code (`/easy-seo/src/`)

| File/Directory          | Purpose                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.jsx`              | **[App Entry Point]** The entry point of the React application. It renders the root `<App />` component into the DOM and wraps it with `<BrowserRouter>` to enable client-side routing. It also includes a polyfill for the `Buffer` module.                                                                                      |
| `App.jsx`               | **[Routing Core]** Defines the application's top-level routes using `react-router-dom`. It separates routes into two categories: standalone routes (like `/login`) and routes nested within the main `<AppLayout />` (like `/explorer` and `/editor`).                                                                                |
| `global.css`            | Contains the base Tailwind CSS directives and global styles for the application.                                                                                                                                                                                                                                             |
| `pages/`                | Contains the top-level components for each page/view of the application. See the detailed breakdown below.                                                                                                                                                                                                                     |
| `components/`           | Contains reusable React components that are used across multiple pages (e.g., `FileExplorer`, `Icon`, `RepoSelector`, `TopToolbar`).                                                                                                                                                                                           |
| `utils/`                | Contains utility functions and helper modules that are used throughout the application (e.g., `astroFileParser.js`, `htmlGenerator.js`, `cache.js`).                                                                                                                                                                              |

#### 2.2.3. Pages (`/easy-seo/src/pages/`)

| File                        | Route                    | Purpose & Key Interactions                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LoginPage.jsx`             | `/`                      | The user's entry point. It handles the "Login with GitHub" button click, initiates the OAuth popup window, and listens for a `postMessage` event from the `CallbackPage` to know when to redirect to `/repository-selection`.                                                            |
| `CallbackPage.jsx`          | `/callback`              | Handles the redirect from GitHub after authentication. It extracts the `code` and `state`, calls the backend `/api/token` endpoint to get a session cookie, and then notifies the `LoginPage` via `postMessage` before closing itself.                                                      |
| `RepositorySelectionPage.jsx` | `/repository-selection`  | Displays a list of the user's GitHub repositories using the `RepoSelector` component. When a repository is selected, its full name is saved to `localStorage` and the user is redirected to `/explorer`.                                                                                |
| `ExplorerPage.jsx`          | `/explorer`              | The main file browsing interface. It retrieves the selected repository from `localStorage` and renders the `FileExplorer` component, which handles the logic for displaying files and folders.                                                                                             |
| `EditorPage.jsx`            | `/editor`                | **[Content Editor]** The core content editing view. It fetches file content from `/api/file`, provides a TinyMCE editor, handles local drafts, generates a live preview, and publishes changes back to GitHub via a `POST` to `/api/file`. It uses various utilities for parsing and stringifying content. |
| `LayoutEditorPage.jsx`      | `/layout-editor`         | **[Layout Editor]** The graphical layout editor. It uses `@craftjs/core` to provide a drag-and-drop interface for building page structures. It saves and loads layout templates from the backend via `/api/layout-templates`.                                                                   |
| `LayoutsDashboardPage.jsx`  | `/layouts`               | A dashboard for managing both graphical layouts (from the D1 database via `/api/layout-templates`) and file-based Astro layouts (from the repository via `/api/astro-layouts`).                                                                                                              |

---

## 3. Backend API (`cloudflare-worker-code.js`)

The Cloudflare Worker exposes a series of API endpoints under the `/api/` path. All endpoints that interact with GitHub or D1 require a valid `gh_session` cookie for authentication.

| Method | Endpoint                    | Purpose                                                                                                                                                                               | Frontend Consumer(s)                                   |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `POST` | `/api/token`                | Exchanges a GitHub OAuth `code` for an access token and sets it in a secure, `HttpOnly` cookie.                                                                                       | `CallbackPage.jsx`                                     |
| `GET`  | `/api/me`                   | Fetches the authenticated user's GitHub profile to verify an existing session.                                                                                                        | `LoginPage.jsx`                                        |
| `GET`  | `/api/repos`                | Fetches the list of repositories for the authenticated user.                                                                                                                          | `RepoSelector.jsx`                                     |
| `GET`  | `/api/files`                | Fetches the contents of a directory in the selected repository.                                                                                                                       | `FileExplorer.jsx`                                     |
| `GET`  | `/api/file`                 | Fetches the raw content and SHA of a single file.                                                                                                                                     | `EditorPage.jsx`, `FileExplorer.jsx` (for README)      |
| `POST` | `/api/file`                 | Creates or updates a file in the repository. The file content must be Base64 encoded.                                                                                                 | `EditorPage.jsx` (on Publish), `CreateModal.jsx`       |
| `DELETE`| `/api/files`               | Deletes a file from the repository. Requires the file's `path` and `sha`.                                                                                                             | `FileExplorer.jsx`                                     |
| `POST` | `/api/rename-file`          | Renames a file by creating a new file with the new name and deleting the old one.                                                                                                     | `FileExplorer.jsx`                                     |
| `POST` | `/api/duplicate-file`       | Duplicates a file by creating a copy with a "-copy" suffix.                                                                                                                           | `FileExplorer.jsx`                                     |
| `GET`  | `/api/metadata`             | Fetches the commit history for a file to get metadata like the last author and modification date.                                                                                     | `FileExplorer.jsx`                                     |
| `GET`  | `/api/search`               | Performs a search for files within the `src/pages` directory of the repository using the GitHub Search API.                                                                           | `SearchBar.jsx` (within `FileExplorer`)                |
| `GET`  | `/api/layout-templates`     | Fetches a list of all graphical layout templates from the D1 database.                                                                                                                | `LayoutsDashboardPage.jsx`                             |
| `POST` | `/api/layout-templates`     | Creates or updates a graphical layout template in the D1 database.                                                                                                                    | `LayoutEditorPage.jsx`                                 |
| `GET`  | `/api/astro-layouts`        | A specialized version of `/api/files` that specifically lists files in the `src/layouts` directory of the user's repository.                                                            | `LayoutsDashboardPage.jsx`                             |
| `GET`  | `/api/get-file-content`     | Fetches the raw, decoded content of a single file from the repository.                                                                                                                | `LayoutEditorPage.jsx` (for Astro layouts)             |
| `POST` | `/api/assign-layout`        | Assigns a layout to a file by modifying its frontmatter `layout` property.                                                                                                            | `FileExplorer.jsx`, `EditorPage.jsx`                   |
| `GET`  | `/api/render-layout/:id`    | Fetches the raw JSON content for a single graphical layout from the D1 database. This is used by the `GraphicalRenderer.astro` layout.                                                  | `GraphicalRenderer.astro`                              |
| `POST` | `/api/trigger-build`        | Triggers a GitHub Actions workflow (`build-preview.yml`) to generate a site preview. Requires a `GITHUB_TOKEN` secret on the worker.                                                  | *(Currently Unused, for future preview functionality)* |
| `GET`  | `/api/build-status`         | Checks the status of the latest run of the `build-preview.yml` workflow.                                                                                                              | **(Currently Unused, for future preview functionality)*** |

---

## 4. Core Architectural Patterns

This section describes the key architectural patterns that enable the application's advanced features.

### 4.1. The "Layout Bridge" Pattern

A fundamental challenge is enabling code-based Astro pages (e.g., `src/pages/about.md`) to use layouts created in the graphical, data-driven editor. The "Layout Bridge" pattern solves this by decoupling the page from the graphical layout definition.

**How it Works:**

1.  **Assignment (`/api/assign-layout`):** When a user assigns a graphical layout (e.g., with ID `123`) to a page, the backend worker modifies that page's frontmatter. It does two things:
    *   Sets the `layout` property to point to a special Astro component: `layout: '/src/layouts/GraphicalRenderer.astro'`.
    *   Adds a new property to store the graphical layout's ID: `graphical_layout_id: 123`.

2.  **Build Time Rendering (`GraphicalRenderer.astro`):** During the Astro site build, when a page with this frontmatter is processed, Astro uses `GraphicalRenderer.astro` as its layout. This component then executes its server-side script:
    *   It reads the `graphical_layout_id` from the page's frontmatter.
    *   It makes a `fetch` call to the public `/api/render-layout/:id` endpoint on the Cloudflare Worker.
    *   The worker fetches the corresponding layout's JSON from the D1 database and returns it.
    *   `GraphicalRenderer.astro` receives the JSON and contains a server-side renderer that converts the Craft.js JSON structure into HTML, which is then injected into the page.

This pattern allows the worker to "give instructions" to the Astro build process without the two environments needing to directly interact, providing a robust and scalable way to mix static and dynamic layouts.

### 4.2. "One-Way Import" for Astro Layouts

To improve the user experience when editing `.astro` files, the application uses a "one-way import" pattern instead of attempting to create a live, two-way-synced visual editor for code.

**How it Works:**

1.  **Conversion (`astroLayoutConverter.js`):** A utility module was created to act as a converter.
    *   It takes the raw string content of an `.astro` file.
    *   It uses the official **`@astrojs/compiler`** to parse the file into an Abstract Syntax Tree (AST).
    *   It traverses the AST, focusing on the `<body>` of the HTML structure, and maps the HTML tags and their hierarchy to a **Craft.js-compatible JSON object**.
    *   It uses `uuid` to generate unique IDs for each new node in the JSON structure.

2.  **Editor Integration (`LayoutEditorPage.jsx`):**
    *   When a user opens an `.astro` file in the Layout Editor, the component calls the `convertAstroToCraft` utility.
    *   If the conversion is successful, the resulting JSON is deserialized and loaded onto the editor's canvas.
    *   The user can now manipulate the imported structure as a standard graphical layout.
    *   When saved, this is stored as a **new, independent graphical layout** in the D1 database. The original `.astro` file is never modified.

This pattern provides a safe and powerful way for users to leverage their existing code as a starting point for new visual designs without the risk of corrupting the original file.

---

## 5. Architectural Questions & Observations

1.  **Dual `package.json` Files**: The project has a `package.json` at the root and another inside `easy-seo/`. This is typical for a monorepo structure but can sometimes lead to confusion about which one to use for which task. The root one seems to manage the broader Astro project and worker, while the nested one is specific to the React editor. This separation is logical but requires careful dependency management.
2.  **Hardcoded Paths**: The `FileExplorer.jsx` component has a hardcoded initial path of `src/pages`. While this makes sense for an Astro project, it makes the component less flexible if it were to be used for browsing other parts of a repository. This is a deliberate design choice for the current use case but is worth noting.
3.  **Error Handling**: The `EditorPage.jsx` includes excellent error handling for file parsing errors, displaying the raw content to the user. This is a strong pattern that could be applied more broadly, for example, when API calls in the `FileExplorer` fail.
4.  **Preview Generation**: The preview functionality (`/api/trigger-build`, `/api/build-status`) exists in the backend but doesn't appear to be fully integrated into the frontend UI yet. This seems to be a planned feature for future development.
5.  **Security**: The use of an `HttpOnly`, `Secure`, `SameSite=None` cookie for the session token is a good security practice. The backend worker acts as a secure gatekeeper, preventing the frontend from ever having direct access to the GitHub API token.
6.  **Utility Functions**: The `utils/` directory contains several parsers and generators (`unifiedParser`, `astroFileParser`, `htmlGenerator`). This is a good separation of concerns, keeping complex data transformation logic out of the React components. The inter-dependencies between these utils suggest they form a core "content processing pipeline".
7.  **D1 Database Schema**: The worker code implies a D1 schema with at least `layout_templates` and `layout_versions` tables. The exact schema isn't visible but can be inferred from the SQL queries in `cloudflare-worker-code.js`. This is a key component for the graphical layout editor's persistence.

---

## 5. Developer Notes & Clarifications (as of 2025-10-09)

*This section contains updates and clarifications based on recent discussions.*

1.  **`package.json` Strategy**: The dual `package.json` setup is intentional. The root `package.json` is for the user's Astro site build. The `easy-seo/package.json` is for the editor application itself, which has its own deployment workflow.

2.  **Repository Flexibility**: The current design assumes each user has a repository with an Astro project structure (e.g., `src/pages`). Future work may involve making the application more flexible to handle different project structures or non-Astro sites.

3.  **Error Handling**: There is a recognized need to improve user-facing error messages across the application to be more explicit about what went wrong and how to fix it. The pattern in `EditorPage.jsx` is a good model to follow.

4.  **Preview Functionality**: The `handleTriggerBuildRequest` and `handleBuildStatusRequest` functions in the worker may be related to why some editor previews are not working as intended. This connection should be investigated when tackling preview-related bugs.

5.  **Graphical Layout Editor (Active Priority)**: The Graphical Layout Editor (`LayoutEditorPage.jsx`) and its corresponding D1 database integration are **not deprecated**. They are the **primary focus of current development efforts**.
    *   **Current Status**: The feature is not fully functional and has several known issues.
    *   **Known Bugs**:
        *   Layouts (both from D1 and `src/layouts`) are incorrectly opening in the content editor (`EditorPage.jsx`) instead of the graphical editor.
        *   Drag-and-drop functionality is not working correctly on mobile devices (e.g., iPhone).
        *   The editor does not visually render the structure of existing layouts when opened; it shows a blank canvas.