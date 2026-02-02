import fs from 'node:fs';
import path from 'node:path';

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = (cols[i] ?? '').trim();
    return row;
  });
  return { header, rows };
}

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeType(type) {
  const t = String(type || '').trim().toLowerCase();
  if (!t) return 'unknown';
  if (t === 'tap' || t === 'faucet' || t === 'spigot') return 'piped';
  if (t === 'creek') return 'stream';
  return t;
}

const csvPath = process.argv[2] || 'private/awol/awol-water-sources.csv';
const outPath = process.argv[3] || 'private/awol/awol-water-sources.json';

if (csvPath === '--help' || csvPath === '-h') {
  console.log('Usage: node scripts/import-awol-water-sources.js [inputCsv] [outputJson]'); // eslint-disable-line no-console
  console.log('Default input:  private/awol/awol-water-sources.csv'); // eslint-disable-line no-console
  console.log('Default output: private/awol/awol-water-sources.json'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Missing input CSV: ${csvPath}`); // eslint-disable-line no-console
  console.error('Copy `private/awol/awol-water-sources.template.csv` to that path and fill it in.'); // eslint-disable-line no-console
  process.exit(1);
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const { header, rows } = parseCsv(csvText);

if (!header.includes('mile') || !header.includes('name')) {
  console.error(`CSV must include at least headers: mile,name (got: ${header.join(', ')})`); // eslint-disable-line no-console
  process.exit(1);
}

const normalized = [];
for (const r of rows) {
  const mile = asNumber(r.mile, null);
  const name = String(r.name || '').trim();
  if (mile === null || !name) continue;
  const type = normalizeType(r.type);
  const offTrail = asNumber(r.offTrail, 0) ?? 0;
  normalized.push({ mile, name, type, offTrail });
}

normalized.sort((a, b) => a.mile - b.mile || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2) + '\n', 'utf8');

console.log(`✅ Wrote ${outPath} (${normalized.length} entries) from ${csvPath}`); // eslint-disable-line no-console
