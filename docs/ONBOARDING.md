# Onboarding Checklist: The First 30 Minutes

Welcome to the project! This guide is designed to get you oriented and productive as quickly as possible. Follow these steps to understand the architecture, get the application running, and learn where to find critical information.

## 1. Initial Reading (5-10 minutes)

Before touching any code, you **must** read the following documents to understand the project's goals, architecture, and the rules of engagement. This is the most critical step.

1.  **`AGENTS.md`**: This is your primary instruction manual. It contains the core directives, architectural principles, and protocols you are expected to follow.
2.  **`ARCHITECTURE.md`**: This document provides a high-level overview of the system, including the relationship between the Astro frontend, the `easy-seo` editor, and the Cloudflare Worker backend.
3.  **`CHANGELOG.md` (and `easy-seo/CHANGELOG.md`)**: Review the latest entries in the changelogs to understand the most recent changes, bug fixes, and architectural decisions. This will give you the most current context.

## 2. Project Setup (10-15 minutes)

The project is a monorepo with two main parts: the root Astro application and the `easy-seo` Preact application.

1.  **Install Root Dependencies:**
    ```bash
    npm install
    ```
2.  **Install `easy-seo` Dependencies:**
    ```bash
    npm install --prefix ./easy-seo
    ```
3.  **Run the Application (Development Mode):**
    *   The development server for the `easy-seo` editor can be unstable. The most reliable way to work is often by running the build and preview commands separately.
    *   **Build the `easy-seo` app:**
        ```bash
        npm run build --prefix ./easy-seo
        ```
    *   **Start the Cloudflare Worker (for backend API):**
        ```bash
        npx wrangler dev
        ```
    *   Access the application in your browser at the URL provided by the `wrangler dev` command (usually `http://localhost:8787`).

## 3. Key Files & Directories (5 minutes)

Familiarize yourself with the location of these critical files and directories. A full registry can be found in `FILES.md`.

-   **`cloudflare-worker-code.js`**: The monolithic Cloudflare Worker that serves as the backend. All API logic lives here.
-   **`easy-seo/src/`**: The source code for the Preact-based editor application.
    -   **`easy-seo/src/pages/`**: Contains the top-level page components (e.g., `ExplorerPage.jsx`, `LoginPage.jsx`).
    -   **`easy-seo/src/components/`**: Contains reusable UI components.
-   **`wrangler.toml`**: The configuration file for the Cloudflare Worker. It defines the entry point, environment variables, and other deployment settings.

## 4. System Verification (5 minutes)

After starting the application, perform these quick checks to ensure the core systems are integrated and functional.

1.  **GitHub Integration:** Log in using the "Login with GitHub" button. A successful login should redirect you to the repository selection page.
2.  **Cloudflare Worker:** After selecting a repository, the File Explorer should load. Check the network tab in your browser's developer tools to ensure that requests to `/api/files/list` (or similar) are returning a `200 OK` status.

You are now ready to begin your first task. Good luck!
