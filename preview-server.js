import express from 'express';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// Serve static files from dist folder (Astro's build output)
const distPath = resolve(process.cwd(), '..', 'dist');
app.use(express.static(distPath));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Preview not ready - build your Astro site first');
  }
});

// Live reload when files change
const watcher = chokidar.watch(distPath, {
  ignored: /node_modules/,
  persistent: true
});

const clients = [];

// SSE for live reload
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  clients.push(res);

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

watcher.on('change', (path) => {
  console.log(`File changed: ${path}`);
  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
});