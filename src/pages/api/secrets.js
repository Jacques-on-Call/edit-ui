// easy-seo/src/pages/api/secrets.js

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Handles the POST request to manage secrets.
 * This API is designed to never write secrets to the repository.
 * It acts as a proxy to the Cloudflare API.
 */
export const POST = async ({ request, locals }) => {
  const { octokit, session } = locals;

  if (!octokit || !session?.user?.login) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { action, repoName, cfAccountId, cfApiToken, resendApiKey } = await request.json();

    switch (action) {
      case 'test':
        return testCloudflareToken(cfApiToken);

      case 'save':
        return saveSecrets(cfAccountId, cfApiToken, repoName, resendApiKey);

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred', details: error.message }), { status: 500 });
  }
};

/**
 * Verifies the Cloudflare API token.
 * @param {string} token The Cloudflare API token.
 * @returns {Response} A Response object with the verification result.
 */
async function testCloudflareToken(token) {
  if (!token) {
    return new Response(JSON.stringify({ error: 'API token is required' }), { status: 400 });
  }

  try {
    const response = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessages = data.errors?.map(e => e.message).join(', ') || 'Invalid token';
      return new Response(JSON.stringify({ error: `Verification failed: ${errorMessages}` }), { status: response.status });
    }

    return new Response(JSON.stringify({ message: 'Connection successful!', status: data.result?.status }), { status: 200 });
  } catch (error) {
    console.error('Cloudflare token verification error:', error);
    return new Response(JSON.stringify({ error: 'Failed to connect to Cloudflare API' }), { status: 500 });
  }
}

/**
 * Saves secrets as environment variables on a Cloudflare Pages project.
 * @param {string} accountId The Cloudflare Account ID.
 * @param {string} apiToken The Cloudflare API Token.
 * @param {string} projectName The name of the Cloudflare Pages project.
 * @param {string} resendKey The Resend API Key.
 * @returns {Response} A Response object with the result.
 */
async function saveSecrets(accountId, apiToken, projectName, resendKey) {
  if (!accountId || !apiToken || !projectName || !resendKey) {
    return new Response(JSON.stringify({ error: 'Missing required fields for saving secrets' }), { status: 400 });
  }

  const url = `${CF_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`;

  const body = {
    deployment_configs: {
      production: {
        env_vars: {
          RESEND_API_KEY: {
            value: resendKey,
          },
          CF_API_TOKEN: {
            value: apiToken,
          },
          // Storing the Account ID can be useful for other integrations/logic within the worker.
          CF_ACCOUNT_ID: {
            value: accountId
          }
        },
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessages = data.errors?.map(e => e.message).join(', ') || 'Failed to update project settings';
      return new Response(JSON.stringify({ error: `Cloudflare API error: ${errorMessages}` }), { status: response.status });
    }

    return new Response(JSON.stringify({ message: 'Secrets saved successfully!' }), { status: 200 });
  } catch (error) {
    console.error('Cloudflare project update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send secrets to Cloudflare' }), { status: 500 });
  }
}
