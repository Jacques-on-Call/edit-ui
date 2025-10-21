import type { LayoutBlueprint, HeadNode, BodyNode, PropSpec } from "./types";

const commentBlockTS = (name: string) =>
  new RegExp(
    String.raw`/\*\s*editor:region\s+name="${name}"\s*\*/([\s\S]*?)\/\*\s*\/editor:region\s*\*/`,
    "m"
  );

const commentBlockHTML = (name: string) =>
  new RegExp(
    String.raw`<!--\s*editor:region\s+name="${name}"\s*-->([\s\S]*?)<!--\s*\/editor:region\s*-->`,
    "m"
  );

// Allow attributes and whitespace on <slot ... />
const contentSlotRe =
  /<!--\s*editor:content-slot[^>]*-->\s*<slot(?:\s[^>]*)?\/>\s*<!--\s*\/editor:content-slot\s*-->/ms;

// Capture attributes from <html ...>
const htmlTagRe = /<html([^>]*)>/m;
const htmlAttrRe = /([^\s=]+)=["']([^"']*)["']/g;

function extract(content: string, name: string): string | null {
  const isTS = name === "imports" || name === "props";
  const rx = isTS
    ? new RegExp(
        String.raw`/\*\s*editor:region\s+name="${name}"\s*\*/([\s\S]*?)\/\*\s*\/editor:region\s*\*/`,
        "s"
      )
    : commentBlockHTML(name);
  const m = content.match(rx);
  return m ? m[1].trim() : null;
}

// Special extractor for props JSON: supports the current format where JSON is
// embedded inside the opening /* editor:region name="props" ... */ comment.
// Falls back to the generic "between comments" capture if needed.
function extractPropsJSONText(content: string): string | null {
  // 1) JSON inside the opening comment style:
  // /* editor:region name="props"
  // { ...json... }
  // */
  // /* /editor:region */
  const insideOpenComment = content.match(
    /\/\*\s*editor:region\s+name="props"[^\S\r\n]*\n([\s\S]*?)\*\/\s*\/\*\s*\/editor:region\s*\*\//m
  );
  if (insideOpenComment && insideOpenComment[1]?.trim()) {
    return insideOpenComment[1].trim();
  }

  // 2) Fallback to "between two comments" style (older/alternate format)
  const betweenTwoComments = extract(content, "props");
  if (betweenTwoComments && betweenTwoComments.trim()) {
    return betweenTwoComments.trim();
  }

  return null;
}

function parseImports(importsBlock: string | null) {
  if (!importsBlock) return [];
  return importsBlock
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      // import X from "path";
      const m = line.match(/^import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["'];?$/);
      return m ? { as: m[1], from: m[2] } : null;
    })
    .filter(Boolean) as { as: string; from: string }[];
}

function parsePropsJSON(propsText: string | null): Record<string, PropSpec> {
  if (!propsText) return {};
  try {
    return JSON.parse(propsText.trim());
  } catch {
    return {};
  }
}

// Fallback: infer props from destructuring const { ... } = Astro.props;
// Supports simple defaults: strings, numbers, booleans, null
function parsePropsFromDestructure(content: string): Record<string, PropSpec> {
  const out: Record<string, PropSpec> = {};
  const m = content.match(/const\s*\{\s*([^}]*)\s*\}\s*=\s*Astro\.props\s*;/ms);
  if (!m) return out;

  const inner = m[1]; // "title = \"Site\", count = 0"
  // Split on commas not inside quotes (simple heuristic)
  const parts = inner
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    // name = default OR just name
    const mm = part.match(/^([A-Za-z_$][\w$]*)\s*(?:=\s*([\s\S]+))?$/);
    if (!mm) continue;

    const name = mm[1];
    const rawDefault = (mm[2] ?? "").trim();

    if (!rawDefault) {
      out[name] = { type: "string", default: null };
      continue;
    }

    // Strip trailing commas if any (from multi-line destructure formats)
    const val = rawDefault.replace(/,+\s*$/, "");

    // Infer type
    if (/^["'`](.*)["'`]$/.test(val)) {
      // string literal
      const str = val.slice(1, -1);
      out[name] = { type: "string", default: str };
    } else if (/^(true|false)$/i.test(val)) {
      out[name] = { type: "boolean", default: /^true$/i.test(val) };
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      out[name] = { type: "number", default: Number(val) };
    } else if (/^null$/i.test(val)) {
      out[name] = { type: "string", default: null };
    } else {
      // Unknown expression -> keep, but do not set an unserializable default
      out[name] = { type: "string", default: null };
    }
  }

  return out;
}

function parseHtmlAttrs(content: string): Record<string, string> {
  const m = content.match(htmlTagRe);
  if (!m) return {};
  const raw = m[1] ?? "";
  const out: Record<string, string> = {};
  for (const match of raw.matchAll(htmlAttrRe)) {
    out[match[1]] = match[2];
  }
  return out;
}

export function parseAstroToBlueprint(content: string): LayoutBlueprint | null {
  if (!contentSlotRe.test(content)) return null;

  const imports = parseImports(extract(content, "imports"));
  const propsFromJSON = parsePropsJSON(extractPropsJSONText(content));
  const propsFromDestructure = parsePropsFromDestructure(content);

  // Merge: JSON marker is source of truth; fill missing keys from destructure
  const props: Record<string, PropSpec> = { ...propsFromDestructure, ...propsFromJSON };

  const htmlAttrs = parseHtmlAttrs(content);

  const headRaw = extract(content, "head") ?? "";
  const preRaw = extract(content, "pre-content") ?? "";
  const postRaw = extract(content, "post-content") ?? "";

  const head: HeadNode[] = headRaw ? [{ type: "raw", html: headRaw }] : [];
  const preContent: BodyNode[] = preRaw ? [{ type: "raw", html: preRaw }] : [];
  const postContent: BodyNode[] = postRaw ? [{ type: "raw", html: postRaw }] : [];

  return {
    name: "Unknown", // derive from filename in the UI
    htmlAttrs,
    imports,
    props,
    head,
    preContent,
    contentSlot: { name: "Content", single: true },
    postContent,
  };
}
