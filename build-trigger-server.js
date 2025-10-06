import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from the Vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // The main endpoint to trigger the build
  if (req.url === '/api/trigger-build' && (req.method === 'POST' || req.method === 'GET')) {
    console.log('Build trigger received. Starting preview build...');

    const buildScriptPath = path.resolve(process.cwd(), 'build-preview.js');

    // We use spawn to run the build script in a separate process.
    // This is non-blocking, so we can immediately respond to the client.
    const buildProcess = spawn('node', [buildScriptPath], {
      // Run from the 'easy-seo' directory context
      cwd: process.cwd(),
      stdio: 'inherit', // Pipe output to the trigger server's console
      shell: true
    });

    buildProcess.on('error', (error) => {
      console.error(`Failed to start build process: ${error.message}`);
    });

    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('Build process completed successfully.');
        } else {
            console.error(`Build process exited with code ${code}`);
        }
    });

    // Immediately send a response to the client
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Build process started.' }));

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

const PORT = 3002; // Using a new port to avoid conflicts
server.listen(PORT, () => {
  console.log(`🔨 Build trigger server listening on http://localhost:${PORT}`);
});