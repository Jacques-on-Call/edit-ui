import { Parser } from 'acorn';

/**
 * A helper function to safely parse a string representing a JavaScript literal.
 * It uses the Function constructor, which is safer than eval.
 * @param {string} valueString - The string to parse (e.g., "'hello'", "{ a: 1 }").
 * @returns {any} The parsed JavaScript value.
 */
function safelyParseValue(valueString) {
  try {
    return Function(`"use strict"; return (${valueString})`)();
  } catch (e) {
    console.error(`Could not parse value: ${valueString}`, e);
    return valueString;
  }
}

/**
 * Recursively converts a JavaScript value into a valid JavaScript code string.
 * This is a custom stringifier that handles objects, arrays, and multiline strings
 * correctly, preserving template literals for multiline content.
 * @param {any} value - The JavaScript value to stringify.
 * @param {number} indent - The current indentation level.
 * @returns {string} A string representing the value as JavaScript code.
 */
function valueToString(value, indent = 0) {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  if (typeof value === 'string') {
    // If the string contains newlines, use a template literal (backticks)
    if (value.includes('\n')) {
      return `\`${value}\``;
    }
    // Otherwise, use a regular JSON-style string
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const arrItems = value.map(item => `${nextIndentStr}${valueToString(item, indent + 1)}`).join(',\n');
    return `[\n${arrItems}\n${indentStr}]`;
  }

  if (typeof value === 'object' && value !== null) {
    if (Object.keys(value).length === 0) return '{}';
    const objItems = Object.entries(value).map(([key, val]) => {
      // Keys in JS objects don't need quotes if they are valid identifiers
      const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      return `${nextIndentStr}${keyStr}: ${valueToString(val, indent + 1)}`;
    }).join(',\n');
    return `{\n${objItems}\n${indentStr}}`;
  }

  // For numbers, booleans, null, etc.
  return String(value);
}


/**
 * Parses the content of an .astro file to extract imports, frontmatter variables,
 * and the body content.
 */
export async function parseAstroFile(fileContent) {
  const trace = { detected: 'astro-js-idiomatic', rawFrontmatter: null, body: null, parsed: null, error: null };

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
      const model = { frontmatter: {}, imports: [], body: text, raw: text, rawType: 'none' };
      return { model, trace };
    }

    const frontmatterContent = match[1].trim();
    trace.rawFrontmatter = frontmatterContent;

    const body = text.substring(match[0].length).trim();

    const frontmatter = {};
    const imports = [];

    const ast = Parser.parse(frontmatterContent, { ecmaVersion: 'latest', sourceType: 'module' });

    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        imports.push(frontmatterContent.substring(node.start, node.end));
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration') {
        for (const declaration of node.declaration.declarations) {
          if (declaration.id.type === 'Identifier' && declaration.init) {
            const key = declaration.id.name;
            const valueString = frontmatterContent.substring(declaration.init.start, declaration.init.end);
            frontmatter[key] = safelyParseValue(valueString);
          }
        }
      }
    }

    if (Object.keys(frontmatter).length === 0) {
      trace.error = "Could not find any valid 'export const' variables in the frontmatter.";
    }

    trace.parsed = { frontmatter, imports };

    const model = {
      frontmatter,
      imports,
      body,
      raw: text,
      rawType: 'astro-js-idiomatic',
    };

    if (trace.error) {
      model.body = fileContent;
      model.rawType = 'error';
    }

    return { model, trace };
  } catch (err) {
    trace.error = `Frontmatter syntax error: ${err.message}`;
    const model = { frontmatter: {}, imports: [], body: fileContent, raw: fileContent, rawType: 'error' };
    return { model, trace };
  }
}

/**
 * Stringifies a frontmatter object, imports, and a body string into a complete .astro file content string.
 */
export function stringifyAstroFile(frontmatter, body, imports = []) {
  const importString = imports.join('\n');

  const frontmatterParts = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    const valueString = valueToString(value);
    frontmatterParts.push(`export const ${key} = ${valueString};`);
  }
  const frontmatterExportsString = frontmatterParts.join('\n\n');

  const separator = importString && frontmatterExportsString ? '\n\n' : '';

  return `---
${importString}${separator}${frontmatterExportsString}
---
${body || ''}`;
}