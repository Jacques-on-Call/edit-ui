# Easy‑SEO: Unified Architecture and Roadmap (Authoritative)

This is the single source of truth for the Easy‑SEO editor. It reflects the current repo, your UX goals, and the unified “visual .astro editor + real Astro preview” direction. It removes prior, deprecated approaches to avoid confusion.

Contents
- Product experience (what the user sees)
- Technical architecture (how it works)
- What’s implemented vs. outstanding
- UX improvement plan (your concrete notes turned into actions)
- Decisions, defaults, and acceptance criteria
- Short appendix for preview routes and folder suggestions

---

## Product experience (layman-first)

- File Explorer
  - First screen with friendly one‑line hints under items (no tech jargon).
  - Tap to open files/folders; long‑press to act.
  - Search shows:
    - Display name (frontmatter title if present; otherwise filename)
    - Small secondary label (folder or type icon only)
    - A short highlighted snippet (one line above/below the match).

- Create Page (one modal)
  - Page Name
  - Design Type: General, Service, Blog, Contact, Product
  - Smart folder suggestion (one tap to accept):
    - Defaults (simple, non‑jargon):
      - Blog → /blog
      - Service → /services
      - Product → /products
      - Contact → / (root “/contact” page)
      - General → / (root)
    - If the suggested folder doesn’t exist, offer to create it (confirm).
  - No technical choices like “.astro”. The app decides the file format.

- Content Editor
  - Familiar text-first editing with a context‑aware toolbar (headings, bold, links, lists, quote, code).
  - “Add” opens a simple block/insert modal (image, table, button, section, etc.).
  - “Page Settings” modal exposes layman fields (title, description, slug); writes frontmatter safely.
  - Header is sticky and visible on mobile; core actions (Home, Publish/Save) are always reachable.

- Visual Settings (“Design”)
  - A simple modal/drawer to adjust page‑level look: background image/color, spacing, and basic toggles.
  - Non‑technical labels with safe defaults.

- Preview (always accurate)
  - Full‑screen, frameless iframe of the real Astro preview build.
  - One “Rebuild preview” button triggers the GitHub workflow and auto‑refreshes with cache‑busting.
  - Path mapping mirrors Astro:
    - src/pages/index → /preview/
    - src/pages/about → /preview/about
    - nested index → directory route (/preview/blog/)

- SEO check before Publish
  - “Save Draft” anytime.
  - “Publish” prompts a small check (title, description, slug, at least one internal link).
  - Clear messages; fix and continue.

---

## Technical architecture

- Editor (Preact + Vite)
  - Path: easy‑seo/
  - Dev proxy: `/api` → local Worker (http://localhost:8787)
  - Auth: GitHub OAuth via Worker; session cookie `gh_session` (HttpOnly)
  - Unified .astro editing:
    - Visual UI over real `.astro` with harmless markers to preserve structure
    - Compiler/Parser/Validator ensure safe round‑trip

- Cloudflare Worker (API)
  - Auth: `/api/callback` (sets `gh_session`)
  - GitHub operations: list dir, get file, get content, create/update, delete, rename, duplicate
  - Search: `/api/search` (returns fragments/snippets)
  - Metadata: last author/date
  - Layout: assign layout in frontmatter (file‑based), optional D1 graphical templates
  - Preview: `/api/trigger-build` and `/api/build-status`
  - D1: present and usable for versioned templates; optional for core .astro flow

- Data model
  - Source of truth: the Astro site in GitHub (src/pages, src/layouts, etc.)
  - D1 (optional): layout_versions, pages (kept for future graphical templates or advanced flows)

- Preview build
  - GitHub Actions workflow `build-preview.yml` → commits preview bundle to `public/preview/`
  - UI adds a cache‑busting query (e.g., `?v=<run_or_ts>`) on iframe reload after a successful build
  - Default base `/preview`; override with `VITE_PREVIEW_BASE_URL` if the preview host differs

Note on D1 (your question)
- D1 is not required for the unified .astro path. Keep it as an optional layer (for future graphical templates/versions) or remove later. Current core flows (Explorer, Editor, Preview) work entirely via GitHub.

---

## Implemented vs. outstanding

Implemented in repo now
- Preact/Vite setup; Worker endpoints; D1 tables; marker compiler/parse/validate (with tests); preview workflow; astro.wasm
- Worker search endpoint already returns text fragments (snippets)
- Worker recursive folder delete endpoint exists (/api/delete-folder)

Outstanding (high‑impact)
- Preview UI integration
  - Full‑screen iframe pane with single rebuild button; backoff polling; cache‑busting
  - Path mapping helper + tests
- Explorer UX
  - Scroll anywhere fix (no nested scroll traps on iOS)
  - Helper copy under items
  - Search results UI (friendly names + highlighted snippet)
  - Long‑press folder delete wired to `/api/delete-folder`
  - Replace `[?]` with SVG icons everywhere
- Create Page modal
  - Remove tech toggles; rename Classic → General
  - Smart folder suggestion per Design Type (+ create folder if missing)
- Content Editor
  - Sticky header; merge duplicate preview controls into the new full‑screen preview
  - Context‑aware TinyMCE toolbar; “Add” modal for inserts
- Visual Editor
  - Remove old top nav (Explorer/Layouts/Preview text); keep minimal icon nav (Home, Design)
  - Single rebuild button; components dock needs “X” close and short helper hint; wire all actions
  - Expand block set over time
- Design Dashboard
  - Simplify header; rename to “Layouts”
  - Card visual: page icon + name only (“MainLayout”); long‑press actions

Quick technical fixes
- Worker: UTF‑8‑safe decode in `handleAssignLayoutRequest` (use TextDecoder like in get-file-content)
- Worker: fix duplicate‑layout (D1) syntax error or hide the action for now
- UI: fix uniquePath.ts loop variable (`i` not `n`)
- CSS: consolidate global.css / index.css
- Sync: exclude non‑app assets (follow‑up to issue #1040)

---

## UX improvement plan (from your notes → actions)

Explorer
- Scrolling: Make the file list the only scroll container; `overflow-auto` on the main list; avoid nested scrolling; `overscroll-behavior: contain`; verify no invisible overlay intercepts touches.
- Helper copy: Show one‑line hints only at sensible places (e.g., root folders). Keep language simple and consistent (no “discover/consider/get” jargon by default).
- Search UX: Render “Display name” (frontmatter title or filename) with a small snippet; highlight matches; limit to ~1 line above/below.
- Long‑press folder delete: Wire to `/api/delete-folder` with a confirmation; show progress if many files.
- Icons: Replace `[?]` with clear SVG icons for “info”/“help”.

Create Page
- Remove “Visual (.astro)” vs “Content (.md)” options.
- Rename “Classic” → “General.”
- Suggest folders based on Design Type:
  - Blog → /blog
  - Service → /services
  - Product → /products
  - Contact → root (create `/contact` page)
  - General → root
  - If the suggested folder doesn’t exist, offer to create it automatically.

Content Editor
- Sticky header (safe‑area aware); show Home and Publish/Save.
- Single Preview entry (the full‑screen preview pane), remove old preview.
- Context‑aware TinyMCE tools in a horizontal sliding bar; large, mobile‑friendly tap targets.

Visual Editor
- Remove obsolete header text; keep minimal icon nav (House for Explorer, Design icon for dashboard).
- One rebuild button (top or bottom quick bar); remove duplicates.
- Components dock: add an “X” close; top helper hint (“Tap to add. Long‑press for settings.”); wire button actions.
- Grow the block palette iteratively.

Design Dashboard
- Heading “Layouts”; remove tech phrasing.
- Tiles: page icon + name (“MainLayout”), no “.astro” extension on the face.
- Long‑press menu: Rename, Duplicate, Delete.

---

## Decisions and defaults

- Unified .astro editor is the only path the user sees (no tech UI). Markdown pages stay supported in the content editor, but the app never exposes file types to the user.
- Preview base `/preview` by default; configurable via `VITE_PREVIEW_BASE_URL`.
- Auto‑rebuild default OFF. “Smart auto‑rebuild” later as an opt‑in (on creation, layout‑affecting saves, 30s idle).
- Friendly folders by default (no jargon):
  - /blog, /services, /products, /contact, and root
  - Advanced users can keep/join other taxonomies later; we’ll not surface that by default.

---

## Acceptance criteria (5.6 fit‑and‑finish)

- Explorer: scroll works anywhere in the list on iPhone; safe‑area respected; long‑press folder delete works; search shows friendly names + highlighted snippet.
- Create Page: only Page Name + Design Type; “General” label; suggests simple folders; can create missing folders.
- Content Editor: sticky header always visible; single preview; context‑aware toolbar in bottom slider.
- Visual Editor: minimal header; one rebuild button; components dock closable with “X” and helper text; actions wired.
- Design Dashboard: simplified heading; icon+name tiles; long‑press actions.

---

## Appendix

Preview route mapping helper (spec)
- Input: `src/pages/<path>.(astro|md|mdx)`
- Output (assuming base `/preview`):
  - `src/pages/index.astro` → `/preview/`
  - `src/pages/about.astro` → `/preview/about`
  - `src/pages/blog/index.md` → `/preview/blog/`
- Rules:
  - Strip extension
  - Map `.../index` to the directory route with a trailing slash
  - Avoid double slashes; percent‑encode spaces

Folder suggestions per Design Type (defaults)
- General → `/`
- Blog → `/blog`
- Service → `/services`
- Product → `/products`
- Contact → `/` (create `/contact` page)

Note: If the suggested folder doesn’t exist, offer to create it (confirm).
