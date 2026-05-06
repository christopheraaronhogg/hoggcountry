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
    readonly averageScore: number;
    readonly coverageScore: number;
    readonly passRate: number;
    readonly blockerCount: number;
    readonly safetyRiskCount: number;
    readonly severityCounts: Record<string, number>;
  };
  readonly filters: Record<string, unknown>;
  readonly patchNotes: string;
  readonly deploymentNotes: string;
  readonly knownRemainingFailures: string;
}

export interface ScoutReliabilityRunArtifact {
  readonly metadata: ScoutReliabilityRunMetadata;
  readonly scenarios: readonly ScoutReliabilityScenario[];
  readonly results: readonly ScoutReliabilityScenarioResult[];
}

export interface ScoutReliabilityData {
  readonly scenarios: readonly ScoutReliabilityScenario[];
  readonly runs: readonly ScoutReliabilityRunArtifact[];
  readonly dataRoot: string;
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
    dataRoot
  };
}
