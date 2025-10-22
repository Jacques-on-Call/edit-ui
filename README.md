# 🧠 StrategyContent Repository

Welcome to the source code for **StrategyContent**, a modular, mobile-first publishing system built with Astro. This repo contains the public-facing site and all related source code.

## 🚀 Getting Started

This section will guide you through setting up the project on your local machine for development and testing purposes.

### Prerequisites
- read contributions.md
- [Node.js](https://nodejs.org/) version 22.4
- [npm](https://www.npmjs.com/) version 11 (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## 📜 Available Scripts

In the project directory, you can run the following commands:

### `npm run dev` or `npm start`

Runs the app in the development mode.
Open [http://localhost:4321](http://localhost:4321) to view it in the browser.

The page will reload if you make edits.

### `npm run build`

Builds the app for production to the `dist/` folder.
It correctly bundles Astro and optimizes the build for the best performance.

### `npm run preview`

Runs a local server to preview the production build from the `dist/` directory. This is a good way to check the final output before deploying.

## 📱 PWA and File Explorer

The application includes a mobile-first file explorer that can be installed as a Progressive Web App (PWA) on your phone or desktop. This allows for a native-like experience for editing content on the go.

### Core Features:
*   **Responsive Grid Layout:** Files and folders are displayed in a responsive grid that shows 2-3 columns on mobile and expands on larger screens.
*   **Bottom Toolbar:** A thumb-friendly toolbar provides quick access to core actions:
    *   **Open:** Opens a selected file or navigates into a directory.
    *   **Create:** Opens a modal to create new files or folders.
    *   **Duplicate:** Creates a copy of the selected file.
    *   **Up:** Navigates to the parent directory.
*   **Contextual Actions (Long-Press):** Long-pressing (or right-clicking) an item opens a context menu with more options:
    *   **Rename:** Allows renaming a file.
    *   **Delete:** Deletes a file or folder with a confirmation step.
    *   **Duplicate:** Same as the toolbar action.
    *   **Share:** Copies a direct link to the file to the clipboard.
*   **Progressive Metadata:** File tiles display the last modified date and author. This data is loaded progressively and cached to ensure a fast initial load time.

### Client-Side Caching Strategy

To minimize network requests and provide an instantaneous, responsive UI, the file explorer uses a client-side caching strategy.

*   **Cache Location:** Browser's `localStorage`.
*   **Cache Key:** `filemeta-[sha]` where `[sha]` is the Git SHA of the file.
*   **Cache Data:** An object containing the `{ author, date }` of the file's last commit.
*   **Cache TTL:** Cached items have a Time-To-Live (TTL) of 5 minutes to ensure eventual consistency.
*   **Workflow:** On load, the app first checks the cache for metadata. If an item is not found or has expired, it is queued for a background fetch from the GitHub API.
*   **Invalidation:** The cache for a specific file is cleared whenever it is modified via a `Rename` or `Delete` action.

### Accessing the Editor:
The editor is available at [`edit.strategycontent.agency`](https://edit.strategycontent.agency).


## 🗂️ Project Architecture

This repository uses a monorepo-like structure with two primary directories:

-   **/src/**: This is the main content directory for the Astro-based public website. All pages, layouts, and components for the `StrategyContent.agency` site reside here.
-   **/easy-seo/**: This is a self-contained React application that serves as the file explorer and content editor. It authenticates with GitHub and uses the API to manipulate the files in the `/src` directory.

This separation allows the content and the editor to be developed and deployed independently.

### Editor vs. Content

A key architectural concept is the separation between the **editor (the tool)** and the **content (the documents)**.

-   **The Editor (`/easy-seo/`)**: This is a standalone React application that acts as a "headless" CMS. It contains all the UI and logic for creating and manipulating content but does not know how to render the final website.
-   **The Content (`/src/`)**: This is the user's Astro project. It contains all the actual `.astro` files, including pages, layouts, and the reusable block components found in `/src/blocks/`. These components are the building blocks of the final website and are rendered by the Astro compiler, not the React-based editor.

This separation ensures that the `easy-seo` editor remains a portable tool that can operate on any compatible Astro project, making future installer wizards or integrations much simpler to build.

## 🗂️ File Structure


src/
├── pages/         # Static pages (e.g. index, about, contact)
│   ├── blog/      # Blog posts with frontmatter metadata
│   ├── hubs/      # Niche content hubs
│   ├── services/  # Service-specific landing pages
├── layouts/       # Page and post layouts
├── components/    # Reusable UI elements
├── cards/         # Card components
public/
└── images/        # Media assets

legacy-site/       # Archived pre-Astro version for reference

## 🧪 Versioning & Safety

Before publishing major changes:

• Create a new branch from `main` (e.g. `pre-refactor-2025-09-09`)
• Optionally tag the commit (e.g. `v0.9.0`)
• Use pull requests to merge changes safely


## 🧩 Goals

• Mobile-first editing experience
• Modular, teachable publishing workflow
• Versioned content for future AI agent collaboration
• SEO-optimized structure for legal professionals


## 👥 Team & Collaboration

This project is a collaboration between human and AI developers. The team includes:

*   **Jacques Damhuis:** Strategy architect and content designer.
*   **Jules (AI Developer):** Responsible for various development tasks.

The involvement of multiple AI agents is possible and coordinated through a central project management system. The goal is to create a seamless workflow where different AI instances can contribute to the project's development.

## question for the team:
1.  Does this proposed architecture align with our long-term vision for a simple, modular, and teachable publishing workflow?
2.  The new system will save files with JavaScript-based frontmatter (`export const frontmatter = {...}`). Are there any concerns with moving away from YAML for all new and updated content?
3.  Are there any other "quality of life" features for content creators that we should consider adding to the editor's "Preview" tab? (e.g., a word count, a readability score?)
