import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCurrentDateAuthority, buildCurrentDatetimeDetails } from '../apps/openclaw-web/src/lib/server/scout-date-authority.ts';
import { checkOfficialTrailSources } from '../apps/openclaw-web/src/lib/server/scout-official-sources.ts';

test('current datetime authority uses the server clock for today and tomorrow', () => {
  const details = buildCurrentDatetimeDetails(new Date('2026-05-12T13:00:00.000Z'), 'America/New_York');

  assert.equal(details.fetchedAt, '2026-05-12T13:00:00.000Z');
  assert.equal(details.today.iso, '2026-05-12');
  assert.equal(details.today.weekday, 'Tuesday');
  assert.equal(details.tomorrow.iso, '2026-05-13');
  assert.equal(details.tomorrow.weekday, 'Wednesday');
});

test('date authority forbids stale workspace timestamps as current date source', () => {
  const authority = buildCurrentDateAuthority(new Date('2026-05-12T13:00:00.000Z'), 'America/New_York');

  assert.match(authority, /Today is Tuesday, 2026-05-12/u);
  assert.match(authority, /Tomorrow is Wednesday, 2026-05-13/u);
  assert.match(authority, /Never derive the current date from profile\.updatedAt/u);
  assert.doesNotMatch(authority, /April 23/u);
});

test('NWS official check reports a source gap when weather has no coordinates', async () => {
  const details = await checkOfficialTrailSources(
    { query: 'Weather report', source: 'nws', latitude: null, longitude: null },
    null
  );

  assert.equal(details.weather, null);
  assert.match(details.skipped.join(' '), /latitude\/longitude required/u);
});

test('NWS official check fetches point forecast and alerts for coordinates', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url) => {
    const href = String(url);
    requests.push(href);

    if (href.startsWith('https://api.weather.gov/points/')) {
      return new Response(JSON.stringify({
        properties: {
          forecast: 'https://api.weather.gov/gridpoints/LWX/70,87/forecast',
          relativeLocation: {
            properties: {
              city: 'Harpers Ferry',
              state: 'WV'
            }
          }
        }
      }), { status: 200, headers: { 'content-type': 'application/geo+json' } });
    }

    if (href === 'https://api.weather.gov/gridpoints/LWX/70,87/forecast') {
      return new Response(JSON.stringify({
        properties: {
          updated: '2026-05-13T12:00:00+00:00',
          periods: [
            {
              name: 'Today',
              startTime: '2026-05-13T08:00:00-04:00',
              endTime: '2026-05-13T18:00:00-04:00',
              temperature: 68,
              temperatureUnit: 'F',
              windSpeed: '5 mph',
              windDirection: 'NW',
              shortForecast: 'Chance Showers',
              detailedForecast: 'A chance of showers before evening.'
            }
          ]
        }
      }), { status: 200, headers: { 'content-type': 'application/geo+json' } });
    }

    if (href.startsWith('https://api.weather.gov/alerts/active')) {
      return new Response(JSON.stringify({ features: [] }), { status: 200, headers: { 'content-type': 'application/geo+json' } });
    }

    throw new Error(`Unexpected fetch in weather test: ${href}`);
  };

  try {
    const details = await checkOfficialTrailSources(
      { query: 'Weather report', source: 'nws', latitude: 39.3245, longitude: -77.7398 },
      null
    );

    assert.equal(details.weather?.label, 'Harpers Ferry, WV');
    assert.equal(details.weather?.periods[0]?.shortForecast, 'Chance Showers');
    assert.equal(details.weather?.alerts.length, 0);
    assert.ok(requests.some((href) => href.includes('/points/39.3245,-77.7398')), 'expected NWS point fetch for Harpers Ferry coordinates');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
