const GITHUB_API_URL = 'https://api.github.com';

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Access-Control-Allow-Credentials': 'true',
});

function getAuthenticatedToken(request) {
  const cookie = request.headers.get('Cookie');
  if (!cookie || !cookie.includes('gh_session=')) {
    throw new Error('Unauthorized');
  }
  return cookie.match(/gh_session=([^;]+)/)[1];
}

async function handleLayoutTemplateRequest(request, env) {
  const { method } = request;
  const url = new URL(request.url);
  const templateId = url.searchParams.get('template_id');

  // POST: Create or update a layout template
  if (method === 'POST') {
    const { json_content, name } = await request.json();
    if (!json_content || !name) {
      return new Response(JSON.stringify({ error: 'Missing json_content or name' }), { status: 400 });
    }

    try {
      // Find template or create it
      let template = await env.DB.prepare('SELECT id FROM layout_templates WHERE name = ?').bind(name).first();
      if (!template) {
        await env.DB.prepare('INSERT INTO layout_templates (name) VALUES (?)').bind(name).run();
        template = await env.DB.prepare('SELECT id FROM layout_templates WHERE name = ?').bind(name).first();
      }

      // Get next version number
      const lastVersion = await env.DB.prepare('SELECT MAX(version_number) as max_version FROM layout_versions WHERE template_id = ?')
        .bind(template.id)
        .first();
      const nextVersion = (lastVersion.max_version || 0) + 1;

      // Insert new layout version
      await env.DB.prepare('INSERT INTO layout_versions (template_id, json_content, version_number) VALUES (?, ?, ?)')
        .bind(template.id, JSON.stringify(json_content), nextVersion)
        .run();

      const newVersion = await env.DB.prepare('SELECT id FROM layout_versions WHERE template_id = ? AND version_number = ?')
        .bind(template.id, nextVersion)
        .first();

      // Update template to point to the new version
      await env.DB.prepare('UPDATE layout_templates SET current_version_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newVersion.id, template.id)
        .run();

      return new Response(JSON.stringify({ success: true, template_id: template.id, version: nextVersion }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET: Fetch a specific layout template or a list of all templates
  if (method === 'GET') {
    try {
      // If templateId is provided, fetch a single template's current version
      if (templateId) {
        const stmt = env.DB.prepare(`
          SELECT lt.name, lv.json_content FROM layout_versions lv
          JOIN layout_templates lt ON lt.current_version_id = lv.id
          WHERE lt.id = ?
        `);
        const result = await stmt.bind(templateId).first();
        if (!result) return new Response(JSON.stringify({ error: 'Layout template not found' }), { status: 404 });
        // The result will be { name: "...", json_content: "..." }. The content is a string, so we parse it before sending.
        const responsePayload = {
          name: result.name,
          json_content: JSON.parse(result.json_content)
        };
        return new Response(JSON.stringify(responsePayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        // Otherwise, fetch all templates
        const { results } = await env.DB.prepare('SELECT id, name, updated_at FROM layout_templates ORDER BY updated_at DESC').all();
        return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handlePageTemplateAssignment(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    const url = new URL(request.url);
    // Path will be /api/pages/:slug/assign-template
    const slug = url.pathname.split('/')[3];
    const { template_id } = await request.json();

    if (!slug || !template_id) {
        return new Response(JSON.stringify({ error: 'Missing slug or template_id' }), { status: 400 });
    }

    try {
        await env.DB.prepare('UPDATE pages SET layout_template_id = ? WHERE slug = ?')
            .bind(template_id, slug)
            .run();
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  let response;

  // D1 API Routes
  if (pathname === '/api/layout-templates') {
    getAuthenticatedToken(request); // Throws error if not authenticated
    response = await handleLayoutTemplateRequest(request, env);
  } else if (pathname.startsWith('/api/pages/') && pathname.endsWith('/assign-template')) {
    getAuthenticatedToken(request); // Throws error if not authenticated
    response = await handlePageTemplateAssignment(request, env);
  }
  // GitHub API Proxy Routes
  else if (pathname.startsWith('/api/')) {
    const token = getAuthenticatedToken(request);
    let apiUrl = '';
    const endpoint = pathname.substring(5); // remove /api/

    switch(endpoint) {
        case 'me':
            apiUrl = `${GITHUB_API_URL}/user`;
            break;
        case 'repos':
            apiUrl = `${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`;
            break;
        case 'files':
        case 'file':
            const repo = url.searchParams.get('repo');
            const path = url.searchParams.get('path') || '';
            if (!repo) return new Response('Missing repo', { status: 400 });
            apiUrl = `${GITHUB_API_URL}/repos/${repo}/contents/${path}`;
            break;
        case 'metadata':
            const repoMeta = url.searchParams.get('repo');
            const pathMeta = url.searchParams.get('path');
            if (!repoMeta || !pathMeta) return new Response('Missing repo or path', { status: 400 });
            apiUrl = `${GITHUB_API_URL}/repos/${repoMeta}/commits?path=${pathMeta}&per_page=1`;
            break;
        case 'search':
            const repoSearch = url.searchParams.get('repo');
            const querySearch = url.searchParams.get('query');
            if (!repoSearch || !querySearch) return new Response('Missing repo or query', { status: 400 });
            const githubQuery = `${querySearch} in:file,path repo:${repoSearch} path:src/pages`;
            apiUrl = `${GITHUB_API_URL}/search/code?q=${encodeURIComponent(githubQuery)}`;
            break;
        default:
            return new Response('API endpoint not found', { status: 404, headers: corsHeaders(origin) });
    }

    const ghRequest = new Request(apiUrl, request);
    ghRequest.headers.set('Authorization', `token ${token}`);
    ghRequest.headers.set('User-Agent', 'EasySEO-App');
    response = await fetch(ghRequest);
  } else {
    return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
  }

  // Apply CORS headers to all successful responses
  const responseHeaders = new Headers(response.headers);
  const cors = corsHeaders(origin);
  for(const [key, value] of Object.entries(cors)) {
      responseHeaders.set(key, value);
  }
  // Ensure Content-Type is set for our own API responses which might not have it
  if (!responseHeaders.has('Content-Type')) {
      responseHeaders.set('Content-Type', 'application/json');
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

async function handleTokenRequest(request, env) {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
        const { code } = await request.json();
        if (!code) {
            return new Response(JSON.stringify({ message: 'Authorization code is missing.' }), { status: 400 });
        }

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: env.OAUTH_GITHUB_CLIENT_ID,
                client_secret: env.OAUTH_GITHUB_CLIENT_SECRET,
                code: code,
            }),
        });

        const data = await response.json();
        if (data.error || !data.access_token) {
            throw new Error(data.error_description || 'Failed to exchange code for token.');
        }

        const accessToken = data.access_token;
        const headers = new Headers({
            ...corsHeaders(origin),
            'Content-Type': 'application/json',
        });
        headers.set('Set-Cookie', `gh_session=${accessToken}; HttpOnly; Secure; Path=/; SameSite=None; Max-Age=86400`);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500, headers: corsHeaders(origin) });
    }
}


export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/token') {
        return handleTokenRequest(request, env);
    }
    return handleRequest(request, env);
  },
};