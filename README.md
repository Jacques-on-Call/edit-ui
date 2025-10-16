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

---

## 🧭 Layout Loading Debug Checklist

**Goal:** Determine why layout templates (from D1) and Astro layout files (from GitHub) do not appear or render in the layout editor.

Each step builds on the previous. Don’t skip ahead until one is confirmed working.

---

### 🔹 Phase 1 – Verify Backend Output

**✅ Step 1. Check /api/layout-templates Worker Handler**

Open `cloudflare-worker-code.js` and locate: `case "/api/layout-templates":`

**Confirm:**
- The SQL query: `const result = await env.DB.prepare("SELECT * FROM layout_templates").all();`
- It returns `JSON.stringify(result.results)` or `Response.json(result.results)` (not just `result`).

**✅ Expected Output Example:**
```json
[
  {
    "id": 1,
    "name": "Homepage Layout",
    "json_content": "{\\"ROOT\\":{\\"type\\":\\"div\\",\\"props\\":{},\\"nodes\\":[]}}",
    "created_at": "2025-10-05T12:00:00Z"
  }
]
```

**❌ Red Flags:**
- Returns `{ success: true, results: [] }`
- Or returns Base64 instead of raw JSON string
→ indicates D1 query or JSON encoding mismatch.

---

**✅ Step 2. Check /api/astro-layouts**

Still in `cloudflare-worker-code.js`: `case "/api/astro-layouts":`

**Confirm:**
- It’s calling GitHub’s API endpoint like: `GET /repos/{owner}/{repo}/contents/src/layouts`
- That it filters only `.astro` files before returning.

**✅ Expected Output Example:**
```json
[
  { "name": "BaseLayout.astro", "path": "src/layouts/BaseLayout.astro" },
  { "name": "LandingPage.astro", "path": "src/layouts/LandingPage.astro" }
]
```

**❌ Common Pitfalls:**
- The path is hardcoded incorrectly (`src/layout` instead of `src/layouts`).
- The GitHub API returns an array of file objects, but the Worker only passes a single `file.content`.

**🧩 Debug Tip:**
In the Worker’s console (via `wrangler dev`), log the result before returning:
`console.log("Astro layouts:", result);`

---

### 🔹 Phase 2 – Verify Frontend Data Consumption

**✅ Step 3. Find Fetch Logic in `LayoutsDashboardPage.jsx` (COMPLETED)**

**Status:** The `useEffect` hook has been refactored to fetch D1 and Astro layouts into separate state variables (`d1Layouts`, `astroLayouts`), ensuring the data is correctly consumed and handled.

---

**✅ Step 4. Verify Data Mapping to UI (COMPLETED)**

**Status:** The JSX in `LayoutsDashboardPage.jsx` has been updated to render the `d1Layouts` and `astroLayouts` arrays in two distinct sections with appropriate headers and styling. This correctly maps the fetched data to the UI.

---

### 🔹 Phase 3 – Verify CraftJS Canvas Hydration

**✅ Step 5. Check Deserialization in `LayoutEditorPage.jsx`**

Locate something like:
```jsx
useEffect(() => {
  if (layout && layout.json_content) {
    actions.deserialize(JSON.parse(layout.json_content));
  }
}, [layout]);
```

**✅ Test:**
Insert a temporary log: `console.log("Deserializing:", layout?.json_content);`
- If you see a JSON string → check if it’s valid CraftJS format.
- If it’s empty → D1 record was found, but column `json_content` was null or misnamed.

---

**✅ Step 6. Confirm Component Registration**

In the editor setup (usually near the top of `LayoutEditorPage.jsx`):
`<Editor resolver={{ Container, Section, Hero, TextBlock }}>`

Compare this list with the component names used inside your stored JSON (`layout.json_content`).
If they don’t match, CraftJS silently refuses to render.

**✅ Test:**
Manually deserialize a minimal layout:
`actions.deserialize({ ROOT: { type: "div", props: {}, nodes: [] } });`
If that renders a blank div → good.
If not, deserialization is blocked or the editor instance didn’t initialize.

---

### 🔹 Phase 4 – Cross-Verification

**✅ Step 7. Compare D1 JSON with Working Example**

Take any saved layout JSON and paste it into a test sandbox:
`const testJson = JSON.parse(layout.json_content);`
`console.log(Object.keys(testJson.ROOT));`

**✅ Should show at least:** `["type", "props", "nodes"]`

**❌ If it shows something like:** `["editorState", "data", "id"]`
→ you’re storing the wrong CraftJS state shape (likely the entire `editor.query.getSerializedNodes()` object instead of the `ROOT` tree).
Fixing the serialization format will make existing layouts visible again.

---

### 🔹 Phase 5 – Optional: Sync Logic Between D1 and Astro

**✅ Step 8. File Type Routing**

In `FileExplorer.jsx` or wherever you call `navigate("/editor" | "/layout-editor")`, find:
```jsx
if (file.path.startsWith("src/layouts")) {
  navigate("/layout-editor?id=" + file.path);
} else {
  navigate("/editor?id=" + file.path);
}
```
If this condition is missing or inverted, `.astro` layouts open in the wrong editor.

---

## Layout Editor Dehydration Fix: Development Roadmap (Oct 2025)

This section documents the active, incremental plan to build a new, robust, mobile-first layout editor to solve the "layout dehydration" issue. The work is being done by Jules #98.

**Core Methodology:** Start with a "scorched earth" minimal proof-of-concept and build confidence with each subsequent milestone. The primary target device for testing and usability is an iPhone.

---

### **Milestone 1: Single Component on Canvas (Complete)**

*   **Goal:** Prove that a single component could be rendered on a blank canvas.
*   **Outcome:** A minimal editor now successfully renders a single, non-interactive `Hero` component.
*   **Key Learnings:**
    *   Solved a critical Craft.js `Invariant failed` error by ensuring a component marked `isCanvas: true` does not also render a `<Canvas>` tag. The component should render its `children` directly.
    *   Confirmed that `<Element is={Component} />` is required to wrap all components placed on the canvas.

---

### **Milestone 2: Toolbox & Mobile Drag-and-Drop (In Progress)**

*   **Goal:** Implement a mobile-first toolbox that allows a user to drag a `Hero` component onto the canvas.
*   **Current Status:**
    *   A mobile-friendly bottom toolbar has been implemented.
    *   The toolbox contains a `Hero` component that is configured to be draggable.
*   **Active Challenge:** Standard HTML5 drag-and-drop does not work on mobile (iPhone). The current effort is focused on solving this by integrating `react-dnd` with the `react-dnd-touch-backend`. This library will translate mobile touch events into the drag-and-drop commands that Craft.js expects.
*   **Key Learnings (from regressions):**
    *   The Drag-and-Drop Provider (`DndProvider`) must be scoped carefully to only wrap the parts of the application that need it, to avoid breaking standalone pages like the login flow.

---

### **Milestone 3: Property Editing (Next)**

*   **Goal:** Introduce a settings panel (sidebar) that appears when a component is selected on the canvas.
*   **Functionality:** This panel will contain controls (e.g., text inputs) to edit the properties of the selected component (e.g., the title and subtitle of a `Hero`) and see the changes reflected live on the canvas.

---

### **Milestone 4: Advanced Mobile UX (Future)**

*   **Goal:** Implement a more intuitive, touch-based drag-and-drop system for reordering components.
*   **Functionality:** Users will be able to long-press and drag components directly with their finger, providing a more fluid and direct editing experience on mobile devices.

---

### **Milestone 5: Code Generation & Persistence (Future)**

*   **Goal:** Implement the "save" part of the load/save cycle.
*   **Functionality:**
    *   Generate `.astro` file content from the current state of the components on the canvas.
    *   Persist this generated layout, likely back to a file in the user's GitHub repository or to the D1 database as a template.

---

### **Milestone 5: Loading from Astro File (Future)**

*   **Goal:** Complete the full, bidirectional editing workflow.
*   **Functionality:** Parse an existing `.astro` file from the user's repository, translate its content into the Craft.js editor state, and load it onto the canvas for visual editing.

---

## Universal Layout Interpreter - Implementation Plan

Below is a developer-ready implementation plan designed to make the layout editor resilient, debuggable, and forward-compatible.

**🧠 Goal Summary**

*   **Goal:** Create a universal layout interpreter that can safely parse, render, and visualize .astro layout files (and embedded React/Vue islands) inside a visual editor — with built-in data normalization, error fallbacks, and live debugging hooks.
*   **Outcomes:**
    *   Works with current and future Astro versions
    *   Supports React/Vue/Svelte islands
    *   Detects, parses, and renders all layout types
    *   Never breaks due to data shape or missing component imports
    *   Visual debugging layer for non-renderable layouts

---

**⚙️ Phase 1 – Core Layout Interpreter (Completed)**

**1. File Parsing Layer**
Create a parser that can detect and classify layouts automatically.
```javascript
// pseudo-code
detectLayoutType(fileContent) {
  if (fileContent.includes("import React") || fileContent.includes("from 'react'")) return 'react';
  if (fileContent.includes("from 'vue'")) return 'vue';
  if (fileContent.includes("from 'svelte'")) return 'svelte';
  if (fileContent.includes("---") && fileContent.includes("<html")) return 'astro';
  return 'unknown';
}
```

**2. Frontmatter Extractor**
Use regex or gray-matter to extract the `---` block and normalize it into JSON.
```javascript
normalizeFrontmatter(rawFrontmatter) {
  try {
    return parseFrontmatter(rawFrontmatter); // converts Astro frontmatter into JSON
  } catch (err) {
    return { error: `Invalid frontmatter: ${err.message}` };
  }
}
```

**3. Schema Validation**
Add schema checking for layout props (e.g., title, description, meta, schema).
```javascript
const layoutSchema = {
  title: 'string',
  description: 'string',
  meta: 'object?',
  schema: 'object?'
};
```
*🔧 Optional: use Zod or ajv for strict schema validation.*

---

**🧩 Phase 2 – Component Mapper (Completed)**

**1. AST (Abstract Syntax Tree) Reader**
Use `@astrojs/compiler` to walk the AST and map all components, including standard components and client-side islands.
*   **Note:** The initial implementation using a generic JSX parser (`acorn-jsx`) was replaced with the official Astro compiler. This was a critical fix to ensure accurate parsing of Astro-specific syntax (e.g., `<style>` tags, `client:*` directives), which resolved a fundamental `Failed to parse Astro body` error.

**2. Component Registry**
Maintain a registry with dynamic import fallbacks:
```javascript
registry = {
  Header: async () => import('../components/Header.astro').catch(showPlaceholder),
  Footer: async () => import('../components/Footer.astro').catch(showPlaceholder),
};
```
If import fails → render `<MissingComponent name="Header" />`.

---

**🧱 Phase 3 – Visual Render Engine (Completed)**

**1. Safe Renderer**
All layout previews are rendered in a sandboxed `<iframe>` to isolate them from the main application, preventing style and script conflicts.

**2. Fallback Renderer**
If a layout file cannot be parsed or rendered, a detailed fallback view is displayed within the `iframe`. This view includes:
*   A clear error message.
*   The file's frontmatter.
*   A list of all detected components.
*   A list of all detected client-side islands.

---

**🪄 Phase 4 – Error & Debugging Layer (Completed)**

**1. Live Error Feed**
A responsive, mobile-first `DebugSidebar` component displays a live feed of diagnostic information when a layout fails to render. It shows all the information from the fallback renderer in a persistent sidebar for easier debugging.

**2. Visual Indicators**
*Not yet implemented.*

**3. Interactive Fix Suggestions**
*Not yet implemented.*

---

**🧩 Phase 5 – Reactive Islands Support (Partially Completed)**

**1. Astro Island Auto-Detection**
The system now uses the `@astrojs/compiler` to accurately detect all components with a `client:*` directive. These are displayed in the fallback renderer and the debug sidebar.

**2. Hydration Controller**
Hydrate islands only after the main layout is mounted (avoiding premature runtime errors).
```javascript
hydrateIslandsAfterRender(() => {
  islands.forEach(loadIslandSafely);
});
```

**3. Reactive Renderer Adapters**
Create adapters for React, Vue, and Svelte using micro-frontends (import maps or modular federation).

---

**🧰 Phase 6 – Long-Term Stability Features**
*   **Normalization Patch System:** Each layout load passes through a `normalizeLayoutData(layout)` function that reshapes props to a safe base schema.
*   **Version-Aware Engine:** Detect Astro version (via `astro.config.mjs`) and enable compatibility shims if syntax changes.
*   **Diagnostics Export:** Export layout maps, dependencies, and render logs as JSON for bug reports or debugging sessions.

---

**🔒 Bonus: Developer Safety Tools**

| Tool                     | Purpose                          |
| ------------------------ | -------------------------------- |
| `vite-plugin-inspect`    | View actual component graph      |
| `astro-check` CLI        | Validate syntax before render    |
| `react-error-boundary`   | Catch React island crashes       |
| `console.groupCollapsed()`| Clean, readable logs             |
| Source Map Overlay       | Map rendered view to file lines  |

---

**✅ Summary of Deliverables**

For Jules to implement:
1.  `layoutInterpreter.ts` → Detects type, parses frontmatter, validates schema
2.  `componentMapper.ts` → Maps and loads components dynamically
3.  `layoutRenderer.ts` → Safely renders with iframe/shadow DOM
4.  `debugLayer.tsx` → Displays missing components, errors, suggestions
5.  `islandHydrator.ts` → Loads Astro islands and React/Vue elements safely
6.  `normalizationPatch.ts` → Reshapes data for stable rendering

---

## 🚀 Development Roadmap: The Creative Intelligence Engine

The following roadmap outlines the evolution of the layout editor from a technical interpreter into a modern, AI-powered creative tool.

### Tier 1: Modern Design Capability Layer

The goal of this tier is to empower users to create and preview modern, trend-aware web aesthetics directly within the editor.

*   **Phase 1: Modern Design Schema**
    *   Enhance the layout schema to include modern design tokens for themes, animations, color palettes, UI elements (buttons, cards), and motion. This allows for a declarative, editable JSON-based theme system.

*   **Phase 2: Visual DNA System (Trend Engine)**
    *   Implement a "style pack" engine to load and merge pre-made modern themes (e.g., "Soft Neo," "Cyber Grid," "Play Minimal"). This allows for instant design application via CSS variables and component classes.

*   **Phase 3: Modular Layout Components**
    *   Create an internal library of atomic, theme-compatible layout components (`HeroSection`, `FeatureGrid`, `CTASection`, etc.) that users can mix and match.

*   **Phase 4: Real-Time Interaction Preview**
    *   Integrate a lightweight reactive engine (e.g., Preact Signals) into the preview `iframe` to provide live feedback on hover animations, button interactions, and theme toggles without a full rebuild.

*   **Phase 5: Smart Modernization Suggestions (AI Assist)**
    *   Develop an AI layer that suggests modern upgrades (e.g., "apply a gradient hover animation to your buttons") based on the current layout's structure and style.

*   **Phase 6: Accessibility & Device Awareness**
    *   Add automated color contrast checks, touch gesture optimization, and a responsive scaling preview to ensure layouts are inclusive and mobile-first.

*   **Phase 7: Design Plugin System**
    *   Structure the rendering engine to support a plugin system, allowing future developers to add new UI packs and animation libraries without modifying the core.

### Tier 2: AI Layout Decoder Layer

The goal of this tier is to bridge the gap between design perception and structural generation, allowing users to create layouts from visual inputs.

*   **Phase 1: AI-Powered Input Analysis**
    *   Create a `/api/ai-decode` endpoint that accepts an image or a URL.
    *   Integrate an AI vision model (e.g., Gemini Vision) to analyze images for layout structure, typography, and color palettes.
    *   Build a lightweight scraper to parse the DOM of a given URL for the same information.

*   **Phase 2: Schema Translator**
    *   Develop a translation layer that maps the AI/DOM findings to the editor's internal component library (e.g., a `<header>` tag maps to the `Header` component).

*   **Phase 3: Visual Assembly & Feedback Loop**
    *   The Layout Editor will use the translated JSON to render the generated structure.
    *   If the AI cannot find a perfect component match, it will suggest the closest substitute.
    *   The system will learn from user corrections, improving its mapping accuracy over time.