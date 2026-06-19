#!/usr/bin/env node
// Projects the canonical full-trail elevation/route geometry into a slim asset
// the standalone mobile app can fetch() at runtime (the same bundling pattern as
// the offline KJV Bible).
//
// Source: USGS 3DEP elevation samples along the Scout full-trail RC1 open route
// (public domain — "Data available from U.S. Geological Survey, 3D Elevation
// Program"). 1-mile resolution, NOBO mile 0 → ~2106.
//
// Output: mobile/static/trail/elevation-1mi.json — an array of
//   { m: <mile_nobo>, ft: <elevation_ft>, lat, lon }
// used for (a) the Today/Map elevation profile and (b) snapping an on-device GPS
// fix to a real trail mile. Re-run after a guidebook/route refresh:
//   node scripts/build-trail-geometry.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(
	here,
	'../../data/at-open-reference/full_trail_rc1/processed/elevation/full_trail_elevation_samples_1_0mi.json'
);
const OUT = resolve(here, '../static/trail/elevation-1mi.json');

const raw = JSON.parse(readFileSync(SOURCE, 'utf8'));
if (!Array.isArray(raw) || raw.length === 0) {
	throw new Error(`Unexpected source shape in ${SOURCE}`);
}

const round = (n, dp) => Math.round(n * 10 ** dp) / 10 ** dp;

const points = raw
	.filter((p) => Number.isFinite(p.mile_nobo) && Number.isFinite(p.elevation_ft))
	.map((p) => ({
		m: round(p.mile_nobo, 1),
		ft: round(p.elevation_ft, 1),
		lat: round(p.lat, 5),
		lon: round(p.lon, 5)
	}))
	.sort((a, b) => a.m - b.m);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(points));

const kb = (Buffer.byteLength(JSON.stringify(points)) / 1024).toFixed(0);
console.log(`Wrote ${points.length} points → ${OUT} (${kb} KB)`);
console.log(`Range: mile ${points[0].m} (${points[0].ft} ft) → ${points.at(-1).m} (${points.at(-1).ft} ft)`);
