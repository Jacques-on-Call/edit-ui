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

// Add CORS headers for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Preview not ready - build your Astro site first');
  }
});

// Enhanced SSE for live reload
const clients = new Set();

app.get('/sse', (req, res) => {
  console.log('🔗 SSE client connected');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial connection message
  res.write('data: connected\n\n');

  const client = {
    id: Date.now(),
    response: res
  };

  clients.add(client);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write('data: heartbeat\n\n');
    } catch (e) {
      // Client disconnected
      console.log('Client disconnected, clearing heartbeat.');
      clearInterval(heartbeat);
      clients.delete(client);
    }
  }, 30000);

  req.on('close', () => {
    console.log('🔒 SSE client disconnected');
    clearInterval(heartbeat);
    clients.delete(client);
  });
});

// File watcher with better error handling
const watcher = chokidar.watch(distPath, {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (path) => {
  console.log(`📁 File changed: ${path}`);
  clients.forEach(client => {
    try {
      client.response.write('data: reload\n\n');
    } catch (error) {
      console.log('❌ Failed to send reload to client, removing...');
      clients.delete(client);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down preview server...');
  watcher.close();
  clients.forEach(client => {
    client.response.end();
  });
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
  console.log(`🔗 SSE endpoint: http://localhost:${PORT}/sse`);
});