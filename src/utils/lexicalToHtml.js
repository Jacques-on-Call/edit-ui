// easy-seo/src/utils/lexicalToHtml.js

/**
 * Processes a single Lexical node and converts it to an HTML string.
 * @param {object} node - The Lexical node to process.
 * @returns {string} The resulting HTML string.
 */
function processNode(node) {
  if (node.type === 'text') {
    let text = node.text || '';

    // NORMALIZE QUOTES: Fixes BUG-001-251230
    text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

    // Apply formatting
    if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
    if (node.format & 2) text = `<em>${text}</em>`;   // Italic

    return text;
  }

  if (node.type === 'heading' || node.type === 'paragraph') {
    const tag = node.type === 'heading' ? `h${node.tag.slice(1)}` : 'p';
    const childrenHtml = node.children ? node.children.map(processNode).join('') : '';
    return `<${tag}>${childrenHtml}</${tag}>`;
  }

  // Fallback for unknown nodes
  return '';
}

/**
 * Converts a Lexical JSON state to an HTML string.
 * @param {object} lexicalState - The Lexical JSON object from the editor.
 * @returns {string} The rendered HTML.
 */
export function lexicalToHtml(lexicalState) {
  if (!lexicalState || !lexicalState.root || !lexicalState.root.children) {
    return '';
  }
  return lexicalState.root.children.map(processNode).join('');
}
