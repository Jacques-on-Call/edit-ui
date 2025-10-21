import type { LayoutBlueprint, HeadNode, BodyNode } from "./types";

const esc = (s: string) => s.replace(/`/g, "\\`");

function renderHead(head: HeadNode[], propsVar = "Astro.props"): string {
  return head
    .map((node) => {
      if (node.type === "meta") {
        const attrs = Object.entries(node.attrs)
          .map(([k, v]) => `${k}="${esc(String(v))}"`)
          .join(" ");
        return `    <meta ${attrs} />`;
      }
      if (node.type === "title") {
        if (node.contentFromProp) return `    <title>{${propsVar}.${node.contentFromProp}}</title>`;
        return `    <title>${esc(node.text ?? "")}</title>`;
      }
      return node.html
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n");
    })
    .join("\n");
}

function renderBody(nodes: BodyNode[], indent = "    "): string {
  return nodes
    .map((n) => {
      if (n.type === "component") {
        const props =
          n.props && Object.keys(n.props).length
            ? " " +
              Object.entries(n.props)
                .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
                .join(" ")
            : "";
        return `${indent}<${n.name}${props} />`;
      }
      return n.html
        .split("\n")
        .map((l) => `${indent}${l}`)
        .join("\n");
    })
    .join("\n");
}

export function compileAstro(bp: LayoutBlueprint): string {
  const htmlAttrs = Object.entries(bp.htmlAttrs ?? { lang: "en" })
    .map(([k, v]) => `${k}="${esc(String(v))}"`)
    .join(" ");

  const importBlock = bp.imports.map((i) => `import ${i.as} from "${i.from}";`).join("\n");
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
