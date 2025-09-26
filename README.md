# Easy-SEO Content Editor

## 1. Overview

Welcome to the Easy-SEO Content Editor! This is a custom-built, React-based web application designed to manage the content of the main Astro website contained in this repository.

The editor provides a user-friendly interface for browsing, creating, and editing `.astro` pages, with a special focus on a "section-based" content model. It is designed to be a "frameless" and intuitive experience, especially on mobile devices.

## 2. Architecture

The project consists of two main parts: the frontend editor and a serverless backend.

### Frontend

*   **Framework:** React v19, bundled with Vite.
*   **Location:** All frontend code is located in the `/easy-seo` directory.
*   **Styling:** Standard CSS files, co-located with their respective components.
*   **Key Features:**
    *   **File Explorer:** Browse the contents of the `src/pages` directory in the main repository.
    *   **Section-Aware Editor:** Built with TinyMCE, the editor can parse `.astro` files that use a `sections` array in their frontmatter. It renders editable rich text areas for `text_block` sections and user-friendly visual previews for other section types (e.g., 'hero', 'grid').
    *   **Local Drafts:** All changes are automatically saved as a local draft in the browser's `localStorage`, preventing data loss.

### Backend

*   **Type:** Serverless, running on Cloudflare Workers.
*   **Location:** The worker code is defined in `cloudflare-worker-code.js` in the root of the main repository.
*   **Function:** The worker acts as a secure proxy between the React editor and the GitHub API. It handles:
    *   **Authentication:** Manages the GitHub OAuth flow to get a user token.
    *   **File Operations:** Uses the authenticated user's token to perform all file operations (reading, writing, deleting) directly on the GitHub repository.

### Content Format

The editor is specifically designed to work with `.astro` files that use **JavaScript frontmatter**. It expects an exported constant named `frontmatter`, which contains all page metadata, including the `sections` array that defines the page structure.

**Example:**
```javascript
---
export const frontmatter = {
  title: "My Awesome Page",
  sections: [
    { type: 'hero', title: 'Welcome!' },
    { type: 'text_block', content: '<p>Some editable text.</p>' }
  ]
};
---
<!-- Page body -->
```

## 3. How to Run

### Prerequisites

*   Node.js and npm must be installed.

### Installation

To install the project's dependencies, run the following command from the **root of the repository**:

```bash
npm install --prefix ./easy-seo
```
*Note: The `--prefix` flag is required to ensure dependencies are installed in the correct directory.*

### Running the Development Server

To start the local development server, run the following command from the **root of the repository**:

```bash
npm run dev --prefix ./easy-seo
```
The application will typically be available at `http://localhost:5173`.

### Building for Production

To create a production-ready build of the application, run:

```bash
npm run build --prefix ./easy-seo
```
The optimized and bundled assets will be placed in the `easy-seo/dist` directory.