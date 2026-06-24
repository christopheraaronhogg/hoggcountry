import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scoutWebRoot = path.join(repoRoot, 'apps/openclaw-web');
const fixedNow = new Date('2026-06-24T15:30:00.000Z');

let viteServerPromise = null;
function vite() {
  viteServerPromise ??= createServer({
    configFile: false,
    root: scoutWebRoot,
    logLevel: 'error',
    resolve: { alias: { $lib: path.join(scoutWebRoot, 'src/lib') } },
    server: { middlewareMode: true },
    appType: 'custom'
  });
  return viteServerPromise;
}
async function load(rel) {
  return (await vite()).ssrLoadModule(path.join(scoutWebRoot, rel));
}
function jsonResponse(body) {
  return { ok: true, status: 200, statusText: 'OK', async text() { return JSON.stringify(body); } };
}
function proxyEnvelope(rows) {
  return { data: { source: 'nps', payload: { data: rows } } };
}

const VISITOR_CENTERS = [
  { name: 'Sugarlands Visitor Center', description: 'Main GRSM visitor center; maps, permits, exhibits.', url: 'https://www.nps.gov/grsm/sugarlands', latitude: 35.6863, longitude: -83.5369, parkCode: 'grsm' }
];
const CAMPGROUNDS = [
  { name: 'Elkmont Campground', description: 'Developed campground in the Smokies; reservations required in season.', url: 'https://www.nps.gov/grsm/elkmont', reservationUrl: 'https://www.recreation.gov/camping/elkmont', latitude: 35.6577, longitude: -83.5807, parkCode: 'grsm' }
];

function stubFacilities() {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/nps/visitorcenters')) return jsonResponse(proxyEnvelope(VISITOR_CENTERS));
    if (url.includes('/nps/campgrounds')) return jsonResponse(proxyEnvelope(CAMPGROUNDS));
    // Field-pack integration also touches weather + ATC + NPS alerts; let those fail.
    throw new Error(`offline in test: ${url}`);
  };
}

async function resetCache() {
  (await load('src/lib/server/scout-park-facilities.ts')).__resetParkFacilitiesCacheForTests();
}

test.after(async () => {
  if (viteServerPromise) (await viteServerPromise).close();
});

test('buildParkFacilitiesPack returns visitor centers + campgrounds for a park state', async () => {
  const { buildParkFacilitiesPack } = await load('src/lib/server/scout-park-facilities.ts');
  await resetCache();
  const originalFetch = globalThis.fetch;
  stubFacilities();
  try {
    const pack = await buildParkFacilitiesPack({ state: 'TN', now: fixedNow, apiBase: 'https://test.local/api/v1' });

    assert.ok(pack.parks.some((p) => /Great Smoky/i.test(p)));
    assert.ok(pack.items.some((i) => i.kind === 'visitor-center'));
    assert.ok(pack.items.some((i) => i.kind === 'campground'));
    // Visitor centers rank first.
    assert.equal(pack.items[0].kind, 'visitor-center');
    const campground = pack.items.find((i) => i.kind === 'campground');
    assert.equal(campground.reservationUrl, 'https://www.recreation.gov/camping/elkmont');
    assert.match(pack.note, /NOT the thru-hiker shelter system/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildParkFacilitiesPack is empty outside a developed park state', async () => {
  const { buildParkFacilitiesPack } = await load('src/lib/server/scout-park-facilities.ts');
  await resetCache();
  // GA has no developed NPS unit the AT crosses → no fetch, empty pack.
  const pack = await buildParkFacilitiesPack({ state: 'GA', now: fixedNow, apiBase: 'https://test.local/api/v1' });
  assert.deepEqual(pack.items, []);
  assert.deepEqual(pack.parks, []);
});

test('field pack carries a parkServices slice + receipt inside a park section', async () => {
  const { buildPublicMobileFieldPack } = await load('src/lib/server/public-mobile-field-pack.ts');
  await resetCache();
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.PUBLIC_API_BASE_URL;
  process.env.PUBLIC_API_BASE_URL = 'https://test.local/api/v1';
  stubFacilities();
  try {
    // Mile 200 is in TN (GRSM).
    const pack = await buildPublicMobileFieldPack(fixedNow, { personal: true, mile: 200, direction: 'NOBO' });
    const parkServices = pack.data.context_pack.parkServices;
    assert.ok(parkServices, 'context pack carries a parkServices slice');
    assert.ok(parkServices.items.length >= 2);
    assert.ok(pack.meta.source_receipts.some((r) => r.id === 'official:nps-park-facilities'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.PUBLIC_API_BASE_URL;
    else process.env.PUBLIC_API_BASE_URL = originalBase;
  }
});
