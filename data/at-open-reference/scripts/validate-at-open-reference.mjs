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
      }

      if (/water/u.test(rel)) {
        assert(record.reliability !== 'reliable', `${prefix} uses forbidden water reliability wording`, failures);
        assert(record.potable !== true, `${prefix} marks water potable without controlled vocabulary`, failures);
        assert(/unknown|candidate|timestamp|official|recent|licensed/iu.test(record.ai_answer_rule ?? ''), `${prefix} missing conservative water ai_answer_rule`, failures);
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
