import { Parser } from 'acorn';
import { marked } from 'marked';

// Note: The gfmHeadingId and mangle plugins have been removed as they
// were causing a browser-compatibility issue (Buffer not defined).
// The core 'marked' library is browser-safe.

/**
 * Traverses an Acorn AST node to convert it into a JavaScript value.
 * This is a simplified implementation for demonstration.
 * @param {object} node The AST node from Acorn.
 * @param {string} source The source code string for the AST.
 * @returns {*} The JavaScript value represented by the node.
 */
function astNodeToValue(node, source) {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'ObjectExpression': {
      const obj = {};
      for (const prop of node.properties) {
        const key = prop.key.name || prop.key.value;
        obj[key] = astNodeToValue(prop.value, source);
      }
      return obj;
    }
    case 'ArrayExpression':
      return node.elements.map(element => astNodeToValue(element, source));
    // For other complex types, we fall back to extracting the source text
    // and evaluating it. This handles template literals, etc.
    default:
      try {
        const valueString = source.substring(node.start, node.end);
        return Function(`"use strict"; return (${valueString})`)();
      } catch (e) {
        console.error("Could not evaluate AST node:", e);
        return null;
      }
  }
}

/**
 * Parses an .astro file's frontmatter using an AST parser to correctly
 * extract all exported variables.
 *
 * @param {string} fileContent The full string content of the .astro file.
 * @returns {Promise<{model: {frontmatter: object, body: string, raw: string, rawType: string}|null, trace: object}>}
 */
export async function parseAstroFile(fileContent) {
  const trace = { detected: 'astro-ast', rawFrontmatter: null, body: null, parsed: null, error: null };

  if (!fileContent) {
    trace.error = 'Empty content';
    return { model: null, trace };
  }

  try {
    const text = fileContent.replace(/\r\n/g, '\n');
    const frontmatterRegex = /^---([\s\S]*?)---/;
    const match = text.match(frontmatterRegex);

    if (!match || !match[1]) {
      trace.error = 'No frontmatter block found.';
      const model = { frontmatter: {}, body: text, raw: text, rawType: 'none' };
      return { model, trace };
    }

    const frontmatterContent = match[1].trim();
    trace.rawFrontmatter = frontmatterContent;

    const markdownBody = text.substring(match[0].length).trim();
    const htmlBody = await marked.parse(markdownBody);
    trace.body = htmlBody;

    const frontmatter = {};
    if (frontmatterContent) {
        try {
            const ast = Parser.parse(frontmatterContent, { ecmaVersion: 'latest', sourceType: 'module' });
            for (const node of ast.body) {
                if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration') {
                    for (const declarator of node.declaration.declarations) {
                        if (declarator.id.type === 'Identifier' && declarator.init) {
                            const name = declarator.id.name;
                            const value = astNodeToValue(declarator.init, frontmatterContent);
                            frontmatter[name] = value;
                        }
                    }
                }
            }
            trace.parsed = frontmatter;
        } catch (parseError) {
            trace.error = `Frontmatter syntax error: ${parseError.message}`;
        }
    }

    const model = {
      frontmatter,
      body: htmlBody,
      raw: text,
      rawType: 'astro-ast',
    };

    if (trace.error) {
      model.body = `<p>Error parsing frontmatter. Please check the syntax.</p><pre>${fileContent}</pre>`;
      model.rawType = 'error';
    }

    return { model, trace };
  } catch (err) {
    trace.error = (err && err.message) || String(err);
    const model = { frontmatter: {}, body: `<p>A critical error occurred.</p><pre>${fileContent}</pre>`, raw: fileContent, rawType: 'error' };
    return { model, trace };
  }
}

/**
 * Stringifies a frontmatter object and an HTML body into a complete .astro file.
 *
 * @param {object} frontmatter The frontmatter object.
 * @param {string} body The HTML content from the editor.
 * @returns {string} The complete file content.
 */
export function stringifyAstroFile(frontmatter, body) {
    let frontmatterString = '';
    for (const [key, value] of Object.entries(frontmatter)) {
        // Use JSON.stringify to correctly handle all data types, including
        // strings (which will be correctly quoted), objects, and arrays.
        frontmatterString += `export const ${key} = ${JSON.stringify(value, null, 2)};\n`;
    }

    // This is a critical limitation: we are not converting HTML back to Markdown.
    console.warn("HTML to Markdown conversion is not implemented. Edits will not be saved correctly.");
    const markdownBody = body; // Placeholder

    return `---
${frontmatterString}
---
${markdownBody || ''}`;
}