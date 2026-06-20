import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scoutWebRoot = path.join(repoRoot, 'apps/openclaw-web');
const fixedNow = new Date('2026-06-20T15:30:00.000Z');

let viteServerPromise = null;

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    async text() {
      return JSON.stringify(body);
    }
  };
}

async function loadFieldPackBuilder() {
  viteServerPromise ??= createServer({
    configFile: false,
    root: scoutWebRoot,
    logLevel: 'error',
    resolve: {
      alias: {
        $lib: path.join(scoutWebRoot, 'src/lib')
      }
    },
    server: { middlewareMode: true },
    appType: 'custom'
  });

  const server = await viteServerPromise;
  return server.ssrLoadModule(path.join(scoutWebRoot, 'src/lib/server/public-mobile-field-pack.ts'));
}

test.after(async () => {
  if (viteServerPromise) {
    const server = await viteServerPromise;
    await server.close();
  }
});

test('personal mobile field packs use official NWS weather when it is available', async () => {
  const { buildPublicMobileFieldPack } = await loadFieldPackBuilder();
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);

    if (url.includes('/points/')) {
      return jsonResponse({
        properties: {
          forecast: 'https://api.weather.gov/gridpoints/HOGG/42,24/forecast',
          relativeLocation: {
            properties: { city: 'Bland', state: 'VA' }
          }
        }
      });
    }

    if (url.includes('/gridpoints/HOGG/42,24/forecast')) {
      return jsonResponse({
        properties: {
          updated: '2026-06-20T14:50:00+00:00',
          periods: [
            {
              name: 'This Afternoon',
              temperature: 72,
              temperatureUnit: 'F',
              windSpeed: '8 to 14 mph',
              windDirection: 'NW',
              shortForecast: 'Sunny',
              detailedForecast: 'Sunny, with a high near 72.'
            },
            {
              name: 'Tonight',
              temperature: 51,
              temperatureUnit: 'F',
              windSpeed: '5 mph',
              windDirection: 'NW',
              shortForecast: 'Mostly Clear',
              detailedForecast: 'Mostly clear, with a low around 51.'
            }
          ]
        }
      });
    }

    if (url.includes('/alerts/active')) {
      return jsonResponse({
        features: [
          {
            properties: {
              event: 'Wind Advisory',
              headline: 'Wind Advisory remains in effect',
              severity: 'Moderate',
              certainty: 'Likely',
              urgency: 'Expected',
              areaDesc: 'AT corridor',
              effective: '2026-06-20T12:00:00+00:00',
              expires: '2026-06-20T22:00:00+00:00',
              description: 'Gusty ridge winds.',
              instruction: 'Use caution on exposed terrain.'
            }
          }
        ]
      });
    }

    throw new Error(`Unexpected fetch in field-pack test: ${url}`);
  };

  try {
    const pack = await buildPublicMobileFieldPack(fixedNow, {
      personal: true,
      mile: 600.4,
      direction: 'NOBO'
    });

    assert.equal(pack.data.dad, null);
    assert.equal(pack.data.context_pack.hiker.currentMile, 600.4);
    assert.equal(pack.data.context_pack.weather?.source, 'nws');
    assert.equal(pack.data.context_pack.weather?.sourceLabel, 'NWS point forecast near Bland, VA');
    assert.equal(pack.data.context_pack.weather?.highF, 72);
    assert.equal(pack.data.context_pack.weather?.lowF, 51);
    assert.equal(pack.data.context_pack.weather?.windMph, 14);
    assert.match(pack.data.context_pack.weather?.riskNote ?? '', /Active NWS alert/i);
    assert.ok(pack.meta.source_receipts.some((receipt) => receipt.id === 'official:nws-point-forecast'));
    assert.match(pack.data.pilot_notice, /official NWS point forecast/i);
    assert.ok(requests.some((url) => url.includes('api.weather.gov/points/')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('personal mobile field packs do not fall back to the cached pilot forecast when NWS fails', async () => {
  const { buildPublicMobileFieldPack } = await loadFieldPackBuilder();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error('simulated NWS outage');
  };

  try {
    const pack = await buildPublicMobileFieldPack(fixedNow, {
      personal: true,
      mile: 1500.1,
      direction: 'NOBO'
    });

    assert.equal(pack.data.dad, null);
    assert.equal(pack.data.context_pack.hiker.currentMile, 1500.1);
    assert.equal(pack.data.context_pack.weather, null);
    assert.ok(!pack.meta.source_receipts.some((receipt) => receipt.id === 'official:nws-point-forecast'));
    assert.match(pack.data.pilot_notice, /NWS weather was not available/i);
    assert.doesNotMatch(pack.data.pilot_notice, /cached pilot weather/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
