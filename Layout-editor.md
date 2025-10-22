Let’s turn the layout-editor into a true Astro layout template editor that can build a MainLayout replica and beyond (header, footer, body, sections, tables, images, buttons, backgrounds, columns). We’ll separate “head” for later, but we’ll lay the foundations now so it’s easy to add.

High-level approach
- Two modes in one editor:
  - Layout mode: authors real Astro layouts (doctype/html/body with header/footer around a single slot). This produces a MainLayout-grade .astro file.
  - Content mode: authors page content blocks (sections, columns, images, buttons, tables, backgrounds). These render inside the layout’s slot.
- Marker-based round-trip: add harmless comment markers so the editor can read/write exact regions without breaking Astro semantics.
- Minimal schema + compiler + parser + validator: reliable generation, safe editing, and guardrails.

What Jules should build (step-by-step)

Sprint 1 — Core schema, compiler, parser, validator
- Deliver a golden output identical in structure to MainLayout, with markers.
- Build a tiny schema (LayoutBlueprint), a compiler to .astro with markers, a tolerant parser back to LayoutBlueprint, and layout validators.

Add these files to your app:

```typescript name=easy-seo/src/lib/layouts/types.ts
export type ImportSpec = { as: string; from: string };
export type PropSpec = { type: "string" | "number" | "boolean"; default?: any };

export type HeadNode =
  | { type: "meta"; attrs: Record<string, string> }
  | { type: "title"; contentFromProp?: string; text?: string }
  | { type: "raw"; html: string };

export type BodyNode =
  | { type: "component"; name: string; props?: Record<string, any> }
  | { type: "raw"; html: string };

export type LayoutBlueprint = {
  name: string;
  htmlAttrs?: Record<string, string>;
  imports: ImportSpec[];
  props: Record<string, PropSpec>;
  head: HeadNode[];
  preContent: BodyNode[];
  contentSlot: { name: string; single?: boolean };
  postContent: BodyNode[];
};
```

```typescript name=easy-seo/src/lib/layouts/compileAstro.ts
import type { LayoutBlueprint, HeadNode, BodyNode } from "./types";

const esc = (s: string) => s.replace(/`/g, "\\`");

function renderHead(head: HeadNode[], propsVar = "Astro.props"): string {
  return head.map(node => {
    if (node.type === "meta") {
      const attrs = Object.entries(node.attrs).map(([k, v]) => `${k}="${esc(String(v))}"`).join(" ");
      return `    <meta ${attrs} />`;
    }
    if (node.type === "title") {
      if (node.contentFromProp) return `    <title>{${propsVar}.${node.contentFromProp}}</title>`;
      return `    <title>${esc(node.text ?? "")}</title>`;
    }
    return node.html.split("\n").map(l => `    ${l}`).join("\n");
  }).join("\n");
}

function renderBody(nodes: BodyNode[], indent = "    "): string {
  return nodes.map(n => {
    if (n.type === "component") {
      const props = n.props
        ? " " + Object.entries(n.props).map(([k, v]) => `${k}={${JSON.stringify(v)}}`).join(" ")
        : "";
      return `${indent}<${n.name}${props} />`;
    }
    return n.html.split("\n").map(l => `${indent}${l}`).join("\n");
  }).join("\n");
}

export function compileAstro(bp: LayoutBlueprint): string {
  const htmlAttrs = Object.entries(bp.htmlAttrs ?? { lang: "en" })
    .map(([k, v]) => `${k}="${esc(String(v))}"`).join(" ");

  const importBlock = bp.imports.map(i => `import ${i.as} from "${i.from}";`).join("\n");
  const propInit = Object.entries(bp.props)
    .map(([name, spec]) => `${name} = ${JSON.stringify(spec.default ?? null)}`)
    .join(", ");
  const propLine = propInit ? `const { ${propInit} } = Astro.props;` : "";

  const head = renderHead(bp.head);
  const pre = renderBody(bp.preContent);
  const post = renderBody(bp.postContent);

  return `---
/* editor:region name="imports" */
${importBlock}
/* /editor:region */

${propLine}
/* editor:region name="props"
${esc(JSON.stringify(bp.props))}
*/
/* /editor:region */
---

<!DOCTYPE html>
<html ${htmlAttrs}>
  <head>
    <!-- editor:region name="head" -->
${head}
    <!-- /editor:region -->
  </head>
  <body>
    <!-- editor:region name="pre-content" -->
${pre}
    <!-- /editor:region -->

    <!-- editor:content-slot name="${bp.contentSlot.name}"${bp.contentSlot.single ? " single" : ""} -->
    <slot />
    <!-- /editor:content-slot -->

    <!-- editor:region name="post-content" -->
${post}
    <!-- /editor:region -->
  </body>
</html>
`;
}
```

```typescript name=easy-seo/src/lib/layouts/parseAstro.ts
import type { LayoutBlueprint, HeadNode, BodyNode, PropSpec } from "./types";

const re = {
  blockCapture: (name: string) => new RegExp(
    name === "imports" || name === "props"
      ? `/\\*\\s*editor:region\\s+name="${name}"\\s*\\*/([\\s\\S]*?)\\/\\*\\s*\\/editor:region\\s*\\*/`
      : `<!--\\s*editor:region\\s+name="${name}"\\s*-->([\\s\\S]*?)<!--\\s*\\/editor:region\\s*-->`,
    "m"
  ),
  slot: /<!--\s*editor:content-slot[^>]*-->\s*<slot\s*\/>\s*<!--\s*\/editor:content-slot\s*-->/m,
  htmlTag: /<html([^>]*)>/m,
};

function extract(content: string, name: string): string | null {
  const m = content.match(re.blockCapture(name));
  return m ? m[1].trim() : null;
}

function parseImports(importsBlock: string | null) {
  if (!importsBlock) return [];
  return importsBlock
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["'];?$/);
      return m ? { as: m[1], from: m[2] } : null;
    })
    .filter(Boolean) as {as: string; from: string}[];
}

function parsePropsJSON(propsBlock: string | null): Record<string, PropSpec> {
  if (!propsBlock) return {};
  try { return JSON.parse(propsBlock.trim()); } catch { return {}; }
}

function parseHtmlAttrs(content: string): Record<string,string> {
  const m = content.match(re.htmlTag);
  if (!m) return {};
  const attrs = m[1] ?? "";
  const out: Record<string,string> = {};
  for (const attr of attrs.split(/\s+/).filter(Boolean)) {
    const kv = attr.match(/^([^\s=]+)=["']?([^"']+)["']?$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

export function parseAstroToBlueprint(content: string): LayoutBlueprint | null {
  if (!re.slot.test(content)) return null;

  const imports = parseImports(extract(content, "imports"));
  const props = parsePropsJSON(extract(content, "props"));
  const htmlAttrs = parseHtmlAttrs(content);

  const headRaw = extract(content, "head") ?? "";
  const preRaw = extract(content, "pre-content") ?? "";
  const postRaw = extract(content, "post-content") ?? "";

  const head: HeadNode[] = headRaw ? [{ type: "raw", html: headRaw }] : [];
  const preContent: BodyNode[] = preRaw ? [{ type: "raw", html: preRaw }] : [];
  const postContent: BodyNode[] = postRaw ? [{ type: "raw", html: postRaw }] : [];

  return {
    name: "Unknown",
    htmlAttrs,
    imports,
    props,
    head,
    preContent,
    contentSlot: { name: "Content", single: true },
    postContent,
  };
}
```

```typescript name=easy-seo/src/lib/layouts/validateAstro.ts
export function validateAstroLayout(content: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!/<!DOCTYPE html>/i.test(content)) errors.push("Missing <!DOCTYPE html>.");
  if (!/<html[\s>]/i.test(content)) errors.push("Missing <html>.");
  if (!/<head[\s>]/i.test(content)) errors.push("Missing <head>.");
  if (!/<body[\s>]/i.test(content)) errors.push("Missing <body>.");
  const slotCount = (content.match(/<slot\s*\/>/g) || []).length;
  if (slotCount !== 1) errors.push(`Layout must contain exactly one <slot /> (found ${slotCount}).`);

  // Prevent nested html/head/body tags inside editable regions
  const forbidden = ["</?html", "</?head", "</?body"];
  for (const tag of forbidden) {
    const rx = new RegExp(`${tag}\\b`, "i");
    const head = content.match(/<!--\s*editor:region\s+name="head"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";
    const pre = content.match(/<!--\s*editor:region\s+name="pre-content"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";
    const post = content.match(/<!--\s*editor:region\s+name="post-content"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";
    if (rx.test(head) || rx.test(pre) || rx.test(post)) {
      errors.push(`Forbidden tag ${tag} detected inside editable regions.`);
      break;
    }
  }

  return { ok: errors.length === 0, errors };
}
```

Sprint 2 — Make the MainLayout replica (Layout mode)
- UI lets Jules add:
  - Imports (Header/Footer)
  - Props (title)
  - Pre-content region (Header)
  - Post-content region (Footer)
  - Single content slot (fixed)
  - html attributes (lang)
- Compile and save to src/layouts/MainLayout.generated.astro.
- Open an existing MainLayout.astro:
  - If markers exist, parse and edit.
  - If markers are missing, offer “Add markers” (wrap the slot and header/footer), then parse.

Provide a “golden” layout your editor should output:

```astro name=src/layouts/MainLayout.generated.astro
---
/* editor:region name="imports" */
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
/* /editor:region */

const { title = "Site" } = Astro.props;
/* editor:region name="props"
{
  "title": { "type": "string", "default": "Site" }
}
*/
/* /editor:region */
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- editor:region name="head" -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <!-- /editor:region -->
  </head>
  <body>
    <!-- editor:region name="pre-content" -->
    <Header />
    <!-- /editor:region -->

    <!-- editor:content-slot name="Content" single -->
    <slot />
    <!-- /editor:content-slot -->

    <!-- editor:region name="post-content" -->
    <Footer />
    <!-- /editor:region -->
  </body>
</html>
```

Sprint 3 — Content mode: full block palette (sections, columns, images, buttons, tables, backgrounds)
- Add a block library under src/blocks with simple, Astro-compatible building blocks. The editor composes these into content files or fragments that are meant to live inside the layout slot.
- You can use the same schema (BodyNode) in a “content blueprint,” then compile a page fragment (no html/head/body) or a full page that imports the layout and renders blocks between <MainLayout> … </MainLayout>.

Starter block components (keep them simple and self-contained):

```astro name=src/blocks/Section.astro
---
const { tag = 'section', className = '', style = '' } = Astro.props;
const Tag = tag;
---
<Tag class={className} style={style}><slot /></Tag>
```

```astro name=src/blocks/Columns.astro
---
const { gap = '1rem', stackAt = '640px' } = Astro.props;
const style = `
  display:grid;
  grid-template-columns: repeat(auto-fit,minmax(0,1fr));
  gap:${gap};
}
@media (max-width:${stackAt}) {
  grid-template-columns: 1fr;
}
`;
---
<div style={`display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:${gap};`}><slot /></div>
```

```astro name=src/blocks/Column.astro
---
const { className = '', style = '' } = Astro.props;
---
<div class={className} style={style}><slot /></div>
```

```astro name=src/blocks/Image.astro
---
const { src, alt = '', width, height, className = '', style = '' } = Astro.props;
---
<img src={src} alt={alt} width={width} height={height} class={className} style={style} loading="lazy" />
```

```astro name=src/blocks/Button.astro
---
const { href = '#', label = 'Click', variant = 'primary', className = '', style = '' } = Astro.props;
---
<a href={href} class={`btn btn-${variant} ${className}`} style={style}>{label}</a>
```

```astro name=src/blocks/Table.astro
---
const { headers = [], rows = [], className = '', style = '' } = Astro.props;
---
<table class={className} style={style}>
  {headers.length ? (
    <thead>
      <tr>{headers.map(h => <th>{h}</th>)}</tr>
    </thead>
  ) : null}
  <tbody>
    {rows.map(r => <tr>{r.map(c => <td>{c}</td>)}</tr>)}
  </tbody>
</table>
```

```astro name=src/blocks/Background.astro
---
const { image = '', color = '', className = '', style = '' } = Astro.props;
const bgStyle = `
  ${color ? `background-color:${color};` : ''}
  ${image ? `background-image:url('${image}');background-size:cover;background-position:center;` : ''}
  ${style}
`;
---
<div class={className} style={bgStyle}><slot /></div>
```

Block registry (so the editor knows what props to show):

```typescript name=easy-seo/src/blocks/registry.ts
export type BlockProp = { name: string; type: "string" | "number" | "boolean" | "array" | "object"; default?: any };
export type BlockDef = { name: string; path: string; props: BlockProp[] };

export const BLOCKS: BlockDef[] = [
  { name: "Section", path: "src/blocks/Section.astro", props: [
    { name: "tag", type: "string", default: "section" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Columns", path: "src/blocks/Columns.astro", props: [
    { name: "gap", type: "string", default: "1rem" },
    { name: "stackAt", type: "string", default: "640px" },
  ]},
  { name: "Column", path: "src/blocks/Column.astro", props: [
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Image", path: "src/blocks/Image.astro", props: [
    { name: "src", type: "string", default: "" },
    { name: "alt", type: "string", default: "" },
    { name: "width", type: "string", default: "" },
    { name: "height", type: "string", default: "" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Button", path: "src/blocks/Button.astro", props: [
    { name: "href", type: "string", default: "#" },
    { name: "label", type: "string", default: "Click" },
    { name: "variant", type: "string", default: "primary" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Table", path: "src/blocks/Table.astro", props: [
    { name: "headers", type: "array", default: [] },
    { name: "rows", type: "array", default: [] },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Background", path: "src/blocks/Background.astro", props: [
    { name: "image", type: "string", default: "" },
    { name: "color", type: "string", default: "" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
];
```

Content mode output options (pick one now, add the other later):
- Fragment file (only blocks, no html/head/body) to be placed inside a page’s markdown or a wrapper component.
- Full page file that imports MainLayout and renders blocks inside it:
  - Example output concept:
    - import MainLayout from "../layouts/MainLayout.astro";
    - <MainLayout><Section>…</Section></MainLayout>

Sprint 4 — Wire I/O and safeguards
- Use existing endpoints:
  - List layouts: GET /api/astro-layouts?repo=owner/repo
  - Load file content: GET /api/get-file-content?repo=...&path=...
  - Save file: POST /api/save-layout with repo, path, content, sha
- Before save:
  - compileAstro -> validateAstroLayout -> if ok, save
  - If opening an existing layout without markers, show “Add markers and continue” (insert the regions around header/footer/slot, then parse)
- Worker hygiene:
  - Deduplicate handleCreateOrUpdateFileRequest and ensure UTF-8-safe encoding btoa(unescape(encodeURIComponent(content))).

Sprint 5 — UI to “edit all parts”
- Layout mode (replicates MainLayout):
  - Imports manager (add/remove components)
  - Props (title, etc.)
  - HTML attributes (lang)
  - Pre-content (Header, nav, banners, etc.) as a list of components or raw snippets
  - Post-content (Footer)
  - Slot is fixed and single
- Content mode (full works):
  - Block palette (Section, Columns, Column, Image, Button, Table, Background)
  - Drag/drop, reorder, edit props, nested blocks (Columns -> Column children, Section -> nested blocks)
  - Preview compiled Astro (read-only)
  - Save to src/pages/*.astro (or src/components/content/*.astro as fragments) or to D1 if you use DB-backed templates

Sprint 6 — Tests and “MainLayout parity”
- Unit tests:
  - compileAstro produces golden output
  - parseAstroToBlueprint round-trips
  - validateAstroLayout catches bad cases (missing slot, nested html/head/body in regions)
- Integration:
  - Create MainLayout.generated.astro via the editor
  - Build the site, ensure header/footer render and slot content shows
  - Open the real MainLayout.astro (with markers), edit header/footer, save, rebuild

Notes and decisions
- Head editing: We added the head region marker; keep the UI disabled for now, or only allow a title from props. You can expand later with meta/og/link/script node editors.
- “All parts” philosophy:
  - Keep layout shell lean: document structure + shared chrome (header/footer) + slot.
  - Put sections/columns/images/buttons/tables/backgrounds into content blocks rendered inside the slot. The editor supports both modes.
- If you want header/footer to be block-managed too, just treat them as blocks in pre/post-content, which we already support.

Want me to open a PR scaffolding these files and a “MainLayout.generated.astro” sample, plus a basic round-trip test?

## new sprint 5 idea and actions and desissions so far:
The plan: 

Sprint 5 — Plan and Phases Phase 5.1 — Entry UX + Page Creation (file-first) Outcome: Clear guidance on where content lives and a smooth “new page” flow. File Explorer   - Keep your plain-English folder descriptions for general/, discover/, consider/, get/.   - Add “?” tooltips for SEO/UX context; ensure mobile-friendly tap targets. edit Page Modal   - Fields: Page name, Design type (General, Service, Blog, Contact, Product…these layouts need to be built).   - Under the hood: map each design type to a visual layout preset JSON (stored in /data/layouts/presets).   - On create: write a Markdown file in src/pages/{folder}/{slug}.md with:     - layout: /src/layouts/VisualLayout.astro     - visual_layout_path: /data/layouts/presets/{preset}.json     - title, description, etc. Phase 5.2 — Live Preview (client-side) Outcome: Never see a blank white page again. Client-side Preview Pane   - Renders the JSON layout (from the selected visual_layout_path) with a lightweight React/Preact renderer.   - Update the preview instantly when content or style changes.   - Ship default design tokens (typography, spacing, colors) so base is always styled. If a page uses a file-based Astro layout (code)   - Show banner: “This page uses a code layout. Switch to a visual layout to style it.”   - One-tap: “Switch to visual layout” sets layout and visual_layout_path in frontmatter. Phase 5.3 — Visual Layout Sidebar (simple) Outcome: Style without complexity. Visual Sidebar controls   - Presets: Classic, Split, Full Banner, Article, Card Grid.   - Background: color picker + image selector.   - Typography scale: S / M / L.   - Section style: spacing (compact/normal/roomy), alignment (left/center). Block Library (mobile-friendly)   - Add: Heading, Text, Image, Button, List, Quote, Table, Spacer.   - Reorder with long-press (big hit targets).   - Edit block in a bottom sheet form (Save/Cancel). Persistence   - Save user-edited layouts to /data/layouts/custom/.json via the existing /api/file endpoint.   - Pages refer to custom JSON via frontmatter visual_layout_path. Phase 5.4 — Content + SEO Outcome: A guided path to publish-ready pages. Content tab   - Rich text/Markdown editor for the body.   - Auto-generate simple form inputs from the layout JSON’s fields (if present).Pre-publish checklist (modal)   - Title, Description, Featured image + alt text, Internal links.   - “Auto-suggest” button to fill title/description from content (AI optional now, manual fine). Phase 5.5 — Template Assign/Switch flow Outcome: No dead-ends if a page uses code layouts. If code layout:   - “Switch to visual” modal → pick a preset or existing custom layout JSON → update frontmatter.If visual layout:   - Show the currently assigned layout name with a Change action (confirm to prevent accidental loss). Phase 5.6 — Optional Preview Build Outcome: Shareable, server-rendered preview. Button: Generate Preview Build   - Uses your existing /api/trigger-build and /api/build-status.   - Client-side preview remains default for speed; server preview is for sharing. Repo structure (simple and static-friendly) JSON layouts   - /data/layouts/presets/classic.json   - /data/layouts/presets/split.json   - /data/layouts/custom/{user-slug}.json Page frontmatter (example)   - layout: /src/layouts/VisualLayout.astro   - visual_layout_path: /data/layouts/presets/classic.json   - title: “Service Page”   - description: “What we offer and why it matters.” Layout JSON schema (minimal and extensible)   - version: 1   - theme: { colors, typographyScale }   - fields?: [{ key, label, type, required, options? }]   - canvas: [{ id, type, props, children?: [] }] Endpoints (reuse file APIs) Listing layouts   - GET /api/files?repo={owner/repo}&path=data/layouts/presets   - GET /api/files?repo={owner/repo}&path=data/layouts/custom Read one layout   - GET /api/get-file-content?repo={owner/repo}&path=data/layouts/presets/classic.json   - Same for custom. Create/update layout   - POST /api/file with { repo, path: 'data/layouts/custom/{name}.json', content, sha? } Duplicate layout   - POST /api/duplicate-file { repo, path, newPath } Assign layout to page   - POST /api/assign-layout with { repo, path: 'src/pages/...md', layout: 'file' }   - Then update frontmatter:     - layout = /src/layouts/VisualLayout.astro     - visual_layout_path = /data/layouts/custom/{name}.json (or preset) Astro rendering (at build, still static) VisualLayout.astro loads the referenced JSON by path using import.meta.glob   - const layouts = import.meta.glob('../../data/layouts/**/.json', { eager: true });   - Look up the module whose path ends with visual_layout_path.   - Render with small server-safe components so the built HTML reflects the layout.This keeps the final site static, with no runtime DB or network calls. Worker changes (minimal) No D1 calls; deprecate these routes in UI:   - /api/layout-templates, /api/render-layout/:id, /api/pages//assign-templateReuse existing file endpoints for JSON layouts:   - /api/files, /api/get-file-content, /api/file, /api/duplicate-file, /api/deleteKeep /api/assign-layout but switch its behavior:   - If layout starts with visual:, set:     - frontmatter.layout = '/src/layouts/VisualLayout.astro'     - frontmatter.visual_layout_path = provided JSON path (e.g., data/layouts/presets/classic.json)   - If user picks a code layout, set frontmatter.layout to that .astro file and delete visual_layout_path. Definition of done A new user can:   - Create a page, pick a design type (mapped to a preset), add content, change background color/image, and see an attractive preview.   - Pass a simple SEO checklist and publish.   - Switch a code-based page to a visual layout and continue editing.Mobile:   - Primary actions are reachable with large hit areas.   - Reordering via long-press is smooth and predictable. Migration notes (from D1) If any templates exist in D1, export them once to /data/layouts/custom/.json and update pages to point to those JSON paths.Remove d1_databases from wrangler.toml when ready (optional, not required immediately).Remove or hide D1 endpoints in the UI; maintain compatibility in the worker until fully removed. Risks and mitigations Preview mismatch with production styles   - Mitigation: shared design tokens; tight constraints on typography/spacing; optional preview build.Too many styling options overwhelm users   - Mitigation: lead with presets; tuck advanced controls under “More options”; keep contextual microcopy.

The discussion with last developer:
I have a few clarifying questions based on the detailed breakdown you provided. Answering them will help me build a precise and effective plan.
1. Overall Priority: Sprint 5 is quite comprehensive. To ensure we deliver value quickly, which phase is the most critical to get right first? My assumption is that Phase 5.1 (Entry UX) and Phase 5.2 (Live Preview) are the foundation for everything else. Is that correct?
2. Layout Presets (Phase 5.1):You mentioned storing preset JSON files in /data/layouts/presets. Do these preset files (classic.json, split.json, etc.) already exist, or should the first step be for me to create placeholder versions based on the schema you provided?
3. Preview Renderer Scope (Phase 5.2): For the client-side preview pane, you mentioned a "lightweight React/Preact renderer." To keep the initial sprint manageable, should this renderer's first version focus only on rendering the specific block types defined in Phase 5.3 (Heading, Text, Image, Button, etc.), rather than being a general-purpose HTML renderer?
4. Editing UI/UX (Phase 5.3):For editing a block, you described a "bottom sheet form," which is a great mobile-first pattern. For the desktop view, would you prefer this to remain a bottom sheet, or should it adapt to a different UI, like an inline editor or a sidebar panel?
5. Content Editor (Phase 5.4):For the "Content tab," which will have a rich text/Markdown editor, do you have a preferred library in mind (like react-markdown or tiptap), or should I start with a simple, standard <textarea> and we can enhance it later?
6. Preview Build Button (Phase 5.6): Where is the ideal placement for the "Generate Preview Build" button in the UI? For instance, should it be next to the main "Save" button, or perhaps inside a separate "Publish" or "Share" menu?
Your answers will help me structure the plan perfectly. I'm ready to proceed once I have this clarity.
5.1 2- just check as Astro needs are priority. The layout editor.md will explain what layout planning has been done. The layout editor done previously for sprint 5 is too technical for layman users. 3-. I’m not sure but preview can be Astro preview rendered in iframe 4- desktop split screen I think 5- it’s built and needs only carful editing to make it better beware it took long to get it working 6- top header has a button already I think Please go slow and ask don’t assume anything please I don’t want to spend weeks trying to bug hunt.

Today 16:46 
I have one final question, and it's about the transition from the old to the new.
* Deprecation Strategy: The new "Visual Layout Editor" (driven by JSON) will eventually replace the more technical "Layout Mode" editor that edits .astro files directly. Should I:
    * (A) Build the new Visual Editor alongside the old one? We could add a new route or a switch in the UI to access it, keeping the old editor in place for now.
    * (B) Replace the old Layout Editor UI entirely? I would refactor EditorRouter and other components to only load the new JSON-based Visual Editor. This is a cleaner path forward but more disruptive.
    * (C) Something else?Perhaps there's a middle ground I'm not seeing.
Your answer to this will determine the entire structure of the plan. Option (A) is safer and more iterative, while Option (B) is a bolder "rip and replace" approach. I am ready to create the plan as soon as I have your guidance on this.
So not long ago we had basic layout editor: Perfect! Nesting is where this gets interesting (and fun). Let me build you a clean, iPhone-friendly layout editor from scratch.
The Architecture
We’ll build around a tree structure where any component can potentially contain children. Here’s the elegant part: instead of drag-and-drop, we use:
1. Tap to select - highlights component, shows controls
2. Floating action buttons - Add child, Move up/down, Delete
3. Breadcrumb navigation- tap to select parent containers
4. Visual nesting indicators- clear hierarchy
Let me create a working prototype:
What I Built
This is a fully functional mobile-first layout editor with:
✅ Nested components - Sections can contain other components ✅ Tap-to-select - Visual ring shows what’s selected ✅ Breadcrumb navigation - Tap to navigate up the component tree ✅ Smart “Add” button - Adds to selected container or root ✅ Move up/down - Reorder siblings easily ✅ Delete - Removes component and all children ✅ Zero drag-and-drop - Pure tap interactions
Try It Out
1. Tap any component to select it
2. Use the bottom controls to move/delete
3. Hit “Add” to open the component toolbox
4. If you have a Section selected, new components go inside it
5. Use breadcrumbs to navigate back to parent containers
Next Steps to Make This Production-Ready
1. Prop editing - Add a panel to edit component props (titles, colors, etc.)
2. Undo/redo - Keep a history stack of state changes
3. Persistence - Save/load state to localStorage or your backend
4. More components - Add your actual Astro components
5. Export - Generate Astro component code from the tree
Okay thank you, but why can some apps allow user on iphone to move things around and why can’t we build it? Great question! You’re absolutely right to push back - we absolutely CAN build drag-and-drop on iPhone. Many apps do it successfully. Let me clarify the real situation:
Why Touch Drag-and-Drop Actually Works
Apps that do drag-and-drop on mobile (like Notion, Trello, website builders) use touch event APIs (touchstart, touchmove, touchend), NOT the HTML5 Drag & Drop API.
The issue with Craft.js isn’t that drag-and-drop is impossible on iPhone - it’s that Craft.js specifically uses the wrong API for mobile.
The Two Drag-and-Drop Approaches
1. HTML5 Drag & Drop API(what Craft.js uses)
element.addEventListener('dragstart', ...) // ❌ Doesn't work on mobile Safari
element.addEventListener('drop', ...)
2. Touch Events API (what mobile apps actually use)
element.addEventListener('touchstart', ...) // ✅ Works perfectly on iPhone
element.addEventListener('touchmove', ...)
element.addEventListener('touchend', ...)
We Can Absolutely Build Touch-Based Drag-and-Drop
Let me rebuild the editor with actual drag-and-drop using touch events:
Now We’re Talking! 🎯
This version has REAL drag-and-drop that works on iPhone:
How It Works:
1. Touch the grip handle (⋮⋮ icon on the left) to start dragging
2. Move your finger - you’ll see a blue ghost following your touch
3. Blue line appearsshowing where the component will drop
4. Release to drop it in the new position
The Technical Magic:
// We use touch events, not HTML5 drag API
onTouchStart → Start tracking
onTouchMove → Update ghost position, find drop target
onTouchEnd → Execute the move
This is exactly how apps like Notion and Trello do it on mobile. We’re:
* Listening to raw touch coordinates
* Drawing a visual ghost element
* Calculating drop positions in real-time
* Updating the component tree when you release
Try It:
1. Drag the Hero component up and down
2. Add a new Section
3. Drag components into/out of sections
4. Works perfectly on iPhone Safari!
The reason we couldn’t use Craft.js isn’t that drag-and-drop is impossible - it’s that Craft.js made the architectural choice to use the desktop-only HTML5 API. We just rebuilt it with the mobile-friendly approach instead.
We can make this that layout-editor page for users like me who want to have more control of setting and placement

Okay copilot says : Love this direction. Here’s a focused 5.1 review plus a future-proofing pass, then concrete file proposals to land the foundation cleanly.
Assessment and future-proof notes (scoped to 5.1)
* VisualLayout.astro
    * Good approach: import.meta.glob for JSON is static-friendly and SSR-safe.
    * Future-proof: resolve JSON via a normalized absolute path. If frontmatter has visual_layout_path like /data/layouts/presets/classic.json, compute /src + visual_layout_path to look up in the glob map. Add a defensive fallback with a clear message if missing.
    * Guardrails: restrict loading to /src/data/layouts/** to avoid arbitrary import paths from frontmatter.
* BlockRenderer.astro
    * Keep a strict block registry (type → component) and provide a harmless fallback for unknown types.
    * Plan for extensibility: pass through props, but avoid direct HTML injection. Keep recursion minimal and predictable.
* Preset JSONs
    * Minimal schema now; version key included for future migrations.
    * Keep theme small (background, textColor, accent, typographyScale). Don’t overfit yet.
* CreateModal.jsx
    * UX: “Design Type” select is perfect for 5.1. Slugify names and write .md with frontmatter layout + visual_layout_path.
    * Keep folder creation out for now (you can re-introduce it later as an “Advanced” toggle; 5.1 is about “Create Page” clarity).
    * Validation: ensure preset exists; if missing, default to classic.
* Worker alignment (note for 5.2+)
    * You can leave D1 endpoints in place but unused. For 5.1, /api/file is sufficient.
    * When you tackle “Assign Layout” in the Explorer context menu, shift it to write visual_layout_path in frontmatter (and layout set to VisualLayout.astro). Not required to ship 5.1.
Proposed files and changes to complete Phase 5.1
Astro layout to render JSON-driven pages
---
const { title, description, visual_layout_path } = Astro.props;

// Load all layout JSON files at build time
const layouts = import.meta.glob('/src/data/layouts/**/*.json', { eager: true });

// Resolve the frontmatter path to an absolute module key
function resolveLayoutModulePath(p) {
  if (!p) return null;
  // normalize: e.g. "/data/layouts/presets/classic.json" -> "/src/data/layouts/presets/classic.json"
  const normalized = p.startsWith('/src') ? p : `/src${p}`;
  return normalized;
}

let layoutData = null;
const targetKey = resolveLayoutModulePath(visual_layout_path);
if (targetKey && layouts[targetKey] && layouts[targetKey].default) {
  layoutData = layouts[targetKey].default;
} else {
  // Optional: pick a bundled default to avoid blank pages
  const fallbackKey = '/src/data/layouts/presets/classic.json';
  layoutData = layouts[fallbackKey]?.default ?? {
    version: 1,
    theme: { background: '#ffffff', textColor: '#111827', accent: '#1f2937', typographyScale: 'M' },
    canvas: [
      { id: 'fallback-title', type: 'Heading', props: { text: title || 'Untitled', level: 1, align: 'center' } },
      { id: 'fallback-text', type: 'Text', props: { text: 'This page is using a fallback layout. Please check visual_layout_path.' } },
    ],
  };
}

const theme = layoutData?.theme ?? {};
const canvas = layoutData?.canvas ?? [];
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <style>
      :root {
        --page-bg: {theme.background || '#ffffff'};
        --page-text: {theme.textColor || '#111827'};
        --page-accent: {theme.accent || '#1f2937'};
        --type-scale: {theme.typographyScale || 'M'};
      }
      body {
        background: var(--page-bg);
        color: var(--page-text);
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        line-height: 1.6;
      }
      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .spacer {
        height: 1rem;
      }
      @media (max-width: 640px) {
        .container { padding: 1rem; }
      }
    </style>
  </head>
  <body>
    <main class="container">
      <Fragment set:html={''} />
      <Component src="../components/BlockRenderer.astro" blocks={canvas} />
      <slot />
    </main>
  </body>
</html>
Recursive block renderer
---
import Heading from './blocks/Heading.astro';
import Text from './blocks/Text.astro';

const { blocks = [] } = Astro.props;

const registry = {
  Heading,
  Text,
};

function renderBlock(block) {
  if (!block || !block.type) return null;
  const Component = registry[block.type];
  if (!Component) {
    // Unknown block type; render nothing to keep things safe and quiet
    return null;
  }
  return <Component {...(block.props || {})}>
    {Array.isArray(block.children) && block.children.length > 0 ? (
      <Component src="../components/BlockRenderer.astro" blocks={block.children} />
    ) : null}
  </Component>;
}
---

{Array.isArray(blocks) && blocks.map((b) => (
  <Fragment>{renderBlock(b)}</Fragment>
))}
Basic block components (minimal for presets)
---
const { text = '', level = 1, align = 'left' } = Astro.props;
const Tag = (level >= 1 && level <= 6) ? (`h${level}`) : 'h2';
const alignStyle = ['left','center','right','justify'].includes(align) ? align : 'left';
const styles = {
  1: 'font-weight: 800; font-size: 2rem; line-height: 1.2;',
  2: 'font-weight: 700; font-size: 1.75rem; line-height: 1.3;',
  3: 'font-weight: 700; font-size: 1.5rem; line-height: 1.35;',
  4: 'font-weight: 600; font-size: 1.25rem; line-height: 1.4;',
  5: 'font-weight: 600; font-size: 1.125rem; line-height: 1.45;',
  6: 'font-weight: 600; font-size: 1rem; line-height: 1.5;',
};
---

<Tag style={`text-align:${alignStyle}; ${styles[level] || styles[2]}; margin: 0.5rem 0; color: var(--page-text);`}>
  {text}
</Tag>
---
const { text = '', align = 'left' } = Astro.props;
const alignStyle = ['left','center','right','justify'].includes(align) ? align : 'left';
---

<p style={`text-align:${alignStyle}; margin: 0.75rem 0;`}>
  {text}
</p>
Preset JSONs (five defaults)
{
  "version": 1,
  "theme": {
    "background": "#ffffff",
    "textColor": "#111827",
    "accent": "#003971",
    "typographyScale": "M"
  },
  "canvas": [
    { "id": "hero", "type": "Heading", "props": { "text": "Your Page Title", "level": 1, "align": "center" } },
    { "id": "intro", "type": "Text", "props": { "text": "Introduce the main idea of this page here. Keep it short and clear.", "align": "center" } }
  ]
}
{
  "version": 1,
  "theme": {
    "background": "#ffffff",
    "textColor": "#0f172a",
    "accent": "#0ea5e9",
    "typographyScale": "M"
  },
  "canvas": [
    { "id": "title", "type": "Heading", "props": { "text": "Service Name", "level": 1, "align": "center" } },
    { "id": "blurb", "type": "Text", "props": { "text": "What you do, who it’s for, and why it matters.", "align": "center" } },
    { "id": "details-title", "type": "Heading", "props": { "text": "What’s Included", "level": 2 } },
    { "id": "details", "type": "Text", "props": { "text": "Brief bullet-like description of key features or outcomes." } }
  ]
}
{
  "version": 1,
  "theme": {
    "background": "#ffffff",
    "textColor": "#1f2937",
    "accent": "#2563eb",
    "typographyScale": "M"
  },
  "canvas": [
    { "id": "title", "type": "Heading", "props": { "text": "Blog Post Title", "level": 1 } },
    { "id": "sub", "type": "Text", "props": { "text": "Short summary to set context." } }
  ]
}
{
  "version": 1,
  "theme": {
    "background": "#ffffff",
    "textColor": "#111827",
    "accent": "#16a34a",
    "typographyScale": "M"
  },
  "canvas": [
    { "id": "title", "type": "Heading", "props": { "text": "Get in Touch", "level": 1, "align": "center" } },
    { "id": "desc", "type": "Text", "props": { "text": "We’ll get back to you as soon as possible.", "align": "center" } }
  ]
}
{
  "version": 1,
  "theme": {
    "background": "#ffffff",
    "textColor": "#0b1220",
    "accent": "#f59e0b",
    "typographyScale": "M"
  },
  "canvas": [
    { "id": "title", "type": "Heading", "props": { "text": "Product Name", "level": 1, "align": "center" } },
    { "id": "pitch", "type": "Text", "props": { "text": "A single sentence that makes someone care.", "align": "center" } }
  ]
}
Update CreateModal to create Markdown pages with presets
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DESIGN_TYPES = [
  { key: 'classic', label: 'General (Classic)' },
  { key: 'service', label: 'Service' },
  { key: 'blog', label: 'Blog' },
  { key: 'contact', label: 'Contact' },
  { key: 'product', label: 'Product' },
];

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFKD') // handle accents
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CreateModal({ path, repo, onClose, onCreate }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [designType, setDesignType] = useState('classic');
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Page name is required.');
      return;
    }
    setIsCreating(true);
    setError(null);

    try {
      const slug = slugify(name) || 'new-page';
      const fileName = `${slug}.md`;
      const fullPath = path === '/' ? `src/pages/${fileName}` : `${path}/${fileName}`;
      const visualLayoutPath = `/data/layouts/presets/${designType}.json`;
      const frontmatter = [
        '---',
        `layout: /src/layouts/VisualLayout.astro`,
        `visual_layout_path: ${visualLayoutPath}`,
        `title: "${name.replace(/"/g, '\\"')}"`,
        `description: ""`,
        '---',
        '',
      ].join('\n');

      const body = `# ${name}\n\n`;
      const content = `${frontmatter}${body}`;

      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create page.');
      }

      onCreate?.();
      onClose?.();

      // Navigate to the editor for the new file
      navigate(`/editor?path=${fullPath}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Page</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., About Us"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bark-blue focus:border-bark-blue"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="design" className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
            <select
              id="design"
              value={designType}
              onChange={(e) => setDesignType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              {DESIGN_TYPES.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">You can change styles later in the Layout tab.</p>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md border border-gray-300" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-bark-blue text-white hover:bg-opacity-90 disabled:opacity-50" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;
.gitignore update (logs)
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# Build
dist
What to verify after merging
* Create a page from Explorer → Plus → Modal
    * Confirms .md file at src/pages/... with correct frontmatter and body
    * Editor opens successfully
* Build renders the new page with VisualLayout.astro
    * Classic preset shows heading and intro
* Switching design types in creation changes the visual_layout_path and preview look

I'm ready to move on to Sprint 5.2. As before, I'll enter "deep planning mode" to ensure I have absolute clarity on your expectations. The goal for 5.2 is to build the live preview system.
I have a few questions to confirm my assumptions before I create the plan:
1. Preview Technology: For the live preview, the goal mentions a "lightweight React/Preact renderer." This means I will build a set of Preact components inside the editor that are styled to look exactly like your final Astro site's components. This provides a very fast, "instant" update experience. My plan is to build the Preact renderer. Is this the correct approach?
2. Editor Routing: When a user opens a page from the File Explorer, the application needs to decide which editor to show. Here's my proposed logic:
    * If the file is a Markdown file (.md)that uses our new VisualLayout.astro, I will direct the user to a new, dedicated Visual Editor page.
    * If the file is a traditional Astro file (.astro), I will direct the user to the existing Layout Editor (the more technical, marker-based one). Does this routing logic seem correct to you?
3. Scope of "Instant Update":The goal is to "Update the preview instantly when content or style changes." The controls for actually making those changes (e.g., a color picker, a text input) are planned for Sprint 5.3. For this sprint (5.2), my plan is to build the preview pane in a way that it can be updated instantly, but the actual editing controls will be implemented in the next sprint. Is this interpretation correct?
Today 18:31 
1- I didn’t like this before it looks nothing like the webpage so as before Astro build preview must load into a frameless full screen iframe. 2- I’m not sure- and confused. The whole point of embarking on layout-editor.md mission was so that we could make a perfect .astro open a .astro and display the part that matters to visual in an editor. Why can’t we keep this as if user downloads layout kit it must work if user creates there own it must be .astro and work incase user wants to share layout with another user. Frontmaster can be handled differently like a modal that does translation between easy layman and technical backend. 3- first time user waits next time we can help with more instant by injecting changes? 4-think about it differently there is always a way to the solution we just need to put heads together

Thank you for this critical feedback. I understand now that the goal is a single, unified, visual editor that works directly on .astro files, not a separate system for Markdown and JSON.
This creates a conflict with the work we just completed in Sprint 5.1. We need to decide on the path forward before I can plan Sprint 5.2.
Here are the options:
Option A: Pivot to a Unified .astro Editor (Recommended)
1. Refactor 5.1: I will first change the "Create Page" modal to generate a complete .astro file with markers, based on the selected design type.
2. Build the Visual UI for .astro: For Sprint 5.2, I'll build the new user-friendly editor that opens these .astro files, uses the existing marker engine, and provides simple visual controls to modify the file directly.
Option B: Continue with the Separate JSON/Markdown System We stick with the system from 5.1. The visual editor will be a tool for editing the separate JSON layout files, and the "Create Page" flow will continue to make .md files.
I believe Option A is the correct path. It requires a small refactor but aligns with your long-term vision.
Do you agree that we should proceed with Option A? Once you confirm, I will create a new plan for Sprint 5.2.
Today 18:58 
Option A is ideal long term

Olay again only if you agree: copilot says: You’re definitely moving in the right direction. For Phase 5.1, this is exactly the kind of “layman-first” foundation we wanted: presets, a single Visual layout, simple blocks, and a friendlier New Page modal. Below is a focused review with small, high-impact improvements to make this solid today and future-proof for 5.2+.
What’s great
* Clear separation of concerns: content in Markdown, design in JSON, rendering in Astro.
* Presets give non-technical users a confident starting point.
* BlockRenderer + minimal blocks keep complexity down while leaving room to grow.
* CreateModal now speaks the user’s language (“Design Type”), and writes clean frontmatter.
Tighten-ups to land 5.1 cleanly
1. VisualLayout.astro: robust JSON resolution + safe fallback
* Fail gracefully if visual_layout_path is missing/incorrect.
* Only allow JSON under /src/data/layouts/** for safety.
* Provide default theme tokens so the page never looks blank.
---
const { title, description, visual_layout_path } = Astro.props;

// Import JSON presets/custom layouts at build time
const layouts = import.meta.glob('/src/data/layouts/**/*.json', { eager: true });

function resolveLayoutModulePath(p) {
  if (!p) return null;
  // Normalize to absolute module key inside /src
  const normalized = p.startsWith('/src') ? p : `/src${p}`;
  // Safety: only allow /src/data/layouts/**
  if (!normalized.startsWith('/src/data/layouts/')) return null;
  return normalized;
}

const targetKey = resolveLayoutModulePath(visual_layout_path);
let layoutData = targetKey && layouts[targetKey] && layouts[targetKey].default
  ? layouts[targetKey].default
  : layouts['/src/data/layouts/presets/classic.json']?.default;

// Final fallback in dev to avoid white pages
if (!layoutData) {
  layoutData = {
    version: 1,
    theme: { background: '#ffffff', textColor: '#111827', accent: '#003971', typographyScale: 'M' },
    canvas: [
      { id: 'fallback-title', type: 'Heading', props: { text: title || 'Untitled', level: 1, align: 'center' } },
      { id: 'fallback-text', type: 'Text', props: { text: 'Missing or invalid visual_layout_path. Using fallback layout.', align: 'center' } }
    ],
  };
}

const theme = layoutData?.theme ?? {};
const canvas = layoutData?.canvas ?? [];
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <style>
      :root {
        --page-bg: {theme.background || '#ffffff'};
        --page-text: {theme.textColor || '#111827'};
        --page-accent: {theme.accent || '#1f2937'};
        --type-scale: {theme.typographyScale || 'M'};
      }
      body {
        background: var(--page-bg);
        color: var(--page-text);
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        line-height: 1.6;
      }
      .container { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
      @media (max-width: 640px) { .container { padding: 1rem; } }
    </style>
  </head>
  <body>
    <main class="container">
      <Component src="../components/BlockRenderer.astro" blocks={canvas} />
      <slot />
    </main>
  </body>
</html>
1. BlockRenderer.astro: fix recursion and unknown types
* Keep a strict registry (type → component).
* Render children recursively via a helper (no circular imports).
* Silently skip unknown types (no crashes, no code shown).
---
import Heading from './blocks/Heading.astro';
import Text from './blocks/Text.astro';

const { blocks = [] } = Astro.props;

const registry = { Heading, Text };

function RenderBlock({ block }) {
  if (!block || typeof block !== 'object' || !block.type) return null;
  const Cmp = registry[block.type];
  if (!Cmp) return null;

  const children = Array.isArray(block.children) ? block.children : [];
  return (
    <>
      <Cmp {...(block.props || {})} />
      {children.length > 0 && <RenderList items={children} />}
    </>
  );
}

function RenderList({ items }) {
  return (
    <>
      {items.map((b) => <RenderBlock block={b} />)}
    </>
  );
}
---

{Array.isArray(blocks) && <RenderList items={blocks} />}
1. Blocks: safe, simple defaults
* Heading.astro and Text.astro are good. Keep alignment constrained. Astro escapes by default, so you’re safe against injected HTML unless you add set:html.
---
const { text = '', level = 1, align = 'left' } = Astro.props;
const Tag = (level >= 1 && level <= 6) ? (`h${level}`) : 'h2';
const alignStyle = ['left','center','right','justify'].includes(align) ? align : 'left';
const styles = {
  1: 'font-weight: 800; font-size: 2rem; line-height: 1.2;',
  2: 'font-weight: 700; font-size: 1.75rem; line-height: 1.3;',
  3: 'font-weight: 700; font-size: 1.5rem; line-height: 1.35;',
  4: 'font-weight: 600; font-size: 1.25rem; line-height: 1.4;',
  5: 'font-weight: 600; font-size: 1.125rem; line-height: 1.45;',
  6: 'font-weight: 600; font-size: 1rem; line-height: 1.5;',
};
---

<Tag style={`text-align:${alignStyle}; ${styles[level] || styles[2]}; margin: 0.5rem 0; color: var(--page-text);`}>
  {text}
</Tag>
---
const { text = '', align = 'left' } = Astro.props;
const alignStyle = ['left','center','right','justify'].includes(align) ? align : 'left';
---

<p style={`text-align:${alignStyle}; margin: 0.75rem 0;`}>{text}</p>
1. Preset JSONs: include version and minimal theme
* You’re good. Keep version: 1, theme, and a small starter canvas. Later, add fields to drive form inputs.
Example shape reminder:
{
  "version": 1,
  "theme": { "background": "#ffffff", "textColor": "#111827", "accent": "#003971", "typographyScale": "M" },
  "canvas": [
    { "id": "hero", "type": "Heading", "props": { "text": "Your Page Title", "level": 1, "align": "center" } },
    { "id": "intro", "type": "Text", "props": { "text": "Introduce the page purpose here.", "align": "center" } }
  ]
}
1. CreateModal.jsx: slug + collision handling
* Your worker will 422 if the file exists without sha. Avoid a scary error by pre-checking and suffixing the slug if needed.
* Keep sending plaintext content; your worker handles UTF‑8 base64 encoding.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DESIGN_TYPES = [
  { key: 'classic', label: 'General (Classic)' },
  { key: 'service', label: 'Service' },
  { key: 'blog', label: 'Blog' },
  { key: 'contact', label: 'Contact' },
  { key: 'product', label: 'Product' },
];

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniquePath(repo, basePath, fetchFn = fetch) {
  // Try base, then -2, -3, up to -20
  const [dir, file] = [basePath.substring(0, basePath.lastIndexOf('/')), basePath.substring(basePath.lastIndexOf('/') + 1)];
  const base = file.replace(/\.md$/, '');
  for (let i = 0; i <= 20; i++) {
    const candidate = i === 0 ? `${base}.md` : `${base}-${i + 1}.md`;
    const candidatePath = dir ? `${dir}/${candidate}` : candidate;
    const res = await fetchFn(`/api/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(candidatePath)}`, { credentials: 'include' });
    if (res.status === 404) return candidatePath;
  }
  return basePath; // worst case, let server error
}

function CreateModal({ path, repo, onClose, onCreate }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [designType, setDesignType] = useState('classic');
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return setError('Page name is required.');
    setIsCreating(true); setError(null);
    try {
      const slug = slugify(name) || 'new-page';
      const visualLayoutPath = `/data/layouts/presets/${designType}.json`;

      // Build base path under current path (defaults to src/pages/**)
      const dir = path && path !== '/' ? path : 'src/pages';
      const basePath = `${dir}/${slug}.md`;
      const fullPath = await ensureUniquePath(repo, basePath);

      const frontmatter = [
        '---',
        `layout: /src/layouts/VisualLayout.astro`,
        `visual_layout_path: ${visualLayoutPath}`,
        `title: "${name.replace(/"/g, '\\"')}"`,
        `description: ""`,
        '---',
        '',
      ].join('\n');
      const body = `# ${name}\n\n`;
      const content = `${frontmatter}${body}`;

      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repo, path: fullPath, content }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create page.');
      }

      onCreate?.(); onClose?.();
      navigate(`/editor?path=${fullPath}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Page</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., About Us" autoFocus className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bark-blue focus:border-bark-blue" />
          </div>

          <div className="mb-6">
            <label htmlFor="design" className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
            <select id="design" value={designType} onChange={(e) => setDesignType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white">
              {DESIGN_TYPES.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">You can change styles later in the Layout tab.</p>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md border border-gray-300" onClick={onClose} disabled={isCreating}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-bark-blue text-white hover:bg-opacity-90 disabled:opacity-50" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Page'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateModal;
1. .gitignore: good addition
* Logs ignored is correct. Keep dist, .DS_Store, etc.
Lightweight 5.1 polish (optional now, quick wins)
* Folder explainers in Explorer:
    * On src/pages root, render four small “?” icons next to general/, discover/, consider/, get/ with one-tap popovers. Copy to use:
        * general/: “Your website’s core pages (home, about, contact, privacy).”
        * discover/: “Top‑of‑funnel content to help newcomers learn and find you via search.”
        * consider/: “Hub/comparison pages that help visitors evaluate options.”
        * get/: “Decision-stage pages focused on action: purchase, sign up, contact.”
Future-proofing notes (for 5.2+, not blocking 5.1)
* Validation: add a tiny validator for layoutData in VisualLayout.astro (ensure canvas is array, theme keys are strings). If invalid, fallback to classic and log in dev.
* Assign Layout: update /api/assign-layout to accept a JSON path variant (visual_layout_path) in addition to code-layouts. For now, users can pick design type at creation; later they can switch from Explorer’s context menu.
* Design tokens: if you add a global tokens.css, map preset theme values to CSS variables for consistent preview/production look.
* More blocks: when you introduce Image, Button, and Spacer blocks, keep props tight and sanitized. Avoid set:html unless absolutely necessary.
Net-net
* You’ve nailed the 5.1 foundation. With the small robustness tweaks above (safe JSON resolution, recursion fix, slug collision handling), non-technical users will reliably create styled pages without code or surprises.
* Say the word and I’ll draft the Explorer folder tooltips next, then we can move to 5.2 (live preview controls) with confidence.

Thank you for the detailed feedback. It seems to be a review of the first implementation of Sprint 5.1 (the JSON/Markdown system), not the new, unified .astro editor we pivoted to in Sprint 5.2.
Implementing this feedback would mean undoing our decision to build a unified editor.
Before I create the next plan, please let me know if we should:
* A) Continue with our current plan and start Sprint 5.3 (building the visual UI for the .astro editor).
* B) Revert our strategy and go back to the JSON/Markdown system.
I believe Option A is the correct path based on our last conversation. Please confirm how you'd like to proceed.
Today 19:45 
Definitely A. Copilot is now on our page: Thanks for the clarity. I’m aligning Sprint 5.2 around a unified .astro editor and a real Astro build preview loaded in a frameless, full-screen iframe. Below are direct answers and a tight plan so we can move fast.
Answers to your 5.2 planning questions
1. Preview Technology
* Agreed: no Preact lookalike. We will load the actual Astro preview output in a frameless full-screen iframe.
* Source of truth: the GitHub Action build-preview.yml that writes to public/preview. The editor will point the iframe at the built route under a configurable base (default “/preview”).
* Behavior in 5.2: first-time load may wait for a build; we’ll wire the “Trigger Preview Build” and poll “Build Status” (already available in the worker). In 5.3 we’ll explore “injecting” visual changes without a full rebuild via an overlay or postMessage bridge.
1. Editor Routing
* Unified .astro editor is the default:
    * .astro files → Unified Layout Editor (visual, non-technical UI over the .astro file). We’ll parse markers to expose the “parts that matter” without showing code.
* Content (.md) pages → Content Editor (with the same preview iframe) and a frontmatter modal.
* This preserves your “layout kit” abstraction: shared .astro layouts open visually; creators can make their own .astro templates and share them.
1. Scope of “Instant Update”
* For 5.2: we deliver a reliable, full-screen preview iframe that updates on build completion. Controls for live styling (color picker, etc.) come in 5.3. We’ll still design the preview pane to accept injected updates later (postMessage channel stub) so we don’t refactor again.
1. First-time wait vs. later instant
* Yes. 5.2 will favor correctness (real Astro output). 5.3 will add an overlay/injection path to minimize rebuilds between small edits.
What I will build in Sprint 5.2
* Full-screen preview iframe
    * Computes the preview route from the file path:
        * src/pages/index.astro → /preview/
        * src/pages/about.astro → /preview/about
        * src/pages/discover/my-page.astro → /preview/discover/my-page
        * src/pages/about.md → same mapping
    * A small helper maps “index.(astro|md)” to the directory route and strips extensions.
    * Configurable preview base (default “/preview”); we’ll surface this as an editor setting ENV or app config.
* Preview controller and workflow
    * “Rebuild Preview” button calls /api/trigger-build and polls /api/build-status until latest run finishes; then it reloads the iframe.
    * A banner indicates stale preview after a save (“Preview is out-of-date”). Auto-rebuild can be toggled on later.
* Editor integration (routing)
    * EditorRouter chooses:
        * .astro → Unified Layout Editor
        * .md → Content Editor
    * Both editors include the same Preview toggle to full-screen iframe. On mobile, preview opens as a full-screen sheet.
* Frontmatter modal (unified UX)
    * One simple modal translates layman fields (title, description, etc.) to frontmatter. It’s invoked from both editors.
    * No deep layout controls in 5.2; those come in 5.3.
* Future channel (no work now, just an interface)
    * postMessage bridge stub between iframe and editor, so 5.3 can live-update safe sections (text/colors) without a rebuild.
Acceptance criteria
* Opening an .astro file shows the unified visual editor and a Preview button that opens a full-screen, frameless iframe with the actual built page.
* After saving a file, a “Preview is out-of-date” notice appears; clicking “Rebuild Preview” triggers the GitHub workflow, shows progress, and refreshes the iframe when done.
* Mapping from src/pages path → /preview route matches Astro’s routing (index → directory route, strip extensions).
* On mobile, preview occupies the whole screen and is easy to exit.
Open confirmations (to finalize config)
* Preview base URL: Is the preview served from the same host as the live site (e.g., https://strategycontent.agency/preview) or from another domain? If different, provide PREVIEW_BASE_URL so we point the iframe correctly.
* Build behavior: Do you want “Auto Rebuild after Save” as a toggle (default off in 5.2)?
* Navigation from preview: Should links clicked in the preview iframe stay inside /preview (same tab) or open in a new tab? Default will be same iframe to preserve context.
Risks and mitigations
* Build latency frustrates users
    * Mitigation: clear progress UI, optimistic “Rebuild started” feedback, and a visible timestamp of last successful preview. 5.3 adds in-iframe small updates to reduce rebuild frequency.
* Route mismatch edge cases
    * Mitigation: unit-test pathToPreviewRoute for common patterns (index files, nested dirs, md vs astro).
What I need from you
* The base URL for the preview (confirm it’s “/preview” on production domain, or provide a full PREVIEW_BASE_URL).
* Your preference on default Auto Rebuild (off for 5.2?).
If you confirm the above, I’ll proceed to:
* Implement the PreviewPane (full-screen iframe) and PreviewController (trigger + poll + reload).
* Wire EditorRouter for the unified .astro editor and the existing content editor for .md.
* Add the pathToPreviewRoute helper with robust mapping and tests.
* Add the “stale preview” banner post-save.
Once deployed, we’ll immediately roll into 5.3 to add live controls and the injection channel.

I am in full agreement with the copilot's plan for Sprint 5.2. It's a great path forward.
I just need your answers to the three "Open confirmations" before I create the final plan and begin working:
1. Preview Base URL: What is the base URL for the preview? (/preview or a different domain?)
2. Auto Rebuild: Should "Auto Rebuild after Save" be off by default for this sprint?
3. Preview Navigation: Should links clicked inside the preview iframe navigate within the same iframe, or open in a new tab?
Today 20:16 
Since it produces the preview file here src/ I think but easier to find out is to trigger a preview build and I give you the exact location base on where it is in Cloudflare 2. It was previously discussed we can trigger earlier like on page creation then again when user updates layout or adds something more than text. Then we inject changes as user makes them and run a true preview when user pauses for 30 or more seconds it takes about 37 seconds to build from what I’ve seen and a simple indicator in header can say last updated…minute ago or updating. 3 good question in iframe I think but I’m not sure if iframe will have a back button
Jules says: Great—here are clear decisions and a tight plan for Sprint 5.2 (live preview with a real Astro build in a frameless, full-screen iframe), aligned with your “unified .astro editor” direction.
Decisions (my recommendations)
1. Preview Base URL
* Default: /preview
* Configurable override: VITE_PREVIEW_BASE_URL (full origin allowed, e.g., https://strategycontent.agency/preview)
* Rationale: Your build-preview workflow commits output to public/preview, which is served at /preview on the production site. We’ll make the base configurable and add a small “probe” fallback later if needed.
1. Auto Rebuild after Save (default OFF)
* Default OFF for 5.2 to keep it predictable.
* Add Smart triggers (opt-in toggle in Settings) in 5.2:
    * Auto-trigger on page creation
    * Auto-trigger on “layout-affecting” saves (i.e., .astro files or non-trivial frontmatter changes)
    * Idle trigger after 30 seconds without further edits
* Show “Preview is out of date” banner post-save with a prominent “Rebuild preview” button.
1. Preview Navigation (inside the iframe)
* Navigate within the same iframe.
* If same-origin with preview, show Back/Forward controls and “Copy preview URL.” If cross-origin, hide Back/Forward and show “Open in new tab” + “Reset to current page.”
* Rationale: Same-origin allows us to drive iframe history. Cross-origin blocks history control, so we degrade gracefully.
Implementation plan (5.2)
* Preview pane (full-screen iframe)
    * Map src/pages path to preview URL:
        * src/pages/index.astro → ${PREVIEW_BASE}/
        * src/pages/about.astro → ${PREVIEW_BASE}/about
        * src/pages/discover/my-page.md → ${PREVIEW_BASE}/discover/my-page
    * Configurable base via import.meta.env.VITE_PREVIEW_BASE_URL (default /preview)
* Preview controller
    * “Rebuild preview” → POST /api/trigger-build → poll /api/build-status → refresh iframe on success
    * “Stale preview” banner after saves
    * Optional “Smart auto-rebuild” toggle:
        * Fire on page creation
        * Fire on layout-affecting saves
        * Fire on 30s idle
* Editor routing (unified)
    * .astro → Unified Layout Editor (marker-based visual zones)
    * .md → Content Editor (same preview experience)
    * Both use the same PreviewPane component
* UX
    * Header indicator: “Last built: 1m ago” and “Updating…” during builds
    * Mobile: preview opens full-screen; easy “Close Preview” control
Two small files to add (foundation)
export function getPreviewBase(): string {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/+$/, '');
  return '/preview'; // default
}

// src/pages/foo/bar.(astro|md) => /preview/foo/bar
// index.(astro|md) maps to directory root: /preview/foo/
export function pathToPreviewRoute(filePath: string): string {
  const base = getPreviewBase();
  if (!filePath?.startsWith('src/pages/')) return base;
  let withoutPrefix = filePath.slice('src/pages/'.length);
  // strip extension
  withoutPrefix = withoutPrefix.replace(/\.(astro|md)x?$/i, '');
  // index → directory root
  if (withoutPrefix.endsWith('/index')) {
    return `${base}/${withoutPrefix.slice(0, -('/index'.length))}`.replace(/\/+$/, '/') || `${base}/`;
  }
  return `${base}/${withoutPrefix}`.replace(/\/+$/, '');
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { getPreviewBase, pathToPreviewRoute } from '../utils/previewRoute';

export default function PreviewPane({ filePath, stale, onRebuild, building, builtAtISO, sameOriginHint }) {
  const iframeRef = useRef(null);
  const [canNavigate, setCanNavigate] = useState(false);
  const src = useMemo(() => pathToPreviewRoute(filePath), [filePath]);

  useEffect(() => {
    try {
      const previewOrigin = new URL(src, window.location.origin).origin;
      setCanNavigate(sameOriginHint ?? (previewOrigin === window.location.origin));
    } catch {
      setCanNavigate(false);
    }
  }, [src, sameOriginHint]);

  const reload = () => { iframeRef.current?.contentWindow?.location?.reload(); };
  const goBack = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.back(); };
  const goForward = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.forward(); };
  const openNewTab = () => window.open(src, '_blank', 'noopener,noreferrer');

  const lastBuiltText = builtAtISO ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    .format(Math.round((new Date(builtAtISO).getTime() - Date.now()) / 60000), 'minute') : '';

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <header className="flex items-center gap-2 p-2 bg-white shadow">
        <span className="font-semibold">Preview</span>
        {building ? <span className="text-amber-600">Updating…</span> : (builtAtISO && <span className="text-gray-500">Last built {lastBuiltText}</span>)}
        {stale && !building && (
          <button className="ml-auto px-3 py-1 rounded bg-blue-600 text-white" onClick={onRebuild}>Rebuild preview</button>
        )}
        {!stale && <div className="ml-auto" />}
        <div className="flex items-center gap-2">
          {canNavigate ? (
            <>
              <button className="px-2 py-1 border rounded" onClick={goBack}>Back</button>
              <button className="px-2 py-1 border rounded" onClick={goForward}>Forward</button>
            </>
          ) : (
            <button className="px-2 py-1 border rounded" onClick={openNewTab}>Open in new tab</button>
          )}
          <button className="px-2 py-1 border rounded" onClick={reload}>Reload</button>
          <button className="px-2 py-1 border rounded" onClick={() => window.history.back()}>Close</button>
        </div>
      </header>
      <iframe
        ref={iframeRef}
        src={src}
        title="Live Preview"
        className="flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
Next steps (once you confirm)
* Set VITE_PREVIEW_BASE_URL if preview is on another origin (e.g., https://strategycontent.agency/preview). If not set, we default to /preview.
* I’ll wire PreviewPane into both editors, add the “stale preview” banner and the Rebuild flow using /api/trigger-build and /api/build-status.
* I’ll add Smart Auto-Rebuild toggle in Settings and ship the on-create + layout-save + 30s idle triggers as optional in 5.2.
Open confirmations (final)
* Preview base: Use /preview by default and expose VITE_PREVIEW_BASE_URL for overrides? If you already know the full URL, I’ll set it now.
* Auto Rebuild default: OFF (with Smart Auto as an opt-in toggle in 5.2)?
* Preview navigation: Navigate inside iframe; show Back/Forward only when same-origin; otherwise show “Open in new tab.”

Thank you here copilot review: Fantastic progress. The Sprint 5.2 deliverable (real Astro preview in a full-screen iframe + build integration) is exactly what we needed for a layman-friendly, accurate preview.
Here are my confirmations, defaults, and a short punch list to make this rock-solid and future-proof without changing your direction.
Final confirmations (based on your inputs)
* Preview Base URL
    * Default to /preview.
    * Keep a configurable override via VITE_PREVIEW_BASE_URL so we can point to a different origin if Cloudflare serves preview elsewhere.
    * Action: after a build, confirm the actual preview origin. If it’s not same-origin, we’ll still work—just switch to “Open in new tab” controls when cross-origin.
* Auto Rebuild after Save
    * Default OFF.
    * Smart Auto-Rebuild toggle (already added) is perfect: trigger on page creation, layout-affecting saves, and 30s idle.
* Preview Navigation
    * Navigate inside the iframe.
    * Show Back/Forward only when same-origin (iframe history accessible). If cross-origin, show “Open in new tab” and “Reload”.
    * Reassurance: the iframe header in the editor provides back/forward controls; you don’t need the website’s back button.
High-impact improvements to land now
1. Cache-busting on iframe refresh
* Add ?build=<run_id or timestamp> to the preview URL when reloading after a successful build to avoid stale Cloudflare caches.
import { useEffect, useMemo, useRef, useState } from 'react';
import { pathToPreviewRoute } from '../utils/previewRoute';

export default function PreviewPane({ filePath, stale, onRebuild, building, builtAtISO, lastRunId, sameOriginHint }) {
  const iframeRef = useRef(null);
  const [canNavigate, setCanNavigate] = useState(false);

  // Base route derived from file path
  const baseSrc = useMemo(() => pathToPreviewRoute(filePath), [filePath]);

  // Cache-bust key: prefer the run id; fallback to timestamp
  const cacheKey = lastRunId ? `build=${encodeURIComponent(lastRunId)}` : `t=${Date.now()}`;

  // Compose final src with cache-busting when building is done or when user reloads
  const src = useMemo(() => {
    const u = new URL(baseSrc, window.location.origin);
    // Only add cache-busting when not currently building (prevents thrash during polling)
    if (!building) {
      u.searchParams.set('v', cacheKey);
    }
    return u.toString();
  }, [baseSrc, building, cacheKey]);

  useEffect(() => {
    try {
      const previewOrigin = new URL(src, window.location.origin).origin;
      setCanNavigate(sameOriginHint ?? (previewOrigin === window.location.origin));
    } catch {
      setCanNavigate(false);
    }
  }, [src, sameOriginHint]);

  const reload = () => { iframeRef.current?.contentWindow?.location?.reload(); };
  const goBack = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.back(); };
  const goForward = () => { if (canNavigate) iframeRef.current?.contentWindow?.history?.forward(); };
  const openNewTab = () => window.open(src, '_blank', 'noopener,noreferrer');

  const lastBuiltText = builtAtISO
    ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
        .format(Math.round((new Date(builtAtISO).getTime() - Date.now()) / 60000), 'minute')
    : '';

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <header className="flex items-center gap-2 p-2 bg-white shadow">
        <span className="font-semibold">Preview</span>
        {building ? <span className="text-amber-600">Updating…</span> : (builtAtISO && <span className="text-gray-500">Last built {lastBuiltText}</span>)}
        {stale && !building && (
          <button className="ml-auto px-3 py-1 rounded bg-blue-600 text-white" onClick={onRebuild}>Rebuild preview</button>
        )}
        {!stale && <div className="ml-auto" />}
        <div className="flex items-center gap-2">
          {canNavigate ? (
            <>
              <button className="px-2 py-1 border rounded" onClick={goBack}>Back</button>
              <button className="px-2 py-1 border rounded" onClick={goForward}>Forward</button>
            </>
          ) : (
            <button className="px-2 py-1 border rounded" onClick={openNewTab}>Open in new tab</button>
          )}
          <button className="px-2 py-1 border rounded" onClick={reload}>Reload</button>
          <button className="px-2 py-1 border rounded" onClick={() => window.history.back()}>Close</button>
        </div>
      </header>
      <iframe
        ref={iframeRef}
        src={src}
        title="Live Preview"
        className="flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
2. Match the correct workflow run
* GitHub’s dispatch API doesn’t return a run id. To avoid picking an older run, record the “triggeredAt” time and, while polling, select the newest workflow_run whose created_at >= triggeredAt and event === workflow_dispatch. Pass that run.id into PreviewPane as lastRunId so we can cache-bust with it.
3. Route mapping edge cases (unit tests)
* Ensure the helper handles:
    * /src/pages/index.astro → /preview/
    * /src/pages/about.astro → /preview/about
    * /src/pages/blog/index.md → /preview/blog/
    * /src/pages/Discover/Intro.md → /preview/Discover/Intro (case preserved; optional lowercasing if desired)
    * Filenames with spaces (encode as /preview/my%20page)
* If not already, add tests for these patterns.
export function getPreviewBase(): string {
  const fromEnv = import.meta.env?.VITE_PREVIEW_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/+$/, '');
  return '/preview';
}

// src/pages/foo/bar.(astro|md) => /preview/foo/bar
// index.(astro|md) => directory route: /preview/foo/
export function pathToPreviewRoute(filePath: string): string {
  const base = getPreviewBase();
  if (!filePath?.startsWith('src/pages/')) return `${base}/`;
  let p = filePath.slice('src/pages/'.length);
  p = p.replace(/\.(astro|md)x?$/i, '');

  if (p === 'index') return `${base}/`;
  if (p.endsWith('/index')) {
    const dir = p.slice(0, -('/index'.length));
    return `${base}/${dir}`.replace(/\/+$/, '/') || `${base}/`;
  }
  // Ensure no double slashes, and leave off trailing slash for leaf pages
  return `${base}/${p}`.replace(/\/{2,}/g, '/');
}
4. Polling behavior and throttling
* Backoff: poll every 2s initially, then 4s, up to 10s. Stop on completed/failed/cancelled.
* Throttle “Rebuild” to avoid storming Actions: disable button while building and enforce a minimum 30–45s between triggers (your 37s build time is a good reference).
* If build fails: show error details (from /api/build-status) and keep the last good preview.
5. Same-origin detection and iframe controls
* You already handle this: when preview is same-origin, enable Back/Forward. If not, show “Open in new tab.”
* If you ever point PREVIEW_BASE to a different domain, ensure that domain allows embedding (no X-Frame-Options: DENY). Same-origin is the most seamless.
6. Smart Auto-Rebuild logic (already present)
* Good triggers:
    * On page creation
    * On layout-affecting save (.astro or major frontmatter)
    * On 30s idle
* Coalesce multiple edits: one build after the idle window rather than many small ones.
Minimal QA checklist
* Rebuild on new page: creates preview route and opens correctly (index and nested).
* Save a .astro layout: “Preview is out of date” banner appears; “Rebuild” kicks off, updates Last built … in ~37s, iframe refreshes with cache-bust.
* Throttling: user can’t trigger multiple builds rapidly; queued clicks are ignored.
* Cross-origin: if preview base is remote, Back/Forward are hidden; “Open in new tab” works.
* Large repos/slow builds: polling backoff works; no UI freeze.
What I still need from you (one-liners)
* If you know the preview origin already, provide it for VITE_PREVIEW_BASE_URL (otherwise we run with /preview and adjust once you confirm).
* Confirm Smart Auto-Rebuild remains opt-in (default OFF) for 5.2. Your current implementation matches this—good.
Next (5.3) at a glance
* Add visual controls (text, colors, spacing) to your unified .astro editor and push small, safe visual changes into the iframe via a postMessage bridge (no rebuild) while keeping the “true build” on idle or explicit rebuild.
* Frontmatter modal (layman → technical translation) shared by both .astro and .md editors.
If you want, you can also add:
* A tiny “Build Info” drawer (run id, status, duration, commit sha) to help you debug builds.
* A smoke test page that links to several preview routes to verify your mapping on CI.

