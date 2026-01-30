// Fetch Appalachian Trail shelter locations from the NPS ArcGIS MapServer (via PASDA)
// and write a browser-friendly GeoJSON to /public/data.
//
// Source service:
//   https://mapservices.pasda.psu.edu/server/rest/services/pasda/NationalParkService/MapServer
// Layer 0:
//   Appalachian National Scenic Trail - Shelter Locations
//
// Run:
//   node scripts/fetch-at-shelters-geojson.js
//
// Notes:
// - The service supports GeoJSON output directly.
// - We use pagination defensively (maxRecordCount=1000).

import fs from "node:fs/promises";
import path from "node:path";

const SERVICE_BASE =
  "https://mapservices.pasda.psu.edu/server/rest/services/pasda/NationalParkService/MapServer";
const LAYER_ID = 0;

const PAGE_SIZE = 1000;

async function fetchGeoJsonPage(offset) {
  const url = new URL(`${SERVICE_BASE}/${LAYER_ID}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("f", "geojson");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("resultOffset", String(offset));
  url.searchParams.set("resultRecordCount", String(PAGE_SIZE));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/geo+json, application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Shelters query failed: ${res.status} ${res.statusText}\n${text.slice(0, 500)}`
    );
  }

  return res.json();
}

async function main() {
  console.log(`Fetching shelter locations from NPS MapServer…`);

  let offset = 0;
  const allFeatures = [];
  let template = null;

  while (true) {
    const page = await fetchGeoJsonPage(offset);
    if (!template) template = page;

    const features = page?.features || [];
    for (const f of features) allFeatures.push(f);

    console.log(`  received ${features.length} features (offset=${offset})`);

    if (features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const geojson = {
    type: "FeatureCollection",
    features: allFeatures,
    properties: {
      name: "Appalachian National Scenic Trail - Shelter Locations",
      source: "National Park Service (via PASDA ArcGIS MapServer)",
      service: SERVICE_BASE,
      layer: LAYER_ID,
      fetched_at: new Date().toISOString(),
    },
  };

  const outDir = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, "at-shelters.geojson");
  await fs.writeFile(outPath, JSON.stringify(geojson));

  console.log(`Wrote ${outPath} (features=${allFeatures.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
