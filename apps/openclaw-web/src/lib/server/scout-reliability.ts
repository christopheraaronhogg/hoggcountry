import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface ScoutReliabilityScenario {
  readonly id: string;
  readonly prompt: string;
  readonly regionState: string;
  readonly approximateAtMileRange?: readonly [number, number];
  readonly expectedCorridor: string;
  readonly expectedStart: string;
  readonly expectedEnd: string;
  readonly expectedDirection: string;
  readonly expectedPlanType: string;
  readonly requiredOutputSections: readonly string[];
  readonly requiredCaveats: readonly string[];
  readonly disallowedMistakes: readonly string[];
  readonly difficulty: number;
  readonly difficultyRationale: string;
  readonly deterministicStrictRouteSupport: 'now' | 'later';
  readonly expectedExecutionMode?: string;
  readonly expectedSourceId?: string;
  readonly expectedStartPointId?: string;
  readonly expectedDestinationPointId?: string;
  readonly expectedAnchors?: readonly string[];
  readonly sourceExpectations?: {
    readonly requiredSourceIds: readonly string[];
    readonly missingSourceClasses: readonly string[];
    readonly liveFetchRequiredBeforeActing: boolean;
  };
  readonly scoringCriteria?: {
    readonly passThreshold: number;
    readonly blockerFlags: readonly string[];
    readonly requiredCategories: readonly string[];
    readonly categoryWeights: Record<string, number>;
  };
}

export interface ScoutReliabilityAssertionResult {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly actual?: unknown;
  readonly issues?: readonly unknown[];
}

export interface ScoutReliabilityScenarioResult {
  readonly scenarioId: string;
  readonly difficulty: number;
  readonly regionState: string;
  readonly status: 'passed' | 'failed' | 'skipped';
  readonly pass: boolean | null;
  readonly failureReason: string;
  readonly assertions: readonly ScoutReliabilityAssertionResult[];
  readonly rawResponse: string;
  readonly score?: {
    readonly total: number;
    readonly passThreshold: number;
    readonly categoryScores: Record<string, number>;
    readonly severityFlags: readonly string[];
    readonly failureReasons: readonly string[];
    readonly blockerCount: number;
    readonly safetyRiskCount: number;
  };
  readonly grounding: {
    readonly sourceId: string;
    readonly direction: string;
    readonly start: string;
    readonly destination: string | null;
    readonly planOptions: readonly string[];
    readonly warnings: readonly string[];
  } | null;
  readonly sourceReceipts?: readonly string[];
  readonly missingSourceClasses?: readonly string[];
  readonly manualReview?: {
    readonly status: string;
    readonly notes: string;
  };
}

export interface ScoutReliabilityRunMetadata {
  readonly runId: string;
  readonly timestamp: string;
  readonly gitCommitSha: string;
  readonly gitCommitMessage: string;
  readonly changedFiles: readonly string[];
  readonly deployedRevision: string | null;
  readonly forgeReleaseId: string | null;
  readonly environment: string;
  readonly model: string;
  readonly modelProvider?: string;
  readonly modelId?: string;
  readonly modelDisplayName?: string;
  readonly modelSettings?: Record<string, unknown>;
  readonly promptVersion?: string;
  readonly siteGitSha?: string;
  readonly evaluatorVersion?: string;
  readonly scenarioSuiteVersion?: string;
  readonly mode: string;
  readonly scenarioCount: number;
  readonly passFailCounts: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
  };
  readonly difficultyRangeTested: readonly [number, number] | null;
  readonly scoreSummary?: {
    readonly totalScore?: number;
    readonly averageScore: number;
    readonly coverageScore: number;
    readonly passRate: number;
    readonly blockerCount: number;
    readonly safetyRiskCount: number;
    readonly wrongCorridorCount?: number;
    readonly severityCounts: Record<string, number>;
  };
  readonly filters: Record<string, unknown>;
  readonly patchNotes: string;
  readonly deploymentNotes: string;
  readonly knownRemainingFailures: string;
  readonly humanReviewLabels?: readonly string[];
  readonly humanReviewStatusCounts?: Record<string, number>;
}

export interface ScoutReliabilityRunArtifact {
  readonly metadata: ScoutReliabilityRunMetadata;
  readonly scenarios: readonly ScoutReliabilityScenario[];
  readonly results: readonly ScoutReliabilityScenarioResult[];
}

export interface ScoutReliabilityData {
  readonly scenarios: readonly ScoutReliabilityScenario[];
  readonly runs: readonly ScoutReliabilityRunArtifact[];
  readonly groups: readonly ScoutReliabilityArenaGroup[];
  readonly dataRoot: string;
}

export interface ScoutReliabilityScenarioConsistency {
  readonly scenarioId: string;
  readonly runCount: number;
  readonly averageScore: number;
  readonly bestScore: number;
  readonly worstScore: number;
  readonly passRate: number;
  readonly statusCounts: Record<string, number>;
  readonly severityFlags: readonly string[];
  readonly latestRunId: string;
}

export interface ScoutReliabilityArenaGroup {
  readonly groupKey: string;
  readonly rank: number;
  readonly modelProvider: string;
  readonly modelId: string;
  readonly modelDisplayName: string;
  readonly repoSha: string;
  readonly environment: string;
  readonly runCount: number;
  readonly runIds: readonly string[];
  readonly averageScore: number;
  readonly bestScore: number;
  readonly worstScore: number;
  readonly averagePassRate: number;
  readonly blockerCount: number;
  readonly safetyRiskCount: number;
  readonly wrongCorridorCount: number;
  readonly blockerFrequency: number;
  readonly safetyRiskFrequency: number;
  readonly wrongCorridorFrequency: number;
  readonly scenarioLevelConsistency: number;
  readonly difficultyCoverage: string;
  readonly scenarioCountAverage: number;
  readonly latestRunTimestamp: string;
  readonly latestRunId: string;
  readonly latestPatchNotes: string;
  readonly patchNotesSummary: string;
  readonly knownRemainingFailures: string;
  readonly changedAreas: readonly string[];
  readonly scenarioConsistency: readonly ScoutReliabilityScenarioConsistency[];
}

function scoutReliabilityDataRoot(): string {
  const candidates = [
    resolve(process.cwd(), 'data/scout-reliability'),
    resolve(process.cwd(), '../../data/scout-reliability'),
    resolve(process.cwd(), '../data/scout-reliability')
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function scenarioScore(result: ScoutReliabilityScenarioResult | null | undefined): number {
  if (!result) return 0;
  if (typeof result.score?.total === 'number') return result.score.total;
  if (result.status === 'passed') return 100;
  return 0;
}

function runScore(run: ScoutReliabilityRunArtifact): number {
  if (typeof run.metadata.scoreSummary?.coverageScore === 'number') return run.metadata.scoreSummary.coverageScore;
  const scores = run.results.map(scenarioScore);
  return scores.length > 0 ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;
}

function runPassRate(run: ScoutReliabilityRunArtifact): number {
  if (typeof run.metadata.scoreSummary?.passRate === 'number') return run.metadata.scoreSummary.passRate;
  const tested = run.results.filter((result) => result.status !== 'skipped');
  return tested.length > 0 ? Math.round((run.metadata.passFailCounts.passed / tested.length) * 100) : 0;
}

function severityCount(run: ScoutReliabilityRunArtifact, flag: string): number {
  const fromSummary = run.metadata.scoreSummary?.severityCounts?.[flag];
  if (typeof fromSummary === 'number') return fromSummary;
  return run.results.filter((result) => result.score?.severityFlags?.includes(flag)).length;
}

function blockerCount(run: ScoutReliabilityRunArtifact): number {
  if (typeof run.metadata.scoreSummary?.blockerCount === 'number') return run.metadata.scoreSummary.blockerCount;
  return run.results.reduce((total, result) => total + (result.score?.blockerCount ?? 0), 0);
}

function safetyRiskCount(run: ScoutReliabilityRunArtifact): number {
  if (typeof run.metadata.scoreSummary?.safetyRiskCount === 'number') return run.metadata.scoreSummary.safetyRiskCount;
  return run.results.reduce((total, result) => total + (result.score?.safetyRiskCount ?? 0), 0);
}

function repoSha(run: ScoutReliabilityRunArtifact): string {
  return run.metadata.siteGitSha || run.metadata.gitCommitSha || 'unknown';
}

function modelId(run: ScoutReliabilityRunArtifact): string {
  return run.metadata.modelId || run.metadata.model || 'unknown-model';
}

function modelDisplayName(run: ScoutReliabilityRunArtifact): string {
  return run.metadata.modelDisplayName || run.metadata.model || run.metadata.modelId || 'Unknown model';
}

function changedArea(file: string): string {
  if (file.startsWith('apps/openclaw-web/src/lib/server/')) return 'Scout server logic';
  if (file.startsWith('apps/openclaw-web/src/routes/app/scout-lab/reliability')) return 'Reliability Arena UI';
  if (file.startsWith('packages/trail-data/')) return 'AT route validators';
  if (file.startsWith('packages/scout-sources/')) return 'Source manifests';
  if (file.startsWith('data/scout-reliability/')) return 'Reliability artifacts';
  if (file.startsWith('scripts/eval-scout-reliability')) return 'Reliability harness';
  return file.split('/').slice(0, 2).join('/');
}

function uniqueSorted<T>(items: readonly T[]): T[] {
  return [...new Set(items)].sort();
}

function average(items: readonly number[]): number {
  return items.length > 0 ? Math.round(items.reduce((total, item) => total + item, 0) / items.length) : 0;
}

function difficultyCoverage(runs: readonly ScoutReliabilityRunArtifact[]): string {
  const difficulties = uniqueSorted(runs.flatMap((run) => run.results.map((result) => result.difficulty)).filter(Number.isFinite));
  if (difficulties.length === 0) return 'none';
  const contiguous = difficulties.length === difficulties[difficulties.length - 1] - difficulties[0] + 1;
  return contiguous ? `${difficulties[0]}-${difficulties[difficulties.length - 1]}` : difficulties.join(', ');
}

function scenarioConsistencyFor(runs: readonly ScoutReliabilityRunArtifact[]): ScoutReliabilityScenarioConsistency[] {
  const rows = new Map<string, ScoutReliabilityScenarioResult[]>();
  for (const run of runs) {
    for (const result of run.results) {
      rows.set(result.scenarioId, [...(rows.get(result.scenarioId) ?? []), result]);
    }
  }

  return [...rows.entries()].map(([scenarioId, results]) => {
    const scores = results.map(scenarioScore);
    const passed = results.filter((result) => result.status === 'passed').length;
    const statusCounts = results.reduce<Record<string, number>>((counts, result) => {
      counts[result.status] = (counts[result.status] ?? 0) + 1;
      return counts;
    }, {});
    const latest = results
      .map((result) => ({ result, run: runs.find((candidate) => candidate.results.includes(result)) }))
      .sort((left, right) => new Date(right.run?.metadata.timestamp ?? 0).getTime() - new Date(left.run?.metadata.timestamp ?? 0).getTime())[0];
    return {
      scenarioId,
      runCount: results.length,
      averageScore: average(scores),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      passRate: Math.round((passed / results.length) * 100),
      statusCounts,
      severityFlags: uniqueSorted(results.flatMap((result) => result.score?.severityFlags ?? [])),
      latestRunId: latest?.run?.metadata.runId ?? ''
    };
  }).sort((left, right) => left.averageScore - right.averageScore || left.passRate - right.passRate || left.scenarioId.localeCompare(right.scenarioId));
}

export function buildScoutReliabilityArenaGroups(runs: readonly ScoutReliabilityRunArtifact[]): ScoutReliabilityArenaGroup[] {
  const buckets = new Map<string, ScoutReliabilityRunArtifact[]>();
  for (const run of runs) {
    const key = [run.metadata.modelProvider ?? 'unknown-provider', modelId(run), repoSha(run), run.metadata.environment || 'unknown-env'].join('|');
    buckets.set(key, [...(buckets.get(key) ?? []), run]);
  }

  return [...buckets.entries()].map(([groupKey, groupRuns]) => {
    const sortedRuns = [...groupRuns].sort((left, right) => new Date(right.metadata.timestamp).getTime() - new Date(left.metadata.timestamp).getTime());
    const latest = sortedRuns[0];
    const scores = sortedRuns.map(runScore);
    const passRates = sortedRuns.map(runPassRate);
    const blockers = sortedRuns.reduce((total, run) => total + blockerCount(run), 0);
    const safetyRisks = sortedRuns.reduce((total, run) => total + safetyRiskCount(run), 0);
    const wrongCorridors = sortedRuns.reduce((total, run) => total + severityCount(run, 'wrong corridor'), 0);
    const consistency = scenarioConsistencyFor(sortedRuns);
    const stableScenarios = consistency.filter((scenario) => scenario.bestScore === scenario.worstScore && Object.keys(scenario.statusCounts).length === 1);

    return {
      groupKey,
      rank: 0,
      modelProvider: latest.metadata.modelProvider ?? 'unknown-provider',
      modelId: modelId(latest),
      modelDisplayName: modelDisplayName(latest),
      repoSha: repoSha(latest),
      environment: latest.metadata.environment || 'unknown-env',
      runCount: sortedRuns.length,
      runIds: sortedRuns.map((run) => run.metadata.runId),
      averageScore: average(scores),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      averagePassRate: average(passRates),
      blockerCount: blockers,
      safetyRiskCount: safetyRisks,
      wrongCorridorCount: wrongCorridors,
      blockerFrequency: Math.round(blockers / sortedRuns.length),
      safetyRiskFrequency: Math.round(safetyRisks / sortedRuns.length),
      wrongCorridorFrequency: Math.round(wrongCorridors / sortedRuns.length),
      scenarioLevelConsistency: consistency.length > 0 ? Math.round((stableScenarios.length / consistency.length) * 100) : 0,
      difficultyCoverage: difficultyCoverage(sortedRuns),
      scenarioCountAverage: average(sortedRuns.map((run) => run.metadata.scenarioCount)),
      latestRunTimestamp: latest.metadata.timestamp,
      latestRunId: latest.metadata.runId,
      latestPatchNotes: latest.metadata.patchNotes || '',
      patchNotesSummary: latest.metadata.patchNotes || latest.metadata.gitCommitMessage || 'No patch notes recorded.',
      knownRemainingFailures: latest.metadata.knownRemainingFailures || '',
      changedAreas: uniqueSorted(sortedRuns.flatMap((run) => run.metadata.changedFiles ?? []).map(changedArea)).slice(0, 8),
      scenarioConsistency: consistency
    };
  }).sort((left, right) =>
    right.averageScore - left.averageScore ||
    right.averagePassRate - left.averagePassRate ||
    left.blockerFrequency - right.blockerFrequency ||
    left.safetyRiskFrequency - right.safetyRiskFrequency ||
    new Date(right.latestRunTimestamp).getTime() - new Date(left.latestRunTimestamp).getTime()
  ).map((group, index) => ({ ...group, rank: index + 1 }));
}

export async function loadScoutReliabilityData(): Promise<ScoutReliabilityData> {
  const dataRoot = scoutReliabilityDataRoot();
  const scenarios = await readJsonFile<ScoutReliabilityScenario[]>(join(dataRoot, 'scenarios.json'), []);
  const runsPath = join(dataRoot, 'runs');
  const runFiles = existsSync(runsPath)
    ? (await readdir(runsPath)).filter((file) => file.endsWith('.json')).sort().reverse()
    : [];
  const runs = await Promise.all(
    runFiles.map((file) => readJsonFile<ScoutReliabilityRunArtifact | null>(join(runsPath, file), null))
  );

  return {
    scenarios,
    runs: runs.filter((run): run is ScoutReliabilityRunArtifact => Boolean(run?.metadata?.runId)),
    groups: buildScoutReliabilityArenaGroups(runs.filter((run): run is ScoutReliabilityRunArtifact => Boolean(run?.metadata?.runId))),
    dataRoot
  };
}
