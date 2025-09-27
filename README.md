# Easy-SEO Content Editor

## 1. Overview

Welcome to the Easy-SEO Content Editor! This is a custom-built, React-based web application designed to manage the content of the main Astro website contained in this repository.

The editor provides a user-friendly interface for browsing, creating, and editing `.astro` pages, with a special focus on a "section-based" content model. It is designed to be a "frameless" and intuitive experience, especially on mobile devices.

## 2. Architecture

The project consists of two main parts: the frontend editor and a serverless backend.

### Frontend

*   **Framework:** React v19, bundled with Vite.
*   **Location:** All frontend code is located in the `/easy-seo` directory.
*   **Styling:** CSS Modules (`*.module.css`), with each component importing its own styles.
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

## 4. Development Notes

### CSS Modules Refactoring (Sept 2025)

The application's styling has been refactored to align with the "Component-based styling" principle outlined in this README. All components within `easy-seo/src/` now use CSS Modules (`*.module.css`) instead of global CSS imports.

**Key Learnings:**

*   **Build Process:** The Vite build process is strict about resolving imports. During the refactoring, it was discovered that some parent components were importing CSS for their children (e.g., `FileExplorer.jsx` importing `ContextMenu.css`). This is an anti-pattern that was resolved by ensuring each component exclusively imports its own styles.
*   **Dependency Trail:** A large-scale refactor like this can create a "trail" of broken imports that only become apparent during the production build. It's crucial to run a build after making significant changes to catch these issues early.

**Suggestions for Future Improvements:**

*   **Shared Styles:** Some components, like `CreateModal.jsx` and `RenameModal.jsx`, use the same stylesheet. While this works, a better approach would be to create a generic `Modal` component that encapsulates the shared styling, which other modals can then use. This would improve reusability and make the styling more robust.

Jules Instructions:
Jules map CSS modules directly to JSX without ambiguity. I’ll describe the architecture in precise component terms, not loose words.

---

🔑 Architectural Principles

• Component-based styling: Each React component imports its own `*.module.css` file.
• Design tokens: Shared variables for color, spacing, typography live in a single `tokens.css`.
• Layout primitives: `Header`, `Footer`, `Container` components provide consistent structure.
• Feature components: `LoginScreen`, `FileExplorer`, `PreviewPage`, `EditorPage` each own their scoped styles.
• Interaction states: Selection, hover, and active states are defined in the component’s CSS module, not globally.


---

📂 Folder & File Structure

/src
  /components
    /Layout
      
    /Login
     
    /Explorer
      
    /Preview
      
    /Editor
      
  /styles
    tokens.css
    globals.css


---

🎨 Visual Flow in Correct Terms

1. LoginScreen component• Full-viewport container (`100vh`) with `background-color: var(--color-blue)`.
• Centered form elements styled via `LoginScreen.module.css`.

2. Layout components (Header, Footer)• `Header` and `Footer` components styled with `Header.module.css` and `Footer.module.css`.
• Both use `background-color: var(--color-blue)` and `color: var(--color-white)`.
• `Footer` is `position: fixed; bottom: 0; width: 100%`.

3. FileExplorer component• `FileExplorer.module.css` defines a white background container.
• `FolderItem` and `FileItem` components each import their own CSS modules.
• `FolderItem` uses `background-color: var(--color-folder)`.
• `FileItem` uses `background-color: var(--color-file)`.
• Both have `.selected` class with `outline: 2px solid var(--color-blue)` and `transition: background 0.2s ease`.
• Double-click event in JSX triggers navigation to either `PreviewPage` or nested `FileExplorer`.

4. PreviewPage component• Styled with `PreviewPage.module.css`.
• Contains `.document` class for plain-text rendering with `line-height: 1.6`.
• Includes navigation buttons (`Back`, `Edit`, `Search`) styled as reusable `Button` components.

5. EditorPage component• Uses `EditorPage.module.css`.
• Layout: `display: flex; flex-direction: column; height: 100vh`.
• `Header` and `Footer` reused from Layout.
• `Footer` has `.keyboardVisible` modifier class that applies `transform: translateY(-200px)` to rise with the keyboard.
• `editorArea` is a scrollable white container for text editing.



