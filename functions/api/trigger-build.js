/**
 * Cloudflare Function to trigger a GitHub Actions workflow dispatch.
 * This is the serverless backend for the "Generate Preview" button.
 */
export async function onRequestPost(context) {
  // context contains the request, environment variables (env), and other data.
  const { env } = context;

  // --- Configuration ---
  // These are hardcoded for now, but could also be moved to environment variables.
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const REPO_OWNER = 'Jacques-on-Call';
  const REPO_NAME = 'StrategyContent';
  const WORKFLOW_ID = 'build-preview.yml'; // The name of your workflow file

  // 1. Check for the GITHUB_TOKEN
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not set in Cloudflare environment variables.');
    const errorResponse = {
      message: 'Server configuration error: A GITHUB_TOKEN secret is not configured in the Cloudflare project settings.',
      details: 'The application cannot authenticate with GitHub to trigger a preview build without this token.'
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;

  try {
    // 2. Make the API call to GitHub
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Easy-SEO-Preview-Trigger', // A descriptive User-Agent is good practice
      },
      body: JSON.stringify({
        ref: 'main', // The branch you want to build from
        inputs: {
          repo: REPO_NAME,
        },
      }),
    });

    // 3. Handle the response from GitHub
    if (response.ok) {
      // Success! The workflow was dispatched.
      console.log('Successfully dispatched GitHub workflow.');
      return new Response(JSON.stringify({ message: 'Build workflow successfully triggered.' }), {
        status: 202, // 202 Accepted is the correct status code for an async task
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // The request to GitHub failed. Provide a detailed error message.
      const errorText = await response.text();
      console.error(`Failed to trigger workflow. Status: ${response.status}, Body: ${errorText}`);

      let userMessage = `Failed to trigger workflow. GitHub API responded with status ${response.status}.`;

      // Provide specific, helpful guidance for common errors.
      if (response.status === 401) {
         userMessage = 'GitHub API Error (401 Unauthorized): The GITHUB_TOKEN is likely invalid or expired. Please check the secret in your Cloudflare project settings.';
      } else if (response.status === 403 || response.status === 405) {
        userMessage = 'GitHub API Error (403/405 - Permissions Issue): The GITHUB_TOKEN does not have sufficient permissions. Please ensure your Personal Access Token has the "repo" and "workflow" scopes enabled.';
      } else if (response.status === 404) {
        userMessage = `GitHub API Error (404 Not Found): The workflow file ('${WORKFLOW_ID}') or repository ('${REPO_OWNER}/${REPO_NAME}') could not be found. Please check the configuration in the Cloudflare Function.`;
      }

      return new Response(JSON.stringify({ message: userMessage, details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    // Handle unexpected network errors
    console.error('Error triggering workflow:', error);
    return new Response(JSON.stringify({ message: `A network error occurred while trying to trigger the build: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}