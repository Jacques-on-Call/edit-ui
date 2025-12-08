# File & Module Registry

This document serves as a central registry for the key files and modules in this repository. It is intended to help developers (human or AI) quickly understand the purpose and context of each major component.

---

## 📂 Root Directory

| File / Directory | Purpose | Notes |
| :--- | :--- | :--- |
| **`AGENTS.md`** | **Primary Instruction Manual:** Contains core directives, architectural principles, and protocols for AI agents. | **MUST READ.** This is the source of truth for agent behavior. |
| **`ARCHITECTURE.md`** | **System Overview:** Describes the high-level architecture of the project. | Provides context on how the Astro app, `easy-seo` editor, and Cloudflare Worker interact. |
| **`CHANGELOG.md`** | **Project-Wide Changes:** Records major changes, decisions, and bug fixes that affect the entire system. | Review before starting work. |
| **`ONBOARDING.md`** | **"First 30 Minutes" Guide:** Provides a step-by-step checklist for new contributors to get set up and oriented. | Start here. |
| **`FILES.md`** | **This File:** A central registry of key files and their purposes. | |
| **`RECOVERY.md`** | **Debug Diary:** A living log of common failure modes, known bugs, and their resolutions. | Consult this first when troubleshooting. |
| **`SCHEMAS.md`** | **Data Contracts:** The single source of truth for API schemas and component prop shapes. | Essential for preventing data-related bugs. |
| **`cloudflare-worker-code.js`** | **Backend API Server:** The monolithic Cloudflare Worker that handles all API requests. | All backend logic lives here. Currently being refactored to a modular architecture. |
| **`wrangler.toml`** | **Worker Configuration:** The configuration file for the Cloudflare Worker. | Defines the entry point, environment variables, and deployment settings. |
| **`easy-seo/`** | **Editor Application:** The main Preact-based application for content and layout editing. | This is where the majority of frontend development occurs. |

---

## 🚀 `easy-seo/` Application

| File / Directory | Purpose | Notes |
| :--- | :--- | :--- |
| **`easy-seo/CHANGELOG.md`** | **Editor-Specific Changes:** Records changes and learnings specific to the `easy-seo` application. | |
| **`easy-seo/src/main.jsx`** | **Application Entry Point:** Initializes the Preact application and sets up the router. | |
| **`easy-seo/src/App.jsx`** | **Root Component & Router:** Defines the application's URL structure and page components. | **Architectural Note:** This file now contains the global `AuthDebugMonitor` and wraps all routes. |
| **`easy-seo/src/pages/`** | **Page Components:** Contains the top-level components for each major view (e.g., `LoginPage.jsx`, `ExplorerPage.jsx`). | |
| **`easy-seo/src/contexts/`** | **Global State Management:** Contains Preact Contexts for managing application-wide state. | |
| **`easy-seo/src/contexts/AuthContext.jsx`** | **Authentication State:** Manages the global authentication state (`isAuthenticated`, `user`, `isLoading`) and provides a `checkAuthStatus` function to re-validate the session. | The `AuthProvider` component in this file must wrap the entire application. |
| **`easy-seo/src/components/ProtectedRoute.jsx`** | **Route Guard:** A component that wraps authenticated routes. It checks the `AuthContext` and redirects unauthenticated users to the login page. | This is the primary mechanism for securing pages. |
| **`easy-seo/src/components/AuthDebugMonitor.jsx`** | **Global Debugger:** An on-screen monitor for real-time logging of API calls, auth flows, and state changes. | Exposes the `window.authDebug` object for global use. |
| **`easy-seo/src/components/`** | **Reusable UI Components:** Contains all shared components used throughout the application (e.g., `FileExplorer.jsx`, `RepoSelector.jsx`). | |
| **`easy-seo/src/components/FloatingToolbar.jsx`** | **Icon-Only Contextual Formatting Toolbar:** Appears above text selection with compact icon-only buttons and liquid glass theme. Includes selection deduplication, cooldown anti-loop protection, and runtime debug mode via `window.__EASY_SEO_TOOLBAR_DEBUG__`. | Provides inline formatting (bold, italic, etc.), block formats, alignment, lists, links, colors. |
| **`easy-seo/src/components/FloatingToolbar.css`** | **FloatingToolbar Styles:** Liquid glass theme styling with backdrop-filter blur, gradients, and refined shadows. Icon-only button layout. | Located in components/ directory (moved from styles/). |
| **`easy-seo/src/components/SlideoutToolbar.jsx`** | **Icon-Only Slideout Insert Toolbar:** Replaces VerticalToolbox. Two states: collapsed icon-rail (56px) and expanded slideout (260px). Floating hamburger trigger in top-left. | Provides insert actions for headings, lists, structure (HR, table), media (image), layout (columns, collapsible), utility (date), and history (undo/redo). Auto-closes after selection. |
| **`easy-seo/src/components/SlideoutToolbar.css`** | **SlideoutToolbar Styles:** Liquid glass theme for hamburger trigger, collapsed rail, expanded slideout, and all toolbar items. | Matches FloatingToolbar visual aesthetic. |
| **`easy-seo/src/components/VerticalToolbox.jsx`** | **[DEPRECATED]** Old slide-out left sidebar for insert actions. | Replaced by `SlideoutToolbar.jsx` with improved icon-only design and liquid glass theme. Component still exists for reference but not used in EditorCanvas. |
| **`easy-seo/src/components/EditorHeader.jsx`** | **[REMOVED]** The old fixed header for the editor. | This component has been removed and replaced by the `FloatingToolbar`. |
| **`easy-seo/src/lib/imageScoring.js`** | **ID Score Engine:** Provides comprehensive SEO scoring for images based on topic word usage, filename structure, alt text quality, and more. | See Scoring for Growth Strategy doc. Exports `calculateImageScore()`, `extractTopicWords()`, `calculatePageImageScore()`. |
| **`easy-seo/src/lib/pageScoring.js`** | **Page Score (PS) Engine:** Calculates comprehensive Page Score (0-100) based on headers, content quality, images, links, and metadata. | Integrates with imageScoring.js. Exports `calculatePageScore()`, `getPageScoreColor()`. |
| **`easy-seo/src/lib/imageHelpers.js`** | **Image URL Helpers:** Constructs URLs for images including proxy URLs and GitHub raw URL fallbacks. | Exports `getPreviewImageUrl()`, `getGitHubRawUrl()`. |
