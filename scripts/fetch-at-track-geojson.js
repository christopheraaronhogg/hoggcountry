// Fetch Appalachian Trail geometry from OpenStreetMap (ODbL) via Overpass,
// and write a browser-friendly GeoJSON to /public/data.
//
// Source relation: https://www.openstreetmap.org/relation/156553
// License: OpenStreetMap ODbL (https://www.openstreetmap.org/copyright)
//
// Run:
//   node scripts/fetch-at-track-geojson.js

import fs from "node:fs/promises";
import path from "node:path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RELATION_ID = 156553;

// Reduce point density for web rendering.
// 25–50m is usually a good balance for an overview map.
const MIN_POINT_SPACING_METERS = 35;

const overpassQuery = `[out:json][timeout:180];
rel(${RELATION_ID})->.r;
(.r; >>;)->.all;
way.all;
out geom;`;

function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function decimateByDistance(coords, minMeters) {
  if (!coords || coords.length < 2) return coords;

  const out = [coords[0]];
  let last = coords[0];

  for (let i = 1; i < coords.length - 1; i++) {
    const p = coords[i];
    if (haversineMeters(last, p) >= minMeters) {
      out.push(p);
      last = p;
    }
  }

  // Always include final point.
  out.push(coords[coords.length - 1]);
  return out;
}

function computeBbox(multiline) {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;

  for (const line of multiline) {
    for (const [lon, lat] of line) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return { minLon, minLat, maxLon, maxLat };
}

async function main() {
  console.log(
    `Fetching AT geometry from Overpass (relation ${RELATION_ID})… (this can take ~30–120s)`
  );

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: overpassQuery }).toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Overpass request failed: ${res.status} ${res.statusText}\n${text.slice(0, 500)}`
    );
  }

  const data = await res.json();
  const ways = (data.elements || []).filter(
    (el) => el.type === "way" && Array.isArray(el.geometry) && el.geometry.length >= 2
  );

  console.log(`Received ${ways.length} ways. Building GeoJSON…`);

  const lines = [];

  for (const w of ways) {
    const coords = w.geometry.map((p) => [p.lon, p.lat]);
    const decimated = decimateByDistance(coords, MIN_POINT_SPACING_METERS);
    if (decimated.length >= 2) lines.push(decimated);
  }

  const bbox = computeBbox(lines);

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Appalachian Trail (OSM-derived)",
          source: "OpenStreetMap contributors",
          license: "ODbL",
          osm_relation: RELATION_ID,
          fetched_at: new Date().toISOString(),
          min_point_spacing_meters: MIN_POINT_SPACING_METERS,
          bbox,
        },
        geometry: {
          type: "MultiLineString",
          coordinates: lines,
        },
      },
    ],
  };

  const outDir = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, "appalachian-trail.geojson");
  await fs.writeFile(outPath, JSON.stringify(geojson));

  console.log(
    `Wrote ${outPath} (lines=${lines.length}, bbox=${JSON.stringify(bbox)})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
