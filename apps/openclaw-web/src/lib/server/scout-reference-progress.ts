import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackConfig {
  readonly id: string;
  readonly label: string;
  readonly region: string;
  readonly root: string;
  readonly validationPath: string;
  readonly statusPath: string;
  readonly validationScript: string;
}

export interface ReferenceProgressPack {
  readonly id: string;
  readonly label: string;
  readonly region: string;
  readonly status: 'green' | 'yellow' | 'red';
  readonly miles: number | null;
  readonly sources: number | null;
  readonly behaviorQuestions: number | null;
  readonly ragDocs: number | null;
  readonly waterCandidates: number | null;
  readonly treadRecords: number | null;
  readonly difficultySegments: number | null;
  readonly majorFordCandidates: number | null;
  readonly validationScript: string;
  readonly statusPath: string;
}

export interface ReferenceProgressDataset {
  readonly datasetId: string;
  readonly path: string;
  readonly recordCount: number;
  readonly productionSafe: boolean;
  readonly licenseStatus: string;
  readonly lastGenerated: string;
  readonly aiAnswerRule: string;
}

export interface ReferenceProgressStatusRow {
  readonly area: string;
  readonly status: 'green' | 'yellow' | 'red' | 'unknown';
  readonly notes: string;
}

export interface ReferenceProgressData {
  readonly generatedAt: string;
  readonly packRoot: string | null;
  readonly rc1: {
    readonly routeId: string;
    readonly routeMiles: number;
    readonly officialReferenceMiles: number;
    readonly routeLengthDeltaMiles: number;
    readonly routeLengthDeltaPercent: number;
    readonly alignmentStatus: string;
    readonly alignmentReportPath: string;
    readonly geodesicRouteMiles: number | null;
    readonly waymarkedRouteMiles: number | null;
    readonly threeDEstimateMiles: number | null;
    readonly maxContinuityGapMiles: number | null;
    readonly unresolvedCauses: readonly string[];
    readonly suspectedCauses: readonly string[];
    readonly zipPath: string;
    readonly zipSizeBytes: number;
    readonly datasetCount: number;
    readonly productionSafeDatasetCount: number;
    readonly totalDatasetRecords: number;
    readonly sourceCount: number;
    readonly productionSafeSourceCount: number;
    readonly blockedSourceCount: number;
    readonly qaQuestionCount: number;
    readonly ragDocCount: number;
    readonly statusRows: readonly ReferenceProgressStatusRow[];
    readonly yellowFlags: readonly ReferenceProgressStatusRow[];
  };
  readonly packs: readonly ReferenceProgressPack[];
  readonly datasets: readonly ReferenceProgressDataset[];
  readonly commands: readonly {
    readonly label: string;
    readonly command: string;
  }[];
}

const packConfigs: readonly PackConfig[] = [
  {
    id: 'mvp1',
    label: 'MVP1',
    region: 'Springer to Davenport Gap',
    root: 'mvp1',
    validationPath: 'mvp1/tests/validation_results_mvp1.json',
    statusPath: 'mvp1/MVP1_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp1/run_mvp1_validation.py --json',
  },
  {
    id: 'mvp2_va',
    label: 'MVP2',
    region: 'Virginia',
    root: 'mvp2_va',
    validationPath: 'mvp2_va/tests/validation_results_mvp2_va.json',
    statusPath: 'mvp2_va/MVP2_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp2_va/run_mvp2_va_validation.py --json',
  },
  {
    id: 'mvp3_midatlantic',
    label: 'MVP3',
    region: 'WV, MD, PA',
    root: 'mvp3_midatlantic',
    validationPath: 'mvp3_midatlantic/tests/validation_results_mvp3_midatlantic.json',
    statusPath: 'mvp3_midatlantic/MVP3_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp3_midatlantic/run_mvp3_midatlantic_validation.py --json',
  },
  {
    id: 'mvp4_nj_ny_ct',
    label: 'MVP4',
    region: 'NJ, NY, CT',
    root: 'mvp4_nj_ny_ct',
    validationPath: 'mvp4_nj_ny_ct/tests/validation_results_mvp4_nj_ny_ct.json',
    statusPath: 'mvp4_nj_ny_ct/MVP4_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp4_nj_ny_ct/run_mvp4_nj_ny_ct_validation.py --json',
  },
  {
    id: 'mvp5_ma_vt_nh',
    label: 'MVP5',
    region: 'MA, VT, NH',
    root: 'mvp5_ma_vt_nh',
    validationPath: 'mvp5_ma_vt_nh/tests/validation_results_mvp5_ma_vt_nh.json',
    statusPath: 'mvp5_ma_vt_nh/MVP5_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp5_ma_vt_nh/run_mvp5_ma_vt_nh_validation.py --json',
  },
  {
    id: 'mvp6_maine',
    label: 'MVP6',
    region: 'Maine',
    root: 'mvp6_maine',
    validationPath: 'mvp6_maine/tests/validation_results_mvp6_maine.json',
    statusPath: 'mvp6_maine/MVP6_STATUS.md',
    validationScript: 'python3 data/at-open-reference/mvp6_maine/run_mvp6_maine_validation.py --json',
  },
];

function candidatePackRoots(): string[] {
  const roots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let index = 0; index < 14; index += 1) {
      candidates.add(join(cursor, 'data', 'at-open-reference'));
      candidates.add(join(cursor, '..', '..', 'data', 'at-open-reference'));
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return Array.from(candidates);
}

function resolvePackRoot(): string | null {
  for (const root of candidatePackRoots()) {
    const resolved = normalize(root);
    if (existsSync(join(resolved, 'full_trail_rc1', 'manifest.json'))) return resolved;
  }
  return null;
}

function readJson<T>(root: string, relativePath: string): T | null {
  const target = normalize(join(root, relativePath));
  const rel = relative(root, target);
  if (rel.startsWith('..') || !existsSync(target)) return null;
  return JSON.parse(readFileSync(target, 'utf8')) as T;
}

function fileSize(root: string, relativePath: string): number {
  const target = join(root, relativePath);
  return existsSync(target) ? statSync(target).size : 0;
}

function countFiles(root: string, relativePath: string): number {
  const target = join(root, relativePath);
  if (!existsSync(target)) return 0;
  return readdirSync(target).reduce((count, entry) => {
    const entryPath = join(target, entry);
    return count + (statSync(entryPath).isDirectory() ? countFiles(root, relative(root, entryPath)) : 1);
  }, 0);
}

function numericValue(record: Record<string, unknown>, keyPattern: RegExp): number | null {
  for (const [key, value] of Object.entries(record)) {
    if (keyPattern.test(key) && typeof value === 'number') return value;
  }
  return null;
}

function packStatus(record: Record<string, unknown> | null, statusExists: boolean): 'green' | 'yellow' | 'red' {
  if (!record) return 'red';
  if (record.ok === false) return 'red';
  return statusExists ? 'green' : 'yellow';
}

function loadRegionalPack(root: string, config: PackConfig): ReferenceProgressPack {
  const validation = readJson<Record<string, unknown>>(root, config.validationPath);
  return {
    id: config.id,
    label: config.label,
    region: config.region,
    status: packStatus(validation, existsSync(join(root, config.statusPath))),
    miles: validation ? numericValue(validation, /(?:^|_)miles$/u) : null,
    sources: validation && typeof validation.sources === 'number' ? validation.sources : null,
    behaviorQuestions: validation && typeof validation.behavior_questions === 'number' ? validation.behavior_questions : null,
    ragDocs: validation && typeof validation.rag_docs === 'number' ? validation.rag_docs : null,
    waterCandidates: validation && typeof validation.water_candidates === 'number' ? validation.water_candidates : null,
    treadRecords: validation && typeof validation.tread_1mi_records === 'number' ? validation.tread_1mi_records : null,
    difficultySegments: validation && typeof validation.difficulty_segments === 'number' ? validation.difficulty_segments : null,
    majorFordCandidates: validation && typeof validation.major_ford_candidates === 'number' ? validation.major_ford_candidates : null,
    validationScript: config.validationScript,
    statusPath: `data/at-open-reference/${config.statusPath}`,
  };
}

function parseStatusRows(markdown: string): ReferenceProgressStatusRow[] {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && !/^\|\s*-+/u.test(line) && !/\|\s*Area\s*\|/iu.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .map(([area, status, notes]) => ({
      area,
      status: status.toLowerCase() as ReferenceProgressStatusRow['status'],
      notes,
    }));
}

export function loadScoutReferenceProgressData(): ReferenceProgressData {
  const packRoot = resolvePackRoot();
  if (!packRoot) {
    return {
      generatedAt: new Date().toISOString(),
      packRoot: null,
      rc1: {
        routeId: 'missing',
        routeMiles: 0,
        officialReferenceMiles: 0,
        routeLengthDeltaMiles: 0,
        routeLengthDeltaPercent: 0,
        alignmentStatus: 'missing',
        alignmentReportPath: 'data/at-open-reference/full_trail_rc1/processed/route/route_alignment_report.md',
        geodesicRouteMiles: null,
        waymarkedRouteMiles: null,
        threeDEstimateMiles: null,
        maxContinuityGapMiles: null,
        unresolvedCauses: [],
        suspectedCauses: [],
        zipPath: 'data/at-open-reference/full_trail_rc1/exports/full_trail_reference_pack_rc1.zip',
        zipSizeBytes: 0,
        datasetCount: 0,
        productionSafeDatasetCount: 0,
        totalDatasetRecords: 0,
        sourceCount: 0,
        productionSafeSourceCount: 0,
        blockedSourceCount: 0,
        qaQuestionCount: 0,
        ragDocCount: 0,
        statusRows: [],
        yellowFlags: [],
      },
      packs: [],
      datasets: [],
      commands: [],
    };
  }

  const manifest = readJson<{
    route_id: string;
    full_trail_generated_miles: number;
    official_reference_length_miles: number;
    length_delta_miles?: number;
    length_delta_percent?: number;
    alignment_status?: string;
  }>(packRoot, 'full_trail_rc1/manifest.json');
  const routeAlignment = readJson<{
    alignment_status?: string;
    length_delta_miles?: number;
    length_delta_percent?: number;
    route_length_measurements?: {
      local_geodesic_miles?: number;
      waymarked_reported_miles?: number;
      three_d_estimate?: {
        estimated_3d_length_miles?: number;
      };
    };
    unresolved_causes?: string[];
    suspected_causes?: string[];
  }>(packRoot, 'full_trail_rc1/processed/route/route_alignment_diagnostics.json');
  const continuity = readJson<{
    max_consecutive_vertex_gap_miles?: number;
  }>(packRoot, 'full_trail_rc1/processed/route/route_continuity_diagnostics.json');
  const datasetIndex = readJson<{
    dataset_id: string;
    path: string;
    record_count: number;
    production_safe: boolean;
    license_status: string;
    last_generated: string;
    ai_answer_rule: string;
  }[]>(packRoot, 'full_trail_rc1/processed/index/full_trail_dataset_index.json') ?? [];
  const sourceManifest = readJson<{ production_safe?: boolean; license_status?: string }[]>(
    packRoot,
    'full_trail_rc1/full_trail_source_manifest.yaml'
  ) ?? [];
  const statusMarkdown = existsSync(join(packRoot, 'full_trail_rc1/FULL_TRAIL_RC1_STATUS.md'))
    ? readFileSync(join(packRoot, 'full_trail_rc1/FULL_TRAIL_RC1_STATUS.md'), 'utf8')
    : '';
  const statusRows = parseStatusRows(statusMarkdown);
  const qa = datasetIndex.find((dataset) => dataset.dataset_id === 'qa_questions')?.record_count ?? 0;
  const rag = datasetIndex.find((dataset) => dataset.dataset_id === 'rag_metadata')?.record_count ?? countFiles(packRoot, 'full_trail_rc1/rag_docs/segment_guides');

  return {
    generatedAt: new Date().toISOString(),
    packRoot,
    rc1: {
      routeId: manifest?.route_id ?? 'missing',
      routeMiles: manifest?.full_trail_generated_miles ?? 0,
      officialReferenceMiles: manifest?.official_reference_length_miles ?? 0,
      routeLengthDeltaMiles: routeAlignment?.length_delta_miles ?? manifest?.length_delta_miles ?? 0,
      routeLengthDeltaPercent: routeAlignment?.length_delta_percent ?? manifest?.length_delta_percent ?? 0,
      alignmentStatus: routeAlignment?.alignment_status ?? manifest?.alignment_status ?? 'missing',
      alignmentReportPath: 'data/at-open-reference/full_trail_rc1/processed/route/route_alignment_report.md',
      geodesicRouteMiles: routeAlignment?.route_length_measurements?.local_geodesic_miles ?? null,
      waymarkedRouteMiles: routeAlignment?.route_length_measurements?.waymarked_reported_miles ?? null,
      threeDEstimateMiles: routeAlignment?.route_length_measurements?.three_d_estimate?.estimated_3d_length_miles ?? null,
      maxContinuityGapMiles: continuity?.max_consecutive_vertex_gap_miles ?? null,
      unresolvedCauses: routeAlignment?.unresolved_causes ?? [],
      suspectedCauses: routeAlignment?.suspected_causes ?? [],
      zipPath: 'data/at-open-reference/full_trail_rc1/exports/full_trail_reference_pack_rc1.zip',
      zipSizeBytes: fileSize(packRoot, 'full_trail_rc1/exports/full_trail_reference_pack_rc1.zip'),
      datasetCount: datasetIndex.length,
      productionSafeDatasetCount: datasetIndex.filter((dataset) => dataset.production_safe).length,
      totalDatasetRecords: datasetIndex.reduce((sum, dataset) => sum + dataset.record_count, 0),
      sourceCount: sourceManifest.length,
      productionSafeSourceCount: sourceManifest.filter((source) => source.production_safe).length,
      blockedSourceCount: sourceManifest.filter((source) => source.license_status === 'blocked').length,
      qaQuestionCount: qa,
      ragDocCount: rag,
      statusRows,
      yellowFlags: statusRows.filter((row) => row.status === 'yellow' || row.status === 'red'),
    },
    packs: packConfigs.map((config) => loadRegionalPack(packRoot, config)),
    datasets: datasetIndex.map((dataset) => ({
      datasetId: dataset.dataset_id,
      path: `data/at-open-reference/full_trail_rc1/${dataset.path}`,
      recordCount: dataset.record_count,
      productionSafe: dataset.production_safe,
      licenseStatus: dataset.license_status,
      lastGenerated: dataset.last_generated,
      aiAnswerRule: dataset.ai_answer_rule,
    })),
    commands: [
      {
        label: 'Regenerate RC1',
        command: 'node data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      },
      {
        label: 'Export production-safe zip',
        command: 'python3 data/at-open-reference/scripts/export/export_full_trail_production_safe.py',
      },
      {
        label: 'Validate RC1',
        command: 'python3 data/at-open-reference/full_trail_rc1/run_full_trail_validation.py --json',
      },
      {
        label: 'Run full tests',
        command: 'npm test',
      },
      {
        label: 'Forge build',
        command: 'npm run build:openclaw:forge',
      },
    ],
  };
}
