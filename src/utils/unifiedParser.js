import fm from 'front-matter';
import { parseAstroFile } from './astroFileParser';

/**
 * A unified parser that intelligently handles both standard YAML/JSON frontmatter
 * and Astro's specific JavaScript-based frontmatter.
 *
 * @param {string} fileContent The full string content of the file.
 * @param {string} filePath The path to the file, used to determine the file type.
 * @returns {Promise<{model: {frontmatter: object, body: string, raw: string, rawType: string}|null, trace: object}>}
 *          An object containing the parsed model and a trace object for debugging.
 */
export async function unifiedParser(fileContent, filePath) {
  const trace = { detected: null, rawFrontmatter: null, body: null, parsed: null, error: null };

  if (!fileContent) {
    trace.error = 'Empty content';
    return { model: null, trace };
  }

  // If it's an .astro file, use the specialized Astro parser.
  if (filePath && filePath.endsWith('.astro')) {
    trace.detected = 'astro';
    return parseAstroFile(fileContent);
  }

  // For all other files (especially .md), use the robust front-matter library.
  try {
    trace.detected = 'front-matter';
    const parsed = fm(fileContent);

    const model = {
      frontmatter: parsed.attributes || {},
      body: parsed.body || '',
      raw: fileContent,
      rawType: 'yaml', // front-matter only supports YAML
    };

    trace.rawFrontmatter = parsed.attributes;
    trace.body = parsed.body;
    trace.parsed = parsed;

    return { model, trace };
  } catch (err) {
    trace.error = (err && err.message) || String(err);
    // On error, return a model with the raw content to prevent crashes.
    const model = { frontmatter: {}, body: fileContent, raw: fileContent, rawType: 'error' };
    return { model, trace };
  }
}