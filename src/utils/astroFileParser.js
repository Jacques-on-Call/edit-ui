import { Parser } from 'acorn';

/**
 * Parses the content of an .astro file to extract both the JavaScript frontmatter object
 * and the body content (the rest of the file).
 *
 * This function is designed to be a replacement for gray-matter, specifically for .astro files
 * that use a JavaScript object for frontmatter.
 *
 * @param {string} fileContent The full string content of the .astro file.
 * @returns {{model: {frontmatter: object, body: string, raw: string, rawType: string}|null, trace: object}}
 *          An object containing the parsed model and a trace object for debugging.
 */
export async function parseAstroFile(fileContent) {
  const trace = { detected: 'astro-js', rawFrontmatter: null, body: null, parsed: null, error: null };

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

    const frontmatterContent = match[1];
    trace.rawFrontmatter = frontmatterContent;

    const body = text.substring(match[0].length).trim();
    trace.body = body;

    const frontmatterObjectRegex = /export\s+const\s+frontmatter\s*=\s*({[\s\S]*?});/;
    const objectMatch = frontmatterContent.match(frontmatterObjectRegex);

    let frontmatter = {};
    if (objectMatch && objectMatch[1]) {
      const objectString = objectMatch[1];
      try {
        // Use Acorn to check for syntax errors before evaluation
        Parser.parse(objectString, { ecmaVersion: 'latest' });
        // If parsing succeeds, we can safely use the Function constructor.
        // For even greater safety, you could use a library that walks the AST
        // and builds the object, but for now, this confirms syntax validity.
        frontmatter = Function(`"use strict"; return (${objectString})`)();
      } catch (parseError) {
        trace.error = `Frontmatter syntax error: ${parseError.message}`;
        // On a syntax error, do not attempt to evaluate.
        // The model will be returned with empty frontmatter and the error trace.
      }
    } else {
      trace.error = "No 'export const frontmatter' object found.";
    }

    trace.parsed = frontmatter;

    const model = {
      frontmatter,
      body,
      raw: text,
      rawType: 'astro-js',
    };

    // If there was a parsing error, return the raw content in the body
    // so the user can see and fix the problematic content.
    if (trace.error && trace.error.startsWith('Frontmatter syntax error')) {
      model.body = fileContent;
      model.rawType = 'error';
    }


    return { model, trace };
  } catch (err) {
    trace.error = (err && err.message) || String(err);
    const model = { frontmatter: {}, body: fileContent, raw: fileContent, rawType: 'error' };
    return { model, trace };
  }
}

/**
 * Stringifies a frontmatter object and a body string into a complete .astro file content string.
 * This is the inverse of parseAstroFile.
 *
 * @param {object} frontmatter The JavaScript object for the frontmatter.
 * @param {string} body The body content of the file.
 * @returns {string} The complete, formatted .astro file content.
 */
export function stringifyAstroFile(frontmatter, body) {
  // Stringify the entire frontmatter object, including the sections array.
  // This is the fix for the critical save bug.
  const frontmatterString = `export const frontmatter = ${JSON.stringify(
    frontmatter,
    null,
    2
  )};`;

  return `---
${frontmatterString}
---
${body || ''}`;
}