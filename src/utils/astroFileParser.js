import { Parser } from 'acorn';
import { marked } from 'marked';
import TurndownService from 'turndown';

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

/**
 * Converts a JavaScript value to source code string
 */
function valueToSourceCode(value, indent = 0) {
  const indentStr = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string':
      // Use template literals for multi-line strings
      if (value.includes('\n')) {
        return '`' + value.replace(/`/g, '\\`').replace(/\$/g, '\\$') + '`';
      }
      // Use single quotes for simple strings
      return "'" + value.replace(/'/g, "\\'") + "'";

    case 'number':
    case 'boolean':
      return String(value);

    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map(item =>
          indentStr + '  ' + valueToSourceCode(item, indent + 1)
        ).join(',\n');
        return '[\n' + items + '\n' + indentStr + ']';
      }

      // Regular object
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      const props = entries.map(([key, val]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? key
          : `'${key}'`;
        return indentStr + '  ' + safeKey + ': ' + valueToSourceCode(val, indent + 1);
      }).join(',\n');
      return '{\n' + props + '\n' + indentStr + '}';

    default:
      return JSON.stringify(value);
  }
}

/**
 * Traverses an Acorn AST node to convert it into a JavaScript value.
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
    case 'TemplateLiteral':
      // Handle template literals
      return node.quasis.map(q => q.value.cooked).join('');
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
 * Parses an .astro file's frontmatter using an AST parser.
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
 */
export function stringifyAstroFile(frontmatter, body) {
  let frontmatterString = '';
  for (const [key, value] of Object.entries(frontmatter)) {
    frontmatterString += `export const ${key} = ${valueToSourceCode(value)};\n`;
  }

  // Convert HTML back to Markdown
  const markdownBody = turndownService.turndown(body);

  return `---
${frontmatterString}---

${markdownBody}`;
}