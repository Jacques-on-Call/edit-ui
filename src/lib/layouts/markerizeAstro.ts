/* Small helper to add editor markers to legacy Astro layouts, non-destructively. */
export type MarkerizeReport = {
  changed: boolean;
  added: {
    imports: boolean;
    props: boolean;
    head: boolean;
    contentSlot: boolean;
    preContent: boolean;
    postContent: boolean;
  };
  warnings: string[];
};

export function markerizeAstro(input: string): { content: string; report: MarkerizeReport } {
  let content = input;
  const warnings: string[] = [];
  const added = {
    imports: false,
    props: false,
    head: false,
    contentSlot: false,
    preContent: false,
    postContent: false,
  };

  // Quick exits / checks
  const hasAnyMarkers =
    /editor:region|editor:content-slot/.test(content);
  // We still proceed to add any missing markers; idempotent where possible.

  // Basic sanity checks
  if (!/<!DOCTYPE html>/i.test(content) || !/<html[\s>]/i.test(content) || !/<head[\s>]/i.test(content) || !/<body[\s>]/i.test(content)) {
    warnings.push("File does not appear to be a full HTML document with <!DOCTYPE>, <html>, <head>, and <body>.");
  }

  // Split frontmatter (Astro script) if present
  const fmMatch = [...content.matchAll(/^---\s*$/gm)];
  let fmStart = -1, fmEnd = -1;
  if (fmMatch.length >= 2) {
    fmStart = fmMatch[0].index!;
    fmEnd = fmMatch[1].index!;
  }
  const hasFrontmatter = fmStart !== -1 && fmEnd !== -1;
  let beforeFM = "", frontmatter = "", afterFM = content;
  if (hasFrontmatter) {
    beforeFM = content.slice(0, fmStart);
    frontmatter = content.slice(fmStart, fmEnd + 3); // include closing ---
    afterFM = content.slice(fmEnd + 3);
  }

  // Helpers
  const hasImportsRegion = /\/\*\s*editor:region\s+name="imports"\s*\*\//.test(frontmatter);
  const hasPropsRegion = /\/\*\s*editor:region\s+name="props"\s*\*/.test(frontmatter);

  // 1) Imports region (frontmatter)
  if (hasFrontmatter && !hasImportsRegion) {
    // Find all top-level import lines in the frontmatter block (between --- ... ---)
    const fmInner = frontmatter.replace(/^---\s*\n?/, "").replace(/\n?---\s*$/, "");
    const lines = fmInner.split("\n");
    let first = -1, last = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/.test(lines[i])) {
        if (first === -1) first = i;
        last = i;
      }
    }
    if (first !== -1) {
      const before = lines.slice(0, first).join("\n");
      const imports = lines.slice(first, last + 1).join("\n");
      const after = lines.slice(last + 1).join("\n");
      const wrapped =
`/* editor:region name="imports" */
${imports}
/* /editor:region */`;
      const fmNewInner = [before, wrapped, after].filter(Boolean).join("\n").replace(/^\n+|\n+$/g, "\n");
      frontmatter = `---\n${fmNewInner}\n---`;
      added.imports = true;
    }
  }

  // 2) Props region (frontmatter) — build JSON from destructure if present
  if (hasFrontmatter && !hasPropsRegion) {
    const fmInner = frontmatter.replace(/^---\s*\n?/, "").replace(/\n?---\s*$/, "");
    const destructureMatch = fmInner.match(/const\s*\{\s*([^}]*)\s*\}\s*=\s*Astro\.props\s*;/ms);
    let propsJSON = "{}";

    if (destructureMatch) {
      const props = parsePropsFromDestructureInner(destructureMatch[1]);
      try {
        propsJSON = JSON.stringify(props);
      } catch {
        propsJSON = "{}";
        warnings.push("Failed to serialize props JSON from destructure; inserted empty props region.");
      }
    } else {
      // No destructure found; insert an empty props JSON so the editor has a place to store props.
      warnings.push("No Astro.props destructuring found; inserting empty props region.");
    }

    const propsBlock =
`/* editor:region name="props"
${propsJSON}
*/
/* /editor:region */`;

    if (destructureMatch) {
      // Insert props block right after the destructure statement
      const insertAt = frontmatter.indexOf(destructureMatch[0]) + destructureMatch[0].length;
      frontmatter = frontmatter.slice(0, insertAt) + "\n" + propsBlock + "\n" + frontmatter.slice(insertAt);
    } else {
      // Append props block at the end of frontmatter inner
      const fmInnerEnd = frontmatter.lastIndexOf("---");
      frontmatter = frontmatter.slice(0, fmInnerEnd) + propsBlock + "\n" + frontmatter.slice(fmInnerEnd);
    }
    added.props = true;
  }

  // 3) Head region (HTML)
  if (!/<!--\s*editor:region\s+name="head"\s*-->/.test(content)) {
    content = (hasFrontmatter ? beforeFM + frontmatter + afterFM : content);
    content = content.replace(
      /<head([^>]*)>([\s\S]*?)<\/head>/m,
      (_full, attrs, inner) => {
        const already = /<!--\s*editor:region\s+name="head"\s*-->/.test(inner);
        if (already) return _full;
        const indent = detectIndent(inner) || "    ";
        const innerTrim = inner.replace(/^\s*\n?/, "").replace(/\n\s*$/, "");
        added.head = true;
        return `<head${attrs}>` +
               `\n${indent}<!-- editor:region name="head" -->\n` +
               `${reindent(innerTrim, indent)}\n` +
               `${indent}<!-- /editor:region -->\n</head>`;
      }
    );
    // Re-split after change
    if (hasFrontmatter) {
      afterFM = content.slice((beforeFM + frontmatter).length);
    }
  }

  // 4) Content slot wrapper
  if (!/<!--\s*editor:content-slot\b/.test(content)) {
    const slotMatch = content.match(/<slot(?:\s[^>]*)?\/>/m);
    if (slotMatch) {
      const slotIdx = slotMatch.index || 0;
      const slotIndent = getLineIndentAt(content, slotIdx);
      const before = content.slice(0, slotIdx);
      const after = content.slice(slotIdx + slotMatch[0].length);
      const wrapped =
`${slotIndent}<!-- editor:content-slot name="Content" single -->
${slotIndent}${slotMatch[0]}
${slotIndent}<!-- /editor:content-slot -->`;
      content = before + wrapped + after;
      added.contentSlot = true;
    } else {
      warnings.push("No <slot /> found to wrap with editor:content-slot.");
    }
  }

  // 5) Pre/post-content regions inside <body>…</body>
  // Extract body inner, then split around the content-slot block
  const bodyMatch = content.match(/<body([^>]*)>([\s\S]*?)<\/body>/m);
  if (bodyMatch) {
    const bodyFull = bodyMatch[0];
    const bodyAttrs = bodyMatch[1] || "";
    const bodyInner = bodyMatch[2];

    // Find content-slot block
    const slotBlockRe = /<!--\s*editor:content-slot[^>]*-->([\s\S]*?)<!--\s*\/editor:content-slot\s*-->/m;
    const slotBlockMatch = bodyInner.match(slotBlockRe);
    if (slotBlockMatch && slotBlockMatch.index !== undefined) {
      const blockStart = slotBlockMatch.index;
      const blockEnd = blockStart + slotBlockMatch[0].length;

      const pre = bodyInner.slice(0, blockStart);
      const slotBlock = slotBlockMatch[0];
      const post = bodyInner.slice(blockEnd);

      const slotIndent = detectIndent(slotBlock) || "    ";

      const preHasRegion = /<!--\s*editor:region\s+name="pre-content"\s*-->/.test(pre);
      const postHasRegion = /<!--\s*editor:region\s+name="post-content"\s*-->/.test(post);

      let preOut = pre;
      let postOut = post;

      const preTrim = pre.replace(/^\s+|\s+$/g, "");
      const postTrim = post.replace(/^\s+|\s+$/g, "");

      if (preTrim && !preHasRegion) {
        preOut =
`${slotIndent}<!-- editor:region name="pre-content" -->
${reindent(preTrim, slotIndent)}
${slotIndent}<!-- /editor:region -->
`;
        added.preContent = true;
      }
      if (postTrim && !postHasRegion) {
        postOut =
`\n${slotIndent}<!-- editor:region name="post-content" -->
${reindent(postTrim, slotIndent)}
${slotIndent}<!-- /editor:region -->`;
        added.postContent = true;
      }

      const bodyInnerNew = [preOut, slotBlock, postOut].join("").replace(/\s+$/, "\n");
      const bodyNew = `<body${bodyAttrs}>${bodyInnerNew}</body>`;
      content = content.replace(bodyFull, bodyNew);
    } else {
      warnings.push("Could not locate the editor:content-slot block inside <body>.");
    }
  } else {
    warnings.push("No <body> element found.");
  }

  // Stitch frontmatter back if we didn’t update after step 3
  if (hasFrontmatter && !/<!--\s*editor:region\s+name="head"\s*-->/.test(afterFM)) {
    content = beforeFM + frontmatter + afterFM;
  }

  const changed = Object.values(added).some(Boolean);
  return { content, report: { changed, added, warnings } };
}

/* ========== helpers ========== */

function parsePropsFromDestructureInner(inner: string): Record<string, { type: "string" | "number" | "boolean"; default?: any }> {
  const out: Record<string, { type: "string" | "number" | "boolean"; default?: any }> = {};
  // Split on commas (heuristic)
  const parts = inner.split(",").map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^([A-Za-z_$][\w$]*)\s*(?:=\s*([\s\S]+))?$/);
    if (!m) continue;
    const name = m[1];
    const raw = (m[2] ?? "").trim().replace(/,+\s*$/, ""); // trim trailing comma
    if (!raw) { out[name] = { type: "string", default: null }; continue; }
    if (/^["'`](.*)["'`]$/.test(raw)) { out[name] = { type: "string", default: raw.slice(1, -1) }; continue; }
    if (/^(true|false)$/i.test(raw)) { out[name] = { type: "boolean", default: /^true$/i.test(raw) }; continue; }
    if (/^-?\d+(\.\d+)?$/.test(raw)) { out[name] = { type: "number", default: Number(raw) }; continue; }
    if (/^null$/i.test(raw)) { out[name] = { type: "string", default: null }; continue; }
    // Unknown expression: keep as string type with null default so it’s representable
    out[name] = { type: "string", default: null };
  }
  return out;
}

function detectIndent(block: string): string {
  // Find indent of first non-empty line
  const m = block.match(/^[ \t]*/m);
  return m ? m[0] : "";
}

function reindent(text: string, indent: string): string {
  // Trim leading/trailing blank lines, then indent each line
  const trimmed = text.replace(/^\s*\n/, "").replace(/\n\s*$/, "");
  return trimmed.split("\n").map(l => indent + l.replace(/^\s*/, "")).join("\n");
}

function getLineIndentAt(str: string, index: number): string {
  const start = str.lastIndexOf("\n", index - 1) + 1;
  const upto = str.slice(start, index);
  const m = upto.match(/^[ \t]*/);
  return m ? m[0] : "";
}
