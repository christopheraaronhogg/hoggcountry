import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = { interval: 5.0 };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--interval') out.interval = Number(args[++i]);
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function intervalLabel(interval) {
  return interval.toFixed(1).replace('.', '_');
}

function intervalShortLabel(interval) {
  return `${String(interval).replace('.', '_')}mi`;
}

function slugRange(segment) {
  return `${String(segment.start_mile_nobo).replace('.', '_')}-${String(segment.end_mile_nobo).replace('.', '_')}`;
}

function docForSegment(segment) {
  const interval = segment.sample_interval_miles;
  return `# Segment Elevation: NOBO ${segment.start_mile_nobo}-${segment.end_mile_nobo}

This segment is approximately ${segment.distance_miles} generated miles based on Scout's open route geometry, not official ATC mileage.

Terrain summary from ${interval}-mile USGS 3DEP samples:
- Estimated gain: ${segment.elevation_gain_ft} ft
- Estimated loss: ${segment.elevation_loss_ft} ft
- Highest sampled point: ${segment.highest_point_ft} ft
- Lowest sampled point: ${segment.lowest_point_ft} ft

Source: USGS Elevation Point Query Service, interpolated from the 3DEP dynamic elevation service.
License status: public_domain.
Attribution: Data available from U.S. Geological Survey, 3D Elevation Program.
Last checked: ${segment.last_checked}.

Caution: ${segment.limitation}
Scout answer rule: ${segment.ai_answer_rule}
`;
}

function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.help) {
    console.log('Usage: node data/at-open-reference/scripts/build-elevation-rag-docs.mjs [--interval 5.0|1.0]');
    return;
  }
  if (![5, 1].includes(cfg.interval)) throw new Error(`Unsupported interval ${cfg.interval}; expected 5.0 or 1.0.`);

  const label = intervalLabel(cfg.interval);
  const shortLabel = intervalShortLabel(cfg.interval);
  const segmentsPath = path.join(packRoot, 'processed', 'elevation', `climbs_descents_by_25mi_segment_${label}mi.json`);
  const outDir = path.join(packRoot, 'rag_docs', 'segment_guides', `elevation_${shortLabel}`);
  if (!fs.existsSync(segmentsPath)) throw new Error(`Missing elevation segment file: ${segmentsPath}`);
  const segments = JSON.parse(fs.readFileSync(segmentsPath, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith('.md')) fs.unlinkSync(path.join(outDir, file));
  }
  for (const segment of segments) {
    fs.writeFileSync(path.join(outDir, `elevation_${slugRange(segment)}.md`), docForSegment(segment), 'utf8');
  }
  console.log(`Built ${segments.length} elevation RAG segment docs at ${cfg.interval}-mile interval`);
}

main();
