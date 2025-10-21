export function validateAstroLayout(content: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!/<!DOCTYPE html>/i.test(content)) errors.push("Missing <!DOCTYPE html>.");
  if (!/<html[\s>]/i.test(content)) errors.push("Missing <html>.");
  if (!/<head[\s>]/i.test(content)) errors.push("Missing <head>.");
  if (!/<body[\s>]/i.test(content)) errors.push("Missing <body>.");

  // Exactly one slot overall
  const slotOverall = (content.match(/<slot(?:\s[^>]*)?\/>/g) || []).length;
  if (slotOverall !== 1) errors.push(`Layout must contain exactly one <slot /> (found ${slotOverall}).`);

  // Slot must appear inside the content-slot markers
  const contentSlotBlock =
    content.match(/<!--\s*editor:content-slot[^>]*-->([\s\S]*?)<!--\s*\/editor:content-slot\s*-->/i)?.[1] ?? "";
  const slotInside = /<slot(?:\s[^>]*)?\/>/i.test(contentSlotBlock);
  if (!slotInside) errors.push("The <slot /> must be inside the editor:content-slot markers.");

  // Prevent nested html/head/body tags inside editable regions
  const headRegion = content.match(/<!--\s*editor:region\s+name="head"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";
  const preRegion = content.match(/<!--\s*editor:region\s+name="pre-content"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";
  const postRegion = content.match(/<!--\s*editor:region\s+name="post-content"[\s\S]*?<!--\s*\/editor:region\s*-->/i)?.[0] ?? "";

  for (const tag of ["</?html", "</?head", "</?body"]) {
    const rx = new RegExp(`${tag}\\b`, "i");
    if (rx.test(headRegion) || rx.test(preRegion) || rx.test(postRegion)) {
      errors.push(`Forbidden tag ${tag} detected inside editable regions.`);
      break;
    }
  }

  return { ok: errors.length === 0, errors };
}
