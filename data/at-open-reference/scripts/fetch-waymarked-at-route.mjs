import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const endpoint = 'https://hiking.waymarkedtrails.org/api/v1/details/relation/156553';
const outPath = path.join(packRoot, 'raw', 'osm', 'waymarked_relation_156553.json');

async function main() {
  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json',
      'user-agent': 'HoggCountryScout/0.1 (AT open reference pack; contact: repository owner)',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Waymarked Trails fetch failed: ${response.status} ${response.statusText}\n${text.slice(0, 500)}`);
  }

  const data = await response.json();
  data.scout_provenance = {
    fetched_at: new Date().toISOString(),
    source_id: 'osm',
    source_url: 'https://www.openstreetmap.org/relation/156553',
    access_url: endpoint,
    license_status: 'open_license_share_alike',
    source_license: 'ODbL',
    attribution: 'OpenStreetMap contributors; route ordering via Waymarked Trails API',
    confidence: 'osm_derived_route_candidate',
    last_checked: '2026-05-13',
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(data)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
