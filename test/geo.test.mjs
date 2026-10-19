import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineM, nearest } from '../src/lib/geo.mjs';

test('haversine: Seoul City Hall to Seoul Station is about 1.9 km', () => {
  const cityHall = { lat: 37.5663, lng: 126.9779 };
  const station = { lat: 37.5547, lng: 126.9707 };
  const d = haversineM(cityHall, station);
  assert.ok(d > 1300 && d < 1500, `got ${d}`);
});

test('haversine: same point is 0', () => {
  assert.equal(haversineM({ lat: 35, lng: 128 }, { lat: 35, lng: 128 }), 0);
});

test('nearest returns n items ascending by distance', () => {
  const items = [
    { name: 'far', lat: 37.60, lng: 127.00 },
    { name: 'near', lat: 37.5665, lng: 126.9780 },
    { name: 'mid', lat: 37.57, lng: 126.98 },
    { name: 'farther', lat: 38.0, lng: 127.5 },
  ];
  const r = nearest(items, { lat: 37.5663, lng: 126.9779 }, 3);
  assert.deepEqual(r.map((x) => x.name), ['near', 'mid', 'far']);
  assert.ok(r[0].distanceM < r[1].distanceM && r[1].distanceM < r[2].distanceM);
  assert.equal(r.length, 3);
});
