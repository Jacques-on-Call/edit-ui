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
  const rx = isTS ? new RegExp(String.raw`/\*\s*editor:region\s+name="${name}"\s*\*/([\s\S]*?)\/\*\s*\/editor:region\s*\*/`, "s") : commentBlockHTML(name);
  const m = content.match(rx);
  return m ? m[1].trim() : null;
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

function parsePropsJSON(propsBlock: string | null): Record<string, PropSpec> {
  if (!propsBlock) return {};
  try {
    return JSON.parse(propsBlock.trim());
  } catch {
    return {};
  }
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
  const props = parsePropsJSON(extract(content, "props"));
  const htmlAttrs = parseHtmlAttrs(content);

  const headRaw = extract(content, "head") ?? "";
  const preRaw = extract(content, "pre-content") ?? "";
  const postRaw = extract(content, "post-content") ?? "";

  const head: HeadNode[] = headRaw ? [{ type: "raw", html: headRaw }] : [];
  const preContent: BodyNode[] = preRaw ? [{ type: "raw", html: preRaw }] : [];
  const postContent: BodyNode[] = postRaw ? [{ type: "raw", html: postRaw }] : [];

  return {
    name: "Unknown", // derive from filename in UI if needed
    htmlAttrs,
    imports,
    props,
    head,
    preContent,
    contentSlot: { name: "Content", single: true },
    postContent,
  };
}
