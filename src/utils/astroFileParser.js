import { Parser } from 'acorn';
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { mangle } from "marked-mangle";

// Configure marked to handle GitHub Flavored Markdown
marked.use(gfmHeadingId());
marked.use(mangle());

/**
 * Parses the content of an .astro file to extract both the JavaScript frontmatter object
 * and the body content, converting the body to HTML for TinyMCE.
 *
 * @param {string} fileContent The full string content of the .astro file.
 * @returns {{model: {frontmatter: object, body: string, raw: string, rawType: string}|null, trace: object}}
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

    const markdownBody = text.substring(match[0].length).trim();
    const htmlBody = await marked.parse(markdownBody); // Use marked to convert Markdown to HTML
    trace.body = htmlBody;

    const frontmatterObjectRegex = /export\s+const\s+frontmatter\s*=\s*({[\s\S]*?});/;
    const objectMatch = frontmatterContent.match(frontmatterObjectRegex);

    let frontmatter = {};
    if (objectMatch && objectMatch[1]) {
      const objectString = objectMatch[1];
      try {
        Parser.parse(objectString, { ecmaVersion: 'latest' });
        frontmatter = Function(`"use strict"; return (${objectString})`)();
      } catch (parseError) {
        trace.error = `Frontmatter syntax error: ${parseError.message}`;
      }
    } else {
      trace.error = "No 'export const frontmatter' object found.";
    }

    trace.parsed = frontmatter;

    const model = {
      frontmatter,
      body: htmlBody, // The body is now HTML
      raw: text,
      rawType: 'astro-js',
    };

    if (trace.error && trace.error.startsWith('Frontmatter syntax error')) {
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
 * Stringifies a frontmatter object and an HTML body string into a complete .astro file content string.
 * NOTE: This function is a placeholder and does not correctly convert HTML back to Markdown.
 * A proper HTML-to-Markdown converter (like turndown) would be needed for a full implementation.
 *
 * @param {object} frontmatter The JavaScript object for the frontmatter.
 * @param {string} body The HTML body content from the editor.
 * @returns {string} The complete, formatted .astro file content.
 */
export function stringifyAstroFile(frontmatter, body) {
  const frontmatterString = `export const frontmatter = ${JSON.stringify(
    frontmatter,
    null,
    2
  )};`;

  // This is a critical limitation: we are not converting HTML back to Markdown.
  // The original body is returned, which means edits will not be saved correctly.
  // A proper implementation requires a library like 'turndown'.
  console.warn("HTML to Markdown conversion is not implemented. Edits will not be saved correctly.");

  return `---
${frontmatterString}
---
${body || ''}`; // This should be converted from HTML to Markdown
}