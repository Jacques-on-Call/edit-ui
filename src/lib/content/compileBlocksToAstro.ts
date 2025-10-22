import { BLOCKS } from "../../blocks/registry";
import type { BlockNode, ContentBlueprint } from "./types";

const blockMap = new Map(BLOCKS.map((b) => [b.name, b]));

function renderProps(props?: Record<string, any>): string {
  if (!props) return "";
  const entries = Object.entries(props)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => {
      if (typeof v === "string") return `${k}="${String(v).replace(/"/g, "&quot;")}"`;
      return `${k}={${JSON.stringify(v)}}`;
    });
  return entries.length ? " " + entries.join(" ") : "";
}

function collectUsed(node: BlockNode, set: Set<string>) {
  if (node.type !== "root") set.add(node.type);
  for (const child of node.children ?? []) collectUsed(child, set);
}

function renderNode(node: BlockNode, indent = "  "): string {
  if (node.type === "root") {
    return (node.children ?? []).map((c) => renderNode(c, indent)).join("\n");
  }
  const def = blockMap.get(node.type);
  if (!def) return `${indent}<!-- Unknown block: ${node.type} -->`;

  const props = renderProps(node.props);
  if (!def.allowChildren || !node.children?.length) {
    return `${indent}<${def.tag}${props} />`;
  }
  const open = `${indent}<${def.tag}${props}>`;
  const inner = node.children.map((c) => renderNode(c, indent + "  ")).join("\n");
  const close = `</${def.tag}>`;
  return `${open}\n${inner}\n${indent}${close}`;
}

export function compileBlocksToAstro(content: ContentBlueprint): string {
  const used = new Set<string>();
  collectUsed(content.root, used);
  // Stable import order for deterministic output
  const imports = [...used]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => blockMap.get(name))
    .filter(Boolean)
    .map((def) => `import ${def!.tag} from "${def!.path}";`)
    .join("\n");

  const body = renderNode(content.root).trim();

  return `---
${imports}
---

${body}
`;
}
