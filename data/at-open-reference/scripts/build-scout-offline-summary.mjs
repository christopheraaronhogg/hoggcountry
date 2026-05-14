import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packRoot = fileURLToPath(new URL('..', import.meta.url));
const outputPath = join(packRoot, 'processed/summary/scout_offline_reference_summary.json');
const appSummaryPath = join(packRoot, '../../apps/openclaw-web/src/lib/server/generated/at-open-reference-summary.ts');

const datasetSpecs = [
  {
    id: 'generated-milepoints-0-1',
    label: 'Generated 0.1-mile NOBO/SOBO milepoints',
    path: 'processed/milepoints/at_milepoints_0_1mi.geojson',
    category: 'route'
  },
  {
    id: 'generated-milepoints-1-0',
    label: 'Generated 1.0-mile NOBO/SOBO milepoints',
    path: 'processed/milepoints/at_milepoints_1_0mi.geojson',
    category: 'route'
  },
  {
    id: 'water-candidates',
    label: 'Mapped water candidates',
    path: 'processed/water/water_candidates.json',
    category: 'water'
  },
  {
    id: 'shelters',
    label: 'Shelter candidates',
    path: 'processed/waypoints/shelters.json',
    category: 'waypoints'
  },
  {
    id: 'campsites',
    label: 'Campsite candidates',
    path: 'processed/waypoints/campsites.json',
    category: 'waypoints'
  },
  {
    id: 'privies',
    label: 'Privy/toilet candidates',
    path: 'processed/waypoints/privies.json',
    category: 'waypoints'
  },
  {
    id: 'vistas',
    label: 'Vista candidates',
    path: 'processed/waypoints/vistas.json',
    category: 'waypoints'
  },
  {
    id: 'side-trails',
    label: 'Side-trail candidates',
    path: 'processed/waypoints/side_trails.json',
    category: 'waypoints'
  },
  {
    id: 'parking',
    label: 'Parking/access candidates',
    path: 'processed/access/parking.json',
    category: 'access'
  },
  {
    id: 'trailheads',
    label: 'Trailhead candidates',
    path: 'processed/access/trailheads.json',
    category: 'access'
  },
  {
    id: 'road-crossings',
    label: 'Road-crossing candidates',
    path: 'processed/access/road_crossings.json',
    category: 'access'
  },
  {
    id: 'towns-resupply',
    label: 'Town/resupply candidates',
    path: 'processed/towns_resupply/towns_within_15mi.json',
    category: 'towns_resupply'
  },
  {
    id: 'elevation-segments',
    label: 'Coarse 5-mile elevation and climb/descent segments',
    path: 'processed/elevation/climbs_descents_by_25mi_segment_5_0mi.json',
    category: 'elevation'
  },
  {
    id: 'camping-rules',
    label: 'Official-source camping, permit, and fee rules',
    path: 'processed/camping_rules/rules_by_land_manager.json',
    category: 'rules'
  },
  {
    id: 'live-condition-sources',
    label: 'Live weather, alert, and current-condition source connectors',
    path: 'processed/live_alerts/live_condition_sources.json',
    category: 'live_conditions'
  }
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(packRoot, relativePath), 'utf8'));
}

function recordsFrom(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.features)) return parsed.features.map((feature) => feature.properties ?? feature);
  return parsed ? [parsed] : [];
}

function compactUnique(values) {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))).sort();
}

function firstKnown(records, fields) {
  for (const record of records) {
    for (const field of fields) {
      const value = record?.[field];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}

function summarizeDataset(spec) {
  const parsed = readJson(spec.path);
  const records = recordsFrom(parsed);
  const sourceIds = compactUnique(records.map((record) => record.source_id ?? record.source ?? record.source_route_id));
  const licenseStatuses = compactUnique(records.map((record) => record.license_status ?? record.source_license ?? record.license_source));
  const confidence = firstKnown(records, ['confidence']) ?? 'unknown';
  const lastChecked = firstKnown(records, ['last_checked']) ?? 'unknown';
  const aiAnswerRule = firstKnown(records, ['ai_answer_rule', 'limitation']) ?? null;

  return {
    id: spec.id,
    label: spec.label,
    category: spec.category,
    path: spec.path,
    recordCount: records.length,
    sourceIds,
    licenseStatuses,
    confidence,
    lastChecked,
    aiAnswerRule
  };
}

function countBy(values) {
  return values.reduce((counts, value) => {
    if (typeof value === 'string' && value) counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function summarizeManifest(manifest) {
  return {
    path: 'source_manifest.yaml',
    totalSources: manifest.length,
    licenseStatusCounts: countBy(manifest.map((source) => source.license_status)),
    blockedSourceIds: compactUnique(manifest.filter((source) => source.license_status === 'blocked').map((source) => source.source_id)),
    shareAlikeSourceIds: compactUnique(manifest.filter((source) => source.license_status === 'open_license_share_alike').map((source) => source.source_id)),
    liveApiSourceIds: compactUnique(manifest.filter((source) => source.source_type === 'live API').map((source) => source.source_id)),
    lastCheckedDates: compactUnique(manifest.map((source) => source.last_checked))
  };
}

function summarizeRoute() {
  const selected = readJson('processed/route/at_route_selected.geojson');
  const props = selected.features?.[0]?.properties;
  if (!props) throw new Error('Selected route is missing feature properties.');

  return {
    routeId: props.route_id,
    name: props.name,
    path: 'processed/route/at_route_selected.geojson',
    sourceId: props.source_id,
    sourceUrl: props.source_url,
    sourceAccessUrl: props.source_access_url,
    geometrySource: props.geometry_source,
    licenseStatus: props.license_status,
    attribution: props.attribution,
    confidence: props.confidence,
    lastChecked: props.last_checked,
    measuredLengthMiles: props.measured_length_miles,
    officialReferenceLengthMiles: props.official_reference_length_miles,
    officialReferenceDate: props.official_reference_date,
    officialReferenceSource: props.official_reference_source,
    lengthDeltaMiles: props.length_delta_miles,
    official: props.official,
    candidateStatus: props.candidate_status,
    knownQualityFlags: Array.isArray(props.known_quality_flags) ? props.known_quality_flags : [],
    aiAnswerRule: props.ai_answer_rule
  };
}

function readTextSummary(relativePath) {
  const text = readFileSync(join(packRoot, relativePath), 'utf8');
  return {
    path: relativePath,
    excerpt: text
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, 800)
  };
}

const manifest = readJson('source_manifest.yaml');
const datasets = datasetSpecs.map(summarizeDataset);
const liveConditionSources = recordsFrom(readJson('processed/live_alerts/live_condition_sources.json'));
const totalRecords = datasets.reduce((total, dataset) => total + dataset.recordCount, 0);

const summary = {
  version: 1,
  summaryId: 'scout-at-open-reference-offline-summary',
  generatedAt: new Date().toISOString(),
  available: true,
  sourceManifest: summarizeManifest(manifest),
  route: summarizeRoute(),
  datasets,
  totals: {
    datasets: datasets.length,
    records: totalRecords
  },
  liveConditionSources,
  policies: {
    generatedMileDisclosure: "Generated miles are based on Scout's open route geometry, not official ATC miles.",
    routeQualityDisclosure: 'The current open route is a non-production candidate with a known measured-length gap; use it for corpus testing and conservative planning, not exact field navigation.',
    waterDisclosure: 'Mapped water candidates do not prove reliability, seasonality, or potability. Reliability and potability remain unknown unless a recent licensed source or official managed-drinking-water record says otherwise.',
    liveConditionsDisclosure: 'Weather, closures, detours, flooding, fire/smoke, bear activity, permits, and other current conditions require live checks when online. Offline answers must disclose cache age and source gaps.',
    blockedSourcesDisclosure: 'FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers Companion, AllTrails, Gaia, Hiking Project, ATC website resources, and private guide PDFs remain blocked unless explicit permission or compatible licensing exists.',
    offlineUseDisclosure: 'Use this compact summary as an offline citation and safety policy index. Do not treat it as a complete offline guidebook.'
  },
  sourceNotes: [
    readTextSummary('blocked_sources.md'),
    readTextSummary('data_quality_report.md'),
    readTextSummary('processed/water/water_confidence_notes.md'),
    readTextSummary('rag_docs/safety/current_conditions_policy.md')
  ],
  generatedFrom: {
    script: relative(packRoot, fileURLToPath(import.meta.url)),
    packRoot: 'data/at-open-reference'
  }
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
mkdirSync(dirname(appSummaryPath), { recursive: true });
writeFileSync(
  appSummaryPath,
  `// Generated by data/at-open-reference/scripts/build-scout-offline-summary.mjs.\n` +
    `// Do not edit by hand; rerun the generator after changing the AT reference pack.\n` +
    `export const scoutAtOpenReferenceBundledSummary = ${JSON.stringify(summary, null, 2)} as const;\n`
);
console.log(`Wrote ${relative(process.cwd(), outputPath)} (${datasets.length} datasets, ${totalRecords} summarized records).`);
console.log(`Wrote ${relative(process.cwd(), appSummaryPath)} for the Scout server bundle.`);
