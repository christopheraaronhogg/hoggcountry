import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoutAtOpenReferenceBundledSummary } from './generated/at-open-reference-summary.ts';

const SUMMARY_RELATIVE_PATH = 'processed/summary/scout_offline_reference_summary.json';

export interface ScoutAtOpenReferenceDatasetSummary {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly path: string;
  readonly recordCount: number;
  readonly sourceIds: readonly string[];
  readonly licenseStatuses: readonly string[];
  readonly confidence: string;
  readonly lastChecked: string;
  readonly aiAnswerRule: string | null;
}

export interface ScoutAtOpenReferenceSummaryRoute {
  readonly routeId: string;
  readonly name: string;
  readonly path: string;
  readonly sourceId: string;
  readonly sourceUrl: string;
  readonly sourceAccessUrl: string;
  readonly geometrySource: string;
  readonly licenseStatus: string;
  readonly attribution: string;
  readonly confidence: string;
  readonly lastChecked: string;
  readonly measuredLengthMiles: number;
  readonly officialReferenceLengthMiles: number;
  readonly officialReferenceDate: string;
  readonly officialReferenceSource: string;
  readonly lengthDeltaMiles: number;
  readonly official: false;
  readonly candidateStatus: string;
  readonly knownQualityFlags: readonly string[];
  readonly aiAnswerRule: string;
}

export interface ScoutAtOpenReferenceOfflineSummary {
  readonly version: 1;
  readonly summaryId: string;
  readonly generatedAt: string;
  readonly loadedAt: string;
  readonly available: true;
  readonly sourceManifest: {
    readonly path: string;
    readonly totalSources: number;
    readonly licenseStatusCounts: Record<string, number>;
    readonly blockedSourceIds: readonly string[];
    readonly shareAlikeSourceIds: readonly string[];
    readonly liveApiSourceIds: readonly string[];
    readonly lastCheckedDates: readonly string[];
  };
  readonly route: ScoutAtOpenReferenceSummaryRoute;
  readonly datasets: readonly ScoutAtOpenReferenceDatasetSummary[];
  readonly totals: {
    readonly datasets: number;
    readonly records: number;
  };
  readonly liveConditionSources: readonly unknown[];
  readonly policies: {
    readonly generatedMileDisclosure: string;
    readonly routeQualityDisclosure: string;
    readonly waterDisclosure: string;
    readonly liveConditionsDisclosure: string;
    readonly blockedSourcesDisclosure: string;
    readonly offlineUseDisclosure: string;
  };
  readonly sourceNotes: readonly {
    readonly path: string;
    readonly excerpt: string;
  }[];
  readonly generatedFrom: {
    readonly script: string;
    readonly packRoot: string;
  };
}

export interface ScoutAtOpenReferenceUnavailableSummary {
  readonly version: 1;
  readonly summaryId: 'scout-at-open-reference-offline-summary';
  readonly loadedAt: string;
  readonly available: false;
  readonly reason: string;
  readonly attemptedPaths: readonly string[];
}

export type ScoutAtOpenReferenceFieldPackSummary =
  | ScoutAtOpenReferenceOfflineSummary
  | ScoutAtOpenReferenceUnavailableSummary;

function summaryPathCandidates(): string[] {
  const roots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let index = 0; index < 14; index += 1) {
      candidates.add(join(cursor, 'data/at-open-reference', SUMMARY_RELATIVE_PATH));
      candidates.add(join(cursor, '../../data/at-open-reference', SUMMARY_RELATIVE_PATH));

      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return Array.from(candidates);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidSummary(value: unknown): value is Omit<ScoutAtOpenReferenceOfflineSummary, 'loadedAt'> {
  if (!isObject(value)) return false;
  if (value.version !== 1 || value.available !== true || value.summaryId !== 'scout-at-open-reference-offline-summary') return false;
  if (!isObject(value.route) || value.route.official !== false || value.route.candidateStatus !== 'not_production_final') return false;
  if (!Array.isArray(value.datasets) || value.datasets.length === 0) return false;
  if (!isObject(value.policies) || typeof value.policies.generatedMileDisclosure !== 'string') return false;
  return /not official ATC miles|not an official ATC mile/iu.test(value.policies.generatedMileDisclosure);
}

function summaryWithLoadedAt(
  value: unknown,
  now: Date
): ScoutAtOpenReferenceOfflineSummary | null {
  if (!isValidSummary(value)) return null;
  return {
    ...value,
    loadedAt: now.toISOString()
  };
}

export async function loadScoutAtOpenReferenceOfflineSummary(now = new Date()): Promise<ScoutAtOpenReferenceFieldPackSummary> {
  const bundled = summaryWithLoadedAt(scoutAtOpenReferenceBundledSummary, now);
  if (bundled) return bundled;

  const attemptedPaths = summaryPathCandidates();

  for (const path of attemptedPaths) {
    if (!existsSync(path)) continue;

    try {
      const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
      const parsedSummary = summaryWithLoadedAt(parsed, now);
      if (!parsedSummary) {
        return {
          version: 1,
          summaryId: 'scout-at-open-reference-offline-summary',
          loadedAt: now.toISOString(),
          available: false,
          reason: `Scout AT reference summary was present but failed safety validation at ${path}.`,
          attemptedPaths
        };
      }

      return parsedSummary;
    } catch (error) {
      if (error instanceof SyntaxError) {
        return {
          version: 1,
          summaryId: 'scout-at-open-reference-offline-summary',
          loadedAt: now.toISOString(),
          available: false,
          reason: `Scout AT reference summary is not valid JSON at ${path}.`,
          attemptedPaths
        };
      }
    }
  }

  return {
    version: 1,
    summaryId: 'scout-at-open-reference-offline-summary',
    loadedAt: now.toISOString(),
    available: false,
    reason: 'Scout AT reference summary is not bundled in this runtime.',
    attemptedPaths
  };
}
