#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const LIDAR_STAC_ROOT = 'https://usgs-lidar-stac.s3-us-west-2.amazonaws.com/ept/catalog.json';

const CALIBRATION_SECTIONS = [
  {
    id: 'northern_pennsylvania_rocky_ridges',
    bbox: [-77.9, 40.3, -75.1, 41.4],
  },
  {
    id: 'white_mountains_nh',
    bbox: [-72.2, 43.8, -70.7, 44.5],
  },
  {
    id: 'western_maine_mahoosucs_100_mile',
    bbox: [-71.1, 44.4, -68.7, 46.0],
  },
];

async function main() {
  const writeIndex = process.argv.indexOf('--write');
  const writePath = writeIndex >= 0 ? process.argv[writeIndex + 1] : null;
  const response = await fetch(LIDAR_STAC_ROOT, { method: 'GET' });
  if (!response.ok) throw new Error(`LiDAR STAC root fetch failed: ${response.status} ${response.statusText}`);
  const catalog = await response.json();
  const result = {
    discovery_id: 'bounded-3dep-lidar-calibration-sections',
    source_id: 'usgs_3dep_lidar',
    source_url: 'https://registry.opendata.aws/usgs-lidar/',
    stac_root: LIDAR_STAC_ROOT,
    catalog_title: catalog.title ?? null,
    calibration_sections: CALIBRATION_SECTIONS,
    policy: 'Bounded catalog discovery only. Do not bulk-download LAZ/point-cloud data; stream EPT tiles only for explicit calibration windows.',
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
