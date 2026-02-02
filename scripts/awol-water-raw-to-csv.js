import fs from 'node:fs';
import path from 'node:path';

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeType(type) {
  const t = String(type || '').trim().toLowerCase();
  if (!t) return '';
  if (t === 'tap' || t === 'faucet' || t === 'spigot') return 'piped';
  if (t === 'creek' || t === 'brook' || t === 'branch') return 'stream';
  return t;
}

function inferType(name) {
  const n = String(name || '').toLowerCase();
  if (/\bspring\b/.test(n)) return 'spring';
  if (/\b(creek|brook|branch|stream)\b/.test(n)) return 'stream';
  if (/\briver\b/.test(n)) return 'river';
  if (/\b(spigot|faucet|tap|pump|well|hydrant)\b/.test(n)) return 'piped';
  if (/\b(town|store|market|outfitter|hostel|inn|lodge)\b/.test(n)) return 'town';
  return 'unknown';
}

function csvCell(value) {
  const s = String(value ?? '');
  if (!/[",\n]/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const hasPipe = trimmed.includes('|');
  const hasTab = trimmed.includes('\t');

  if (hasPipe || hasTab) {
    const parts = (hasPipe ? trimmed.split('|') : trimmed.split('\t')).map((p) => p.trim()).filter(Boolean);
    const mile = asNumber(parts[0], null);
    if (mile === null) return { error: `Could not parse mile: ${parts[0]}` };
    const name = String(parts[1] || '').trim();
    if (!name) return { error: 'Missing name' };
    const type = normalizeType(parts[2]) || inferType(name);
    const offTrail = asNumber(parts[3], 0) ?? 0;
    return { mile, name, type, offTrail };
  }

  // Simple format: "<mile> <name...> [+offTrail]"
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!m) return { error: 'Unrecognized format' };

  const mile = asNumber(m[1], null);
  if (mile === null) return { error: `Could not parse mile: ${m[1]}` };

  let rest = m[2].trim();
  let offTrail = 0;

  // "+0.2" or "+0.2mi"
  const offMatch = rest.match(/\s*\+\s*(\d+(?:\.\d+)?)\s*(?:mi)?\s*$/i);
  if (offMatch) {
    offTrail = asNumber(offMatch[1], 0) ?? 0;
    rest = rest.slice(0, offMatch.index).trim();
  }

  // Optional "[type]"
  let type = '';
  const typeMatch = rest.match(/\s*\[(spring|stream|river|piped|town|unknown)\]\s*$/i);
  if (typeMatch) {
    type = normalizeType(typeMatch[1]);
    rest = rest.slice(0, typeMatch.index).trim();
  }

  const name = rest.trim();
  if (!name) return { error: 'Missing name' };

  return { mile, name, type: type || inferType(name), offTrail };
}

const inPath = process.argv[2] || 'private/awol/awol-water-sources.raw.txt';
const outPath = process.argv[3] || 'private/awol/awol-water-sources.csv';

if (inPath === '--help' || inPath === '-h') {
  console.log('Usage: node scripts/awol-water-raw-to-csv.js [inputRawTxt] [outputCsv]'); // eslint-disable-line no-console
  console.log('Default input:  private/awol/awol-water-sources.raw.txt'); // eslint-disable-line no-console
  console.log('Default output: private/awol/awol-water-sources.csv'); // eslint-disable-line no-console
  console.log('Template:       private/awol/awol-water-sources.raw.template.txt'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(inPath)) {
  console.error(`Missing input raw file: ${inPath}`); // eslint-disable-line no-console
  console.error('Create it by copying `private/awol/awol-water-sources.raw.template.txt`.'); // eslint-disable-line no-console
  process.exit(1);
}

const raw = fs.readFileSync(inPath, 'utf8');
const parsed = [];
const errors = [];

for (const line of raw.split(/\r?\n/)) {
  const res = parseLine(line);
  if (!res) continue;
  if ('error' in res) {
    errors.push(`${line.trim()}: ${res.error}`);
    continue;
  }
  parsed.push(res);
}

parsed.sort((a, b) => a.mile - b.mile || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const outLines = ['mile,name,type,offTrail'];
for (const r of parsed) {
  outLines.push([r.mile, csvCell(r.name), csvCell(r.type), r.offTrail].join(','));
}
fs.writeFileSync(outPath, outLines.join('\n') + '\n', 'utf8');

if (errors.length) {
  console.error(`⚠️ Wrote ${outPath} with ${parsed.length} rows, but ${errors.length} lines could not be parsed.`); // eslint-disable-line no-console
  for (const e of errors.slice(0, 25)) console.error(`- ${e}`); // eslint-disable-line no-console
  if (errors.length > 25) console.error(`- ...and ${errors.length - 25} more`); // eslint-disable-line no-console
  process.exit(2);
}

console.log(`✅ Wrote ${outPath} (${parsed.length} rows)`); // eslint-disable-line no-console
