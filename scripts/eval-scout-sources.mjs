#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  SCOUT_SOURCE_CATALOG,
  SCOUT_SOURCE_MANIFESTS,
  buildScoutSourceReceipt,
  getScoutSourceManifest,
  selectScoutSourceManifests
} from '../packages/scout-sources/src/index.ts';

assert.ok(SCOUT_SOURCE_MANIFESTS.length >= 10, 'Scout source catalog should expose the initial source pack');
assert.equal(SCOUT_SOURCE_CATALOG.length, SCOUT_SOURCE_MANIFESTS.length, 'Legacy catalog view should mirror manifests');

const requiredIds = [
  'private-workspace',
  'hogg-country-corpus',
  'at-guide-user-owned',
  'farout-current-comments',
  'hoggcountry-pine-grove-route-qa-2026-05-04',
  'hoggcountry-gsmnp-at-corridor-qa-2026-05-05',
  'gsmnp-backcountry-permits',
  'atc-trail-updates',
  'nws-weather'
];
for (const sourceId of requiredIds) {
  assert.ok(getScoutSourceManifest(sourceId), `Missing required Scout source manifest: ${sourceId}`);
}

const pineGroveSources = selectScoutSourceManifests({
  query: 'Pine Grove Furnace NOBO 3 day itinerary with shelters, mileage, weather, fire risk, and water',
  state: 'PA',
  mileRange: [1105.9, 1150.8],
  limit: 8
}).map((source) => source.id);
assert.ok(pineGroveSources.includes('hoggcountry-pine-grove-route-qa-2026-05-04'), 'Pine Grove itinerary should select the strict route validator');
assert.ok(pineGroveSources.includes('at-guide-user-owned'), 'Exact shelter/mileage itinerary should require user-owned guide data');
assert.ok(pineGroveSources.includes('nws-weather'), 'Weather-bearing itinerary should select NWS');


const gsmnpSources = selectScoutSourceManifests({
  query: 'Fontana Dam to Newfound Gap Smokies NOBO 4 day section hiker itinerary with permits shelters camping bears cold rain and parking',
  state: 'NC/TN',
  mileRange: [166.1, 208.1],
  limit: 10
}).map((source) => source.id);
assert.ok(gsmnpSources.includes('hoggcountry-gsmnp-at-corridor-qa-2026-05-05'), 'Smokies itinerary should select the GSMNP route/regulation validator');
assert.ok(gsmnpSources.includes('gsmnp-backcountry-permits'), 'Smokies camping prompts should select official GSMNP permit rules');
assert.ok(gsmnpSources.includes('at-guide-user-owned'), 'Smokies exact shelter/mileage itinerary should require user-owned guide data');

const waterSources = selectScoutSourceManifests({
  query: 'Are the next shelter water sources dry and are recent FarOut comments enough to trust it?',
  topics: ['water', 'shelter'],
  limit: 10
}).map((source) => source.id);
assert.ok(waterSources.includes('farout-current-comments'), 'Recent water/shelter condition prompts should select hiker-supplied current comments');
assert.ok(waterSources.includes('private-workspace'), 'Private workspace should remain a searchable source lane');

const routeReceipt = buildScoutSourceReceipt('hoggcountry-pine-grove-route-qa-2026-05-04');
assert.ok(routeReceipt?.citation.includes('Pine Grove route-order QA fixture'), 'Route receipt should expose the validator citation');
const gsmnpReceipt = buildScoutSourceReceipt('hoggcountry-gsmnp-at-corridor-qa-2026-05-05');
assert.ok(gsmnpReceipt?.citation.includes('GSMNP AT corridor'), 'GSMNP receipt should expose the validator citation');
const nwsReceipt = buildScoutSourceReceipt('nws-weather', { fetchedAt: '2026-05-04T00:00:00.000Z', url: 'https://api.weather.gov/gridpoints/example' });
assert.ok(nwsReceipt?.citation.includes('2026-05-04T00:00:00.000Z'), 'Live receipts should render fetched timestamp');

console.log('Scout source catalog eval passed: manifests, selection, and receipts are wired.');
