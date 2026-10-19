import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsvObjects } from './csv.mjs';
import { parseHours, statusAt } from './hours.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA_FILE = path.resolve(HERE, '../../data/toilets.csv');

// Korea bounding box: rows outside it have broken or missing coordinates.
export const KOREA = { latMin: 33, latMax: 39, lngMin: 124, lngMax: 132 };

/** Column names in the 전국공중화장실표준데이터 CSV. */
const COL = {
  type: '구분',
  name: '화장실명',
  address: '소재지도로명주소',
  addressLot: '소재지지번주소',
  hours: '개방시간',
  lat: '위도',
  lng: '경도',
  refDate: '데이터기준일자',
};

export function inKorea(lat, lng) {
  return lat >= KOREA.latMin && lat <= KOREA.latMax && lng >= KOREA.lngMin && lng <= KOREA.lngMax;
}

/**
 * Load the dataset once. Returns { toilets, meta }.
 * toilets: rows with usable coordinates. meta: counts for the footer fact.
 */
export function loadToilets(file = DATA_FILE, { factMinutes = 22 * 60, contrastMinutes = 15 * 60 } = {}) {
  const text = fs.readFileSync(file, 'utf8');
  const rows = parseCsvObjects(text);
  const toilets = [];
  let latestDate = '';
  const counts = { readable: 0, unknown: 0, openAtFact: 0, closedAtFact: 0, openAtContrast: 0, closedAtContrast: 0 };

  for (const r of rows) {
    const d = r[COL.refDate] || '';
    if (d > latestDate) latestDate = d;
    const lat = Number(r[COL.lat]);
    const lng = Number(r[COL.lng]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inKorea(lat, lng)) continue;
    const hours = (r[COL.hours] || '').trim();
    const t = {
      type: r[COL.type] || '',
      name: r[COL.name] || '',
      address: r[COL.address] || r[COL.addressLot] || '',
      hours,
      lat,
      lng,
    };
    toilets.push(t);
    const parsed = parseHours(hours);
    if (parsed.kind === 'unknown') counts.unknown++;
    else {
      counts.readable++;
      if (statusAt(parsed, factMinutes) === 'open') counts.openAtFact++; else counts.closedAtFact++;
      if (statusAt(parsed, contrastMinutes) === 'open') counts.openAtContrast++; else counts.closedAtContrast++;
    }
  }

  const meta = {
    dataset: '전국공중화장실표준데이터 (Korea public toilet standard dataset)',
    source: 'https://www.data.go.kr/data/15012892/standard.do',
    downloaded: '2026-10-18',
    latestReferenceDate: latestDate,
    rows: rows.length,
    withCoords: toilets.length,
    readableHours: counts.readable,
    unknownHours: counts.unknown,
    factMinutes,
    openAtFact: counts.openAtFact,
    closedAtFact: counts.closedAtFact,
    contrastMinutes,
    openAtContrast: counts.openAtContrast,
    closedAtContrast: counts.closedAtContrast,
  };
  return { toilets, meta };
}
