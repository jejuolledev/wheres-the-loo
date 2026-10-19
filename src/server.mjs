// Where's the Loo — one-file HTTP server. No dependencies.
// Routes: static files from public/, /lib/hours.mjs (shared with the browser),
// GET /api/nearest?lat&lng&n, GET /api/meta.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadToilets } from './lib/toilets.mjs';
import { nearest } from './lib/geo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, '../public');
const LIB = path.resolve(HERE, 'lib');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

/** Resolve a URL path to a file inside root, or null if it escapes root. */
function safeJoin(root, urlPath) {
  const p = path.normalize(path.join(root, decodeURIComponent(urlPath)));
  return p.startsWith(root + path.sep) || p === root ? p : null;
}

export function createApp({ toilets, meta }) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }

    if (url.pathname === '/api/nearest') {
      const num = (k) => { const v = url.searchParams.get(k); return v === null || v.trim() === '' ? NaN : Number(v); };
      const lat = num('lat');
      const lng = num('lng');
      const nRaw = url.searchParams.get('n');
      const n = nRaw === null ? 3 : Number(nRaw);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return json(res, 400, { error: 'lat and lng must be numbers (lat -90..90, lng -180..180)' });
      }
      if (!Number.isInteger(n) || n < 1 || n > 10) return json(res, 400, { error: 'n must be an integer 1..10' });
      const results = nearest(toilets, { lat, lng }, n).map((t, i) => ({
        rank: i + 1,
        name: t.name,
        type: t.type,
        address: t.address,
        hours: t.hours,
        lat: t.lat,
        lng: t.lng,
        distanceM: Math.round(t.distanceM),
      }));
      return json(res, 200, { query: { lat, lng, n }, count: results.length, results });
    }

    if (url.pathname === '/api/meta') return json(res, 200, meta);

    if (url.pathname === '/lib/hours.mjs') return sendFile(res, path.join(LIB, 'hours.mjs'));

    const rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = safeJoin(PUBLIC, rel);
    if (!file) { res.writeHead(400); res.end('Bad path'); return; }
    return sendFile(res, file);
  });
}

// Start only when run directly (tests import createApp instead).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const t0 = Date.now();
  const data = loadToilets();
  const server = createApp(data);
  server.listen(port, () => {
    console.log(`Where's the Loo → http://localhost:${port}`);
    console.log(`Loaded ${data.meta.withCoords.toLocaleString('en-US')} toilets with coordinates in ${Date.now() - t0} ms`);
  });
}
