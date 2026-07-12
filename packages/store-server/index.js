#!/usr/bin/env node
/**
 * buyQk Shared Store Server
 * A tiny in-memory JSON store with SSE push, so all three Vite apps
 * (seller :3001, admin :3002, customer :3000) can share data in real-time.
 * HTTP is not origin-restricted (CORS headers allow all), so cross-port
 * communication works perfectly.
 *
 * Starts on port 3099.
 */

const http = require('http');

// In-memory store - same as localStorage but shared across all origins
const store = {};

// SSE subscriber registry: collection -> [res, ...]
const subscribers = {};

function broadcast(collection) {
  const subs = subscribers[collection] || [];
  const payload = JSON.stringify(store[collection] || []);
  const dead = [];
  subs.forEach((res, i) => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      dead.push(i);
    }
  });
  // Clean up dead connections
  dead.reverse().forEach(i => subs.splice(i, 1));
}

const server = http.createServer((req, res) => {
  // CORS — allow all origins (needed for cross-port dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost:3099');
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'shops'] or ['sse', 'shops']

  // GET /api/:collection — read all
  if (req.method === 'GET' && parts[0] === 'api' && parts[1]) {
    const col = parts[1];
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(store[col] || []));
    return;
  }

  // POST /api/:collection — overwrite all (save)
  if (req.method === 'POST' && parts[0] === 'api' && parts[1]) {
    const col = parts[1];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        store[col] = Array.isArray(parsed) ? parsed : [];
        broadcast(col);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /sse/:collection — Server-Sent Events subscription
  if (req.method === 'GET' && parts[0] === 'sse' && parts[1]) {
    const col = parts[1];
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.writeHead(200);

    // Send current value immediately
    res.write(`data: ${JSON.stringify(store[col] || [])}\n\n`);

    // Register
    if (!subscribers[col]) subscribers[col] = [];
    subscribers[col].push(res);

    // Heartbeat every 20s to keep connection alive
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) { clearInterval(hb); } }, 20000);

    req.on('close', () => {
      clearInterval(hb);
      const subs = subscribers[col];
      if (subs) {
        const i = subs.indexOf(res);
        if (i !== -1) subs.splice(i, 1);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3099;
server.listen(PORT, () => {
  console.log(`\x1b[32m✓\x1b[0m buyQk Store Server running at \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log('  All three Vite apps can now share data in real-time.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m✘\x1b[0m Port ${PORT} already in use. Store server already running.`);
  } else {
    console.error(err);
  }
});
