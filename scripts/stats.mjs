// Prints the counted facts quoted in README.md. Run: node scripts/stats.mjs
import { loadToilets } from '../src/lib/toilets.mjs';
import { formatMinutes } from '../src/lib/hours.mjs';

const { meta } = loadToilets();
const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
const fact = formatMinutes(meta.factMinutes);
const contrast = formatMinutes(meta.contrastMinutes);

console.log(`Dataset: ${meta.dataset}`);
console.log(`Source:  ${meta.source} (downloaded ${meta.downloaded}; latest reference date in file ${meta.latestReferenceDate})`);
console.log(`Rows in CSV:                    ${meta.rows.toLocaleString('en-US')}`);
console.log(`Rows with usable coordinates:   ${meta.withCoords.toLocaleString('en-US')} (${pct(meta.withCoords, meta.rows)})`);
console.log(`  with readable opening hours:  ${meta.readableHours.toLocaleString('en-US')} (${pct(meta.readableHours, meta.withCoords)})`);
console.log(`  with unreadable hours text:   ${meta.unknownHours.toLocaleString('en-US')} (${pct(meta.unknownHours, meta.withCoords)})`);
console.log(`At ${contrast}: open ${meta.openAtContrast.toLocaleString('en-US')}, closed ${meta.closedAtContrast.toLocaleString('en-US')} (${pct(meta.closedAtContrast, meta.readableHours)} closed)`);
console.log(`At ${fact}: open ${meta.openAtFact.toLocaleString('en-US')}, closed ${meta.closedAtFact.toLocaleString('en-US')} (${pct(meta.closedAtFact, meta.readableHours)} closed)`);
console.log('');
console.log(`Sentence: At ${fact}, ${meta.closedAtFact.toLocaleString('en-US')} of the ${meta.readableHours.toLocaleString('en-US')} toilets with readable hours are closed (${pct(meta.closedAtFact, meta.readableHours)}).`);
