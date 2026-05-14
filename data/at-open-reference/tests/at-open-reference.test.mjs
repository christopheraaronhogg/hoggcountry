import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { validateAtOpenReferencePack } from '../scripts/validate-at-open-reference.mjs';

test('Scout AT Open Reference Pack source and safety gates pass', () => {
  const result = validateAtOpenReferencePack();
  assert.deepEqual(result.failures, []);
  assert.equal(result.ok, true);
  assert.ok(result.sources >= 10, 'expected a meaningful initial source manifest');
});

test('generated open route and candidate datasets keep safety labels', () => {
  const route = JSON.parse(readFileSync(new URL('../processed/route/at_route_selected.geojson', import.meta.url), 'utf8'));
  const routeProps = route.features[0].properties;
  assert.equal(routeProps.source_id, 'osm');
  assert.equal(routeProps.license_status, 'open_license_share_alike');
  assert.equal(routeProps.official, false);
  assert.equal(typeof routeProps.length_delta_miles, 'number');
  assert.match(routeProps.ai_answer_rule, /official ATC mileage/);

  const milepoints = JSON.parse(readFileSync(new URL('../processed/milepoints/at_milepoints_1_0mi.geojson', import.meta.url), 'utf8'));
  assert.ok(milepoints.features.length > 2000, 'expected generated whole-mile route coverage');
  assert.equal(milepoints.features[0].properties.official, false);
  assert.match(milepoints.features[0].properties.ai_answer_rule, /not an official ATC mile/);

  const water = JSON.parse(readFileSync(new URL('../processed/water/water_candidates.json', import.meta.url), 'utf8'));
  assert.ok(water.length > 1000, 'expected mapped hydrography candidates');
  assert.equal(water[0].reliability, 'unknown');
  assert.equal(water[0].potable, 'unknown');

  const shelters = JSON.parse(readFileSync(new URL('../processed/waypoints/shelters.json', import.meta.url), 'utf8'));
  assert.ok(shelters.length > 100, 'expected OSM shelter candidates');
  assert.equal(shelters[0].license_status, 'open_license_share_alike');
  assert.equal(shelters[0].water_nearby, 'unknown');
});
