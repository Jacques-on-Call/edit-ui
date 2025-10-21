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
