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

## iPhone‑first plan 
Set out below this gets me to a fully functional, user‑friendly Content Editor, Visual Layout Editor, and real Astro Preview inside the easy‑seo app. It’s sequenced to land the highest risk items first (preview fidelity), keeps everything layman‑friendly, and is technically achievable by Jules at your speed.

### Phase 0 — Preconditions (same day, 1–2 hrs)
- Confirm preview base:
  - If preview is same origin: use /preview (default).
  - If different origin: set VITE_PREVIEW_BASE_URL to the exact preview origin/path.
- Worker housekeeping:
  - Fix UTF‑8 decode in handleAssignLayoutRequest (use TextDecoder).
  - Fix duplicate‑layout syntax bug or temporarily hide the action.
- quick UI hygiene:
  - Fix uniquePath.ts loop var (i, not n).
  - Remove duplicate/legacy PreviewPane; keep one source.

Definition of done:
- Preview base decided; env configured.
- Worker deploy OK (no syntax errors).
- GitHub Action build still succeeds and writes to public/preview.

### Week 1 — Make Preview perfect, then unblock creation and editing

#### Day 1 — Real Astro Preview (fixes issue #1044)
- Implement a full‑screen PreviewPane (iframe) with:
  - Route mapping helper: src/pages path → /preview route (index rules, nested dirs).
  - Single “Rebuild preview” button → POST /api/trigger-build → poll /api/build-status with backoff.
  - Cache‑busting query v=run_id_or_timestamp on successful build reload.
  - Same‑origin detection: show Back/Forward if same origin; otherwise “Open in new tab”.
- Integrate the PreviewPane:
  - Content Editor: replace any legacy preview with the new pane.
  - Visual Editor: one rebuild button, remove duplicates.

Acceptance criteria:
- A page edited in the app matches https://strategycontent.pages.dev/ visually after rebuild.
- User sees “Updating…” during build and “Last built <relative time>” once complete.

#### Day 2 — Explorer iPhone UX + Search snippets
- Make the file list the only scroll container (overflow-auto on the main list; no nested scrolls).
- Add overscroll-behavior: contain; ensure no overlay intercepts touches.
- Search UI:
  - Results show display name (frontmatter title or filename).
  - Show 1 short snippet with the highlighted match (use fragments from /api/search).
- Replace all [?] affordances with clear SVG icons.

Acceptance criteria:
- Scrolling works anywhere in the list on iPhone.
- Search results show friendly names with a highlighted one‑line snippet.

#### Day 3 — Create Page modal (layman‑first)
- Modal shows:
  - Page Name (slugified).
  - Design Type: General, Service, Blog, Contact, Product.
  - Smart folder suggestion per type with one‑tap accept (create folder if missing).
- Remove technical choices (“.astro vs .md”); rename Classic → General.

Acceptance criteria:
- Creating “Blog” suggests /blog; “Service” → /services; “Product” → /products; “Contact” → root; “General” → root.
- Users never see filetype jargon.

#### Day 4 — Content Editor usability
- Sticky header with Home/Publish visible (safe‑area aware).
- Merge duplicate preview controls; keep only the new PreviewPane trigger.
- Context‑aware TinyMCE toolbar in the bottom slider (headings, bold/italic, links, lists, quote, code).
- “Add…” opens a simple insert modal (image, table, button, section).

Acceptance criteria:
- Header never hides behind scroll.
- Users can perform common text edits and insert basics without hunting.

#### Day 5 — Folder delete, confirm, recurse
- Wire long‑press folder delete to /api/delete-folder (already implemented in Worker).
- Add a confirmation dialog and progress state.

Acceptance criteria:
- Long‑press delete removes a folder and all contents; user is warned and can cancel.

### Week 2 — Visual Editor polish, Design Dashboard, SEO gate, QA

#### Day 6 — Visual Editor header cleanup
- Remove obsolete top nav (Explorer/Layouts/Preview text).
- Keep minimal icon nav:
  - House → Explorer; a simple Design icon → open Design Dashboard (or settings modal).
- Ensure only one rebuild button exists (top or bottom quick bar).

Acceptance criteria:
- Clean top area with large, tappable icons; no duplicate controls.

#### Day 7 — Components dock + helper hints
- Add “X” to close the components panel.
- Add one‑line hint at top: “Tap to add. Long‑press a block for settings.”
- Ensure all dock buttons are wired and respond (Design/Components).

Acceptance criteria:
- Components panel opens/closes predictably; actions work; hints reduce confusion.

#### Day 8 — Design Dashboard (Layout Dashboard)
- Title “Layouts”; remove “File-based Layouts (src/layouts)” text.
- Tiles show a page SVG icon + name (“MainLayout”), no “.astro” suffix on the face.
- Long‑press actions: Rename, Duplicate, Delete.

Acceptance criteria:
- Simple, visual tiles; long‑press menus work.

#### Day 9 — SEO gate before Publish
- Before Publish:
  - Check Title, Description, Slug, and at least one internal link (quick heuristic: outbound link starting with /).
- Highlight missing items with plain, non‑technical language.

Acceptance criteria:
- Users cannot publish without basics; guidance is friendly and actionable.

#### Day 10 — QA and hardening
- Unit tests for pathToPreviewRoute edge cases:
  - index pages; nested index; md/mdx; spaces and case; double‑slash avoidance.
- Mobile QA:
  - iOS Safari: scroll, safe‑areas, headers, large tap targets, long‑press.
- Performance polish:
  - Debounce search; throttle preview polling backoff (2s → 4s → 8–10s); minimum 30–45s between rebuilds.

Acceptance criteria:
- All acceptance checks pass; builds are stable; iPhone experience is smooth.

Dependencies to confirm up front
- Preview origin and X‑Frame‑Options:
  - Prefer same origin for best iframe controls.
  - If cross‑origin, we’ll degrade controls (no Back/Forward, “Open in new tab” shown).
- Ensure the Pages site serving /preview includes all CSS/assets (the GHA build must output a complete bundle). If styling is still off, we’ll:
  - Inspect <link> and asset URLs in /preview to ensure absolute/relative paths are correct.
  - Confirm the production domain serves those assets under the same base.

Risks and mitigations
- Preview looks “white page”:
  - Check missing CSS links in preview HTML; fix base path or asset pipeline; add cache‑busting.
- iOS scroll traps:
  - Remove nested scrolls; use one main container; avoid overlays.
- User confusion:
  - Remove all technical copy and duplicate controls; provide one‑line hints in Explorer, Components dock, and Design.

Optional fast‑track (can be done in parallel, same day)
- Confirm/fix /api/assign-layout UTF‑8 decoding with TextDecoder.
- Fix uniquePath.ts loop variable.
- Add the preview route helper + two unit tests.
- Hide or fix the duplicate‑layout D1 function to unblock Worker deploys.

