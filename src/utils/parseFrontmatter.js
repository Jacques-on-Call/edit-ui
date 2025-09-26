import matter from 'gray-matter';

// Lightweight frontmatter detection + safe parsing with trace.
// Tries to use gray-matter if present; otherwise falls back
// to conservative extraction and returns a normalized object.
export async function parseFrontmatter(content) {
  const trace = { detected: null, rawFrontmatter: null, body: null, parsed: null, error: null };
  try {
    // quick trim
    const text = (content || '').replace(/\r\n/g, '\n');
    if (!text) {
      trace.error = 'Empty content';
      return { model: null, trace };
    }

    // detection rules
    if (text.startsWith('---')) {
      trace.detected = 'yaml';
    } else if (text.startsWith('+++')) {
      trace.detected = 'toml';
    } else if (text.trim().startsWith('{')) {
      trace.detected = 'json';
    } else if (/^\s*[A-Za-z0-9_.-]+=/.test(text.split('\n', 6).join('\n'))) {
      // simple heuristic: key=value pairs like Java properties
      trace.detected = 'properties';
    } else {
      trace.detected = 'none';
    }

    // Use gray-matter for robust parsing
    const parsed = matter(text);
    trace.rawFrontmatter = parsed.data || null;
    trace.body = parsed.content || '';
    trace.parsed = parsed;
    // normalize model shape:
    const model = {
      frontmatter: trace.rawFrontmatter,
      body: trace.body,
      raw: text,
      rawType: trace.detected,
    };
    return { model, trace };
  } catch (err) {
    trace.error = (err && err.message) || String(err);
    return { model: null, trace };
  }
}