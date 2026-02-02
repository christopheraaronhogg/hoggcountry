import fs from 'node:fs';
import path from 'node:path';

const defaultPath = new URL('../src/data/at-hydro-crossings.json', import.meta.url);
const inputPath = process.argv[2] || path.resolve(defaultPath.pathname);

if (inputPath === '--help' || inputPath === '-h') {
  console.log('Usage: node scripts/validate-hydro-crossings.js [inputJson]'); // eslint-disable-line no-console
  console.log('Default input: src/data/at-hydro-crossings.json'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Missing dataset: ${inputPath}`); // eslint-disable-line no-console
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);

const errors = [];
const allowedTypes = new Set(['stream', 'river', 'unknown']);
const allowedFlow = new Set(['perennial', 'intermittent', 'ephemeral', 'unknown']);

if (!Array.isArray(data)) {
  errors.push('Expected JSON array.');
}

let prevMile = -Infinity;
const seenKeys = new Set();
const flowCounts = Object.create(null);

for (let i = 0; i < (Array.isArray(data) ? data.length : 0); i++) {
  const row = data[i];
  const where = `index ${i}`;

  if (typeof row !== 'object' || row === null) {
    errors.push(`${where}: Expected object.`);
    continue;
  }

  if (typeof row.mile !== 'number' || !Number.isFinite(row.mile)) {
    errors.push(`${where}: mile must be a finite number.`);
  } else {
    if (row.mile < 0 || row.mile > 3000) errors.push(`${where}: mile out of expected range: ${row.mile}`);
    if (row.mile < prevMile) errors.push(`${where}: list is not sorted by mile (prev=${prevMile}, current=${row.mile}).`);
    prevMile = row.mile;
  }

  if (typeof row.name !== 'string' || row.name.trim().length === 0) {
    errors.push(`${where}: name must be a non-empty string.`);
  }

  if (typeof row.type !== 'string' || !allowedTypes.has(row.type)) {
    errors.push(`${where}: type must be one of ${Array.from(allowedTypes).join(', ')}.`);
  }

  if (typeof row.flow !== 'string' || !allowedFlow.has(row.flow)) {
    errors.push(`${where}: flow must be one of ${Array.from(allowedFlow).join(', ')}.`);
  } else {
    flowCounts[row.flow] = (flowCounts[row.flow] || 0) + 1;
  }

  if (typeof row.offTrail !== 'number' || !Number.isFinite(row.offTrail) || row.offTrail < 0) {
    errors.push(`${where}: offTrail must be a non-negative number.`);
  }

  if (typeof row.lat !== 'number' || !Number.isFinite(row.lat) || row.lat < -90 || row.lat > 90) {
    errors.push(`${where}: lat must be a valid latitude.`);
  }

  if (typeof row.lon !== 'number' || !Number.isFinite(row.lon) || row.lon < -180 || row.lon > 180) {
    errors.push(`${where}: lon must be a valid longitude.`);
  }

  const pid = row?.nhd?.permanentId;
  if (typeof pid !== 'string' || pid.trim().length === 0) {
    errors.push(`${where}: nhd.permanentId must be a non-empty string.`);
  }

  const key = `${row.mile}|${row.name}|${row.type}|${row.flow}`;
  if (seenKeys.has(key)) errors.push(`${where}: duplicate entry (${key}).`);
  seenKeys.add(key);
}

if (errors.length) {
  console.error(`❌ Hydro crossings validation failed for ${inputPath}`); // eslint-disable-line no-console
  for (const e of errors.slice(0, 50)) console.error(`- ${e}`); // eslint-disable-line no-console
  if (errors.length > 50) console.error(`- ...and ${errors.length - 50} more`); // eslint-disable-line no-console
  process.exit(1);
}

console.log(`✅ Hydro crossings OK: ${data.length} entries`); // eslint-disable-line no-console
console.log('Flow counts:', flowCounts); // eslint-disable-line no-console

