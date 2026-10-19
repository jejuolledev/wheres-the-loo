// Where's the Loo — page logic. Imports the same hours reader the server uses.
import { parseHours, statusAt, minutesOf, formatMinutes } from '/lib/hours.mjs';

const DEMO_SPOTS = [
  { name: 'Jeonju Hanok Village', lat: 35.8150, lng: 127.1530 },
  { name: 'Hongdae, Seoul', lat: 37.5571, lng: 126.9245 },
  { name: 'Gwangju City Hall, Gyeonggi', lat: 37.4295, lng: 127.2550 },
];

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const cardsEl = $('cards');
const locateBtn = $('locate');

// ---- Map -------------------------------------------------------------
const hasLeaflet = typeof L !== 'undefined';
let map, youMarker;
const pinMarkers = [];
if (hasLeaflet) {
  map = L.map('map', { zoomControl: true, attributionControl: true }).setView([36.3, 127.8], 7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}

// ---- State -----------------------------------------------------------
let results = [];            // last three results from the server
let clockMinutes = minutesOf(); // minutes since midnight used for open/closed

// ---- Demo spots ------------------------------------------------------
const demoList = $('demo-list');
for (const spot of DEMO_SPOTS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = spot.name;
  b.addEventListener('click', () => { document.querySelector('.demo').open = false; find(spot.lat, spot.lng, spot.name); });
  demoList.appendChild(b);
}

// ---- Find the three nearest -----------------------------------------
async function find(lat, lng, label) {
  setStatus(`Looking near ${label}…`);
  let body;
  try {
    const res = await fetch(`/api/nearest?lat=${lat}&lng=${lng}&n=3`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.json();
  } catch (err) {
    setStatus("The toilet list didn't load. Is the server running?", true);
    return;
  }
  results = body.results.map((r) => ({ ...r, parsed: parseHours(r.hours) }));
  drawMap(lat, lng);
  render();
  setStatus(`Nearest three to ${label}, straight-line distance.`);
}

function drawMap(lat, lng) {
  if (!hasLeaflet) return;
  if (youMarker) youMarker.remove();
  youMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div class="pin-you" title="You"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 1000 }).addTo(map);
  for (const m of pinMarkers) m.remove();
  pinMarkers.length = 0;
  for (const r of results) {
    // Nearest on top when two toilets share a spot (it happens in the data).
    const m = L.marker([r.lat, r.lng], { icon: pinIcon(r, statusAt(r.parsed, clockMinutes)), zIndexOffset: (10 - r.rank) * 100 }).addTo(map);
    m.bindPopup(`<b>${escapeHtml(r.name)}</b><br>${escapeHtml(r.hours || '—')}`);
    pinMarkers.push(m);
  }
  const pts = [[lat, lng], ...results.map((r) => [r.lat, r.lng])];
  map.fitBounds(pts, { padding: [36, 36], maxZoom: 17 });
}

function pinIcon(r, status) {
  return L.divIcon({ className: '', html: `<div class="pin ${status === 'closed' ? 'is-closed' : ''}">${r.rank}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
}

// ---- Cards -----------------------------------------------------------
function render() {
  cardsEl.innerHTML = '';
  if (!results.length) return;
  results.forEach((r, i) => {
    const status = statusAt(r.parsed, clockMinutes);
    const li = document.createElement('li');
    li.className = `card is-${status}`;
    li.innerHTML = `
      <div class="rank">${r.rank}</div>
      <div class="name">${escapeHtml(r.name)}</div>
      <div class="dist">${fmtDistance(r.distanceM)}</div>
      <div class="addr">${escapeHtml(r.address || '')}</div>
      <div class="hours"><span class="label">Hours: </span>${escapeHtml(r.hours || '—')}</div>
      <div class="badge">${badgeText(status)}</div>`;
    cardsEl.appendChild(li);
    if (hasLeaflet && pinMarkers[i]) pinMarkers[i].setIcon(pinIcon(r, status));
  });
}

function badgeText(s) { return s === 'open' ? 'Open' : s === 'closed' ? 'Closed' : 'Hours unknown'; }
function fmtDistance(m) { return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`; }
function setStatus(text, isError = false) { statusEl.textContent = text; statusEl.classList.toggle('is-error', isError); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---- Use my location -------------------------------------------------
locateBtn.addEventListener('click', () => {
  if (!('geolocation' in navigator)) { setStatus("This browser can't share a location. Try a demo spot.", true); return; }
  locateBtn.disabled = true;
  locateBtn.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    (pos) => { resetLocateBtn(); find(pos.coords.latitude, pos.coords.longitude, 'you'); },
    () => { resetLocateBtn(); setStatus("Couldn't get your location. Try a demo spot.", true); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
});
function resetLocateBtn() { locateBtn.disabled = false; locateBtn.textContent = 'Use my location'; }

// ---- Time dial -------------------------------------------------------
const dial = $('dial');
const dialTime = $('dial-time');
let dialIsNow = true;

function setClock(minutes, isNow) {
  clockMinutes = minutes;
  dialIsNow = isNow;
  dial.value = String(minutes - (minutes % 15));
  dialTime.textContent = (isNow ? 'Now · ' : '') + formatMinutes(minutes);
  render();
}
dial.addEventListener('input', () => setClock(Number(dial.value), false));
$('dial-now').addEventListener('click', () => setClock(minutesOf(), true));
setClock(minutesOf(), true);
setInterval(() => { if (dialIsNow) setClock(minutesOf(), true); }, 30000);

// ---- Footer fact from /api/meta (same numbers as scripts/stats.mjs) --
fetch('/api/meta').then((r) => r.json()).then((m) => {
  const pct = (100 * m.closedAtFact / m.readableHours).toFixed(0);
  $('fact').innerHTML = `In this dataset, at ${formatMinutes(m.factMinutes)}, <span class="n">${m.closedAtFact.toLocaleString('en-US')}</span> of the ${m.readableHours.toLocaleString('en-US')} toilets with readable hours are closed — about ${pct}%. At ${formatMinutes(m.contrastMinutes)} it's ${m.closedAtContrast.toLocaleString('en-US')}.`;
}).catch(() => { /* footer fact is optional */ });

// ---- Deep link: ?lat=&lng=&at=HH:MM (used for the demo and headless checks)
const q = new URLSearchParams(location.search);
if (q.has('at') && /^\d{1,2}:\d{2}$/.test(q.get('at'))) {
  const [h, m] = q.get('at').split(':').map(Number);
  setClock(h * 60 + m, false);
}
if (q.has('spot')) {
  const spot = DEMO_SPOTS[Number(q.get('spot'))];
  if (spot) find(spot.lat, spot.lng, spot.name);
} else if (q.has('lat') && q.has('lng')) {
  find(Number(q.get('lat')), Number(q.get('lng')), 'this link\'s coordinates');
}
