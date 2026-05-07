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
  'hoggcountry-shenandoah-at-corridor-qa-2026-05-05',
  'shenandoah-backcountry-permits',
  'hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06',
  'harpers-ferry-maryland-dnr-nps-atc',
  'hoggcountry-100-mile-wilderness-qa-2026-05-06',
  'hundred-mile-wilderness-matc-atc-logistics',
  'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05',
  'baxter-state-park-at-permits',
  'hoggcountry-whites-franconia-crawford-qa-2026-05-06',
  'white-mountain-national-forest-amc-rules',
  'green-mountain-club-long-trail-mud-season',
  'new-england-state-land-at-rules',
  'nws-noaa-trail-weather-safety-doctrine',
  'nps-usfs-cdc-backcountry-safety-doctrine',
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

const shenandoahSources = selectScoutSourceManifests({
  query: 'Rockfish Gap to Swift Run Gap Shenandoah NOBO 3 day section hiker itinerary with daily mileage targets legal camping hut wayside assumptions Recreation.gov permits camping setbacks water heat thunderstorms bears and shuttle',
  state: 'VA',
  mileRange: [863.7, 909.6],
  limit: 10
}).map((source) => source.id);
assert.ok(shenandoahSources.includes('hoggcountry-shenandoah-at-corridor-qa-2026-05-05'), 'Shenandoah itinerary should select the Shenandoah route/regulation validator');
assert.ok(shenandoahSources.includes('shenandoah-backcountry-permits'), 'Shenandoah camping prompts should select official Shenandoah permit rules');
assert.ok(shenandoahSources.includes('at-guide-user-owned'), 'Shenandoah exact hut/mileage itinerary should require user-owned guide data');
assert.ok(shenandoahSources.includes('nws-weather'), 'Shenandoah heat/thunderstorm itinerary should select NWS');

const harpersSources = selectScoutSourceManifests({
  query: "Harper's Ferry mental halfway ATC HQ Dad finish hike Keys Gap and Friday Saturday overnight near Weverton Ed Garvey Dahlgren Gathland with legal camping water parking shuttle weather",
  state: 'VA/WV/MD',
  mileRange: [1018.1, 1061.0],
  limit: 10
}).map((source) => source.id);
assert.ok(harpersSources.includes('hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06'), 'Harpers Ferry mental-halfway itinerary should select the route/logistics validator');
assert.ok(harpersSources.includes('harpers-ferry-maryland-dnr-nps-atc'), 'Harpers Ferry overnight/logistics prompts should select NPS/Maryland DNR/ATC source checks');
assert.ok(harpersSources.includes('at-guide-user-owned'), 'Harpers Ferry exact mileage/overnight itinerary should require user-owned guide data');
assert.ok(harpersSources.includes('farout-current-comments'), 'Harpers Ferry water/shelter itinerary should require current comments');
assert.ok(harpersSources.includes('nws-weather'), 'Harpers Ferry weather-bearing itinerary should select NWS');

const whitesSources = selectScoutSourceManifests({
  query: 'Franconia Notch I-93 to Crawford Notch US 302 White Mountains NOBO 3 day section hiker itinerary with AMC huts tentsites legal camping above treeline lightning water parking shuttle bailouts',
  state: 'NH',
  mileRange: [1825.1, 1863.9],
  limit: 10
}).map((source) => source.id);
assert.ok(whitesSources.includes('hoggcountry-whites-franconia-crawford-qa-2026-05-06'), 'Whites itinerary should select the White Mountains route/regulation validator');
assert.ok(whitesSources.includes('white-mountain-national-forest-amc-rules'), 'Whites itinerary should select official/regional WMNF/AMC/NH State Parks rules');
assert.ok(whitesSources.includes('at-guide-user-owned'), 'Whites exact mileage/hut/tentsite itinerary should require user-owned guide data');
assert.ok(whitesSources.includes('nws-weather'), 'Whites ridge weather/lightning itinerary should select NWS');


const hundredMileSources = selectScoutSourceManifests({
  query: 'Monson to Abol Bridge 100-Mile Wilderness NOBO 7 or 8 day itinerary with food carry food drops water fords logging road bailouts campsites lean-tos shuttle weather and Baxter handoff',
  state: 'ME',
  mileRange: [2078.1, 2177.7],
  limit: 10
}).map((source) => source.id);
assert.ok(hundredMileSources.includes('hoggcountry-100-mile-wilderness-qa-2026-05-06'), '100-Mile Wilderness itinerary should select the 100-Mile route/logistics validator');
assert.ok(hundredMileSources.includes('hundred-mile-wilderness-matc-atc-logistics'), '100-Mile Wilderness itinerary should select official/regional logistics sources');
assert.ok(hundredMileSources.includes('at-guide-user-owned'), '100-Mile exact mileage/campsite itinerary should require user-owned guide data');
assert.ok(hundredMileSources.includes('farout-current-comments'), '100-Mile water/ford/campsite itinerary should require current comments');
assert.ok(hundredMileSources.includes('nws-weather'), '100-Mile weather itinerary should select NWS');


const baxterSources = selectScoutSourceManifests({
  query: 'Abol Bridge to Katahdin Stream Campground and Baxter Peak Katahdin NOBO finish itinerary with The Birches Long-Distance Hiker Permit KTP parking campground reservations water weather closures and shuttle',
  state: 'ME',
  mileRange: [2177.7, 2197.7],
  limit: 10
}).map((source) => source.id);
assert.ok(baxterSources.includes('hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05'), 'Baxter/Katahdin itinerary should select the Baxter route/regulation validator');
assert.ok(baxterSources.includes('baxter-state-park-at-permits'), 'Baxter/Katahdin itinerary should select official Baxter permit/camping/rule sources');
assert.ok(baxterSources.includes('at-guide-user-owned'), 'Baxter exact mileage/campsite itinerary should require user-owned guide data');
assert.ok(baxterSources.includes('nws-weather'), 'Baxter weather/closure itinerary should select NWS');

const vermontSources = selectScoutSourceManifests({
  query: 'Vermont Long Trail AT overlap two day hike during mud season with road access shelter water camping and bad weather fallback',
  state: 'VT',
  mileRange: [1602.0, 1751.0],
  limit: 10
}).map((source) => source.id);
assert.ok(vermontSources.includes('green-mountain-club-long-trail-mud-season'), 'Vermont / Long Trail mud-season planning should select GMC official guidance');
assert.ok(vermontSources.includes('nws-weather'), 'Vermont bad-weather prompts should still select NWS live weather');

const ctMaSources = selectScoutSourceManifests({
  query: 'Connecticut Massachusetts family fair weather AT day hike with legal camping parking road access water and state park rules',
  state: 'CT/MA',
  mileRange: [1456.0, 1602.0],
  limit: 10
}).map((source) => source.id);
assert.ok(ctMaSources.includes('new-england-state-land-at-rules'), 'CT/MA planning should select state-land official rules');

const weatherDoctrineSources = selectScoutSourceManifests({
  query: 'Late July heat thunderstorm lightning flood wind exposed ridge go/no-go safety for a trail plan',
  topics: ['weather', 'safety'],
  limit: 10
}).map((source) => source.id);
assert.ok(weatherDoctrineSources.includes('nws-noaa-trail-weather-safety-doctrine'), 'Weather-risk prompts should select NOAA/NWS safety doctrine');
assert.ok(weatherDoctrineSources.includes('nws-weather'), 'Weather-risk prompts should select live NWS weather');

const waterSources = selectScoutSourceManifests({
  query: 'Are the next shelter water sources dry and are recent FarOut comments enough to trust it? Also remind me about filtering, food storage, bears, ticks, and Leave No Trace.',
  topics: ['water', 'shelter'],
  limit: 20
}).map((source) => source.id);
assert.ok(waterSources.includes('farout-current-comments'), 'Recent water/shelter condition prompts should select hiker-supplied current comments');
assert.ok(waterSources.includes('private-workspace'), 'Private workspace should remain a searchable source lane');
assert.ok(waterSources.includes('nps-usfs-cdc-backcountry-safety-doctrine'), 'General backcountry safety prompts should select public government safety doctrine');

const gmcReceipt = buildScoutSourceReceipt('green-mountain-club-long-trail-mud-season');
assert.ok(gmcReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched GMC receipt should not imply a live fetch');
const newEnglandReceipt = buildScoutSourceReceipt('new-england-state-land-at-rules');
assert.ok(newEnglandReceipt?.citation.includes('Massachusetts DCR'), 'New England state-land receipt should name state land sources');
const weatherDoctrineReceipt = buildScoutSourceReceipt('nws-noaa-trail-weather-safety-doctrine');
assert.ok(weatherDoctrineReceipt?.citation.includes('weather.gov/safety'), 'Weather safety doctrine receipt should point to NWS safety guidance');
const backcountrySafetyReceipt = buildScoutSourceReceipt('nps-usfs-cdc-backcountry-safety-doctrine');
assert.ok(backcountrySafetyReceipt?.citation.includes('CDC'), 'Backcountry safety doctrine receipt should name public government safety sources');

const routeReceipt = buildScoutSourceReceipt('hoggcountry-pine-grove-route-qa-2026-05-04');
assert.ok(routeReceipt?.citation.includes('Pine Grove route-order QA fixture'), 'Route receipt should expose the validator citation');
const gsmnpReceipt = buildScoutSourceReceipt('hoggcountry-gsmnp-at-corridor-qa-2026-05-05');
assert.ok(gsmnpReceipt?.citation.includes('GSMNP AT corridor'), 'GSMNP receipt should expose the validator citation');
const shenandoahReceipt = buildScoutSourceReceipt('hoggcountry-shenandoah-at-corridor-qa-2026-05-05');
assert.ok(shenandoahReceipt?.citation.includes('Shenandoah AT south/central corridor'), 'Shenandoah receipt should expose the validator citation');
const shenandoahPermitReceipt = buildScoutSourceReceipt('shenandoah-backcountry-permits');
assert.ok(shenandoahPermitReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched Shenandoah official receipt should not imply a live fetch');
const harpersReceipt = buildScoutSourceReceipt('hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06');
assert.ok(harpersReceipt?.citation.includes('Harpers Ferry mental-halfway'), 'Harpers Ferry receipt should expose the validator citation');
assert.equal(harpersReceipt?.accessMode, 'route-validator', 'Harpers Ferry route receipt should identify deterministic validator access');
const harpersOfficialReceipt = buildScoutSourceReceipt('harpers-ferry-maryland-dnr-nps-atc');
assert.ok(harpersOfficialReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched Harpers Ferry official/regional receipt should not imply a live fetch');
assert.equal(harpersOfficialReceipt?.trust, 'official', 'Harpers Ferry official/regional receipt should be distinguished from local QA fixtures');
const whitesReceipt = buildScoutSourceReceipt('hoggcountry-whites-franconia-crawford-qa-2026-05-06');
assert.ok(whitesReceipt?.citation.includes('White Mountains Franconia Notch'), 'Whites receipt should expose the validator citation');
assert.equal(whitesReceipt?.accessMode, 'route-validator', 'Whites route receipt should identify deterministic validator access');
const whitesOfficialReceipt = buildScoutSourceReceipt('white-mountain-national-forest-amc-rules');
assert.ok(whitesOfficialReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched Whites official/regional receipt should not imply a live fetch');
assert.equal(whitesOfficialReceipt?.trust, 'official', 'Whites official/regional receipt should be distinguished from local QA fixtures');
const hundredMileReceipt = buildScoutSourceReceipt('hoggcountry-100-mile-wilderness-qa-2026-05-06');
assert.ok(hundredMileReceipt?.citation.includes('100-Mile Wilderness Monson'), '100-Mile Wilderness receipt should expose the validator citation');
assert.equal(hundredMileReceipt?.accessMode, 'route-validator', '100-Mile Wilderness route receipt should identify deterministic validator access');
const hundredMileOfficialReceipt = buildScoutSourceReceipt('hundred-mile-wilderness-matc-atc-logistics');
assert.ok(hundredMileOfficialReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched 100-Mile official/regional receipt should not imply a live fetch');
assert.equal(hundredMileOfficialReceipt?.trust, 'official', '100-Mile official/regional receipt should be distinguished from local QA fixtures');
const baxterReceipt = buildScoutSourceReceipt('hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05');
assert.ok(baxterReceipt?.citation.includes('Baxter/Katahdin AT finish corridor'), 'Baxter receipt should expose the validator citation');
assert.equal(baxterReceipt?.trust, 'reviewed', 'Baxter route receipt should remain a reviewed local QA fixture');
assert.equal(baxterReceipt?.accessMode, 'route-validator', 'Baxter route receipt should identify deterministic validator access');
const baxterOfficialReceipt = buildScoutSourceReceipt('baxter-state-park-at-permits');
assert.ok(baxterOfficialReceipt?.citation.includes('Scout fetched timestamp: not fetched'), 'Unfetched Baxter official receipt should not imply a live fetch');
assert.equal(baxterOfficialReceipt?.trust, 'official', 'Baxter official receipt should be distinguished from local QA fixtures');
assert.equal(baxterOfficialReceipt?.accessMode, 'live-fetch', 'Baxter official receipt should identify live-fetch official access');
const nwsReceipt = buildScoutSourceReceipt('nws-weather', { fetchedAt: '2026-05-04T00:00:00.000Z', url: 'https://api.weather.gov/gridpoints/example' });
assert.ok(nwsReceipt?.citation.includes('2026-05-04T00:00:00.000Z'), 'Live receipts should render fetched timestamp');

console.log('Scout source catalog eval passed: manifests, selection, and receipts are wired.');
