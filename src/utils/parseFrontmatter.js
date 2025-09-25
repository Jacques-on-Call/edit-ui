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

    // Try gray-matter if available (prefer it for robust parsing)
    try {
      // dynamic import to avoid hard dependency
      // eslint-disable-next-line no-undef
      const gm = await import('gray-matter').then(m => m.default || m);
      const parsed = gm(text);
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
    } catch (errGrayMatter) {
      // gray-matter not installed or failed; fallback to simple parsing
    }

    // Fallback parsing: simple extraction for YAML-like
    if (trace.detected === 'yaml') {
      const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (match) {
        trace.rawFrontmatter = match[1];
        trace.body = match[2];
      } else {
        trace.error = 'YAML detection but regex failed';
        trace.body = text;
      }
    } else if (trace.detected === 'toml') {
      const match = text.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n?([\s\S]*)$/);
      if (match) {
        trace.rawFrontmatter = match[1];
        trace.body = match[2];
      } else {
        trace.error = 'TOML detection but regex failed';
        trace.body = text;
      }
    } else if (trace.detected === 'json') {
      // try to split a leading JSON block: { ... }\n\nrest
      const idx = text.indexOf('\n');
      // not robust but good enough for debug: try to find trailing brace
      const closing = text.indexOf('}\n');
      try {
        const jsonEnd = text.indexOf('}\n') !== -1 ? text.indexOf('}\n') + 1 : -1;
        if (jsonEnd > 0) {
          const jsonText = text.slice(0, jsonEnd + 1);
          trace.rawFrontmatter = JSON.parse(jsonText);
          trace.body = text.slice(jsonEnd + 1);
        } else {
          trace.error = 'JSON frontmatter detection but cannot find end brace';
          trace.body = text;
        }
      } catch (e) {
        trace.error = 'JSON parse error: ' + e.message;
        trace.body = text;
      }
    } else if (trace.detected === 'properties') {
      // parse Java-like properties (key=value) simple conversion -> object
      const lines = text.split('\n');
      const props = {};
      let i = 0;
      // collect while lines look like key=value and not blank line
      for (; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          i++;
          break;
        }
        if (/^[A-Za-z0-9_.-]+\s*=/.test(line)) {
          const idx = line.indexOf('=');
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          props[k] = v;
        } else {
          break;
        }
      }
      trace.rawFrontmatter = props;
      trace.body = lines.slice(i).join('\n');
    } else {
      trace.rawFrontmatter = null;
      trace.body = text;
    }

    // attempt to extract common keys from rawFrontmatter string (YAML textual)
    const front = trace.rawFrontmatter;
    if (typeof front === 'string') {
      // try to find title and sections keys using regex (debugging purpose)
      const titleMatch = front.match(/title:\s*(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : null;
      trace.parsed = { title };
    } else if (front && typeof front === 'object') {
      trace.parsed = front;
    }

    const model = {
      frontmatter: trace.parsed || null,
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