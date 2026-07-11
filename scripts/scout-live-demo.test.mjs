import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeLiveFieldPack } from '../apps/openclaw-web/src/lib/live-field-pack-demo.ts';

const NOW = Date.parse('2026-07-11T20:00:00.000Z');

test('live Scout demo summarizes the same Dad field pack used by mobile', () => {
  const summary = summarizeLiveFieldPack({
    data: {
      context_pack: {
        hiker: { trailName: 'Hogg', currentMile: 1669, direction: 'NOBO', dayNumber: 42 },
        water: [
          { name: 'Behind Dad', mile: 1668.8, reliability: 'reliable' },
          { name: 'McGinn Brook', mile: 1670.4, reliability: 'thin', note: 'Confirm flow.' }
        ],
        shelters: [{ name: 'Lost Pond Shelter', mile: 1672.8, note: 'Verify status.' }],
        weather: {
          mile: 1669,
          summary: 'NWS This Afternoon: Sunny',
          highF: 75,
          lowF: 53,
          windMph: 6,
          generatedAt: '2026-07-11T19:56:00.000Z',
          source: 'nws',
          sourceLabel: 'NWS point forecast near Danby, VT',
          riskNote: 'Refresh before exposed terrain.'
        },
        generatedAt: '2026-07-11T19:56:00.000Z'
      },
      dad: {
        latestFixAt: '2026-07-11T18:44:45.000Z',
        latestFixIsPreview: false,
        latestTrailLocation: { label: 'AT mile 1669.0', nearestMile: 1669 }
      },
      pilot_notice: 'Dad location came from the public Garmin pilot summary; verify before safety-critical decisions.'
    },
    meta: {
      generated_at: '2026-07-11T19:56:00.000Z',
      valid_until: '2026-07-12T01:56:00.000Z'
    },
    error: null
  }, NOW);

  assert.equal(summary.status, 'ready');
  assert.equal(summary.trailName, 'Hogg');
  assert.equal(summary.currentMile, 1669);
  assert.equal(summary.nextWater?.name, 'McGinn Brook');
  assert.equal(summary.nextWater?.milesAhead, 1.4);
  assert.equal(summary.nextShelter?.name, 'Lost Pond Shelter');
  assert.equal(summary.nextShelter?.milesAhead, 3.8);
  assert.equal(summary.weather?.sourceLabel, 'NWS point forecast near Danby, VT');
  assert.equal(summary.packAgeLabel, '4 min old');
  assert.equal(summary.fixAgeLabel, '1 hr 15 min old');
  assert.equal(summary.isPreview, false);
  assert.equal(summary.isExpired, false);
  assert.match(summary.notice, /verify before safety-critical decisions/i);
});

test('live Scout demo rejects malformed payloads instead of inventing live values', () => {
  const summary = summarizeLiveFieldPack({ data: { context_pack: { hiker: { currentMile: '1669' } } } }, NOW);

  assert.deepEqual(summary, {
    status: 'unavailable',
    message: 'Dad’s live Scout field pack is unavailable right now.'
  });
});

test('live Scout demo marks an expired pack honestly', () => {
  const summary = summarizeLiveFieldPack({
    data: {
      context_pack: {
        hiker: { trailName: 'Hogg', currentMile: 10, direction: 'NOBO', dayNumber: 1 },
        water: [],
        shelters: [],
        weather: null,
        generatedAt: '2026-07-11T10:00:00.000Z'
      },
      dad: { latestFixAt: null, latestFixIsPreview: true, latestTrailLocation: null },
      pilot_notice: ''
    },
    meta: {
      generated_at: '2026-07-11T10:00:00.000Z',
      valid_until: '2026-07-11T16:00:00.000Z'
    },
    error: null
  }, NOW);

  assert.equal(summary.status, 'ready');
  assert.equal(summary.isExpired, true);
  assert.equal(summary.isPreview, true);
  assert.equal(summary.packAgeLabel, '10 hr old');
});
