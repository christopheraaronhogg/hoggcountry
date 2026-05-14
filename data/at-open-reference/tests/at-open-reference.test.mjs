import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
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
  assert.equal(routeProps.candidate_status, 'not_production_final');
  assert.ok(routeProps.known_quality_flags.includes('measured_length_is_materially_shorter_than_2026_official_reference'));
  assert.equal(typeof routeProps.length_delta_miles, 'number');
  assert.match(routeProps.ai_answer_rule, /official ATC mileage/);

  const milepoints = JSON.parse(readFileSync(new URL('../processed/milepoints/at_milepoints_1_0mi.geojson', import.meta.url), 'utf8'));
  assert.ok(milepoints.features.length > 2000, 'expected generated whole-mile route coverage');
  assert.equal(milepoints.features[0].properties.official, false);
  assert.equal(milepoints.features[0].properties.candidate_status, 'not_production_final');
  assert.match(milepoints.features[0].properties.ai_answer_rule, /not an official ATC mile/);

  const water = JSON.parse(readFileSync(new URL('../processed/water/water_candidates.json', import.meta.url), 'utf8'));
  assert.ok(water.length > 1000, 'expected mapped hydrography candidates');
  assert.equal(water[0].reliability, 'unknown');
  assert.equal(water[0].potable, 'unknown');

  const shelters = JSON.parse(readFileSync(new URL('../processed/waypoints/shelters.json', import.meta.url), 'utf8'));
  assert.ok(shelters.length > 100, 'expected OSM shelter candidates');
  assert.equal(shelters[0].license_status, 'open_license_share_alike');
  assert.equal(shelters[0].water_nearby, 'unknown');

  const campsites = JSON.parse(readFileSync(new URL('../processed/waypoints/campsites.json', import.meta.url), 'utf8'));
  const privies = JSON.parse(readFileSync(new URL('../processed/waypoints/privies.json', import.meta.url), 'utf8'));
  const vistas = JSON.parse(readFileSync(new URL('../processed/waypoints/vistas.json', import.meta.url), 'utf8'));
  assert.ok(campsites.length > 250 && campsites.length < 1500, 'expected filtered OSM campsite candidates');
  assert.ok(privies.length > 100 && privies.length < 1000, 'expected filtered OSM privy candidates');
  assert.ok(vistas.length > 250 && vistas.length < 1500, 'expected filtered OSM vista candidates');
  assert.equal(campsites[0].license_status, 'open_license_share_alike');
  assert.match(campsites[0].ai_answer_rule, /verify current status/i);

  const parking = JSON.parse(readFileSync(new URL('../processed/access/parking.json', import.meta.url), 'utf8'));
  const trailheads = JSON.parse(readFileSync(new URL('../processed/access/trailheads.json', import.meta.url), 'utf8'));
  assert.ok(parking.length > 500 && parking.length < 5000, 'parking candidates should be filtered to the trail corridor');
  assert.ok(trailheads.length > 25 && trailheads.length < 500, 'expected filtered OSM trailhead candidates');
  assert.equal(parking[0].license_status, 'open_license_share_alike');
  assert.match(parking[0].ai_answer_rule, /OSM-mapped candidate/);

  const towns = JSON.parse(readFileSync(new URL('../processed/towns_resupply/towns_within_15mi.json', import.meta.url), 'utf8'));
  assert.ok(towns.length > 100 && towns.length < 1500, 'expected filtered open-data town candidates');
  assert.equal(towns[0].confidence, 'open_data_settlement_candidate');
  assert.equal(towns[0].candidate_services.grocery, 'unknown');
  assert.match(towns[0].ai_answer_rule, /do not copy guidebook town notes/);

  const corridorRaw = JSON.parse(readFileSync(new URL('../raw/osm/osm_corridor_features_relation_156553.json', import.meta.url), 'utf8'));
  assert.ok(corridorRaw.elements.length < 10000, 'raw OSM corridor package should be compacted to accepted source elements');
  assert.ok(statSync(new URL('../raw/osm/osm_corridor_features_relation_156553.json', import.meta.url)).size < 2_000_000, 'raw OSM corridor package should avoid full Overpass dumps');

  const elevation = JSON.parse(readFileSync(new URL('../processed/elevation/elevation_samples_5_0mi.json', import.meta.url), 'utf8'));
  assert.ok(elevation.length > 400, 'expected coarse 5-mile elevation samples');
  assert.equal(elevation[0].source_id, 'usgs_3dep');
  assert.match(elevation[0].ai_answer_rule, /model-derived USGS 3DEP/);

  const elevationDocs = readdirSync(new URL('../rag_docs/segment_guides/elevation_5mi', import.meta.url));
  assert.ok(elevationDocs.length > 80, 'expected elevation RAG segment docs');
});

test('camping, permit, and fee rules stay official-source and conservative', () => {
  const rules = JSON.parse(readFileSync(new URL('../processed/camping_rules/rules_by_land_manager.json', import.meta.url), 'utf8'));
  assert.ok(rules.length >= 14, 'expected initial official-source land-manager rules');

  const grsm = rules.find((rule) => rule.rule_id === 'camping-grsm-backcountry');
  assert.equal(grsm.source_id, 'nps_official_land_manager_pages');
  assert.equal(grsm.permit_required, 'yes');
  assert.equal(grsm.camping_policy, 'permit_required_designated_backcountry_campsites_and_shelters_only');
  assert.match(grsm.ai_answer_rule, /verify current rules/);

  const baxter = rules.find((rule) => rule.rule_id === 'camping-baxter-at-katahdin');
  assert.equal(baxter.source_id, 'baxter_state_park_authority_pages');
  assert.match(baxter.permit_required, /yes/);
  assert.match(baxter.source_summary, /LD hiker permits/);

  const permitSections = JSON.parse(readFileSync(new URL('../processed/permits_fees/permit_required_sections.json', import.meta.url), 'utf8'));
  assert.ok(permitSections.some((record) => record.rule_id === 'camping-shenandoah-backcountry'));
  assert.ok(permitSections.every((record) => record.source_url && record.last_checked));

  const stateRules = JSON.parse(readFileSync(new URL('../processed/camping_rules/rules_by_state.json', import.meta.url), 'utf8'));
  assert.ok(stateRules.some((record) => record.state === 'MD' && record.rule_id === 'camping-md-south-mountain-at'));
  assert.ok(stateRules.every((record) => record.ai_answer_rule));

  const ruleDoc = readFileSync(new URL('../rag_docs/rules/camping_permit_fee_initial.md', import.meta.url), 'utf8');
  assert.match(ruleDoc, /not a complete Appalachian Trail legal camping guide/);
  assert.match(ruleDoc, /verify with the land manager/);
});
