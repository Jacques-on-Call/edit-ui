import matter from 'gray-matter';
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

  // For all other files (especially .md), use the robust gray-matter library.
  try {
    trace.detected = 'gray-matter';
    const parsed = matter(fileContent);

    const model = {
      frontmatter: parsed.data || {},
      body: parsed.content || '',
      raw: fileContent,
      rawType: parsed.language || 'yaml',
    };

    trace.rawFrontmatter = parsed.data;
    trace.body = parsed.content;
    trace.parsed = parsed;

    return { model, trace };
  } catch (err) {
    trace.error = (err && err.message) || String(err);
    // On error, return a model with the raw content to prevent crashes.
    const model = { frontmatter: {}, body: fileContent, raw: fileContent, rawType: 'error' };
    return { model, trace };
  }
}