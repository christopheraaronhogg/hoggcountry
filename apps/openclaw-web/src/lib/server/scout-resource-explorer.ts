import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BetaProfileCookie } from '$lib/beta';
import { scoutResourceExplorerBundle } from './generated/resource-explorer.ts';

export type ScoutExplorerTable = (typeof scoutResourceExplorerBundle.tables)[number];
export type ScoutExplorerDoc = (typeof scoutResourceExplorerBundle.docs)[number];

export interface ScoutExplorerWorkspacePreview {
  readonly workspaceId: string;
  readonly title: string;
  readonly docs: readonly {
    readonly id: string;
    readonly title: string;
    readonly kind: string;
    readonly status: string;
    readonly updatedAt: string;
    readonly searchable: boolean;
    readonly preview: string;
  }[];
  readonly resources: readonly {
    readonly id: string;
    readonly title: string;
    readonly kind: string;
    readonly status: string;
    readonly updatedAt: string;
    readonly sensitivity: string;
    readonly searchable: boolean;
    readonly addedBy: string;
    readonly sourceUri: string | null;
    readonly preview: string;
  }[];
  readonly counts: {
    readonly docs: number;
    readonly resources: number;
    readonly tools: number;
    readonly messages: number;
  };
}

export interface ScoutResourceExplorerData {
  readonly generatedAt: string;
  readonly reference: typeof scoutResourceExplorerBundle;
  readonly workspace: ScoutExplorerWorkspacePreview;
}

export interface ScoutTablePage {
  readonly path: string;
  readonly offset: number;
  readonly limit: number;
  readonly total: number;
  readonly columns: readonly string[];
  readonly rows: readonly Record<string, string>[];
  readonly source: 'filesystem' | 'bundled-sample';
}

const tablePathSet = new Set<string>(scoutResourceExplorerBundle.tables.map((table) => table.path));
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
  'source_url',
  'license_status',
  'confidence',
  'last_checked',
  'ai_answer_rule',
];

function compactText(value: string, max = 300): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trimEnd()}...` : normalized;
}

function compactValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return compactText(value, 260);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) && value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
    return compactText(value.join(', '), 260);
  }
  return compactText(JSON.stringify(value), 260);
}

function recordsFrom(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null);
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    Array.isArray((parsed as { features?: unknown }).features)
  ) {
    return (parsed as { features: { properties?: Record<string, unknown> }[] }).features.map((feature) => feature.properties ?? {});
  }
  return typeof parsed === 'object' && parsed !== null ? [parsed as Record<string, unknown>] : [];
}

function columnsFor(records: readonly Record<string, unknown>[]): string[] {
  const observed: string[] = [];
  for (const record of records.slice(0, 25)) {
    for (const key of Object.keys(record)) {
      if (!observed.includes(key)) observed.push(key);
    }
  }
  const prioritized = importantColumns.filter((key) => observed.includes(key));
  const extras = observed.filter((key) => !prioritized.includes(key) && !['geometry', 'coordinates'].includes(key));
  return [...prioritized, ...extras].slice(0, 14);
}

function rowsFor(records: readonly Record<string, unknown>[], columns: readonly string[]): Record<string, string>[] {
  return records.map((record) => Object.fromEntries(columns.map((column) => [column, compactValue(record[column])])));
}

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

function resolvePackFile(relativePath: string): string | null {
  if (!tablePathSet.has(relativePath)) return null;
  for (const root of candidatePackRoots()) {
    const resolved = normalize(join(root, relativePath));
    const rel = relative(root, resolved);
    if (rel.startsWith('..')) continue;
    if (existsSync(resolved)) return resolved;
  }
  return null;
}

function bundledTable(path: string): ScoutExplorerTable | null {
  return scoutResourceExplorerBundle.tables.find((table) => table.path === path) ?? null;
}

export function readScoutReferenceTablePage(input: {
  readonly path: string;
  readonly offset?: number;
  readonly limit?: number;
}): ScoutTablePage {
  const table = bundledTable(input.path);
  if (!table) throw new Error('Unknown Scout reference table.');

  const offset = Math.max(0, Math.floor(input.offset ?? 0));
  const limit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 30)));
  const sourceFile = resolvePackFile(input.path);

  if (sourceFile) {
    const records = recordsFrom(JSON.parse(readFileSync(sourceFile, 'utf8')));
    const pageRecords = records.slice(offset, offset + limit);
    const columns = columnsFor(pageRecords.length > 0 ? pageRecords : records);
    return {
      path: input.path,
      offset,
      limit,
      total: records.length,
      columns,
      rows: rowsFor(pageRecords, columns),
      source: 'filesystem',
    };
  }

  return {
    path: input.path,
    offset: 0,
    limit: table.sampleRows.length,
    total: table.recordCount,
    columns: table.columns,
    rows: table.sampleRows,
    source: 'bundled-sample',
  };
}

function previewFromText(value: string | null | undefined): string {
  return compactText(value ?? 'No preview text available.', 360);
}

export async function loadScoutResourceExplorerData(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<ScoutResourceExplorerData> {
  const { getWorkspace } = await import('./workspace-store.ts');
  const workspace = await getWorkspace(workspaceId, betaProfile);
  const title = betaProfile.trailName || betaProfile.name || 'Scout admin';

  return {
    generatedAt: new Date().toISOString(),
    reference: scoutResourceExplorerBundle,
    workspace: {
      workspaceId,
      title,
      counts: {
        docs: workspace.documents.length,
        resources: workspace.resources.length,
        tools: workspace.tools.length,
        messages: workspace.clawMessages.length,
      },
      docs: workspace.documents.slice(0, 40).map((document) => ({
        id: document.id,
        title: document.title,
        kind: document.kind,
        status: document.status,
        updatedAt: document.updatedAt ?? document.importedAt,
        searchable: document.searchable,
        preview: previewFromText(document.note || document.textContent),
      })),
      resources: workspace.resources.slice(0, 60).map((resource) => ({
        id: resource.id,
        title: resource.title,
        kind: resource.kind,
        status: resource.status,
        updatedAt: resource.updatedAt,
        sensitivity: resource.sensitivity,
        searchable: resource.searchable,
        addedBy: resource.addedBy,
        sourceUri: resource.sourceUri ?? null,
        preview: previewFromText(resource.summary || resource.extractedText || resource.sourceUri),
      })),
    },
  };
}
