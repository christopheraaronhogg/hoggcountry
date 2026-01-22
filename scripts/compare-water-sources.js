import fs from 'node:fs';

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mileKey(mile) {
  const n = Number(mile);
  if (!Number.isFinite(n)) return 'NaN';
  return (Math.round(n * 10) / 10).toFixed(1);
}

function keyOf(row) {
  return `${mileKey(row.mile)}|${normName(row.name)}|${String(row.type || 'unknown').toLowerCase()}`;
}

function binLabel(mile) {
  const n = Number(mile);
  if (!Number.isFinite(n)) return 'unknown';
  const start = Math.floor(n / 100) * 100;
  return `${start}-${start + 99.9}`;
}

const sitePath = process.argv[2] || 'src/data/at-water-sources.json';
const awolPath = process.argv[3] || 'src/data/awol-water-sources.json';

if (sitePath === '--help' || sitePath === '-h') {
  console.log('Usage: node scripts/compare-water-sources.js [siteJson] [awolJson]'); // eslint-disable-line no-console
  console.log('Default site: src/data/at-water-sources.json'); // eslint-disable-line no-console
  console.log('Default awol: src/data/awol-water-sources.json'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(sitePath)) {
  console.error(`Missing site dataset: ${sitePath}`); // eslint-disable-line no-console
  process.exit(1);
}
if (!fs.existsSync(awolPath)) {
  console.error(`Missing AWOL dataset: ${awolPath}`); // eslint-disable-line no-console
  console.error('Run: `npm run import:awol-water` after creating `src/data/awol-water-sources.csv`.'); // eslint-disable-line no-console
  process.exit(1);
}

const site = loadJson(sitePath);
const awol = loadJson(awolPath);

const siteKeys = new Set(site.map(keyOf));
const awolKeys = new Set(awol.map(keyOf));

const missing = awol.filter((r) => !siteKeys.has(keyOf(r)));
const extra = site.filter((r) => !awolKeys.has(keyOf(r)));

const byBin = new Map();
for (const r of awol) {
  const label = binLabel(r.mile);
  const cur = byBin.get(label) || { awol: 0, site: 0 };
  cur.awol++;
  byBin.set(label, cur);
}
for (const r of site) {
  const label = binLabel(r.mile);
  const cur = byBin.get(label) || { awol: 0, site: 0 };
  cur.site++;
  byBin.set(label, cur);
}

const binsSorted = Array.from(byBin.entries()).sort((a, b) => {
  const aStart = Number(a[0].split('-')[0]);
  const bStart = Number(b[0].split('-')[0]);
  if (!Number.isFinite(aStart) || !Number.isFinite(bStart)) return a[0].localeCompare(b[0]);
  return aStart - bStart;
});

console.log(`Site sources: ${site.length}`); // eslint-disable-line no-console
console.log(`AWOL sources: ${awol.length}`); // eslint-disable-line no-console
console.log(`Missing vs AWOL: ${missing.length}`); // eslint-disable-line no-console
console.log(`Extra vs AWOL: ${extra.length}`); // eslint-disable-line no-console
console.log(''); // eslint-disable-line no-console
console.log('Coverage by 100-mile bin (site / awol):'); // eslint-disable-line no-console
for (const [label, counts] of binsSorted) {
  if (label === 'unknown') continue;
  console.log(`- ${label}: ${counts.site} / ${counts.awol}`); // eslint-disable-line no-console
}

if (missing.length) {
  console.log(''); // eslint-disable-line no-console
  console.log('First missing (up to 25):'); // eslint-disable-line no-console
  for (const r of missing.slice(0, 25)) {
    console.log(`- ${mileKey(r.mile)} ${r.name} (${r.type || 'unknown'})`); // eslint-disable-line no-console
  }
}
