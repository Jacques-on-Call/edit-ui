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
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Failed to trigger workflow: ${text}` }));
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
    .then(response => response.json())
    .then(data => {
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
      console.error('Error fetching build status:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error fetching build status: ${error.message}` }));
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