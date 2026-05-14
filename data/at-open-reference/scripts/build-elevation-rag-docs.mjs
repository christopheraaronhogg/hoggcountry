import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const segmentsPath = path.join(packRoot, 'processed', 'elevation', 'climbs_descents_by_25mi_segment_5_0mi.json');
const outDir = path.join(packRoot, 'rag_docs', 'segment_guides', 'elevation_5mi');

function slugRange(segment) {
  return `${String(segment.start_mile_nobo).replace('.', '_')}-${String(segment.end_mile_nobo).replace('.', '_')}`;
}

function docForSegment(segment) {
  return `# Segment Elevation: NOBO ${segment.start_mile_nobo}-${segment.end_mile_nobo}

This segment is approximately ${segment.distance_miles} generated miles based on Scout's open route geometry, not official ATC mileage.

Terrain summary from coarse 5-mile USGS 3DEP samples:
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
  if (!fs.existsSync(segmentsPath)) throw new Error(`Missing elevation segment file: ${segmentsPath}`);
  const segments = JSON.parse(fs.readFileSync(segmentsPath, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const segment of segments) {
    fs.writeFileSync(path.join(outDir, `elevation_${slugRange(segment)}.md`), docForSegment(segment), 'utf8');
  }
  console.log(`Built ${segments.length} elevation RAG segment docs`);
}

main();
