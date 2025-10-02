/**
 * A simple utility to strip HTML tags from a string.
 * @param {string} html The HTML string to sanitize.
 * @returns {string} The plain text content.
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}
