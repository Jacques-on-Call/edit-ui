# Easy-SEO Application Architecture

This document aligns the `easy-seo` editor with the Cloudflare Worker API, D1 schema, CI/CD, and cross-repo sync as implemented in this repository. It also identifies files that do not participate in the editor runtime.

If anything conflicts with intended design, see Open Questions.

---

## 1) High-level architecture

- Editor UI (Preact SPA)
  - Directory: easy-seo/
  - Stack: Preact (via preact/compat), Vite
  - Dev proxy: forwards `/api/*` to a local Worker at `http://localhost:8787`
  - Auth: GitHub OAuth handled by Worker; session via HttpOnly cookie `gh_session`
  - Deployment: this directory is synced to a separate repo (`Jacques-on-Call/edit-ui`) via GitHub Actions. The Cloudflare Pages workflow in this repo deploys a separate app under `priority-engine-ui/` and is not used for `easy-seo` deployment.

- API backend (Cloudflare Worker)
  - Entry: `/cloudflare-worker-code.js`
  - Route: `https://edit.strategycontent.agency/api/*` (configured in `wrangler.toml`)
  - Responsibilities: OAuth callback, repo/file CRUD via GitHub API, D1 layout templates and assignment, preview workflow triggers, search

- Data store (Cloudflare D1)
  - Binding: `env.DB` (database: `easy-seo-layouts-db`)
  - Purpose: versioned layout templates and page-to-template assignment
  - Migrations: `easy-seo/migrations/0001_reusable_layouts_schema.sql`

- Content site (Astro) preview
  - Triggered by Worker endpoint to start the `build-preview.yml` workflow
  - Workflow builds the site and commits `public/preview/` for the editor to consume

- Cross-repo sync
  - `easy-seo/**` → syncs to `Jacques-on-Call/edit-ui`
  - `priority-engine/**` → staged sync to `Jacques-on-Call/seo-brain`

---

## 2) Repository structure and CI/CD

- Worker and config (repo root)
  - `cloudflare-worker-code.js`: all API routes
  - `wrangler.toml`: route mapping, D1 binding, vars

- Workflows (repo root)
  - `.github/workflows/deploy-worker.yml`: deploy Worker (wrangler)
  - `.github/workflows/build-preview.yml`: build Astro preview; commit to `public/preview`
  - `.github/workflows/deploy-ui.yml`: deploy `priority-engine-ui` app (not `easy-seo`)
  - `.github/workflows/sync-to-edit-ui.yml`: push `easy-seo/` to `Jacques-on-Call/edit-ui`
  - `.github/workflows/sync-to-seo-brain.yml`: stage and push engine files to `seo-brain`

Note: Since `easy-seo/` syncs to `edit-ui`, consider excluding non-app assets from the sync (see Unconnected files).

---

## 3) Frontend architecture (easy-seo/)

- Vite config
  - `easy-seo/vite.config.js`
    - Plugin: `@preact/preset-vite`
    - Dev proxy: `/api` → `http://localhost:8787`
    - React aliases to Preact (`react` → `preact/compat`, etc.)
    - Test config references `./test.setup.js` (present)
    - Global definition for browser bundling

- Public assets (editor app)
  - `easy-seo/public/astro.wasm`: used by `@astrojs/compiler` init in `src/main.jsx`
  - `easy-seo/public/index.html`, `favicon.svg`, `vite.svg`, `logo.webp`, `robots.txt`, `sitemap.xml`
  - See “Unconnected files” for large marketing-site assets that are not used by the editor

- App boot
  - `easy-seo/index.html`: Vite entry, TinyMCE CDN script
  - `easy-seo/src/main.jsx`
    - Sets `window.Buffer` (buffer polyfill)
    - Initializes Astro compiler WASM (`initialize({ wasmURL: '/astro.wasm' })`)
    - Imports `./global.css` (verify the single canonical stylesheet; `index.css` also exists)
    - Mounts `<App />` within `<BrowserRouter />`

- Routing and pages
  - `easy-seo/src/App.jsx`
    - Standalone: `/login`, `/callback`, `/repository-selection`
    - Nested under `<AppLayout />`: `/` (redirects to `/explorer`), `/explorer`, `/editor`, `/layouts`, `/visual-editor`, `/layout-editor` (both visual-editor and layout-editor route to `VisualEditorPage`)
  - `easy-seo/src/pages/`
    - `LoginPage.jsx`: starts OAuth login flow
    - `CallbackPage.jsx`: finalize OAuth via Worker’s `/api/callback` (not `/api/token`)
    - `RepositorySelectionPage.jsx`: choose repo → stored in `localStorage`
    - `ExplorerPage.jsx`: browse repo; default path `src/pages`
    - `EditorPage.jsx`: content editor (TinyMCE) for MD/MDX/Astro
    - `VisualEditorPage.jsx` (primary visual/layout editor)
    - `LayoutEditorPage.jsx`: likely legacy; not wired in `App.jsx`
    - `SimpleMobileLayoutEditor.jsx`: likely experimental; not wired in `App.jsx`
    - `LayoutsDashboardPage.jsx`: lists file-based layouts via `/api/astro-layouts`

- Components and editor modules (partial highlights; see tree for full)
  - `src/components/`: App scaffolding, file explorer, modals (create/rename/assign), toolbars, overlay canvas, design/visual panels, etc.
  - `src/components/layout-editor/`: the new visual editor stack (Editors for Imports/Props/Head/Regions/HtmlAttrs, LayoutModeEditor, VisualRenderer, PreviewPane, toolbox/toolbar, etc.)
  - `src/components/layout-editor/blocks/`: individual block editors (CTA, FeatureGrid, Footer, Hero, Testimonial, Text) and settings
  - `src/components/layout-editor/render/`: runtime fragment rendering (Page, Section)
  - `src/components/layout-editor/settings/` and `ui/`: UI controls and primitives
  - `src/blocks/registry.ts`: registry of content blocks and props (consumed by content compiler)

- Libraries
  - `src/lib/layouts/`: compiler, parser, markerize, validator, and tests for marker-based Astro round-trip
    - `compileAstro.ts`, `parseAstro.ts`, `markerizeAstro.ts`, `validateAstro.ts`, `types.ts`, `__tests__/...`
  - `src/lib/content/`: block-based content composition
    - `compileBlocksToAstro.ts`, `types.ts`

- Hooks
  - `src/hooks/`: `useAutosave`, `usePreviewController`, `useDraggable`, `useLongPress`

- Utils and preview bridge
  - `src/utils/`: parser/generator pipeline (`unifiedParser`, `astroFileParser`, `htmlGenerator`, `stateToAstro`, `astroToState`, etc.), preview bridge and routes (`previewBridge.js`, `previewRoute.js`), caching, normalization patches, mappers, style packs, test helpers
  - `previewRoute.test.js` exists for preview routing tests

- Styles
  - `src/global.css` and `src/index.css` both exist. Choose one canonical entry (recommended: `global.css`) and remove or import the other to avoid drift.
  - `tailwind.config.js`, `postcss.config.js` present

- Tests
  - `src/components/__tests__/FileTile.test.jsx`
  - `src/lib/layouts/__tests__/...`
  - `src/utils/__tests__/previewRoute.test.js`
  - `test.setup.js` exists (Vite test config references it)

---

## 4) Backend API (Cloudflare Worker)

Entry: `/cloudflare-worker-code.js`  
Config: `/wrangler.toml` (route, vars, D1 binding)

Auth and identity
- `GET /api/callback`
  - Exchanges GitHub OAuth `code` → access token using `OAUTH_GITHUB_CLIENT_ID`/`OAUTH_GITHUB_CLIENT_SECRET`
  - Sets `gh_session` cookie (HttpOnly; `Secure` unless `DEV_MODE=true`)
  - Redirects to `/login?login=success&close_popup=true`
- `GET /api/me`
  - Uses `gh_session` to retrieve GitHub user; `401` if missing

Repositories and files
- `GET /api/repos`
- `GET /api/files?repo=owner/name&path=optional`
  - Lists directory; hides `GraphicalRenderer.astro` in `src/layouts`
- `GET /api/file?repo=owner/name&path=path`
  - Returns GitHub Contents JSON (base64 payload)
- `GET /api/get-file-content?repo=owner/name&path=path&ref=optional`
  - Returns decoded UTF-8 content + `sha`; maps 404/401/403 cleanly
- `POST /api/file`
  - Create/update (UTF-8-safe base64); optional `sha`, `branch`, `message`
- `DELETE /api/files`
  - Delete single file (`repo`, `path`, `sha`)
- `POST /api/rename-file`
  - Create new then delete old (`repo`, `oldPath`, `newPath`, `sha`)
- `POST /api/duplicate-file`
  - Duplicate (`repo`, `path`, `newPath`)
- `POST /api/delete-folder`
  - Recursively delete folder tree
- `GET /api/metadata?repo=owner/name&path=path`
  - Last commit author/date
- `GET /api/search?repo=owner/name&query=query`
  - Restricts to `path:src/pages`; returns results with text fragments

Layouts (file-based and D1-backed)
- `GET /api/astro-layouts?repo=owner/name`
  - Lists file layouts from `src/layouts` (excludes `GraphicalRenderer.astro`)
- `POST /api/assign-layout`
  - Updates frontmatter using `gray-matter`:
    - File-based: `layout: /src/layouts/*.astro`
    - D1-backed: `layout: /src/layouts/GraphicalRenderer.astro` + `graphical_layout_id`

D1 layout templates
- `POST /api/layout-templates`
  - Upserts template by name; creates next version; sets `current_version_id`
- `GET /api/layout-templates`
  - Lists templates (`id`, `name`, `updated_at`)
- `DELETE /api/layout-templates/{id}`
  - Manual cascade delete
- `GET /api/render-layout/{template_id}`
  - Returns `{ name, json_content }` for current version
- `POST /api/duplicate-layout`
  - D1 source: duplicate template+version (has a syntax bug—see Known issues)
  - File source: duplicate `.astro` layout via `/api/duplicate-file`
- `POST /api/pages/{slug}/assign-template`
  - Assigns template by slug in D1

Preview workflow
- `POST /api/trigger-build`
  - Dispatch `build-preview.yml` via GitHub Actions; requires Worker `GITHUB_TOKEN` with `workflow` scope
- `GET /api/build-status`
  - Returns latest build run info for `build-preview.yml`

Static fallback
- Worker attempts `env.ASSETS.fetch(request)` and falls back to `/index.html` if not found. No `ASSETS` binding is configured in `wrangler.toml` (see Known issues).

---

## 5) D1 data model

Binding: `env.DB` (`easy-seo-layouts-db`)  
Migrations present: `easy-seo/migrations/0001_reusable_layouts_schema.sql`

Tables (inferred from queries):
- `layout_templates`: `id`, `name` (unique), `current_version_id`, `updated_at`
- `layout_versions`: `id`, `template_id`, `json_content`, `version_number`
- `pages`: at least `slug`, `layout_template_id`

Operations:
- Versioning on each POST to `/api/layout-templates`
- Manual cascade delete for templates
- Current version used by `/api/render-layout/{id}` and by page-template assignment

---

## 6) Core editor patterns

- Marker-based round-trip for `.astro` layouts
  - `LayoutBlueprint` ↔ `.astro` with harmless markers
  - Compiler, parser, validator ensure stable round-tripping and guardrails (single `<slot/>`, no nested `<html>/<body>` inside regions)

- Block-based content composition (Content Mode)
  - Content block tree compiled to Astro using block registry and component props

- Layered editing overlay
  - iframe preview with `preview-bridge.js` posts element geometry (via `data-sc-id`)
  - `OverlayCanvas` renders hitboxes and interaction layers on top of the preview

---

## 7) Preview flow

- UI: `POST /api/trigger-build` (session via `gh_session`)
- Worker: dispatches `build-preview.yml` (server `GITHUB_TOKEN`)
- GH Actions: `npm run build:preview`, move `dist/preview` → `public/preview/`, commit
- UI: `GET /api/build-status` to monitor latest run

---

## 8) Known issues and recommendations

- Worker: duplicate D1 layout bug
  - `handleDuplicateLayoutRequest` includes an invalid expression (`originalVersion.[...]`) and will break. Fix to copy `originalVersion.json_content` into a new `layout_versions` row; update `current_version_id`.

- Missing route: create page from layout
  - `handleCreatePageFromLayoutRequest` exists but is not mounted in the router. Either add `/api/create-page-from-layout` or remove the function to avoid confusion.

- ASSETS binding not configured
  - `env.ASSETS.fetch` will throw without a binding. Add an Assets binding in wrangler or remove the fallback logic.

- DEV_MODE=true in production
  - Consider `DEV_MODE=false` in production to enforce cookie auth paths everywhere.

- uniquePath bug
  - `src/utils/uniquePath.ts` uses `n` in the loop instead of `i`, so candidates never change. Fix to use `i` (and consider increasing the search cap).

- CSS duplication
  - Both `src/global.css` and `src/index.css` exist. Choose one entry (recommended: `global.css`) and consolidate.

- Possible unused pages/components
  - `src/pages/LayoutEditorPage.jsx` and `src/pages/SimpleMobileLayoutEditor.jsx` aren’t wired in `App.jsx`.
  - Duplicate `PreviewPane.jsx` exists under `components` and `components/layout-editor/visual-renderer/`. Audit and keep a single source.

- Sync bloat risk
  - Large marketing-site assets under `easy-seo/public` (images, js, preview HTML) are not used by the editor and get synced to `edit-ui`. Recommend excluding them from the sync.

---

## 9) Unconnected files in /easy-seo/ (not used by the editor app)

These appear to belong to a separate public marketing site or preview, not to the editor SPA. Keeping them in `easy-seo/` increases build size and bloats the sync to `edit-ui`.

- Public marketing site assets (not referenced by the editor)
  - `easy-seo/public/images/*` (hundreds of webp/jpg/mp4 icons, logos, etc.)
  - `easy-seo/public/js/*` (site behavior scripts: `hamburger-menu.js`, `cookie-notice.js`, etc.)
  - `easy-seo/public/preview/**`
    - Nested sections like `Consider/`, `Discover/`, `Get/`, `home/` each with `README` and `index.html`
    - Duplicated listing of the same assets under `preview/`
  - `easy-seo/public/robots.txt`, `easy-seo/public/sitemap.xml`
    - These are site-level SEO files, not needed for the editor SPA

- Likely unused or legacy editor pages
  - `easy-seo/src/pages/LayoutEditorPage.jsx` (routes map to `VisualEditorPage.jsx` instead)
  - `easy-seo/src/pages/SimpleMobileLayoutEditor.jsx` (not wired)

- Possible duplicates to audit
  - `easy-seo/src/components/PreviewPane.jsx` and `easy-seo/src/components/layout-editor/visual-renderer/PreviewPane.jsx`

- Notes
  - Keep `easy-seo/public/astro.wasm` (required by editor)
  - Keep `easy-seo/public/index.html`, `favicon.svg`, `vite.svg`, `logo.webp` for editor branding

Recommendation:
- Move the marketing site assets and preview HTML out of `easy-seo/public` (or exclude from sync).
- If they belong to the Astro site repo or a preview destination, keep them there instead.
- If you want these in this repo, place them outside `easy-seo/` so the `sync-to-edit-ui` workflow doesn’t push them to the UI repo.

---

## 10) Open questions

1) Do you want to exclude `easy-seo/public/images`, `easy-seo/public/js`, and `easy-seo/public/preview` (and `robots.txt`/`sitemap.xml`) from the sync to `edit-ui`? I can suggest a small change to the sync workflow to push a curated staging directory instead of the entire `easy-seo/`.
2) Should I wire up `/api/create-page-from-layout` and fix the Worker duplicate-layout bug now?
3) Confirm which stylesheet to keep (`global.css` vs `index.css`) and I’ll update imports.
4) Confirm whether `LayoutEditorPage.jsx` and `SimpleMobileLayoutEditor.jsx` should be removed or re-wired.
5) Are both `PreviewPane.jsx` files intended? If not, I’ll consolidate to the one under `layout-editor/visual-renderer`.

---
