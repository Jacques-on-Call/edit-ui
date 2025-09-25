/**
 * Parses the content of an .astro file to extract the 'meta' object from its JavaScript frontmatter.
 * This function is designed to handle frontmatter that uses a single `const meta = { ... };` declaration.
 *
 * @param {string} fileContent The full string content of the .astro file.
 * @returns {object} The parsed 'meta' object, or an empty object if parsing fails or no meta block is found.
 */
export const parseJsFrontmatter = (fileContent) => {
  console.log('[Parser] Received content:', fileContent);
  if (!fileContent) {
    console.log('[Parser] Content is empty, returning empty object.');
    return {};
  }

  try {
    // First, extract the content between the `---` fences.
    const frontmatterRegex = /^---([\s\S]*?)---/;
    const frontmatterMatch = fileContent.match(frontmatterRegex);

    if (!frontmatterMatch || !frontmatterMatch[1]) {
      console.log("No frontmatter block found.");
      return {};
    }

    const frontmatterContent = frontmatterMatch[1];

    // Next, find the `const meta = { ... };` block within the frontmatter.
    const metaRegex = /const\s+meta\s*=\s*{([\s\S]*?)};/m;
    const metaMatch = frontmatterContent.match(metaRegex);

    if (!metaMatch || typeof metaMatch[1] === 'undefined') {
      console.log("No 'const meta' object found in frontmatter.");
      return {};
    }

    const metaBody = metaMatch[1];

    // Use the safe Function constructor method to parse the object string.
    // This is safer than eval() as it doesn't have access to the surrounding scope.
    const parsedMeta = Function(`"use strict"; return ({${metaBody}})`)();

    console.log('[Parser] Successfully parsed meta object:', parsedMeta);
    return parsedMeta;
  } catch (error) {
    console.error("[Parser] Error parsing JavaScript frontmatter:", error);
    // Return an empty object in case of a parsing error to prevent crashes.
    return {};
  }
};
