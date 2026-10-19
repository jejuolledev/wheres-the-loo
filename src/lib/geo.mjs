// Straight-line distance on a sphere (haversine) and nearest-n selection.

const R = 6371008.8; // mean Earth radius in metres
const toRad = (d) => (d * Math.PI) / 180;

/** Distance in metres between two {lat, lng} points. */
export function haversineM(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * The n items nearest to point, ascending by distance.
 * Each result is a copy of the item with distanceM added.
 * Linear scan: 24k rows takes a few milliseconds, which is fine for this proof of concept.
 */
export function nearest(items, point, n = 3) {
  const best = []; // kept sorted ascending, length <= n
  for (const item of items) {
    const d = haversineM(point, item);
    if (best.length === n && d >= best[n - 1].distanceM) continue;
    let i = best.length;
    while (i > 0 && best[i - 1].distanceM > d) i--;
    best.splice(i, 0, { ...item, distanceM: d });
    if (best.length > n) best.pop();
  }
  return best;
}
