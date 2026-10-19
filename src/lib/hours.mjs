// Opening-hours reader for the Korean public-toilet standard dataset.
// The "개방시간" column is free text (589 distinct spellings in the 2026-10-18
// snapshot). This module turns it into something a clock can check.
// Pure ES module: runs in Node and in the browser unchanged.

const ALWAYS_WORDS = ['24시간', '연중무휴', '상시', '종일', '주야', '24시', '24h', '24H', '연중'];

/**
 * @param {string} text raw hours text from the dataset
 * @returns {{kind:'always'|'range'|'unknown', ranges:{start:number,end:number}[], raw:string}}
 *   start/end are minutes since midnight; end > 1440 means the range crosses midnight.
 */
export function parseHours(text) {
  const raw = (text ?? '').toString();
  const t = raw.replace(/\s+/g, '').replace(/[∼～〜﹣–—]/g, (m) => (m === '∼' || m === '～' || m === '〜' ? '~' : '-'));
  if (!t) return { kind: 'unknown', ranges: [], raw };

  const ranges = findRanges(t);
  if (ranges.length) {
    // A range that covers the whole day is "always".
    if (ranges.some((r) => r.start === 0 && r.end >= 1439)) return { kind: 'always', ranges: [], raw };
    return { kind: 'range', ranges, raw };
  }
  if (ALWAYS_WORDS.some((w) => t.includes(w)) || /^24(:00(:00)?)?$/.test(t)) {
    return { kind: 'always', ranges: [], raw };
  }
  return { kind: 'unknown', ranges: [], raw };
}

// Matches HH:MM~HH:MM, HH~HH, HHMM~HHMM, H시~H시, with ~ or - as the separator.
// The lookahead rejects month/day spans such as "하절기(7~9월)".
const RANGE_RE = /(?<![\d.])(\d{1,2})(?::?(\d{2}))?시?[~-](\d{1,2})(?::?(\d{2}))?시?(?![\d월일년.])/g;

function findRanges(t) {
  const out = [];
  for (const m of t.matchAll(RANGE_RE)) {
    const sh = +m[1], sm = m[2] === undefined ? 0 : +m[2];
    const eh = +m[3], em = m[4] === undefined ? 0 : +m[4];
    if (sh > 24 || eh > 24 || sm > 59 || em > 59) continue;
    // "0900~1800" style: four digits captured as hh + mm already; "9~18" style has no minutes.
    const start = sh * 60 + sm;
    let end = eh * 60 + em;
    // "~24:00", "~00:00" and overnight spans such as 05:00~01:00 all end after the start.
    if (end <= start) end += 1440;
    out.push({ start, end });
  }
  return out;
}

/**
 * @param {ReturnType<typeof parseHours>} parsed
 * @param {number} minutes minutes since local midnight (0–1439)
 * @returns {'open'|'closed'|'unknown'}
 */
export function statusAt(parsed, minutes) {
  if (parsed.kind === 'always') return 'open';
  if (parsed.kind !== 'range') return 'unknown';
  const m = ((minutes % 1440) + 1440) % 1440;
  // First readable range wins (day-tagged strings are simplified; see spec.md).
  const r = parsed.ranges[0];
  if (m >= r.start && m < r.end) return 'open';
  // Overnight: the part after midnight.
  if (r.end > 1440 && m < r.end - 1440) return 'open';
  return 'closed';
}

/** Minutes since local midnight for a Date. */
export function minutesOf(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatMinutes(m) {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
