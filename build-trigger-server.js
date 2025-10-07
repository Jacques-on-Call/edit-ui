/* eslint-env node */
/* eslint-env node */
import http from 'http';

// --- GitHub Actions Configuration ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Jacques-on-Call';
const REPO_NAME = 'StrategyContent';
const WORKFLOW_ID = 'build-preview.yml'; // The name of the workflow file

const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint to trigger the GitHub Actions workflow
  if (req.url === '/api/trigger-build' && (req.method === 'POST' || req.method === 'GET')) {
    console.log('Build trigger received. Dispatching GitHub Actions workflow...');

    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN is not set.');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server configuration error: GITHUB_TOKEN is missing.' }));
      return;
    }

    // Construct the API URL for dispatching the workflow
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;

    // Trigger the workflow via the GitHub API
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Easy-SEO-Build-Trigger',
      },
      body: JSON.stringify({
        ref: 'main', // The branch to build from
        inputs: {
          repo: REPO_NAME,
        },
      }),
    })
    .then(response => {
      if (response.ok) {
        console.log('Successfully dispatched workflow.');
        res.writeHead(202, { 'Content-Type': 'application/json' }); // 202 Accepted is more appropriate
        res.end(JSON.stringify({ message: 'Build workflow successfully triggered.' }));
      } else {
        // Log the error response from GitHub for better debugging
        response.text().then(text => {
          console.error(`Failed to trigger workflow. Status: ${response.status}, Body: ${text}`);

          let errorMessage = `Failed to trigger workflow. GitHub API responded with status ${response.status}: ${text}`;
          if (response.status === 405 || response.status === 403) {
            errorMessage = 'GitHub API Error (403/405 - Forbidden/Method Not Allowed): The GITHUB_TOKEN used by the local build server does not have sufficient permissions. Please ensure your Personal Access Token (PAT) has the full "repo" scope to trigger a workflow_dispatch event.';
          } else if (response.status === 404) {
            errorMessage = `GitHub API Error (404 Not Found): The workflow file ('${WORKFLOW_ID}') or repository ('${REPO_OWNER}/${REPO_NAME}') could not be found. Please check the configuration in build-trigger-server.js.`;
          } else if (response.status === 401) {
             errorMessage = 'GitHub API Error (401 Unauthorized): The GITHUB_TOKEN is likely invalid, expired, or missing. Please check your .env file or environment variables.';
          }

          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: errorMessage, details: text }));
        });
      }
    })
    .catch(error => {
      console.error('Error triggering workflow:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error triggering workflow: ${error.message}` }));
    });

  } else if (req.url.startsWith('/api/build-status') && req.method === 'GET') {
    console.log('Checking GitHub Actions build status...');

    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN is not set.');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server configuration error: GITHUB_TOKEN is missing.' }));
      return;
    }

    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs`;

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Easy-SEO-Build-Status-Checker',
      },
    })
    .then(response => {
      if (!response.ok) {
        // If the response is not OK, we want to capture the error text from GitHub
        return response.text().then(text => {
          // And throw an error that includes the status and the text
          throw new Error(`GitHub API Error: ${response.status} - ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      // Handle cases where GitHub API returns a 2xx status but with an error message in the body
      if (data.message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `GitHub API Error: ${data.message}` }));
        return;
      }

      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No workflow runs found.' }));
        return;
      }

      // Return the most recent workflow run
      const latestRun = data.workflow_runs[0];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(latestRun));
    })
    .catch(error => {
      console.error('Error fetching build status:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Failed to fetch build status: ${error.message}` }));
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

const PORT = 3002; // Using a new port to avoid conflicts
server.listen(PORT, () => {
  console.log(`🔨 Build trigger server listening on http://localhost:${PORT}`);
});