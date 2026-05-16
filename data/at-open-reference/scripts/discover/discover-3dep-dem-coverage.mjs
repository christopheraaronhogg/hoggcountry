#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const STAC_SEARCH_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const COLLECTION = '3dep-seamless';
const AT_CORRIDOR_BBOX = [-84.35, 34.45, -68.75, 46.0];

async function main() {
  const writeIndex = process.argv.indexOf('--write');
  const writePath = writeIndex >= 0 ? process.argv[writeIndex + 1] : null;
  const body = {
    collections: [COLLECTION],
    bbox: AT_CORRIDOR_BBOX,
    limit: 20,
  };
  const response = await fetch(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`STAC search failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  const result = {
    discovery_id: 'bounded-3dep-dem-at-corridor',
    source_id: 'usgs_3dep_seamless_dem',
    source_url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/3dep-seamless',
    request: body,
    item_count_returned: Array.isArray(json.features) ? json.features.length : 0,
    item_ids: (json.features ?? []).map((feature) => feature.id),
    policy: 'Bounded STAC discovery only. Do not bulk-download DEM COGs; stream/query only corridor tiles needed for terrain metrics.',
  };
  if (writePath) {
    const target = path.resolve(writePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
