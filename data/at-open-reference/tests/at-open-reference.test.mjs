import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

import { validateAtOpenReferencePack } from '../scripts/validate-at-open-reference.mjs';

test('Scout AT Open Reference Pack source and safety gates pass', () => {
  const result = validateAtOpenReferencePack();
  assert.deepEqual(result.failures, []);
  assert.equal(result.ok, true);
  assert.ok(result.sources >= 10, 'expected a meaningful initial source manifest');

  const segmentSchema = JSON.parse(readFileSync(new URL('../schemas/segment.schema.json', import.meta.url), 'utf8'));
  assert.ok(segmentSchema.required.includes('segment_id'));
  assert.ok(segmentSchema.required.includes('source_url'));
  assert.ok(segmentSchema.required.includes('ai_answer_rule'));
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
  const sideTrails = JSON.parse(readFileSync(new URL('../processed/waypoints/side_trails.json', import.meta.url), 'utf8'));
  assert.ok(campsites.length > 250 && campsites.length < 1500, 'expected filtered OSM campsite candidates');
  assert.ok(privies.length > 100 && privies.length < 1000, 'expected filtered OSM privy candidates');
  assert.ok(vistas.length > 250 && vistas.length < 1500, 'expected filtered OSM vista candidates');
  assert.ok(sideTrails.length > 50 && sideTrails.length < 5000, 'expected filtered OSM side-trail candidates');
  assert.equal(campsites[0].license_status, 'open_license_share_alike');
  assert.match(campsites[0].ai_answer_rule, /verify current status/i);
  assert.equal(sideTrails[0].license_status, 'open_license_share_alike');
  assert.match(sideTrails[0].ai_answer_rule, /side-trail candidate/i);

  const parking = JSON.parse(readFileSync(new URL('../processed/access/parking.json', import.meta.url), 'utf8'));
  const trailheads = JSON.parse(readFileSync(new URL('../processed/access/trailheads.json', import.meta.url), 'utf8'));
  const roadCrossings = JSON.parse(readFileSync(new URL('../processed/access/road_crossings.json', import.meta.url), 'utf8'));
  assert.ok(parking.length > 500 && parking.length < 5000, 'parking candidates should be filtered to the trail corridor');
  assert.ok(trailheads.length > 25 && trailheads.length < 500, 'expected filtered OSM trailhead candidates');
  assert.ok(roadCrossings.length > 1000 && roadCrossings.length < 5000, 'expected filtered OSM road-crossing candidates');
  assert.equal(parking[0].license_status, 'open_license_share_alike');
  assert.match(parking[0].ai_answer_rule, /OSM-mapped candidate/);
  assert.equal(roadCrossings[0].license_status, 'open_license_share_alike');
  assert.match(roadCrossings[0].ai_answer_rule, /road crossing\/access candidate/);

  const towns = JSON.parse(readFileSync(new URL('../processed/towns_resupply/towns_within_15mi.json', import.meta.url), 'utf8'));
  assert.ok(towns.length > 100 && towns.length < 1500, 'expected filtered open-data town candidates');
  assert.equal(towns[0].confidence, 'open_data_settlement_candidate');
  assert.equal(towns[0].candidate_services.grocery, 'unknown');
  assert.match(towns[0].ai_answer_rule, /do not copy guidebook town notes/);

  const corridorRaw = JSON.parse(readFileSync(new URL('../raw/osm/osm_corridor_features_relation_156553.json', import.meta.url), 'utf8'));
  assert.ok(corridorRaw.elements.length < 10000, 'raw OSM corridor package should be compacted to accepted source elements');
  assert.ok(statSync(new URL('../raw/osm/osm_corridor_features_relation_156553.json', import.meta.url)).size < 10_000_000, 'raw OSM corridor package should avoid full Overpass dumps');

  const elevation = JSON.parse(readFileSync(new URL('../processed/elevation/elevation_samples_5_0mi.json', import.meta.url), 'utf8'));
  assert.ok(elevation.length > 400, 'expected coarse 5-mile elevation samples');
  assert.equal(elevation[0].source_id, 'usgs_3dep');
  assert.match(elevation[0].ai_answer_rule, /model-derived USGS 3DEP/);

  const elevationOneMile = JSON.parse(readFileSync(new URL('../processed/elevation/elevation_samples_1_0mi.json', import.meta.url), 'utf8'));
  assert.ok(elevationOneMile.length > 2000, 'expected 1-mile elevation samples');
  assert.equal(elevationOneMile[0].source_id, 'usgs_3dep');
  assert.equal(elevationOneMile[0].interval_miles, 1);
  assert.match(elevationOneMile[0].ai_answer_rule, /model-derived USGS 3DEP/);

  const elevationOneMileSegments = JSON.parse(readFileSync(new URL('../processed/elevation/climbs_descents_by_25mi_segment_1_0mi.json', import.meta.url), 'utf8'));
  assert.ok(elevationOneMileSegments.length > 80, 'expected 1-mile elevation segment summaries');
  assert.equal(elevationOneMileSegments[0].sample_interval_miles, 1);
  assert.match(elevationOneMileSegments[0].limitation, /1-mile samples improve climb\/descent screening/);

  const gradeScreening = JSON.parse(readFileSync(new URL('../processed/elevation/grade_risk_sections_1_0mi.json', import.meta.url), 'utf8'));
  assert.ok(gradeScreening.length > 100, 'expected conservative 1-mile grade-screening candidates');
  assert.equal(gradeScreening[0].source_id, 'usgs_3dep');
  assert.match(gradeScreening[0].ai_answer_rule, /screening candidate/);

  const elevationDocs = readdirSync(new URL('../rag_docs/segment_guides/elevation_5mi', import.meta.url));
  assert.ok(elevationDocs.length > 80, 'expected elevation RAG segment docs');
  const elevationOneMileDocs = readdirSync(new URL('../rag_docs/segment_guides/elevation_1mi', import.meta.url));
  assert.ok(elevationOneMileDocs.length > 80, 'expected 1-mile elevation RAG segment docs');

  const offlineSummaryText = readFileSync(new URL('../processed/summary/scout_offline_reference_summary.json', import.meta.url), 'utf8');
  const offlineSummary = JSON.parse(offlineSummaryText);
  assert.equal(offlineSummary.available, true);
  assert.equal(offlineSummary.route.official, false);
  assert.equal(offlineSummary.route.candidateStatus, 'not_production_final');
  assert.doesNotMatch(JSON.stringify(offlineSummary.route), /coordinates/u, 'offline summary should not embed full route geometry');
  assert.match(offlineSummary.policies.generatedMileDisclosure, /not official ATC miles|not an official ATC mile/u);
  assert.match(offlineSummary.policies.waterDisclosure, /reliability|potability/u);
  assert.ok(offlineSummary.datasets.some((dataset) => dataset.id === 'water-candidates' && dataset.recordCount > 1000));
  assert.ok(offlineSummary.datasets.some((dataset) => dataset.id === 'side-trails' && dataset.recordCount > 50));
  assert.ok(offlineSummary.datasets.some((dataset) => dataset.id === 'road-crossings' && dataset.recordCount > 1000));
  assert.ok(offlineSummary.datasets.some((dataset) => dataset.id === 'elevation-samples-1-0' && dataset.recordCount > 2000));
  assert.ok(offlineSummary.datasets.some((dataset) => dataset.id === 'elevation-grade-screening-1-0' && dataset.recordCount > 100));
  assert.ok(offlineSummary.liveConditionSources.some((source) => source.source_id === 'noaa_nws_api'));
  assert.ok(offlineSummaryText.length < 50_000, 'offline summary should remain compact enough for phone caching');
});

test('camping, permit, and fee rules stay official-source and conservative', () => {
  const rules = JSON.parse(readFileSync(new URL('../processed/camping_rules/rules_by_land_manager.json', import.meta.url), 'utf8'));
  assert.ok(rules.length >= 17, 'expected expanded initial official-source land-manager rules');

  const grsm = rules.find((rule) => rule.rule_id === 'camping-grsm-backcountry');
  assert.equal(grsm.source_id, 'nps_official_land_manager_pages');
  assert.equal(grsm.permit_required, 'yes');
  assert.equal(grsm.camping_policy, 'permit_required_designated_backcountry_campsites_and_shelters_only');
  assert.match(grsm.ai_answer_rule, /verify current rules/);

  const baxter = rules.find((rule) => rule.rule_id === 'camping-baxter-at-katahdin');
  assert.equal(baxter.source_id, 'baxter_state_park_authority_pages');
  assert.match(baxter.permit_required, /yes/);
  assert.match(baxter.source_summary, /LD hiker permits/);

  const connecticut = rules.find((rule) => rule.rule_id === 'camping-ct-backpack-sites');
  assert.equal(connecticut.source_id, 'state_land_manager_official_pages');
  assert.equal(connecticut.camping_policy, 'designated_backpack_sites_only_no_dispersed_camping');
  assert.match(connecticut.permit_required, /reservation/);

  const massachusetts = rules.find((rule) => rule.rule_id === 'camping-ma-at-designated-sites');
  assert.equal(massachusetts.source_id, 'state_land_manager_official_pages');
  assert.match(massachusetts.camping_policy, /designated/);

  const nantahala = rules.find((rule) => rule.rule_id === 'camping-nantahala-at-cheoah-district');
  assert.equal(nantahala.source_id, 'usfs_official_land_manager_pages');
  assert.match(nantahala.source_summary, /Stecoah Gap/);

  const permitSections = JSON.parse(readFileSync(new URL('../processed/permits_fees/permit_required_sections.json', import.meta.url), 'utf8'));
  assert.ok(permitSections.some((record) => record.rule_id === 'camping-shenandoah-backcountry'));
  assert.ok(permitSections.every((record) => record.source_url && record.last_checked));

  const stateRules = JSON.parse(readFileSync(new URL('../processed/camping_rules/rules_by_state.json', import.meta.url), 'utf8'));
  assert.ok(stateRules.some((record) => record.state === 'MD' && record.rule_id === 'camping-md-south-mountain-at'));
  assert.ok(stateRules.every((record) => record.ai_answer_rule));

  const stateGuides = readdirSync(new URL('../rag_docs/state_guides', import.meta.url)).filter((file) => /^[A-Z]{2}\.md$/u.test(file));
  assert.equal(stateGuides.length, 14, 'expected generated state RAG guides for every AT state');
  const connecticutGuide = readFileSync(new URL('../rag_docs/state_guides/CT.md', import.meta.url), 'utf8');
  assert.match(connecticutGuide, /designated_backpack_sites_only_no_dispersed_camping/);
  assert.match(connecticutGuide, /not an official ATC mile/);
  assert.match(connecticutGuide, /live retrieval failed/);

  const ruleDoc = readFileSync(new URL('../rag_docs/rules/camping_permit_fee_initial.md', import.meta.url), 'utf8');
  assert.match(ruleDoc, /not a complete Appalachian Trail legal camping guide/);
  assert.match(ruleDoc, /verify with the land manager/);
});

test('Scout AT MVP1 Springer to Davenport reference pack validates source-aware planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp1/run_mvp1_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp1_miles, 234.7);
  assert.ok(validation.behavior_questions >= 40);
  assert.ok(validation.rag_docs >= 15);
  assert.ok(validation.water_candidates >= 100);
  assert.ok(validation.tread_1mi_records >= 200);

  const routeNotes = readFileSync(new URL('../mvp1/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Amicalola/i);
  assert.match(routeNotes, /Davenport Gap/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const treadNotes = readFileSync(new URL('../mvp1/processed/tread_rockiness/model_notes.md', import.meta.url), 'utf8');
  assert.match(treadNotes, /SSURGO\/gSSURGO/i);
  assert.match(treadNotes, /not field_verified/i);

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp1/tests/mvp1_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /reliable water/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /live retrieval/i.test(question.expected_behavior)));
});

test('Scout AT MVP2 Virginia reference pack validates source-aware planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp2_va/run_mvp2_va_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp2_va_miles, 547.0);
  assert.ok(validation.behavior_questions >= 50);
  assert.ok(validation.rag_docs >= 28);
  assert.ok(validation.water_candidates >= 300);
  assert.ok(validation.tread_1mi_records >= 540);

  const routeNotes = readFileSync(new URL('../mvp2_va/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Damascus/i);
  assert.match(routeNotes, /Harpers Ferry/i);
  assert.match(routeNotes, /MVP1/i);
  assert.match(routeNotes, /WV\/MD/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const livePolicy = readFileSync(new URL('../mvp2_va/rag_docs/policies/weather_live_conditions.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /ATC Trail Updates/i);
  assert.match(livePolicy, /verification pointer only/i);
  assert.match(livePolicy, /live retrieval fails/i);
  const liveSources = JSON.parse(readFileSync(new URL('../mvp2_va/processed/live_conditions/live_condition_sources.json', import.meta.url), 'utf8'));
  assert.ok(liveSources.some((source) => source.source_id === 'shenandoah_official_alerts'));

  const treadNotes = readFileSync(new URL('../mvp2_va/processed/tread_rockiness/model_notes.md', import.meta.url), 'utf8');
  assert.match(treadNotes, /SSURGO\/gSSURGO/i);
  assert.match(treadNotes, /not field_verified/i);

  const segmentGuide = readFileSync(new URL('../mvp2_va/rag_docs/segment_guides/mvp2_va_000_025.md', import.meta.url), 'utf8');
  assert.match(segmentGuide, /## Terrain/);
  assert.match(segmentGuide, /## Water Candidates/);
  assert.match(segmentGuide, /## Camping \/ Permit Summary/);
  assert.match(segmentGuide, /## AI Cautions/);
  assert.match(segmentGuide, /Generated miles are not official ATC mileage/);

  const checklist = readFileSync(new URL('../mvp2_va/prompt_artifact_checklist.md', import.meta.url), 'utf8');
  assert.match(checklist, /npm test/);
  assert.match(checklist, /npm run build:openclaw:forge/);
  assert.match(checklist, /Shenandoah\/VA state-local\/ATC pointer-only policy/i);

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp2_va/tests/mvp2_va_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /Shenandoah/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Grayson Highlands/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Blue Ridge Parkway/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /reliable water/i.test(question.question + question.expected_behavior)));
});

test('Scout AT MVP3 Mid-Atlantic reference pack validates source-aware planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp3_midatlantic/run_mvp3_midatlantic_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp3_midatlantic_miles, 264.0);
  assert.ok(validation.behavior_questions >= 60);
  assert.ok(validation.rag_docs >= 19);
  assert.ok(validation.water_candidates >= 80);
  assert.ok(validation.tread_1mi_records >= 260);

  const routeNotes = readFileSync(new URL('../mvp3_midatlantic/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Harpers Ferry/i);
  assert.match(routeNotes, /Delaware Water Gap/i);
  assert.match(routeNotes, /MVP2/i);
  assert.match(routeNotes, /MVP4/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const livePolicy = readFileSync(new URL('../mvp3_midatlantic/rag_docs/policies/weather_live_conditions.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /hunting-season safety/i);
  assert.match(livePolicy, /ATC Trail Updates/i);
  assert.match(livePolicy, /verification pointer only/i);
  assert.match(livePolicy, /live retrieval fails/i);
  const liveSources = JSON.parse(readFileSync(new URL('../mvp3_midatlantic/processed/live_conditions/live_condition_sources.json', import.meta.url), 'utf8'));
  assert.ok(liveSources.some((source) => source.source_id === 'pa_dcnr_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'pa_game_commission_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'nps_dewa_official_pages'));

  const paGuide = readFileSync(new URL('../mvp3_midatlantic/rag_docs/state_guides/PA.md', import.meta.url), 'utf8');
  assert.match(paGuide, /Susquehanna/i);
  assert.match(paGuide, /rocky ridges/i);
  assert.match(paGuide, /Delaware Water Gap/i);

  const treadNotes = readFileSync(new URL('../mvp3_midatlantic/processed/tread_rockiness/model_notes.md', import.meta.url), 'utf8');
  assert.match(treadNotes, /SSURGO\/gSSURGO/i);
  assert.match(treadNotes, /not field_verified/i);
  const calibration = readFileSync(new URL('../mvp3_midatlantic/processed/tread_rockiness/pa_calibration_report.md', import.meta.url), 'utf8');
  assert.match(calibration, /South PA/i);
  assert.match(calibration, /North PA/i);
  assert.match(calibration, /not field_verified/i);

  const waterNotes = readFileSync(new URL('../mvp3_midatlantic/processed/water/water_confidence_notes.md', import.meta.url), 'utf8');
  assert.match(waterNotes, /not proof that water is absent/i);
  const sparseWater = JSON.parse(readFileSync(new URL('../mvp3_midatlantic/processed/water/sparse_uncertain_water_stretches.json', import.meta.url), 'utf8'));
  assert.ok(sparseWater.length >= 5);

  const segmentGuide = readFileSync(new URL('../mvp3_midatlantic/rag_docs/segment_guides/mvp3_midatlantic_000_025.md', import.meta.url), 'utf8');
  assert.match(segmentGuide, /## Terrain/);
  assert.match(segmentGuide, /## Water Candidates/);
  assert.match(segmentGuide, /## Camping \/ Permit Summary/);
  assert.match(segmentGuide, /## AI Cautions/);
  assert.match(segmentGuide, /Generated miles are not official ATC mileage/);

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp3_midatlantic/tests/mvp3_midatlantic_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /Harpers Ferry/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Delaware Water Gap/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /hunting-season/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /reliable water/i.test(question.question + question.expected_behavior)));
});

test('Scout AT MVP4 NJ/NY/CT reference pack validates source-aware planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp4_nj_ny_ct/run_mvp4_nj_ny_ct_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp4_nj_ny_ct_miles, 206.0);
  assert.ok(validation.behavior_questions >= 60);
  assert.ok(validation.rag_docs >= 17);
  assert.ok(validation.water_candidates >= 100);
  assert.ok(validation.tread_1mi_records >= 200);

  const routeNotes = readFileSync(new URL('../mvp4_nj_ny_ct/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Delaware Water Gap/i);
  assert.match(routeNotes, /Sages Ravine/i);
  assert.match(routeNotes, /MVP3/i);
  assert.match(routeNotes, /MVP5/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const livePolicy = readFileSync(new URL('../mvp4_nj_ny_ct/rag_docs/policies/weather_live_conditions.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /NJDEP/i);
  assert.match(livePolicy, /Palisades/i);
  assert.match(livePolicy, /CT DEEP/i);
  assert.match(livePolicy, /verification pointers only/i);
  assert.match(livePolicy, /live retrieval fails/i);
  const liveSources = JSON.parse(readFileSync(new URL('../mvp4_nj_ny_ct/processed/live_conditions/live_condition_sources.json', import.meta.url), 'utf8'));
  assert.ok(liveSources.some((source) => source.source_id === 'njdep_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'nys_palisades_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'ct_deep_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'ny_nj_trail_conference_pointer'));

  const nyGuide = readFileSync(new URL('../mvp4_nj_ny_ct/rag_docs/state_guides/NY.md', import.meta.url), 'utf8');
  assert.match(nyGuide, /Harriman/i);
  assert.match(nyGuide, /Bear Mountain/i);
  assert.match(nyGuide, /designated camping/i);

  const treadNotes = readFileSync(new URL('../mvp4_nj_ny_ct/processed/tread_rockiness/model_notes.md', import.meta.url), 'utf8');
  assert.match(treadNotes, /SSURGO\/gSSURGO/i);
  assert.match(treadNotes, /not field_verified/i);
  const calibration = readFileSync(new URL('../mvp4_nj_ny_ct/processed/tread_rockiness/mvp4_vs_mvp3_pa_calibration_report.md', import.meta.url), 'utf8');
  assert.match(calibration, /MVP3 PA/i);
  assert.match(calibration, /NJ sample/i);
  assert.match(calibration, /not field_verified/i);

  const waterNotes = readFileSync(new URL('../mvp4_nj_ny_ct/processed/water/water_confidence_notes.md', import.meta.url), 'utf8');
  assert.match(waterNotes, /not proof that water is absent/i);
  const sparseWater = JSON.parse(readFileSync(new URL('../mvp4_nj_ny_ct/processed/water/sparse_uncertain_water_stretches.json', import.meta.url), 'utf8'));
  assert.ok(sparseWater.length >= 1);

  const segmentGuide = readFileSync(new URL('../mvp4_nj_ny_ct/rag_docs/segment_guides/mvp4_nj_ny_ct_000_025.md', import.meta.url), 'utf8');
  assert.match(segmentGuide, /## Terrain/);
  assert.match(segmentGuide, /## Water Candidates/);
  assert.match(segmentGuide, /## Camping \/ Permit Summary/);
  assert.match(segmentGuide, /## AI Cautions/);
  assert.match(segmentGuide, /Generated miles are not official ATC mileage/);

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp4_nj_ny_ct/tests/mvp4_nj_ny_ct_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /Delaware Water Gap/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Harriman/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /illegal dispersed camping/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /reliability unknown/i.test(question.question + question.expected_behavior)));
});

test('Scout AT MVP5 MA/VT/NH reference pack validates source-aware mountain planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp5_ma_vt_nh/run_mvp5_ma_vt_nh_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp5_ma_vt_nh_miles, 377.0);
  assert.ok(validation.behavior_questions >= 70);
  assert.ok(validation.rag_docs >= 24);
  assert.ok(validation.water_candidates >= 300);
  assert.ok(validation.tread_1mi_records >= 370);
  assert.ok(validation.difficulty_segments >= 37);

  const routeNotes = readFileSync(new URL('../mvp5_ma_vt_nh/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Sages Ravine/i);
  assert.match(routeNotes, /NH\/ME/i);
  assert.match(routeNotes, /MVP4/i);
  assert.match(routeNotes, /MVP6/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const livePolicy = readFileSync(new URL('../mvp5_ma_vt_nh/rag_docs/policies/weather_live_conditions.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /alpine weather/i);
  assert.match(livePolicy, /mud closures/i);
  assert.match(livePolicy, /AMC/i);
  assert.match(livePolicy, /Green Mountain Club/i);
  assert.match(livePolicy, /verification pointers only/i);
  assert.match(livePolicy, /live retrieval fails/i);

  const liveSources = JSON.parse(readFileSync(new URL('../mvp5_ma_vt_nh/processed/live_conditions/live_condition_sources.json', import.meta.url), 'utf8'));
  assert.ok(liveSources.some((source) => source.source_id === 'ma_dcr_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'usfs_gmnf_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'usfs_wmnf_official_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'amc_pointer'));
  assert.ok(liveSources.some((source) => source.source_id === 'gmc_pointer'));

  const nhGuide = readFileSync(new URL('../mvp5_ma_vt_nh/rag_docs/state_guides/NH.md', import.meta.url), 'utf8');
  assert.match(nhGuide, /White Mountain/i);
  assert.match(nhGuide, /Presidential/i);
  assert.match(nhGuide, /alpine/i);
  assert.match(nhGuide, /AMC/i);

  const treadNotes = readFileSync(new URL('../mvp5_ma_vt_nh/processed/tread_rockiness/model_notes.md', import.meta.url), 'utf8');
  assert.match(treadNotes, /SSURGO\/gSSURGO/i);
  assert.match(treadNotes, /mud/i);
  assert.match(treadNotes, /not field_verified/i);
  const calibration = readFileSync(new URL('../mvp5_ma_vt_nh/processed/tread_rockiness/mvp5_mountain_tread_mud_calibration_report.md', import.meta.url), 'utf8');
  assert.match(calibration, /White Mountain/i);
  assert.match(calibration, /Presidential/i);
  assert.match(calibration, /not field_verified/i);

  const difficulty = JSON.parse(readFileSync(new URL('../mvp5_ma_vt_nh/processed/difficulty/difficulty_by_10mi_segment.json', import.meta.url), 'utf8'));
  assert.ok(difficulty.some((record) => record.alpine_exposure_factor > 0));
  assert.ok(difficulty.every((record) => /planning difficulty screen/i.test(record.ai_answer_rule)));

  const segmentGuide = readFileSync(new URL('../mvp5_ma_vt_nh/rag_docs/segment_guides/mvp5_ma_vt_nh_000_025.md', import.meta.url), 'utf8');
  assert.match(segmentGuide, /## Terrain/);
  assert.match(segmentGuide, /## Water Candidates/);
  assert.match(segmentGuide, /## Difficulty/);
  assert.match(segmentGuide, /## Camping \/ Permit Summary/);
  assert.match(segmentGuide, /## AI Cautions/);
  assert.match(segmentGuide, /Generated miles are not official ATC mileage/);

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp5_ma_vt_nh/tests/mvp5_ma_vt_nh_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /Presidential/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Franconia/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /AMC/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /reliability unknown/i.test(question.question + question.expected_behavior)));
});

test('Scout AT MVP6 Maine reference pack validates Baxter, ford, and remoteness planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/mvp6_maine/run_mvp6_maine_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.mvp6_maine_miles, 253.2);
  assert.ok(validation.behavior_questions >= 80);
  assert.ok(validation.rag_docs >= 15);
  assert.ok(validation.water_candidates >= 100);
  assert.ok(validation.major_ford_candidates >= 50);
  assert.ok(validation.tread_1mi_records >= 250);
  assert.ok(validation.difficulty_segments >= 25);

  const routeNotes = readFileSync(new URL('../mvp6_maine/processed/route/route_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Mahoosuc/i);
  assert.match(routeNotes, /Monson/i);
  assert.match(routeNotes, /100-Mile Wilderness/i);
  assert.match(routeNotes, /Baxter/i);
  assert.match(routeNotes, /Katahdin/i);
  assert.match(routeNotes, /not official ATC miles/i);

  const waterPolicy = readFileSync(new URL('../mvp6_maine/rag_docs/policies/water.md', import.meta.url), 'utf8');
  assert.match(waterPolicy, /mapped ford candidate/i);
  assert.match(waterPolicy, /Ford safety unknown/i);
  assert.match(waterPolicy, /safe fordability/i);

  const livePolicy = readFileSync(new URL('../mvp6_maine/rag_docs/policies/weather_live_conditions.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /Baxter\/Katahdin/i);
  assert.match(livePolicy, /river\/fords/i);
  assert.match(livePolicy, /live retrieval fails/i);
  assert.match(livePolicy, /verification pointer/i);

  const liveSources = JSON.parse(readFileSync(new URL('../mvp6_maine/processed/live_conditions/live_condition_sources.json', import.meta.url), 'utf8'));
  assert.ok(liveSources.some((source) => source.source_id === 'baxter_current_conditions'));
  assert.ok(liveSources.some((source) => source.source_id === 'baxter_state_park_authority_pages'));
  assert.ok(liveSources.some((source) => source.source_id === 'maine_state_local_alerts'));
  assert.ok(liveSources.some((source) => source.source_id === 'monson_pointer'));

  const meGuide = readFileSync(new URL('../mvp6_maine/rag_docs/state_guides/ME.md', import.meta.url), 'utf8');
  assert.match(meGuide, /Mahoosuc/i);
  assert.match(meGuide, /100-Mile Wilderness/i);
  assert.match(meGuide, /Katahdin/i);
  assert.match(meGuide, /ford safety unknown/i);

  const calibration = readFileSync(new URL('../mvp6_maine/processed/tread_rockiness/mvp6_maine_tread_remoteness_calibration_report.md', import.meta.url), 'utf8');
  assert.match(calibration, /Mahoosuc/i);
  assert.match(calibration, /100-Mile Wilderness/i);
  assert.match(calibration, /Katahdin/i);
  assert.match(calibration, /not field_verified/i);

  const difficulty = JSON.parse(readFileSync(new URL('../mvp6_maine/processed/difficulty/difficulty_by_10mi_segment.json', import.meta.url), 'utf8'));
  assert.ok(difficulty.some((record) => record.ford_uncertainty_factor > 0));
  assert.ok(difficulty.some((record) => record.remoteness_bailout_scarcity_factor > 0));
  assert.ok(difficulty.every((record) => /planning difficulty screen/i.test(record.ai_answer_rule)));

  const behaviorQuestions = JSON.parse(readFileSync(new URL('../mvp6_maine/tests/mvp6_maine_behavior_questions.json', import.meta.url), 'utf8'));
  assert.ok(behaviorQuestions.some((question) => /Baxter/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Katahdin/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /ford/i.test(question.question + question.expected_behavior)));
  assert.ok(behaviorQuestions.some((question) => /Monson/i.test(question.question + question.expected_behavior)));
});

test('Scout AT Full Trail RC1 reference pack validates end-to-end source-aware planning rules', () => {
  const result = spawnSync('python3', ['data/at-open-reference/full_trail_rc1/run_full_trail_validation.py', '--json'], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const validation = JSON.parse(result.stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.failures.length, 0);
  assert.equal(validation.route_miles, 2106.2);
  assert.equal(validation.official_reference_miles, 2197.9);
  assert.equal(validation.length_delta_miles, -91.7);
  assert.equal(validation.alignment_status, 'yellow_unresolved_open_route_delta');
  assert.ok(validation.milepoints_0_1mi >= 21000);
  assert.ok(validation.water_candidates >= 1700);
  assert.ok(validation.tread_1mi_records >= 2000);
  assert.ok(validation.difficulty_segments >= 210);
  assert.ok(validation.rag_docs >= 84);
  assert.ok(validation.behavior_questions >= 462);

  const routeNotes = readFileSync(new URL('../full_trail_rc1/processed/route/route_integration_notes.md', import.meta.url), 'utf8');
  assert.match(routeNotes, /Davenport Gap/i);
  assert.match(routeNotes, /Damascus/i);
  assert.match(routeNotes, /Amicalola/i);
  assert.match(routeNotes, /Baxter/i);
  assert.match(routeNotes, /Katahdin/i);
  assert.match(routeNotes, /not official ATC mileage/i);
  assert.match(routeNotes, /2197\.9/i);
  assert.match(routeNotes, /-91\.7/i);
  assert.match(routeNotes, /generated\/open-route/i);

  const alignment = JSON.parse(readFileSync(new URL('../full_trail_rc1/processed/route/route_alignment_diagnostics.json', import.meta.url), 'utf8'));
  assert.equal(alignment.official, false);
  assert.equal(alignment.official_reference_length_miles, 2197.9);
  assert.equal(alignment.generated_route_length_miles, 2106.2);
  assert.equal(alignment.length_delta_miles, -91.7);
  assert.equal(alignment.alignment_status, 'yellow_unresolved_open_route_delta');
  assert.ok(alignment.route_length_measurements.local_geodesic_miles > 2106);
  assert.ok(alignment.route_length_measurements.waymarked_reported_miles > 2106);
  assert.ok(alignment.route_length_measurements.three_d_estimate.estimated_3d_length_miles > 2110);
  assert.match(alignment.ai_answer_rule, /generated\/open-route mile/i);

  const alignmentReport = readFileSync(new URL('../full_trail_rc1/processed/route/route_alignment_report.md', import.meta.url), 'utf8');
  assert.match(alignmentReport, /Official 2026 reference length: 2197\.9 miles/i);
  assert.match(alignmentReport, /Scout generated open-route length: 2106\.2 miles/i);
  assert.match(alignmentReport, /Delta: -91\.7 miles/i);
  assert.match(alignmentReport, /Waymarked/i);
  assert.match(alignmentReport, /geodesic/i);
  assert.match(alignmentReport, /Approach Trail/i);
  assert.match(alignmentReport, /unresolved/i);
  assert.match(alignmentReport, /generated\/open-route/i);

  const segmentChecks = JSON.parse(readFileSync(new URL('../full_trail_rc1/processed/route/route_segment_length_checks.json', import.meta.url), 'utf8'));
  assert.ok(segmentChecks.some((check) => check.region_id === 'coverage_gap_davenport_damascus' && check.gap === true));
  assert.ok(segmentChecks.every((check) => /generated\/open-route|Davenport Gap/.test(check.ai_answer_rule)));

  const livePolicy = readFileSync(new URL('../full_trail_rc1/processed/live_conditions/full_trail_live_condition_policy.md', import.meta.url), 'utf8');
  assert.match(livePolicy, /NWS/i);
  assert.match(livePolicy, /NPS/i);
  assert.match(livePolicy, /USFS/i);
  assert.match(livePolicy, /Baxter/i);
  assert.match(livePolicy, /ATC Trail Updates/i);
  assert.match(livePolicy, /live retrieval fails/i);

  const waterPolicy = readFileSync(new URL('../full_trail_rc1/processed/water/full_trail_water_policy.md', import.meta.url), 'utf8');
  assert.match(waterPolicy, /reliability unknown/i);
  assert.match(waterPolicy, /potability unknown/i);
  assert.match(waterPolicy, /safe fordability/i);

  const difficultyPolicy = readFileSync(new URL('../full_trail_rc1/processed/difficulty/full_trail_daily_difficulty_model.md', import.meta.url), 'utf8');
  assert.match(difficultyPolicy, /ford uncertainty/i);
  assert.match(difficultyPolicy, /remoteness/i);
  assert.match(difficultyPolicy, /permit/i);

  const exportManifest = JSON.parse(readFileSync(new URL('../full_trail_rc1/exports/manifest.json', import.meta.url), 'utf8'));
  assert.equal(exportManifest.production_safe, true);
  assert.ok(exportManifest.datasets.every((dataset) => dataset.production_safe));
});
