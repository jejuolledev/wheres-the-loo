import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.mjs';
import { loadToilets } from '../src/lib/toilets.mjs';

let server, base;
before(async () => {
  server = createApp(loadToilets());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('GET /api/nearest returns three toilets nearest to Seoul City Hall, ascending', async () => {
  const res = await fetch(`${base}/api/nearest?lat=37.5663&lng=126.9779`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.count, 3);
  assert.equal(body.results.length, 3);
  for (const r of body.results) {
    assert.ok(r.name && typeof r.hours === 'string' && Number.isFinite(r.lat) && Number.isFinite(r.lng));
    assert.ok(r.distanceM < 2000, 'a toilet within 2 km of City Hall');
  }
  assert.ok(body.results[0].distanceM <= body.results[1].distanceM && body.results[1].distanceM <= body.results[2].distanceM);
  assert.deepEqual(body.results.map((r) => r.rank), [1, 2, 3]);
});

test('GET /api/nearest rejects bad input with 400', async () => {
  for (const q of ['lat=abc&lng=1', 'lat=37&lng=999', 'lat=37&lng=127&n=0', 'lat=37&lng=127&n=50', '']) {
    const res = await fetch(`${base}/api/nearest?${q}`);
    assert.equal(res.status, 400, q);
  }
});

test('GET /api/meta exposes the counted dataset facts', async () => {
  const meta = await (await fetch(`${base}/api/meta`)).json();
  assert.equal(meta.rows, 33820);
  assert.equal(meta.withCoords, 24321);
  assert.equal(meta.duplicatesDropped, 2705);
  assert.equal(meta.readableHours + meta.unknownHours, meta.withCoords);
  assert.equal(meta.openAtFact + meta.closedAtFact, meta.readableHours);
});

test('static: / serves the page and /lib/hours.mjs is JavaScript; path escape is refused', async () => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  const lib = await fetch(`${base}/lib/hours.mjs`);
  assert.equal(lib.status, 200);
  assert.match(lib.headers.get('content-type'), /javascript/);
  const esc = await fetch(`${base}/..%2F..%2Fpackage.json`);
  assert.notEqual(esc.status, 200);
});
