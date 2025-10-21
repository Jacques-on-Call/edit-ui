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
    const head = content.match(/<!--\\s*editor:region\\s+name="head"[\\s\\S]*?<!--\\s*\\/editor:region\\s*-->/i)?.[0] ?? "";
    const pre = content.match(/<!--\\s*editor:region\\s+name="pre-content"[\\s\\S]*?<!--\\s*\\/editor:region\\s*-->/i)?.[0] ?? "";
    const post = content.match(/<!--\\s*editor:region\\s+name="post-content"[\\s\\S]*?<!--\\s*\\/editor:region\\s*-->/i)?.[0] ?? "";
    if (rx.test(head) || rx.test(pre) || rx.test(post)) {
      errors.push(`Forbidden tag ${tag} detected inside editable regions.`);
      break;
    }
  }

  return { ok: errors.length === 0, errors };
}
