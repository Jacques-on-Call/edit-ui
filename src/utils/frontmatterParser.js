import matter from 'gray-matter';

/**
 * Parses the frontmatter from an .astro file, trying two methods:
 * 1. Standard YAML frontmatter using the `gray-matter` library.
 * 2. A custom regex for JavaScript `const meta = {}` blocks.
 *
 * @param {string} fileContent The full string content of the .astro file.
 * @returns {object} An object containing the parsed data and original content.
 *                   Example: { data: { title: '...', sections: [...] }, content: '...' }
 */
export const parseFrontmatter = (fileContent) => {
  if (!fileContent) {
    return { data: {}, content: '' };
  }

  // --- Method 1: Try parsing with gray-matter (for standard YAML) ---
  try {
    // gray-matter is smart enough to find the content between `---` fences.
    const { data, content } = matter(fileContent);
    // If gray-matter finds data, we assume it's valid YAML frontmatter.
    if (Object.keys(data).length > 0) {
      console.log("DEBUG: Parsed successfully with gray-matter (YAML).");
      return { data, content };
    }
  } catch (e) {
    // This error can be ignored if it's not YAML, as we'll try the JS parser next.
    console.log("DEBUG: gray-matter parsing failed (likely not YAML), trying JS parser.", e.message);
  }

  // --- Method 2: Try parsing for a `const meta = {}` block ---
  try {
    const frontmatterRegex = /^---([\s\S]*?)---/;
    const frontmatterMatch = fileContent.match(frontmatterRegex);
    const bodyContent = fileContent.replace(frontmatterRegex, '').trim();

    if (frontmatterMatch && frontmatterMatch[1]) {
      const frontmatterContent = frontmatterMatch[1];
      const metaRegex = /const\s+meta\s*=\s*({[\s\S]*?});/m;
      const metaMatch = frontmatterContent.match(metaRegex);

      if (metaMatch && metaMatch[1]) {
        // We found the JS block. The "data" is the meta object itself.
        // We use a function constructor for safe parsing.
        const metaObject = Function(`"use strict"; return ${metaMatch[1]}`)();
        console.log("DEBUG: Parsed successfully with custom JS parser.");
        return { data: metaObject, content: bodyContent };
      }
    }
  } catch (error) {
    console.error("DEBUG: Custom JS frontmatter parsing failed:", error);
    // Fallthrough to return default empty state
  }

  // --- Fallback ---
  console.log("DEBUG: No recognizable frontmatter found. Treating entire file as content.");
  return { data: {}, content: fileContent };
};