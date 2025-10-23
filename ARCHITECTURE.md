# Easy-SEO Application Architecture

This document provides a detailed architectural overview of the `easy-seo` application. It is intended to be a comprehensive guide for developers to understand the project's structure, data flow, and key components.

## 1. High-Level Architecture

The `easy-seo` application is a **headless CMS** built on a decoupled architecture, using **GitHub as the content repository**. It consists of two primary components:

1.  **Frontend**: A modern **React application** built with Vite. It provides the user interface for authentication, repository selection, file exploration, and content editing.
2.  **Backend**: A **Cloudflare Worker** that acts as a secure intermediary between the frontend and the GitHub API. It handles authentication, proxies API requests, and manages data persistence for layout templates using Cloudflare D1.

### Core Concepts

*   **GitHub as a CMS**: The application treats a user's GitHub repository as the single source of truth for content. All file and content modifications are performed by making commits to the user's repository via the GitHub API.
*   **Authentication Flow**: The application uses a standard **GitHub OAuth 2.0 flow** to authenticate users. The frontend initiates the flow, and the backend worker securely exchanges the authorization code for an access token, which is then stored in an `HttpOnly` cookie (`gh_session`).
*   **Dual Mode Editor**: The editor operates in two distinct modes to separate page structure from page content.
    *   **Layout Mode**: Used for editing `.astro` layout files. This mode provides a UI for managing the core structure of a page, including imports, props, and the placement of shared components like headers and footers around a central `<slot />`.
    *   **Content Mode**: Used for editing content blocks that will be rendered inside a layout's `<slot />`. This mode provides a rich block-based editor for creating complex page content with components like sections, columns, images, and buttons.

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
| `package.json`        | Manages the frontend application's dependencies (e.g., `react`, `vite`, `@tinymce/tinymce-react`) and scripts (`dev`, `build`, `lint`).                                                                           |
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
| `components/`           | Contains reusable React components that are used across multiple pages (e.g., `FileExplorer`, `Icon`, `RepoSelector`, `TopToolbar`, `MobileQuickBar`).                                                                                                                                                                                           |
| `hooks/`                | Contains reusable React hooks for managing complex stateful logic (e.g., `usePreviewController`, `useAutosave`).                                                                                                                                                                                                            |
| `utils/`                | Contains utility functions and helper modules that are used throughout the application (e.g., `astroFileParser.js`, `htmlGenerator.js`, `cache.js`, `uniquePath.ts`, `previewBridge.js`).                                                                                                                                                                              |
| `scripts/`              | Contains client-side scripts, such as the `preview-bridge.js` for iframe communication.                                                                                                                                                                                                                                   |

#### 2.2.3. Pages (`/easy-seo/src/pages/`)

| File                        | Route                    | Purpose & Key Interactions                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LoginPage.jsx`             | `/`                      | The user's entry point. It handles the "Login with GitHub" button click, initiates the OAuth popup window, and listens for a `postMessage` event from the `CallbackPage` to know when to redirect to `/repository-selection`.                                                            |
| `CallbackPage.jsx`          | `/callback`              | Handles the redirect from GitHub after authentication. It extracts the `code` and `state`, calls the backend `/api/token` endpoint to get a session cookie, and then notifies the `LoginPage` via `postMessage` before closing itself.                                                      |
| `RepositorySelectionPage.jsx` | `/repository-selection`  | Displays a list of the user's GitHub repositories using the `RepoSelector` component. When a repository is selected, its full name is saved to `localStorage` and the user is redirected to `/explorer`.                                                                                |
| `ExplorerPage.jsx`          | `/explorer`              | The main file browsing interface. It retrieves the selected repository from `localStorage` and renders the `FileExplorer` component, which handles the logic for displaying files and folders.                                                                                             |
| `EditorRouter.jsx`          | `/editor`                | **[Editor Router]** A top-level component that determines which editor mode to render—'Layout Mode' or 'Content Mode'—based on the file type (`.astro` vs. `.md`) and the presence of editor markers. |
| `LayoutModeEditor.jsx`      | `/editor` (Layout Mode)  | **[Layout Mode UI]** The UI for editing the structure of `.astro` layout files. It provides controls for managing imports, props, and the arrangement of components in the `pre-content` and `post-content` regions. |
| `ContentModeEditor.jsx`     | `/editor` (Content Mode) | **[Content Mode UI]** The UI for editing block-based content. It provides a rich palette of content blocks (e.g., `Section`, `Columns`, `Image`) that can be composed to build a page. |
| `LayoutsDashboardPage.jsx`  | `/layouts`               | A dashboard for managing file-based Astro layouts from the user's repository, which are retrieved via the `/api/astro-layouts` endpoint.                                                               |

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
| `GET`  | `/api/astro-layouts`        | A specialized version of `/api/files` that specifically lists files in the `src/layouts` directory of the user's repository.                                                            | `LayoutsDashboardPage.jsx`                             |
| `GET`  | `/api/get-file-content`     | Fetches the raw, decoded content of a single file from the repository.                                                                                                                | `LayoutModeEditor.jsx`, `ContentModeEditor.jsx`         |
| `POST` | `/api/save-layout`          | A unified endpoint for creating or updating `.astro` files. The worker handles Base64 encoding and commits the changes to the user's repository.                                     | `LayoutModeEditor.jsx`, `ContentModeEditor.jsx`         |
| `POST` | `/api/trigger-build`        | Triggers a GitHub Actions workflow (`build-preview.yml`) to generate a site preview. Requires a `GITHUB_TOKEN` secret on the worker.                                                  | `usePreviewController.js` |
| `GET`  | `/api/build-status`         | Checks the status of the latest run of the `build-preview.yml` workflow.                                                                                                              | `usePreviewController.js` |

---

## 4. Core Architectural Patterns

This section describes the key architectural patterns that enable the application's advanced features.

### 4.1. Marker-Based Round-Trip Editing

The core of the new editor is a "marker-based" system that allows for non-destructive, round-trip editing of `.astro` layout files. This ensures that the editor can read, modify, and write `.astro` files without breaking the underlying code or interfering with the Astro compiler.

**How it Works:**

1.  **Markers**: The system injects special HTML comments (e.g., `<!-- editor:region name="pre-content" -->`) and JavaScript comment blocks (e.g., `/* editor:region name="props" */`) into the `.astro` file. These markers define editable regions for different parts of the layout, such as imports, props, the head, and the body.

2.  **Parsing (`parseAstro.ts`)**: When an `.astro` file is opened in 'Layout Mode', a parser reads the content and uses regular expressions to find these markers. It extracts the content within each marked region and maps it to a structured JSON object called a `LayoutBlueprint`. The parser is resilient and can infer regions from standard HTML tags if markers are not present.

3.  **Compilation (`compileAstro.ts`)**: After the user has modified the `LayoutBlueprint` in the editor UI, a compiler takes the JSON object and reconstructs the `.astro` file. It re-inserts the markers and formats the content correctly, producing a clean, valid `.astro` file.

4.  **Validation (`validateAstro.ts`)**: Before saving, a validator runs a series of checks on the compiled output to ensure it's a valid Astro layout (e.g., it contains exactly one `<slot />` and no nested `<html>` or `<body>` tags within the editable regions).

This marker-based approach provides a robust and reliable way to build a visual editor on top of a code-based file format like Astro.

### 4.2. Block-Based Content Composition

In 'Content Mode', the editor uses a block-based system to compose page content. This system is designed for flexibility and reusability.

**How it Works:**

1.  **Block Components (`/src/blocks/`)**: The system is built on a library of simple, self-contained `.astro` components located in the root `src/blocks/` directory. Each component represents a piece of content (e.g., `Section.astro`, `Image.astro`, `Button.astro`).

2.  **Block Registry (`/easy-seo/src/blocks/registry.ts`)**: A central registry file defines the schema for each block, including its name, path, and the props it accepts. This registry allows the editor to dynamically generate a UI for editing the properties of each block.

3.  **Content Compiler (`/easy-seo/src/lib/content/compileBlocksToAstro.ts`)**: When a user creates content in 'Content Mode', the editor builds a JSON-like tree of `BlockNode` objects. A content compiler then traverses this tree and transforms it into a renderable `.astro` string, correctly importing the required block components and passing the specified props.

This architecture separates the content's structure (the JSON tree) from its presentation (the `.astro` components), making the content highly portable and easy to render.

---

## 5. Architectural Questions & Observations

1.  **Dual `package.json` Files**: The project has a `package.json` at the root and another inside `easy-seo/`. This is typical for a monorepo structure but can sometimes lead to confusion about which one to use for which task. The root one seems to manage the broader Astro project and worker, while the nested one is specific to the React editor. This separation is logical but requires careful dependency management.
2.  **Hardcoded Paths**: The `FileExplorer.jsx` component has a hardcoded initial path of `src/pages`. While this makes sense for an Astro project, it makes the component less flexible if it were to be used for browsing other parts of a repository. This is a deliberate design choice for the current use case but is worth noting.
3.  **Error Handling**: The `EditorPage.jsx` includes excellent error handling for file parsing errors, displaying the raw content to the user. This is a strong pattern that could be applied more broadly, for example, when API calls in the `FileExplorer` fail.
4.  **Preview Generation**: The preview functionality (`/api/trigger-build`, `/api/build-status`) exists in the backend and is now fully integrated into the frontend UI via the `usePreviewController` hook.
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

5.  **Astro Layout Editor (Active Priority)**: The new marker-based Astro Layout Editor is the **primary focus of current development efforts**.
    *   **Current Status**: The core libraries for the compiler, parser, and validator have been built, and the UI is now being actively developed.
    *   **Autosave**: Drafts of the layout blueprint are saved to `localStorage` via the `useAutosave` hook.
    *   **Instant Preview**: A `postMessage` bridge (`preview-bridge.js` and `previewBridge.js`) is used to provide instant feedback for non-structural changes.
    *   **Mobile UX**: A `MobileQuickBar` component provides a mobile-first interface.
    *   **File Naming**: The `uniquePath.ts` utility is used to prevent filename collisions when saving layouts.