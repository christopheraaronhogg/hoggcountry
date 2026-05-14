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
