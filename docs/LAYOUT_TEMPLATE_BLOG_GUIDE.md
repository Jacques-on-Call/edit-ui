# Layout Template Library — spec & playbook

Purpose
- Provide a documented, versioned library of reusable page layouts (Astro + Preact components, styles, and schema injection) that product, design and engineering can reuse to build SEO‑ready pages quickly.
- Ensure consistency across the site (visual, accessibility, SEO, schema) and make it easy to add new templates (blog post, landing page, category, author, listing, docs, hub).

Audience
- Frontend engineers (Jules)
- Designers and content authors
- SEO / Brain team members
- QA / Testers

Goals
- Standardize layout structure, frontmatter contract, components and JSON‑LD schema.
- Make templates composable and easy to maintain.
- Provide acceptance criteria and tests so each template ships with measurable guarantees (accessibility, schema, EEAT signals).
- Keep mobile-first behavior and the editor integration seamless.

Conventions and scope
- Layouts = top-level page shells (layouts/Layout.astro, layouts/BlogPost.astro, layouts/Landing.astro).
- Templates = layout + recommended component composition and example frontmatter.
- Components are small, focused, documented, and live under src/components/.
- Styling: Prefer existing global theme (Tailwind utility-first where present). Keep template CSS minimal; reuse common tokens and utilities.
- All templates must be safe to render in the editor (Lexical) and to be serialized back to .astro files.

Repository layout (expected)
- docs/
  - layout-template-library.md (this doc)
  - templates/ (specs & examples)
- src/
  - layouts/
  - components/
  - styles/
- easy‑seo/ (editor + serializer integration will consume frontmatter contract)

Minimal frontmatter contract (required keys)
Use this minimal schema as the canonical contract every template supports.

- title: string
- slug: string
- layout: string (path to layout, e.g. "../../../layouts/BlogPost.astro")
- date: ISO string (published)
- updated?: ISO string
- author?: { name: string, id?: string, profileUrl?: string }
- excerpt?: string
- heroImage?: { src: string, alt: string, width?: number, height?: number }
- breadcrumb?: Array<{ name: string, url?: string }>
- tags?: string[]
- canonical?: string
- schemaType?: "Article" | "BlogPosting" | "WebPage" | "LandingPage" (default "WebPage")
- sections?: Array<?> (optional structured content; editor mapping may convert blocks → sections)

Note: Keep frontmatter explicit and small. The editor and serializer depend on these keys to build drafts and .astro files.

Layout types & recommended components
- Base Layout (layouts/Layout.astro)
  - Purpose: global shell, scripts + style imports, SchemaInjector mount point, header + footer placement.
  - Must include: <head> JSON‑LD injection area, accessible nav landmarks.

- BlogPost (layouts/BlogPost.astro)
  - Components: Breadcrumbs, PostMeta, Hero, ContentArea (rich text), AuthorCard, RelatedPosts, SubscribeCTA, SchemaInjector.
  - Acceptance: H1 present, published/updated date displayed, author link present if author defined, Image alt text, Article JSON‑LD injected.

- Landing (layouts/Landing.astro)
  - Components: Hero, FeatureGrid, CTA, Testimonials, Footer.
  - Acceptance: Clear H1, primary CTA focusable/keyboard accessible, hero image alt.

- Listing / Index (layouts/Listing.astro)
  - Components: ListItem, Pagination, Filters, Breadcrumbs.
  - Acceptance: Accessible lists, keyboard and screen reader friendly.

- Author Page, Tag Page, Docs Page
  - Similar component lists with template variations.

Breadcrumbs (visual + machine)
- Always render both:
  - Visual: semantic <nav aria-label="Breadcrumb"><ol>...</ol></nav>
  - Machine: SchemaInjector emits BreadcrumbList JSON‑LD
- Source: frontmatter.breadcrumb → page.meta.breadcrumb → derived from path
- Accessibility: last item aria-current="page"

SchemaInjector & JSON‑LD rules
- Every layout includes a SchemaInjector which:
  - Uses frontmatter keys to emit Article / BreadcrumbList / Author JSON‑LD where relevant.
  - Adds canonical, datePublished, dateModified, author.name, image if heroImage frontmatter present.
- Keep the injector deterministic and pure — don’t call network inside it.
- Example JSON‑LD keys:
  - Article: headline, description, author, datePublished, dateModified, mainEntityOfPage
  - BreadcrumbList: itemListElement (positioned ListItems)

Editor & serializer integration requirements
- Editor (easy‑seo) must be able to:
  - Open files and map frontmatter → editor model (sections OR initialContent).
  - When saving, serialize the editor content into a valid .astro file that follows the frontmatter contract above.
- Template authors: avoid injecting dynamic non-serializable code inside the main content body (server-only code should live in component slots or be guarded).
- Provide sample fixtures for editor testing: src/pages/sample-templates/<template>.astro

Accessibility (must-have checklist)
- Landmark roles: header, main, nav, footer
- H1 present + logical heading order (H1 → H2 → H3)
- Images must have non-empty alt text or explicit decorative flag
- Keyboard focus order makes sense (skip links optional)
- Color contrast meets WCAG AA
- Buttons and links have accessible names (aria-label if icon-only)
- Breadcrumbs use OL/LI and aria-current on current item

SEO & EEAT checklist
- SchemaInjector emits Article/BreadcrumbList/Author where applicable
- Title and meta description (excerpt) present in frontmatter
- Published date present; updated date optional but encouraged
- Author with profile URL (profile should be dedicated author page when possible)
- Internal links present in body or RelatedPosts component
- Images with descriptive alt text and width/height where possible
- Canonical URL set when page has alternate copies

Styling & responsive rules
- Mobile-first: design and test on phone widths first.
- Provide readable measure constraints for wide viewports (e.g., center content with max-width 65ch).
- Components must be responsive and not depend on viewport-filling backgrounds (those belong to layout shell).
- Use CSS variables / tokens for colors, spacing, and typography to keep global theme consistent.

Templates as composable building blocks
- Build templates from small components: Hero, PostMeta, AuthorCard, SubscribeCTA, RelatedPosts, ContentArea.
- Each component must export a small prop contract documented in its file header.
- Components must avoid side-effects during render (no fetches, no global mutation).

Testing & CI
- Each template must include at least:
  - A visual regression test (percy / storybook snapshot or simple screenshot compare).
  - A unit test for SchemaInjector output (JSON‑LD shape).
  - A11y test (axe-core or pa11y running against the rendered template).
- CI pipeline:
  - Build step catches missing imports (run `npm run build --prefix ./easy-seo`).
  - Tests run on PRs; templates must pass tests before merging.

Versioning & change process
- Templates live on main branch; breaking changes must be introduced behind feature flags and documented.
- Use changelog entries: easy-seo/CHANGELOG.md (template additions, field changes).
- Backwards-incompatible frontmatter changes require a migration script and editor mapping update.

Acceptance criteria (per-template)
- Render: page renders without runtime errors.
- Editor: template can be opened in easy-seo editor and round-tripped (open → edit → save → re-open) without losing frontmatter fields.
- Schema: JSON‑LD output validates (check with Google Structured Data Test).
- Accessibility: automated a11y checks pass (no critical violations).
- Mobile: layout works on phone (navigation usable, toolbar not obscured).
- Docs: template has a markdown spec and an example .astro page in docs/templates/ or src/pages/sample-templates/.

Developer checklist (before merging a new template)
- [ ] Add layout file under src/layouts/
- [ ] Add minimal styles or reference existing tokens (avoid global overrides)
- [ ] Add example page under src/pages/sample-templates/
- [ ] Add docs/templates/<template>.md describing frontmatter, components and acceptance criteria
- [ ] Add a SchemaInjector test and a snapshot test
- [ ] Ensure editor integration (easy-seo) supports the template frontmatter
- [ ] Add CHANGELOG entry

Designer checklist
- Provide Figma reference or screenshots for responsive breakpoints
- Supply hero and sample media (with alt text)
- Confirm typography scale and readable measure (recommend 60–75 chars; we use 65ch by default)
- Provide token mapping for colors and spacing

Content author checklist
- Provide title, slug, excerpt, heroImage (with alt), dates and author info in frontmatter
- Provide breadcrumb field if page belongs to a special hierarchy
- Keep the body content semantic (use headings, lists, figure/caption where appropriate)

Example: sample frontmatter for blog post
```astro
---
title: "How to Write a Great Post"
slug: "write-great-post"
layout: "../../../layouts/BlogPost.astro"
date: 2025-11-18T10:00:00Z
updated: 2025-11-18T12:00:00Z
author:
  name: "Jane Example"
  profileUrl: "/authors/jane-example"
excerpt: "Short summary of the article."
heroImage:
  src: "/assets/posts/write-great.jpg"
  alt: "Person writing on laptop"
breadcrumb:
  - name: "Home"
    url: "/"
  - name: "Blog"
    url: "/blog"
  - name: "How to Write a Great Post"
    url: "/blog/write-great-post"
tags: ["writing","seo"]
schemaType: "Article"
---
<!-- Page body (HTML or markdown depending on your pipeline) -->
```

Developer notes: roundtrip & editor considerations
- The editor may store an in-memory draft with a content HTML string and meta object. Serializer must:
  - Write YAML frontmatter (layout/title/slug/date/author/excerpt/...).
  - Append the body HTML after the `---` closing frontmatter block.
  - Preserve component placeholders / shortcodes if the editor uses them.
- For pages with sections-based frontmatter, consider adding a conversion utility to map sections → HTML when serializing and the reverse parser when opening files.

Roadmap & suggested incremental work
- Phase 1 (core): implement Layout.astro + BlogPost template + SchemaInjector + sample page and tests.
- Phase 2 (editor): ensure easy-seo can open and save BlogPost pages (roundtrip).
- Phase 3 (library): add Landing, Listing, Author, Tag templates and update docs.
- Phase 4 (brain): export canonical feature flags for discovery (hasSchema, hasAuthorLink, breadcrumbCount, hasMedia).

Questions & governance
- Who can approve new templates? Define reviewers across Product, SEO & Frontend.
- When to bump template version? On changes to frontmatter or semantics that require editor updates.

Appendix: useful tooling & references
- Structured Data Testing: https://search.google.com/test/rich-results
- axe-core for automated a11y checks
- Percy / Playwright / Chromatic for visual testing
- For a11y: https://dequeuniversity.com/axe/core-documentation
- For canonical JSON‑LD patterns: https://schema.org/Article, https://schema.org/BreadcrumbList

## Original Advice:
An optimised blog post template should do more than just look nice.
It should:

→ Build trust (EEAT)
→ Be accessible and scannable
→ Drive engagement and subscribers

Here's what every SEO-ready blog template needs:

1. Breadcrumb navigation - helps users and Google understand context.
2. Post date (and updated date) - shows freshness and credibility.
3. Author bio + profile link - adds expertise signals.
4. Structured headings (H1–H3) – keep hierarchy logical and readable.
5. Formatting styles – bold, quotes, lists, tables. Makes scanning easy.
6. Rich media – images, video, charts. Supports accessibility and dwell time.
7. Mobile-first design – test on phone first, desktop second.
8. Subscribe CTA or lead magnet – capture interest while trust is high.
9. Internal links block – guide readers deeper into your site.
10. Schema markup – Article + Author + BreadcrumbList.

All of this makes your posts look trustworthy to both humans and machines.
