/**
 * Parses a string of file content to separate the frontmatter from the body.
 * Frontmatter is expected to be enclosed in `---` delimiters.
 * @param {string} content The raw content of the file.
 * @returns {{frontmatter: string, body: string}} An object containing the frontmatter and body.
 */
export function parseContent(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (match) {
    const frontmatter = match[0];
    const body = content.substring(frontmatter.length);
    return { frontmatter, body };
  }

  // If no frontmatter is found, assume the whole file is the body.
  return { frontmatter: '', body: content };
}

/**
 * Reconstructs the full file content from its frontmatter and body parts.
 * @param {string} frontmatter The frontmatter section.
 * @param {string} body The body section.
 * @returns {string} The full file content.
 */
export function reconstructContent(frontmatter, body) {
  // If there's no frontmatter, just return the body.
  if (!frontmatter) {
    return body;
  }

  // Ensure there's no extra space between frontmatter and body.
  return `${frontmatter.trim()}\n${body.trim()}`;
}