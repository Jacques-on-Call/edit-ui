# Easy SEO - Astro Content Editor

This project is a React-based content editor designed to work with Astro sites. It provides a user-friendly interface for managing content stored in a GitHub repository.

## Architecture Overview

*(This section is a placeholder for the original architectural notes.)*

The application consists of two main parts:
1.  A **React single-page application (SPA)** built with Vite, responsible for the user interface.
2.  A **Cloudflare Worker backend** that handles authentication and acts as a secure proxy to the GitHub API.

---

## Jules' Developer & Handover Notes

This section details the work completed, the architecture implemented, and key learnings for the next developer taking over. My environment has become unstable, so this serves as my final handover.

### Core Architecture & Local Development Setup

The most critical piece of this setup is the local development environment, which is designed to accurately mimic the Cloudflare Pages production environment and resolve the 404 errors encountered previously.

*   **Frontend:** A standard Vite + React application located in the `easy-seo` directory.
*   **Backend:** A single Cloudflare Worker script, `easy-seo/worker.js`, handles all API logic. It authenticates requests using a session cookie and proxies them to the GitHub API.
*   **Local Servers:** To make this work locally, we run two servers simultaneously:
    1.  The **Vite dev server** for the frontend (`npm run dev:frontend`).
    2.  The **Wrangler dev server** for the backend worker (`npm run dev:api`), which runs on `http://localhost:8787`.
*   **Proxying:** The Vite server is configured in `vite.config.js` to proxy any request to `/api/*` to the Wrangler server. This is the key that connects the frontend to the backend.
*   **Running Locally:** To start the entire development environment, simply run `npm run dev` from the `easy-seo` directory. This uses `concurrently` to start both servers.

### Styling with Tailwind CSS

*   **Configuration:** The project is fully configured with Tailwind CSS. The main configuration is in `tailwind.config.js`.
*   **Custom Colors:** I've added custom colors based on your feedback from the legacy site's stylesheet:
    *   `bark-blue`: `#003971` (used for the footer and login page background)
    *   `light-grey`: `#F5F5F5` (used for the main application header)
*   **Plugins:** The project uses the `@tailwindcss/typography` plugin for rendering Markdown content (in the `ReadmeDisplay`) and the `@tailwindcss/forms` plugin for styling form elements in modals.

### Component & Feature Breakdown

*   **Authentication Flow (GitHub OAuth):**
    *   `pages/LoginPage.jsx`: The entry point for users. It initiates the GitHub OAuth flow.
    *   `pages/CallbackPage.jsx`: Handles the redirect from GitHub, exchanges the code for a token (via the `/api/token` worker endpoint), and sets the session cookie.
    *   `pages/RepositorySelectionPage.jsx`: Appears after a successful login for the user to choose a repository.

*   **Application Layout:**
    *   `components/AppLayout.jsx`: This is a context-aware layout. It uses the `useLocation` hook to check the current URL.
    *   `components/ExplorerHeader.jsx`: A special header that is displayed only on explorer-related routes (`/explorer/*`). It contains the search bar for a more integrated feel.
    *   For all other pages under the layout, a default header with the site logo is shown.

*   **File Explorer:**
    *   `pages/ExplorerPage.jsx`: The main page that houses the file explorer.
    *   `components/FileExplorer.jsx`: The core component that fetches and displays files and folders.
    *   `components/SearchBar.jsx`: The search component, now integrated into the `ExplorerHeader`.
    *   `components/ReadmeDisplay.jsx`: A component to render the `README.md` of the current directory.
    *   **Modals:** The explorer uses several modals for user actions: `CreateModal`, `ConfirmDialog`, `RenameModal`, and `ContextMenu`.

### Important Learnings & Discoveries

The primary challenge was correctly setting up the local development environment to support the Cloudflare Worker backend. My initial approach using a `functions` directory was incorrect for a Vite project, as the Vite dev server cannot execute those functions. The breakthrough was realizing that `wrangler` needed to run as a separate process and that Vite's built-in proxy was the way to connect the two servers. This setup is now robust and accurately reflects the production deployment on Cloudflare Pages.

Thank you for the opportunity to work on this project. The foundation is now solid, and the next developer should be able to build upon this architecture successfully.
