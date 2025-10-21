import type { LayoutBlueprint, HeadNode, BodyNode, PropSpec } from "./types";

const re = {
  blockCapture: (name: string) => new RegExp(
    name === "imports" || name === "props"
      ? `/*\\s*editor:region\\s+name="${name}"\\s*\\*/([\\s\\S]*?)\\/\\*\\s*\\/editor:region\\s*\\*/`
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
