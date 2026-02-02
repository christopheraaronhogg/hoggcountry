import fs from 'node:fs';
import path from 'node:path';

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mileLabel(mile) {
  const n = asNumber(mile, null);
  if (n === null) return '—';
  return (Math.round(n * 10) / 10).toFixed(1);
}

function offLabel(offTrail) {
  const n = asNumber(offTrail, 0) ?? 0;
  if (n === 0) return '0';
  return (Math.round(n * 10) / 10).toFixed(1);
}

function binLabel(mile) {
  const n = asNumber(mile, null);
  if (n === null) return 'unknown';
  const start = Math.floor(n / 100) * 100;
  const end = start + 99.9;
  return `${start}-${end.toFixed(1)}`;
}

function mdEscape(text) {
  return String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

const inPath = process.argv[2] || 'private/awol/awol-water-sources.json';
const outPath = process.argv[3] || 'private/awol/awol-water-sources.md';

if (inPath === '--help' || inPath === '-h') {
  console.log('Usage: node scripts/generate-awol-water-reference.js [inputJson] [outputMd]'); // eslint-disable-line no-console
  console.log('Default input:  private/awol/awol-water-sources.json'); // eslint-disable-line no-console
  console.log('Default output: private/awol/awol-water-sources.md'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(inPath)) {
  console.error(`Missing input JSON: ${inPath}`); // eslint-disable-line no-console
  console.error('Run: `npm run import:awol-water` after creating `private/awol/awol-water-sources.csv`.'); // eslint-disable-line no-console
  process.exit(1);
}

const raw = fs.readFileSync(inPath, 'utf8');
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  console.error(`Expected JSON array in ${inPath}`); // eslint-disable-line no-console
  process.exit(1);
}

const rows = data
  .filter((r) => r && typeof r === 'object')
  .map((r) => ({
    mile: asNumber(r.mile, null),
    name: String(r.name || '').trim(),
    type: String(r.type || 'unknown').trim().toLowerCase() || 'unknown',
    offTrail: asNumber(r.offTrail, 0) ?? 0,
  }))
  .filter((r) => r.mile !== null && r.name.length > 0)
  .sort((a, b) => (a.mile ?? 0) - (b.mile ?? 0) || a.name.localeCompare(b.name));

const typeCounts = Object.create(null);
for (const r of rows) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;

const bins = new Map();
for (const r of rows) {
  const label = binLabel(r.mile);
  const list = bins.get(label) || [];
  list.push(r);
  bins.set(label, list);
}

const binsSorted = Array.from(bins.entries()).sort((a, b) => {
  const aStart = Number(String(a[0]).split('-')[0]);
  const bStart = Number(String(b[0]).split('-')[0]);
  if (!Number.isFinite(aStart) || !Number.isFinite(bStart)) return String(a[0]).localeCompare(String(b[0]));
  return aStart - bStart;
});

const lines = [];
lines.push('# AWOL Water Sources (private)');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push(`Sources: **${rows.length}**`);
lines.push('');
lines.push('## Types');
lines.push('');
for (const [type, count] of Object.entries(typeCounts).sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`- **${type}**: ${count}`);
}
lines.push('');
lines.push('## Index (100-mile bins)');
lines.push('');
for (const [label, list] of binsSorted) {
  if (label === 'unknown') continue;
  const anchor = label.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase();
  lines.push(`- [${label} (${list.length})](#${anchor})`);
}
lines.push('');

for (const [label, list] of binsSorted) {
  if (label === 'unknown') continue;
  lines.push(`## ${label}`);
  lines.push('');
  lines.push('| Mile | Name | Type | Off trail (mi) |');
  lines.push('| ---: | --- | --- | ---: |');
  for (const r of list) {
    lines.push(`| ${mileLabel(r.mile)} | ${mdEscape(r.name)} | ${mdEscape(r.type)} | ${offLabel(r.offTrail)} |`);
  }
  lines.push('');
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

console.log(`✅ Wrote ${outPath} (${rows.length} entries)`); // eslint-disable-line no-console
