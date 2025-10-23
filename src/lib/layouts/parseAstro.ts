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

const contentSlotRe =
  /<!--\s*editor:content-slot[^>]*-->\s*<slot(?:\s[^>]*)?\/>\s*<!--\s*\/editor:content-slot\s*-->/ms;

const htmlTagRe = /<html([^>]*)>/m;
const htmlAttrRe = /([^\s=]+)=["']([^"']*)["']/g;

function extract(content: string, name: string): string | null {
  const isTS = name === "imports" || name === "props";
  const rx = isTS ? commentBlockTS(name) : commentBlockHTML(name);
  const m = content.match(rx);
  return m ? m[1].trim() : null;
}

function extractPropsJSONText(content: string): string | null {
  const insideOpenComment = content.match(
    /\/\*\s*editor:region\s+name="props"[^\S\r\n]*\n([\s\S]*?)\*\/\s*\/\*\s*\/editor:region\s*\*\//m
  );
  if (insideOpenComment && insideOpenComment[1]?.trim()) {
    return insideOpenComment[1].trim();
  }
  return extract(content, "props");
}

function parseImports(importsBlock: string | null): { as: string; from: string }[] {
  if (!importsBlock) return [];
  return importsBlock
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["'];?$/);
      return m ? { as: m[1], from: m[2] } : null;
    })
    .filter((x): x is { as: string; from: string } => !!x);
}

function parsePropsJSON(propsText: string | null): Record<string, PropSpec> {
  if (!propsText) return {};
  try {
    return JSON.parse(propsText.trim());
  } catch {
    return {};
  }
}

function parsePropsFromDestructure(content: string): Record<string, PropSpec> {
  const out: Record<string, PropSpec> = {};
  const m = content.match(/const\s*\{\s*([^}]*)\s*\}\s*=\s*Astro\.props\s*;/ms);
  if (!m) return out;
  const inner = m[1];
  const parts = inner.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const mm = part.match(/^([A-Za-z_$][\w$]*)\s*(?:=\s*([\s\S]+))?$/);
    if (!mm) continue;
    const name = mm[1];
    const rawDefault = (mm[2] ?? "").trim().replace(/,+\s*$/, "");
    if (!rawDefault) {
      out[name] = { type: "string", default: null };
      continue;
    }
    if (/^["'`](.*)["'`]$/.test(rawDefault)) {
      out[name] = { type: "string", default: rawDefault.slice(1, -1) };
    } else if (/^(true|false)$/i.test(rawDefault)) {
      out[name] = { type: "boolean", default: /^true$/i.test(rawDefault) };
    } else if (/^-?\d+(\.\d+)?$/.test(rawDefault)) {
      out[name] = { type: "number", default: Number(rawDefault) };
    } else {
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

// Resiliently find regions, either by marker or by tag inference
function findRegions(content: string): { head: HeadNode[], pre: BodyNode[], post: BodyNode[] } {
  const headRaw = extract(content, "head");
  const preRaw = extract(content, "pre-content");
  const postRaw = extract(content, "post-content");

  if (headRaw !== null && preRaw !== null && postRaw !== null) {
    return {
      head: [{ type: "raw", html: headRaw }],
      pre: [{ type: "raw", html: preRaw }],
      post: [{ type: "raw", html: postRaw }],
    };
  }

  // Fallback: Infer from raw HTML structure
  const headMatch = content.match(/<head>([\s\S]*?)<\/head>/m);
  const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/m);
  const slotMatch = bodyMatch ? bodyMatch[1].match(/<slot\s*\/>/m) : null;

  const inferredHead = headMatch ? headMatch[1].trim() : "";
  let inferredPre = "", inferredPost = "";
  if (bodyMatch && slotMatch && typeof slotMatch.index === 'number') {
    inferredPre = bodyMatch[1].slice(0, slotMatch.index).trim();
    inferredPost = bodyMatch[1].slice(slotMatch.index + slotMatch[0].length).trim();
  }

  return {
    head: [{ type: "raw", html: inferredHead }],
    pre: [{ type: "raw", html: inferredPre }],
    post: [{ type: "raw", html: inferredPost }],
  };
}

export function parseAstroToBlueprint(content: string): LayoutBlueprint | null {
  const hasSlotTag = /<slot\s*\/>/m.test(content);
  if (!hasSlotTag) return null; // A layout must have a slot

  const hasMarkers = contentSlotRe.test(content);

  const imports = parseImports(extract(content, "imports"));
  const propsFromJSON = parsePropsJSON(extractPropsJSONText(content));
  const propsFromDestructure = parsePropsFromDestructure(content);
  const props: Record<string, PropSpec> = { ...propsFromDestructure, ...propsFromJSON };

  const htmlAttrs = parseHtmlAttrs(content);
  const { head, pre, post } = findRegions(content);

  return {
    name: "Unknown",
    htmlAttrs,
    imports,
    props,
    head: head,
    preContent: pre,
    contentSlot: { name: "Content", single: true },
    postContent: post,
  };
}
