# Easy-SEO Content Editor

## 1. Overview
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

### Tailwind CSS and Styling Setup (Oct 2025)

This project uses **Tailwind CSS** for styling, not CSS Modules as some older documentation may suggest. The primary stylesheet is located at `easy-seo/src/styles/main.css`, which contains the necessary `@tailwind` directives. This file is imported once in the application's entry point, `easy-seo/src/main.jsx`.

During the refactoring process, several key issues were identified and resolved to ensure a stable build and correct application behavior:

*   **Vite Build Configuration:** The Vite dev server would fail to start due to a conflict with the root-level `tsconfig.json` from the parent Astro project. This was resolved by creating a local `tsconfig.json` and `tsconfig.node.json` inside the `easy-seo/` directory. This isolates the React project's build process from the monorepo's root configuration.

*   **React Router Integration:** The application relies on `react-router-dom` for client-side routing. For the application to render correctly, the main `<App />` component must be wrapped in a `<BrowserRouter>` component within `easy-seo/src/main.jsx`. This file also defines all the application's routes, such as `/`, `/callback`, and `/explorer`.

*   **Component Rendering:** The initial entry point was rendering a test component. This was corrected to render the main `<App />` component, which is the proper entry point for the application.

### CSS Modules Refactoring (Sept 2025)

**Note:** The following notes refer to a previous refactoring and are kept for historical context. The project has since moved to a global Tailwind CSS approach.

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



### 5. Outstanding Issues & Next Steps 
     
jules task: Oh my goodness, we went from black background white text no css to white background white text with css, now back to black background white text no css. From the parts I saw I’m worried as it’s not quite as I described. 

the vision and what you will find when you look at the code in react-login. 

🖼️ Preview Screen

• A full-page website-like view that renders the document with its associated CSS and images.
• Includes a fixed blue header containing the following interactive elements:• Back button
• Search Preview button
• Edit button
• Publish button
• Status indicator (e.g. draft, published, error)

• On smaller screens, the header layout may require responsive wrapping or collapsing to maintain usability.


---

🔍 Search Preview Modal

• Triggered from the Preview screen via the Search Preview button.
• Appears as a modal dialog with two tabs:1. SERP View Tab• Displays a simulated search engine result preview.
• Includes editable fields for:• Meta title
• Meta description
• URL slug

• Changes reflect in the visual SERP preview in real time.

2. JSON Schema Tab• Allows editing of structured data (JSON-LD format).
• Supports schema types like:• Breadcrumbs
• Page details
• Rich snippets

• Enhances the document’s visibility in search engines by enabling rich results.


So can you do the css for this?

---

### Jules Task #55: AI-Powered Schema Editor (Oct 2025)

**Vision:** An intuitive interface for managing page schemas. One tab for manual editing of head metadata, and a second, AI-assisted tab for automated schema generation based on a list of 24 preferred schema types. The goal is to make search visibility tangible and powerful.

**My Clarifying Questions:**

To ensure I build exactly what you envision, I have a few questions:

1.  **Integration Point:** The app is a content editor for `.astro` files. Will this new schema editing feature be part of the existing `EditorPage`, or should it be a new interface accessible from the `PreviewPage` (which already has "Back", "Edit", "Search" buttons)?
2.  **UI Structure:** You described a two-tab interface (manual metadata and automated schemas). Does the current editor already handle basic metadata (like page title)? Should I build this two-tab view from scratch, or extend an existing UI?
3.  **Automation Source:** For the "automated" schema tab, what content should the AI analyze? Should it process the text inside the rich text editor (`text_block` sections) to suggest and pre-fill schemas? For example, if it sees a list of steps, should it automatically generate a `HowTo` schema?
4.  **AI's Role:** You mentioned "hidden mechanics" and "AI assistance." Could you give an example? Are you thinking the AI should intelligently layer multiple schemas? For instance, if a blog post (`Article`) also describes an upcoming webinar (`Event`), should the AI automatically create and combine both schemas?
5.  **Manual vs. Automated:** The list of 24 schemas is comprehensive. Besides the AI's suggestions, should the interface also allow users to manually add, edit, and layer any of these schemas themselves?

Your answers will help me create a precise plan to bring this powerful feature to life.

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



### 5. Outstanding Issues & Next Steps 
     
jules task: Oh my goodness, we went from black background white text no css to white background white text with css, now back to black background white text no css. From the parts I saw I’m worried as it’s not quite as I described. 

the vision and what you will find when you look at the code in react-login. 

🖼️ Preview Screen (almost perfect working page, only needs fine tuning)

• A full-page website-like view that renders the document with its associated CSS and images.
• Includes a fixed header containing the following interactive elements:• Back button
• Search Preview button
• Edit button
• Publish button
• Status indicator (e.g. draft, published, error)

• On smaller screens, the header layout may require responsive wrapping or collapsing to maintain usability.


---

🔍 Search Preview Modal 

• Triggered from the Preview screen via the Search Preview button.
• Appears as a modal dialog with two tabs:1. SERP View Tab• Displays a simulated search engine result preview.
• Includes editable fields for:• Meta title
• Meta description
• URL slug

• Changes reflect in the visual SERP preview in real time.

2. JSON Schema Tab (see Jules task #55) • Allows editing of structured data (JSON-LD format).
• Supports schema types like:• Breadcrumbs
• Page details
• Rich snippets

• Enhances the document’s visibility in search engines by enabling rich results.




---

### Jules Task #55: AI-Powered Schema Editor (Oct 2025)

**Vision:** An intuitive interface for managing page schemas. One tab for manual editing of head metadata, and a second, AI-assisted tab for automated schema generation based on a list of 24 preferred schema types. The goal is to make search visibility tangible and powerful.

**My Clarifying Questions:**

To ensure I build exactly what you envision, I have a few questions:

1.  **Integration Point:** The app is a content editor for `.astro` files. Will this new schema editing feature be part of the existing `EditorPage`, or should it be a new interface accessible from the `PreviewPage` (which already has "Back", "Edit", "Search" buttons)?
2.  **UI Structure:** You described a two-tab interface (manual metadata and automated schemas). Does the current editor already handle basic metadata (like page title)? Should I build this two-tab view from scratch, or extend an existing UI?
3.  **Automation Source:** For the "automated" schema tab, what content should the AI analyze? Should it process the text inside the rich text editor (`text_block` sections) to suggest and pre-fill schemas? For example, if it sees a list of steps, should it automatically generate a `HowTo` schema?
4.  **AI's Role:** You mentioned "hidden mechanics" and "AI assistance." Could you give an example? Are you thinking the AI should intelligently layer multiple schemas? For instance, if a blog post (`Article`) also describes an upcoming webinar (`Event`), should the AI automatically create and combine both schemas?
5.  **Manual vs. Automated:** The list of 24 schemas is comprehensive. Besides the AI's suggestions, should the interface also allow users to manually add, edit, and layer any of these schemas themselves?

Your answers will help me create a precise plan to bring this powerful feature to life.
