/**
 * Transforms a Lexical editor state object or an array of section objects into an HTML string.
 * This function is designed to handle the data structure from the SectionsEditor.
 * @param {Object|Array} data - Either a standard Lexical editor state object { root: { ... } }
 *                             or an array of section objects, where each section may contain
 *                             a title or a Lexical state in `props.body`.
 * @returns {string} The generated HTML string.
 */
export function lexicalToHtml(data) {
  // Handles null, undefined, or empty array inputs gracefully.
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return '<p></p>';
  }

  /**
   * Processes a single node from the Lexical tree.
   * @param {Object} node - The Lexical node to process.
   * @returns {string} The HTML representation of the node.
   */
  function processNode(node) {
    if (!node) return '';

    // Process a TEXT node, applying formatting.
    if (node.type === 'text') {
      let text = node.text || '';
      // Normalize smart quotes to standard quotes (BUG-001-251230)
      text = text
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");

      // Apply bitwise format flags.
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
        if (node.format & 2) text = `<em>${text}</em>`;   // Italic
        if (node.format & 8) text = `<u>${text}</u>`;     // Underline
        if (node.format & 16) text = `<code>${text}</code>`; // Code
        if (node.format & 4) text = `<s>${text}</s>`; // Strikethrough
      }
      return text;
    }

    // Recursively process all children of the current node.
    const childrenHtml = (node.children || [])
      .map(processNode)
      .join('');

    // Process BLOCK nodes based on their type.
    switch (node.type) {
      case 'root':
        return childrenHtml; // The root itself doesn't render a tag.
      case 'paragraph':
        // Render a <br> for empty paragraphs to maintain spacing.
        return `<p>${childrenHtml || '<br>'}</p>`;
      case 'heading':
        const level = node.tag || 'h2';
        return `<${level}>${childrenHtml}</${level}>`;
      case 'list':
        const listTag = node.listType === 'bullet' ? 'ul' : 'ol';
        return `<${listTag}>${childrenHtml}</${listTag}>`;
      case 'listitem':
        return `<li>${childrenHtml}</li>`;
      case 'link':
        // Ensure link has a valid href.
        return `<a href="${node.url || '#'}">${childrenHtml}</a>`;
      case 'quote':
        return `<blockquote>${childrenHtml}</blockquote>`;
      default:
        // For unknown node types, render their children.
        return childrenHtml;
    }
  }

  // --- Main Logic ---

  // Case 1: The input is an array of sections (from ContentEditorPage.jsx)
  if (Array.isArray(data)) {
    return data.map(section => {
      let sectionHtml = '';
      // If the section has a title, render it as an H1.
      if (section.props && section.props.title) {
        sectionHtml += `<h1>${section.props.title}</h1>`;
      }
      // If the section has a body with a Lexical root, process it.
      if (section.props && section.props.body && section.props.body.root) {
        sectionHtml += processNode(section.props.body.root);
      }
      return sectionHtml;
    }).join('');
  }

  // Case 2: The input is a standard Lexical editor state object.
  if (data.root) {
    return processNode(data.root);
  }

  // Fallback for unexpected data structures.
  return '<p></p>';
}
