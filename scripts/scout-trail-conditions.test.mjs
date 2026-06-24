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
  const server = await vite();
  return server.ssrLoadModule(path.join(scoutWebRoot, rel));
}

function jsonResponse(body) {
  return { ok: true, status: 200, statusText: 'OK', async text() { return JSON.stringify(body); } };
}

function htmlResponse(body) {
  return { ok: true, status: 200, statusText: 'OK', async text() { return body; } };
}

// Minimal ATC list + detail HTML that exercises the real parser in scout-official-sources.
const ATC_LIST_HTML = `
<div class="trail-update-component thumbnail-style">
  <a href="https://appalachiantrail.org/trail-updates/smokies-bridge-detour/"></a>
  <h3 class="update-title">Smokies footbridge washout detour</h3>
  <div class="trail-update-details"><p>GRSM, TN/NC</p></div>
  <p class="elapsed-time">2 hours ago</p>
  <span class="updated"></span>
</div>`;

const ATC_DETAIL_HTML = `
<html><head>
<meta property="article:published_time" content="2026-06-23T10:00:00+00:00">
<meta name="description" content="A footbridge is out near the AT; follow the marked detour and ford only if safe.">
</head><body><div class="wp-content"><p>Bridge washout detour in effect; use the blazed reroute.</p></div></div></body></html>`;

const NPS_ALERTS = {
  data: [
    {
      title: 'Newfound Gap Road closure',
      description: 'US-441 through the park is closed due to a rockslide; no vehicle or shuttle access.',
      url: 'https://www.nps.gov/grsm/closure',
      category: 'Park Closure',
      parkCode: 'grsm',
      lastIndexedDate: '2026-06-22'
    },
    {
      title: 'Trail crew working near the AT',
      description: 'Volunteer crews are clearing blowdowns near the ridge this week.',
      url: 'https://www.nps.gov/appa/notice',
      category: 'Information',
      parkCode: 'appa',
      lastIndexedDate: '2026-06-20'
    }
  ]
};

function stubConditionsFetch({ atcList = ATC_LIST_HTML, nps = NPS_ALERTS, weather = true } = {}) {
  const requests = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url === 'https://appalachiantrail.org/trail-updates/') return htmlResponse(atcList);
    if (url.startsWith('https://appalachiantrail.org/trail-updates/')) return htmlResponse(ATC_DETAIL_HTML);
    if (url.includes('developer.nps.gov/api/v1/alerts')) return jsonResponse(nps);
    if (weather && url.includes('/points/')) {
      return jsonResponse({
        properties: {
          forecast: 'https://api.weather.gov/gridpoints/HOGG/1,1/forecast',
          relativeLocation: { properties: { city: 'Gatlinburg', state: 'TN' } }
        }
      });
    }
    if (weather && url.includes('/gridpoints/HOGG/1,1/forecast')) {
      return jsonResponse({
        properties: {
          updated: '2026-06-24T14:00:00+00:00',
          periods: [{ name: 'Today', temperature: 70, temperatureUnit: 'F', windSpeed: '6 mph', windDirection: 'W', shortForecast: 'Sunny', detailedForecast: 'Sunny.' }]
        }
      });
    }
    if (weather && url.includes('/alerts/active')) return jsonResponse({ features: [] });
    throw new Error(`Unexpected fetch in conditions test: ${url}`);
  };
  return requests;
}

async function resetCaches() {
  const official = await load('src/lib/server/scout-official-sources.ts');
  const conditions = await load('src/lib/server/scout-trail-conditions.ts');
  official.__resetOfficialSourceCachesForTests();
  conditions.__resetTrailConditionsCacheForTests();
}

test.after(async () => {
  if (viteServerPromise) (await viteServerPromise).close();
});

test('buildTrailConditionsPack merges NPS + ATC and ranks high-severity first', async () => {
  const { buildTrailConditionsPack } = await load('src/lib/server/scout-trail-conditions.ts');
  await resetCaches();
  const originalFetch = globalThis.fetch;
  stubConditionsFetch();
  try {
    const pack = await buildTrailConditionsPack({ mile: 300, now: fixedNow, npsApiKey: 'TESTKEY' });

    assert.deepEqual([...pack.sourcesChecked].sort(), ['atc', 'nps']);
    assert.ok(pack.items.length >= 2, 'expected NPS + ATC items');

    // The GRSM road closure (high) must rank above the ATC detour (moderate) and the info notice (low).
    assert.equal(pack.items[0].severity, 'high');
    assert.equal(pack.items[0].category, 'closure');
    assert.equal(pack.items[0].source, 'nps');

    const sources = new Set(pack.items.map((item) => item.source));
    assert.ok(sources.has('nps') && sources.has('atc'), 'both sources present');

    const detour = pack.items.find((item) => item.source === 'atc');
    assert.equal(detour.category, 'detour');
    assert.match(pack.note, /2|3 active official trail condition/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildTrailConditionsPack reports "checked, none active" when ATC is empty and no NPS key', async () => {
  const { buildTrailConditionsPack } = await load('src/lib/server/scout-trail-conditions.ts');
  await resetCaches();
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.NPS_API_KEY;
  delete process.env.NPS_API_KEY;
  stubConditionsFetch({ atcList: '<html><body>no updates</body></html>' });
  try {
    const pack = await buildTrailConditionsPack({ mile: 300, now: fixedNow });

    assert.deepEqual(pack.sourcesChecked, ['atc']); // ATC reached, returned nothing
    assert.equal(pack.items.length, 0);
    assert.ok(pack.sourcesSkipped.some((entry) => entry.startsWith('nps')));
    assert.match(pack.note, /No active official closures/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NPS_API_KEY;
    else process.env.NPS_API_KEY = originalKey;
  }
});

test('public mobile field pack carries live conditions, receipts, and a notice', async () => {
  const { buildPublicMobileFieldPack } = await load('src/lib/server/public-mobile-field-pack.ts');
  await resetCaches();
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.NPS_API_KEY;
  process.env.NPS_API_KEY = 'TESTKEY';
  stubConditionsFetch();
  try {
    const pack = await buildPublicMobileFieldPack(fixedNow, { personal: true, mile: 300, direction: 'NOBO' });

    const conditions = pack.data.context_pack.conditions;
    assert.ok(conditions, 'context pack carries a conditions slice');
    assert.ok(conditions.items.length >= 2);
    assert.ok(conditions.items.some((item) => item.severity === 'high'));
    assert.equal(typeof conditions.note, 'string');

    assert.ok(pack.meta.source_receipts.some((receipt) => receipt.id === 'official:atc-trail-updates'));
    assert.ok(pack.meta.source_receipts.some((receipt) => receipt.id === 'official:nps-park-alerts'));
    assert.match(pack.data.pilot_notice, /active official trail condition/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NPS_API_KEY;
    else process.env.NPS_API_KEY = originalKey;
  }
});
