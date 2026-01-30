// Fetch Appalachian Trail shelter locations from OpenStreetMap (ODbL) via Overpass,
// and write a browser-friendly GeoJSON to /public/data.
//
// We pull shelters/huts within a buffer of the official AT relation.
// This is not authoritative like guidebooks, but it’s open + maintainable.
//
// Source relation: https://www.openstreetmap.org/relation/156553
// License: OpenStreetMap ODbL (https://www.openstreetmap.org/copyright)
//
// Run:
//   node scripts/fetch-at-shelters-geojson.js

import fs from "node:fs/promises";
import path from "node:path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RELATION_ID = 156553;

// Buffer in meters around the AT geometry to capture shelters.
// Too small misses shelters slightly off the corridor; too big pulls random picnic shelters.
const BUFFER_METERS = 650;

const overpassQuery = `[out:json][timeout:180];
rel(${RELATION_ID})->.r;
(.r; >>;)->.all;
way.all->.w;
(
  node(around.w:${BUFFER_METERS})[amenity=shelter];
  node(around.w:${BUFFER_METERS})[tourism=alpine_hut];
  node(around.w:${BUFFER_METERS})[tourism=wilderness_hut];
);
out body;`;

function toFeature(el) {
  const tags = el.tags || {};
  const name = tags.name || tags.ref || tags.operator || "Shelter";

  // Nodes have lat/lon.
  const lat = el.lat;
  const lon = el.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  return {
    type: "Feature",
    properties: {
      name,
      osm_type: el.type,
      osm_id: el.id,
      amenity: tags.amenity,
      tourism: tags.tourism,
      shelter_type: tags.shelter_type,
      capacity: tags.capacity,
      operator: tags.operator,
      website: tags.website,
      note: tags.note,
      tags, // keep the raw tags for debugging / future enrichment
    },
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
  };
}

async function main() {
  console.log(
    `Fetching AT shelter points from Overpass (relation ${RELATION_ID}, buffer ${BUFFER_METERS}m)…`
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
  const elements = data.elements || [];

  const features = [];
  for (const el of elements) {
    const ft = toFeature(el);
    if (ft) features.push(ft);
  }

  // Basic de-dupe by (name, coordinates) to reduce obvious repeats.
  const seen = new Set();
  const deduped = [];
  for (const ft of features) {
    const key = `${ft.properties.name}::${ft.geometry.coordinates[0].toFixed(5)},${ft.geometry.coordinates[1].toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ft);
  }

  const geojson = {
    type: "FeatureCollection",
    features: deduped,
    properties: {
      name: "Appalachian Trail shelters (OSM-derived)",
      source: "OpenStreetMap contributors",
      license: "ODbL",
      osm_relation: RELATION_ID,
      buffer_meters: BUFFER_METERS,
      fetched_at: new Date().toISOString(),
    },
  };

  const outDir = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, "at-shelters.geojson");
  await fs.writeFile(outPath, JSON.stringify(geojson));

  console.log(`Wrote ${outPath} (features=${deduped.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
