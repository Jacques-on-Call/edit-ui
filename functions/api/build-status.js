/**
 * Cloudflare Function to check the status of the latest GitHub Actions workflow run.
 * This is the serverless backend for polling the preview build status.
 */
export async function onRequestGet(context) {
  // context contains the request, environment variables (env), etc.
  const { env } = context;

  // --- Configuration ---
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const REPO_OWNER = 'Jacques-on-Call';
  const REPO_NAME = 'StrategyContent';
  const WORKFLOW_ID = 'build-preview.yml';

  // 1. Check for the GITHUB_TOKEN
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not set in Cloudflare environment variables.');
    return new Response(JSON.stringify({ message: 'Server configuration error: GITHUB_TOKEN is not set.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs`;

  try {
    // 2. Make the API call to GitHub
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Easy-SEO-Build-Status-Checker',
      },
    });

    // 3. Handle the response from GitHub
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API Error fetching build status: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ message: `Failed to fetch build status from GitHub: ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Handle cases where GitHub API returns a 2xx status but with an error message
    if (data.message) {
      return new Response(JSON.stringify({ message: `GitHub API Error: ${data.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      // It's not an error if no runs are found, it just means the build hasn't started.
      return new Response(JSON.stringify({ message: 'No workflow runs found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the latest workflow run object
    const latestRun = data.workflow_runs[0];
    return new Response(JSON.stringify(latestRun), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Handle unexpected network errors
    console.error('Error fetching build status:', error);
    return new Response(JSON.stringify({ message: `A network error occurred while fetching build status: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}