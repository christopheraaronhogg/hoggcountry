import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

const allowedLicenseStatuses = new Set([
  'public_domain',
  'open_license_attribution',
  'open_license_share_alike',
  'api_access_allowed',
  'permission_required',
  'unknown_review_required',
  'blocked'
]);

const blockedSourceIds = new Set([
  'atc_website',
  'farout',
  'awol_at_guide',
  'at_data_book',
  'alltrails_gaia_hiking_project'
]);

const requiredPaths = [
  'source_manifest.yaml',
  'license_review.md',
  'blocked_sources.md',
  'attribution.md',
  'data_quality_report.md',
  'raw',
  'processed',
  'rag_docs',
  'schemas',
  'scripts',
  'tests'
];

const requiredGeneratedPaths = [
  'raw/osm/waymarked_relation_156553.json',
  'raw/osm/osm_corridor_features_relation_156553.json',
  'processed/route/at_route_candidate_osm.geojson',
  'processed/route/at_route_selected.geojson',
  'processed/route/route_selection_notes.md',
  'processed/milepoints/at_milepoints_0_1mi.geojson',
  'processed/milepoints/at_milepoints_0_5mi.geojson',
  'processed/milepoints/at_milepoints_1_0mi.geojson',
  'processed/milepoints/at_milepoints_5_0mi.geojson',
  'processed/water/water_candidates.json',
  'processed/water/water_crossings.geojson',
  'processed/water/water_confidence_notes.md',
  'processed/waypoints/shelters.json',
  'processed/waypoints/shelters.geojson',
  'processed/waypoints/campsites.json',
  'processed/waypoints/campsites.geojson',
  'processed/waypoints/privies.json',
  'processed/waypoints/privies.geojson',
  'processed/waypoints/vistas.json',
  'processed/waypoints/vistas.geojson',
  'processed/waypoints/side_trails.json',
  'processed/access/parking.json',
  'processed/access/parking.geojson',
  'processed/access/trailheads.json',
  'processed/access/trailheads.geojson',
  'processed/access/road_crossings.json',
  'processed/access/road_crossings.geojson',
  'processed/towns_resupply/towns_within_15mi.json',
  'processed/towns_resupply/resupply_candidates.json',
  'processed/towns_resupply/road_access_to_towns.json',
  'processed/towns_resupply/private_businesses_review_required.json',
  'processed/live_alerts/live_condition_sources.json',
  'processed/live_alerts/nps_alerts_cache.json',
  'processed/live_alerts/nws_alerts_cache.json',
  'processed/elevation/elevation_samples_5_0mi.json',
  'processed/elevation/elevation_profile_5_0mi.geojson',
  'processed/elevation/climbs_descents_by_25mi_segment_5_0mi.json',
  'processed/elevation/high_low_points_5_0mi.json',
  'processed/elevation/grade_risk_sections_5_0mi.json',
  'rag_docs/segment_guides/elevation_5mi'
];

function readJsonLikeYaml(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walkFiles(path) : [path];
  });
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

export function validateAtOpenReferencePack() {
  const failures = [];

  for (const requiredPath of requiredPaths) {
    assert(existsSync(join(packRoot, requiredPath)), `Missing required path: ${requiredPath}`, failures);
  }
  for (const requiredPath of requiredGeneratedPaths) {
    assert(existsSync(join(packRoot, requiredPath)), `Missing generated artifact: ${requiredPath}`, failures);
  }

  const manifestPath = join(packRoot, 'source_manifest.yaml');
  const manifest = readJsonLikeYaml(manifestPath);
  assert(Array.isArray(manifest), 'source_manifest.yaml must be a JSON-compatible YAML array.', failures);

  const sourceIds = new Set();
  const sourceById = new Map();

  for (const [index, source] of manifest.entries()) {
    const prefix = `source_manifest[${index}]`;
    for (const field of [
      'source_id',
      'name',
      'owner',
      'source_url',
      'source_type',
      'access_method',
      'license_status',
      'allowed_use',
      'attribution_required',
      'data_categories',
      'update_cadence',
      'confidence',
      'last_checked',
      'notes'
    ]) {
      assert(source && Object.hasOwn(source, field), `${prefix} missing ${field}`, failures);
    }

    if (!source?.source_id) continue;
    assert(!sourceIds.has(source.source_id), `Duplicate source_id: ${source.source_id}`, failures);
    sourceIds.add(source.source_id);
    sourceById.set(source.source_id, source);
    assert(allowedLicenseStatuses.has(source.license_status), `${source.source_id} has invalid license_status`, failures);
    assert(Array.isArray(source.data_categories) && source.data_categories.length > 0, `${source.source_id} must list data_categories`, failures);
  }

  for (const blockedId of blockedSourceIds) {
    const source = sourceById.get(blockedId);
    assert(source, `Missing blocked source in manifest: ${blockedId}`, failures);
    assert(source?.license_status === 'blocked', `${blockedId} must be marked blocked`, failures);
  }

  assert(sourceById.get('osm')?.license_status === 'open_license_share_alike', 'OSM must be marked open_license_share_alike.', failures);
  assert(sourceById.get('waymarked_trails_api')?.license_status === 'open_license_share_alike', 'Waymarked Trails route ordering must stay OSM/ODbL separated.', failures);

  const blockedText = readFileSync(join(packRoot, 'blocked_sources.md'), 'utf8').toLowerCase();
  for (const term of ['farout', 'a.t. guide', 'alltrails', 'gaia', 'hiking project', 'atc']) {
    assert(blockedText.includes(term), `blocked_sources.md missing ${term}`, failures);
  }

  const processedFiles = walkFiles(join(packRoot, 'processed'))
    .filter((path) => /\.(json|geojson)$/u.test(path));

  for (const file of processedFiles) {
    const rel = relative(repoRoot, file);
    const parsed = readJsonLikeYaml(file);
    const records = Array.isArray(parsed) ? parsed : parsed.features?.map((feature) => feature.properties ?? feature) ?? [parsed];

    for (const [index, record] of records.entries()) {
      const prefix = `${rel}[${index}]`;
      const sourceId = record.source_id ?? record.source ?? record.source_route_id;
      const licenseStatus = record.license_status ?? record.source_license ?? record.license_source;
      assert(sourceId, `${prefix} missing source provenance`, failures);
      assert(licenseStatus, `${prefix} missing license status`, failures);
      assert(record.confidence, `${prefix} missing confidence`, failures);
      assert(licenseStatus !== 'unknown_review_required', `${prefix} uses unknown_review_required in processed data`, failures);
      assert(licenseStatus !== 'blocked', `${prefix} uses blocked source in processed data`, failures);
      assert(!blockedSourceIds.has(sourceId), `${prefix} uses blocked source_id ${sourceId}`, failures);

      if (/milepoints/u.test(rel)) {
        assert(record.official === false, `${prefix} generated milepoint must have official: false`, failures);
        assert(/not an official ATC mile/iu.test(record.ai_answer_rule ?? ''), `${prefix} missing generated-mile answer rule`, failures);
        assert(record.candidate_status === 'not_production_final', `${prefix} generated milepoint must expose candidate_status`, failures);
      }

      if (/water/u.test(rel)) {
        assert(record.reliability !== 'reliable', `${prefix} uses forbidden water reliability wording`, failures);
        assert(record.reliability === 'unknown', `${prefix} water reliability must default to unknown`, failures);
        assert(record.potable !== true, `${prefix} marks water potable without controlled vocabulary`, failures);
        assert(record.potable === 'unknown', `${prefix} water potability must default to unknown`, failures);
        assert(/unknown|candidate|timestamp|official|recent|licensed/iu.test(record.ai_answer_rule ?? ''), `${prefix} missing conservative water ai_answer_rule`, failures);
      }

      if (/route\/at_route_selected/u.test(rel)) {
        assert(record.official === false, `${prefix} selected open route must not be official`, failures);
        assert(typeof record.measured_length_miles === 'number', `${prefix} missing measured_length_miles`, failures);
        assert(typeof record.length_delta_miles === 'number', `${prefix} missing length_delta_miles calibration note`, failures);
        assert(record.candidate_status === 'not_production_final', `${prefix} route must expose candidate_status`, failures);
        assert(Array.isArray(record.known_quality_flags) && record.known_quality_flags.length > 0, `${prefix} route must expose quality flags`, failures);
      }

      if (/waypoints\/shelters/u.test(rel)) {
        assert(record.source_id === 'osm', `${prefix} shelter candidates must remain OSM-derived`, failures);
        assert(record.license_status === 'open_license_share_alike', `${prefix} shelter candidates must keep ODbL lane`, failures);
        assert(record.water_nearby === 'unknown', `${prefix} shelter water_nearby must default to unknown`, failures);
      }

      if (/waypoints\/(campsites|privies|vistas)/u.test(rel) || /access\/(parking|trailheads)/u.test(rel)) {
        assert(record.source_id === 'osm', `${prefix} corridor candidate must remain OSM-derived`, failures);
        assert(record.license_status === 'open_license_share_alike', `${prefix} corridor candidate must keep ODbL lane`, failures);
        assert(/verify current status|mapped candidate/iu.test(record.ai_answer_rule ?? ''), `${prefix} missing cautious OSM candidate answer rule`, failures);
      }

      if (/towns_resupply\/(towns_within_15mi|resupply_candidates)/u.test(rel)) {
        assert(record.source_id === 'osm', `${prefix} town candidate must remain OSM-derived`, failures);
        assert(record.license_status === 'open_license_share_alike', `${prefix} town candidate must keep ODbL lane`, failures);
        assert(record.confidence === 'open_data_settlement_candidate', `${prefix} town candidate must use settlement-candidate confidence`, failures);
        assert(record.candidate_services?.lodging === 'unknown', `${prefix} town lodging must default to unknown`, failures);
        assert(record.candidate_services?.grocery === 'unknown', `${prefix} town grocery must default to unknown`, failures);
        assert(/do not copy guidebook town notes|do not .*imply confirmed hiker services/iu.test(record.ai_answer_rule ?? ''), `${prefix} missing guidebook-safe town answer rule`, failures);
      }

      if (/elevation/u.test(rel)) {
        assert(record.source_id === 'usgs_3dep', `${prefix} elevation records must use USGS 3DEP source_id`, failures);
        assert(/model-derived|3DEP|coarse|grade-risk/iu.test(record.ai_answer_rule ?? record.limitation ?? ''), `${prefix} missing elevation caution`, failures);
      }
    }
  }

  const ragText = walkFiles(join(packRoot, 'rag_docs'))
    .filter((path) => /\.md$/u.test(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert(/not an official ATC mile/iu.test(ragText), 'RAG docs must include generated-mile caution.', failures);
  assert(/reliability unknown|potability unknown|not prove reliability/iu.test(ragText), 'RAG docs must include conservative water language.', failures);
  assert(/live retrieval fails|last-checked|last checked/iu.test(ragText), 'RAG docs must include current-condition timestamp/source-gap rule.', failures);

  return {
    ok: failures.length === 0,
    failures,
    sources: manifest.length,
    processedFiles: processedFiles.length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateAtOpenReferencePack();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`Scout AT Open Reference Pack validation OK: ${result.sources} sources, ${result.processedFiles} processed files.`);
  } else {
    console.error('Scout AT Open Reference Pack validation failed:');
    for (const failure of result.failures) console.error(`- ${failure}`);
  }
  if (!result.ok) process.exitCode = 1;
}
