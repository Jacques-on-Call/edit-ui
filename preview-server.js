import express from 'express';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
let PORT = 3001;

// Resolve paths from the root of the project
const rootDir = resolve(__dirname, '..');
const distPath = resolve(rootDir, 'dist');
const errorHtmlPath = resolve(__dirname, 'error.html');

// --- Live Reload SSE Setup ---
const clients = [];
const watcher = chokidar.watch(distPath, {
  ignored: /(^|[\/\\])\..|build-status\.json/, // Ignore dotfiles and the status file itself
  persistent: true,
  ignoreInitial: true, // Don't fire on initial scan
});

watcher.on('all', (event, path) => {
  console.log(`File change detected in dist: ${path}. Sending reload signal.`);
  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
});

app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  console.log('Client connected for SSE.');
  clients.push(res);

  req.on('close', () => {
    console.log('Client disconnected.');
    clients.splice(clients.indexOf(res), 1);
  });

  req.on('error', (err) => {
    console.error('SSE client connection error:', err);
    clients.splice(clients.indexOf(res), 1);
  });
});

// --- Static File Serving & Error Handling ---
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const statusFilePath = join(distPath, 'build-status.json');

  // First, check if the build has ever run
  if (!fs.existsSync(distPath) || !fs.existsSync(statusFilePath)) {
    return res.status(404).send('<h1>Preview not ready</h1><p>The Astro site has not been built yet. Please wait for the first build to complete.</p>');
  }

  // Read build status
  fs.readFile(statusFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Could not read build status file.');
    }

    try {
      const { status, message, lastSuccess } = JSON.parse(data);

      if (status === 'error') {
        // Serve the custom error page
        fs.readFile(errorHtmlPath, 'utf8', (err, errorHtml) => {
          if (err) {
            return res.status(500).send('Could not load the error page.');
          }
          const finalHtml = errorHtml
            .replace('{{ERROR_MESSAGE}}', message)
            .replace('{{LAST_SUCCESS}}', new Date(lastSuccess).toLocaleString());
          res.status(500).send(finalHtml);
        });
      } else {
        // Serve the main index.html for SPA routing
        const indexPath = join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('index.html not found in dist folder.');
        }
      }
    } catch (parseError) {
      res.status(500).send('Could not parse build status file.');
    }
  });
});


// --- Server Startup ---
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Preview server running at http://localhost:${port}`);
    console.log(`📁 Serving from: ${distPath}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, trying next port...`);
      startServer(port + 1);
    } else {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  });
}

// Initial check for dist folder
if (!fs.existsSync(distPath)) {
    console.warn(`⚠️ Warning: dist folder not found at ${distPath}.`);
    console.warn('The server will start, but will show a "not ready" message until the first Astro build completes.');
}

startServer(PORT);