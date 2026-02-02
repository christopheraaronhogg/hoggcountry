import fs from 'node:fs';
import path from 'node:path';

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isDirectionDistanceToken(token) {
  // Examples we want to ignore:
  // (2.6W)  0.2W.  0.28N  (0.1E),
  return /^\(?\d+(?:\.\d+)?[NSEW]\)?[.,;:]?$/.test(token);
}

function isWaterSymbolToken(token) {
  if (!/[wWJ]/.test(token)) return false;
  if (isDirectionDistanceToken(token)) return false;

  // Symbols are short (e.g. w, W, wt, kw) or contain punctuation (e.g. kw(pg.)
  const lettersOnly = /^[A-Za-z]+$/.test(token);
  if (lettersOnly && token.length > 4) return false;

  return true;
}

function isCoordinateToken(token) {
  // Typical: 34.6777,-84.0000
  const cleaned = String(token || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  return /^\d{1,2}\.\d+,-\d{1,3}\.\d+$/.test(cleaned);
}

function stripLeaders(text) {
  // pdftotext -layout emits lots of dot leaders like ".  .  ."
  return String(text || '')
    .replace(/\s*(?:\.\s*){3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractOffTrailMiles(text) {
  const s = String(text || '');

  // Prefer parenthetical distances like "(0.2E)"
  const paren = s.match(/\((\d+(?:\.\d+)?)\s*[NSEW]\)/);
  if (paren) {
    const n = asNumber(paren[1], 0) ?? 0;
    return n > 0 && n <= 1 ? n : 0;
  }

  // Fallback: inline like "spring 0.2W" / "0.2W."
  const inline = s.match(/\b(\d+(?:\.\d+)?)\s*[NSEW]\b/);
  if (inline) {
    const n = asNumber(inline[1], 0) ?? 0;
    return n > 0 && n <= 1 ? n : 0;
  }

  return 0;
}

function removeOffTrailMarkers(text) {
  return String(text || '')
    .replace(/\(\d+(?:\.\d+)?\s*[NSEW]\)/g, '')
    .replace(/\b\d+(?:\.\d+)?\s*[NSEW]\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferType(name, symbolChunk) {
  const s = String(name || '').toLowerCase();
  const sym = String(symbolChunk || '');

  if (/[J]/.test(sym)) return 'piped';
  if (/\b(spigot|tap|faucet|pump|well|hydrant|potable)\b/.test(s)) return 'piped';
  if (/\bspring\b/.test(s)) return 'spring';
  if (/\b(river)\b/.test(s)) return 'river';
  if (/\b(footbridge|bridge|cross)\b/.test(s)) return 'stream';
  if (/\b(creek|stream|brook|branch)\b/.test(s)) return 'stream';
  return 'unknown';
}

function isSeasonal(symbolChunk) {
  // Uppercase W indicates seasonal water source per the guide legend.
  // Avoid treating direction distances like (2.6W) as seasonal by only looking at
  // the already-extracted symbol chunk.
  return /W/.test(String(symbolChunk || '')) && !/w/.test(String(symbolChunk || ''));
}

function normKey(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvCell(value) {
  const s = String(value ?? '');
  if (!/[",\n]/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

const inPath = process.argv[2] || 'private/awol/AT-Guide-2026.txt';
const outPath = process.argv[3] || 'private/awol/awol-water-sources.csv';

if (inPath === '--help' || inPath === '-h') {
  console.log('Usage: node scripts/extract-awol-water-sources.js [inputTxt] [outputCsv]'); // eslint-disable-line no-console
  console.log('Default input:  private/awol/AT-Guide-2026.txt'); // eslint-disable-line no-console
  console.log('Default output: private/awol/awol-water-sources.csv'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(inPath)) {
  console.error(`Missing input text: ${inPath}`); // eslint-disable-line no-console
  console.error('Run: `npm run awol:pdf-to-text` after placing your PDF at `private/awol/AT-Guide-2026.pdf`.'); // eslint-disable-line no-console
  process.exit(1);
}

const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/);

const extracted = [];
let seasonalCount = 0;
let pipedCount = 0;

for (const line of lines) {
  const cleaned = String(line || '')
    .replace(/\u000c/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trimEnd();
  if (!cleaned) continue;

  const m = cleaned.match(/^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!m) continue;

  const mile = asNumber(m[2], null);
  if (mile === null) continue;

  const rest = m[3];
  const elevMatch = rest.match(/(\d{3,5})\s*$/);
  if (!elevMatch) continue;

  const restNoElev = rest.slice(0, elevMatch.index).trimEnd();
  const tokens = restNoElev.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) continue;

  // Find the water symbol chunk by scanning from the end.
  let symbolStart = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (isWaterSymbolToken(tokens[i])) {
      symbolStart = i;
      break;
    }
  }
  if (symbolStart < 0) continue;

  const symbolTokens = tokens.slice(symbolStart);
  const symbolChunk = symbolTokens.join(' ');

  // Description = tokens before symbol chunk, minus dot leaders and coords.
  const descTokens = tokens
    .slice(0, symbolStart)
    .filter((t) => t !== '.' && !isCoordinateToken(t));

  const descRaw = stripLeaders(descTokens.join(' '));
  if (!descRaw) continue;

  const offTrail = extractOffTrailMiles(descRaw);
  let name = removeOffTrailMarkers(descRaw);

  // Normalize trailing punctuation.
  name = name.replace(/\s*\.\s*$/, '').trim();
  if (!name) continue;

  const type = inferType(name, symbolChunk);
  if (type === 'piped') pipedCount++;
  if (isSeasonal(symbolChunk) && !/\bseasonal\b/i.test(name)) {
    seasonalCount++;
    name = `${name} (seasonal)`;
  }

  extracted.push({ mile, name, type, offTrail });
}

// Dedupe
const seen = new Set();
const deduped = [];
for (const r of extracted) {
  const key = `${(Math.round(r.mile * 10) / 10).toFixed(1)}|${normKey(r.name)}|${r.type}|${String(r.offTrail ?? 0)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(r);
}

deduped.sort((a, b) => a.mile - b.mile || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const outLines = ['mile,name,type,offTrail'];
for (const r of deduped) {
  outLines.push([r.mile, csvCell(r.name), csvCell(r.type), r.offTrail].join(','));
}
fs.writeFileSync(outPath, outLines.join('\n') + '\n', 'utf8');

console.log(`✅ Extracted ${deduped.length} water sources to ${outPath}`); // eslint-disable-line no-console
console.log(`   seasonal: ${seasonalCount} (name-suffixed)`); // eslint-disable-line no-console
console.log(`   piped: ${pipedCount}`); // eslint-disable-line no-console
