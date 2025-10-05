/**
 * Parses a string of file content to separate the frontmatter from the body.
 * Frontmatter is expected to be enclosed in `---` delimiters at the start of the file.
 * This function is designed to be robust against different newline characters and file endings.
 * @param {string} content The raw content of the file.
 * @returns {{frontmatter: string, body: string}} An object containing the frontmatter and body.
 */
export function parseContent(content) {
  // Normalize newlines to \n for consistent parsing
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const lines = normalizedContent.split('\n');

  // Check for the opening '---' on the first line
  if (lines[0].trim() !== '---') {
    return { frontmatter: '', body: content };
  }

  // Find the closing '---'
  let endOfFrontmatter = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endOfFrontmatter = i;
      break;
    }
  }

  if (endOfFrontmatter > 0) {
    const frontmatter = lines.slice(0, endOfFrontmatter + 1).join('\n');
    const body = lines.slice(endOfFrontmatter + 1).join('\n');
    return { frontmatter, body };
  }

  // If no closing delimiter is found, assume the file has no frontmatter.
  return { frontmatter: '', body: content };
}

/**
 * Reconstructs the full file content from its frontmatter and body parts.
 * @param {string} frontmatter The frontmatter section.
 * @param {string} body The body section.
 * @returns {string} The full file content.
 */
export function reconstructContent(frontmatter, body) {
  if (!frontmatter) {
    return body;
  }
  // Ensure the frontmatter ends with a single newline before joining with the body.
  return `${frontmatter.trimEnd()}\n${body}`;
}