import fs from 'node:fs';

const fileUrl = new URL('../src/data/at-water-sources.json', import.meta.url);
const raw = fs.readFileSync(fileUrl, 'utf8');
const data = JSON.parse(raw);

const errors = [];
const allowedTypes = new Set(['spring', 'stream', 'river', 'piped', 'town']);

if (!Array.isArray(data)) {
  errors.push('Expected JSON array.');
}

const seenKeys = new Set();
let prevMile = -Infinity;
const typeCounts = Object.create(null);

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
  } else {
    typeCounts[row.type] = (typeCounts[row.type] || 0) + 1;
  }

  if (row.offTrail !== undefined) {
    if (typeof row.offTrail !== 'number' || !Number.isFinite(row.offTrail) || row.offTrail < 0) {
      errors.push(`${where}: offTrail must be a non-negative number when present.`);
    }
  }

  const key = `${row.mile}|${row.name}|${row.type}|${row.offTrail ?? 0}`;
  if (seenKeys.has(key)) errors.push(`${where}: duplicate entry (${key}).`);
  seenKeys.add(key);
}

if (errors.length) {
  console.error(`❌ Water sources validation failed for ${fileUrl.pathname}`); // eslint-disable-line no-console
  for (const e of errors.slice(0, 50)) console.error(`- ${e}`); // eslint-disable-line no-console
  if (errors.length > 50) console.error(`- ...and ${errors.length - 50} more`); // eslint-disable-line no-console
  process.exit(1);
}

console.log(`✅ Water sources OK: ${data.length} entries`); // eslint-disable-line no-console
console.log('Type counts:', typeCounts); // eslint-disable-line no-console
