import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packRoot, '..', '..');
const outPath = path.join(repoRoot, 'apps', 'openclaw-web', 'src', 'lib', 'server', 'generated', 'resource-explorer.ts');

const rootDocs = [
  'README.md',
  'source_manifest.yaml',
  'license_review.md',
  'blocked_sources.md',
  'attribution.md',
  'data_quality_report.md',
];

const importantColumns = [
  'id',
  'source_id',
  'dataset_id',
  'route_id',
  'rule_id',
  'water_id',
  'waypoint_id',
  'access_id',
  'town_id',
  'sample_id',
  'segment_id',
  'title',
  'name',
  'type',
  'category',
  'state',
  'mile_nobo',
  'mile_sobo',
  'recordCount',
  'source_url',
  'license_status',
  'confidence',
  'last_checked',
  'ai_answer_rule',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((entry) => {
    const filePath = path.join(dir, entry);
    const stat = fs.statSync(filePath);
    return stat.isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function recordsFrom(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.features)) return parsed.features.map((feature) => feature.properties ?? feature);
  return parsed ? [parsed] : [];
}

function compactValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.replace(/\s+/gu, ' ').trim().slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) && value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
    return value.join(', ').slice(0, 240);
  }
  return JSON.stringify(value).replace(/\s+/gu, ' ').slice(0, 240);
}

function columnsFor(records) {
  const observed = [];
  for (const record of records.slice(0, 25)) {
    for (const key of Object.keys(record ?? {})) {
      if (!observed.includes(key)) observed.push(key);
    }
  }
  const prioritized = importantColumns.filter((key) => observed.includes(key));
  const extras = observed.filter((key) => !prioritized.includes(key) && !['geometry', 'coordinates'].includes(key));
  return [...prioritized, ...extras].slice(0, 14);
}

function sampleRowsFor(records, columns) {
  return records.slice(0, 18).map((record) =>
    Object.fromEntries(columns.map((column) => [column, compactValue(record?.[column])]))
  );
}

function titleForMarkdown(relativePath, text) {
  const heading = text.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  if (heading) return heading;
  return path.basename(relativePath).replace(/\.(md|yaml)$/u, '').replace(/[-_]/gu, ' ');
}

function groupForDoc(relativePath) {
  if (relativePath === 'source_manifest.yaml') return 'source manifest';
  if (relativePath.startsWith('rag_docs/state_guides/')) return 'state guide';
  if (relativePath.startsWith('rag_docs/segment_guides/')) return 'segment guide';
  if (relativePath.startsWith('rag_docs/rules/')) return 'rules';
  if (relativePath.startsWith('rag_docs/safety/')) return 'safety';
  if (relativePath.startsWith('rag_docs/source_notes/')) return 'source notes';
  return 'policy';
}

function excerpt(text, length = 380) {
  return text.replace(/\s+/gu, ' ').trim().slice(0, length);
}

const summary = readJson('processed/summary/scout_offline_reference_summary.json');
const manifest = readJson('source_manifest.yaml');

const tables = [
  {
    id: 'source-manifest',
    label: 'Source manifest',
    category: 'sources',
    path: 'source_manifest.yaml',
    recordCount: manifest.length,
    sourceIds: ['source_manifest'],
    licenseStatuses: [...new Set(manifest.map((source) => source.license_status))].sort(),
    confidence: 'manifest',
    lastChecked: [...new Set(manifest.map((source) => source.last_checked).filter(Boolean))].sort().join(', '),
    aiAnswerRule: 'Admin source catalog; Scout may use only records whose license status and answer rules permit it.',
  },
  ...summary.datasets,
].map((dataset) => {
  const records = recordsFrom(readJson(dataset.path));
  const columns = columnsFor(records);
  return {
    ...dataset,
    columns,
    sampleRows: sampleRowsFor(records, columns),
  };
});

const markdownPaths = [
  ...rootDocs,
  ...walkFiles(path.join(packRoot, 'rag_docs'))
    .filter((filePath) => filePath.endsWith('.md'))
    .map((filePath) => path.relative(packRoot, filePath))
    .sort(),
];

const docs = markdownPaths.map((relativePath) => {
  const text = fs.readFileSync(path.join(packRoot, relativePath), 'utf8');
  return {
    path: relativePath,
    title: titleForMarkdown(relativePath, text),
    group: groupForDoc(relativePath),
    excerpt: excerpt(text),
    markdown: text.slice(0, 5000),
  };
});

const bundle = {
  version: 1,
  generatedAt: new Date().toISOString(),
  packRoot: 'data/at-open-reference',
  summary: {
    totalSources: summary.sourceManifest.totalSources,
    totalDatasets: summary.totals.datasets,
    totalRecords: summary.totals.records,
    routeOfficial: summary.route.official,
    routeCandidateStatus: summary.route.candidateStatus,
    generatedMileDisclosure: summary.policies.generatedMileDisclosure,
    waterDisclosure: summary.policies.waterDisclosure,
    liveConditionsDisclosure: summary.policies.liveConditionsDisclosure,
  },
  tables,
  docs,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `// Generated by data/at-open-reference/scripts/build-scout-resource-explorer.mjs.\n` +
    `// Do not edit by hand; rerun the generator after changing the AT reference pack.\n` +
    `export const scoutResourceExplorerBundle = ${JSON.stringify(bundle, null, 2)} as const;\n`,
  'utf8',
);

console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${tables.length} tables, ${docs.length} docs).`);
