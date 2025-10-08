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

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  const token = getAuthenticatedToken(request);
  let apiUrl = '';

  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
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
              return new Response('API endpoint not found', { status: 404 });
      }
  } else {
      return new Response('Not found', { status: 404 });
  }

  const ghRequest = new Request(apiUrl, request);
  ghRequest.headers.set('Authorization', `token ${token}`);
  ghRequest.headers.set('User-Agent', 'EasySEO-App');

  const response = await fetch(ghRequest);
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
    }
  });
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