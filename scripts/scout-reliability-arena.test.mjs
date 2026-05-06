import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildScoutReliabilityArenaGroups } from '../apps/openclaw-web/src/lib/server/scout-reliability.ts';

function run({
  id,
  sha,
  environment = 'local',
  score,
  passRate = 100,
  blockers = 0,
  safety = 0,
  wrongCorridor = 0,
  scenarioScore = score,
  status = 'passed'
}) {
  return {
    metadata: {
      runId: id,
      timestamp: `2026-05-06T12:0${id.slice(-1)}:00.000Z`,
      gitCommitSha: sha,
      gitCommitMessage: `commit ${sha}`,
      changedFiles: ['scripts/eval-scout-reliability.mjs'],
      deployedRevision: null,
      forgeReleaseId: null,
      environment,
      model: 'deepseek-v4-pro',
      modelProvider: 'opencode-go',
      modelId: 'deepseek-v4-pro',
      modelDisplayName: 'DeepSeek v4 Pro',
      modelSettings: {},
      promptVersion: 'test-prompt',
      siteGitSha: sha,
      evaluatorVersion: 'test-evaluator',
      scenarioSuiteVersion: 'test-suite',
      mode: 'grounding',
      scenarioCount: 1,
      passFailCounts: {
        passed: status === 'passed' ? 1 : 0,
        failed: status === 'failed' ? 1 : 0,
        skipped: 0
      },
      difficultyRangeTested: [4, 4],
      scoreSummary: {
        totalScore: score,
        averageScore: score,
        coverageScore: score,
        passRate,
        blockerCount: blockers,
        safetyRiskCount: safety,
        wrongCorridorCount: wrongCorridor,
        severityCounts: wrongCorridor > 0 ? { 'wrong corridor': wrongCorridor } : {}
      },
      filters: {},
      patchNotes: `patch ${sha}`,
      deploymentNotes: '',
      knownRemainingFailures: ''
    },
    scenarios: [],
    results: [
      {
        scenarioId: 'at-test-001',
        difficulty: 4,
        regionState: 'West Virginia / WV',
        status,
        pass: status === 'passed',
        failureReason: '',
        assertions: [],
        rawResponse: 'response',
        score: {
          total: scenarioScore,
          passThreshold: 85,
          categoryScores: {},
          severityFlags: wrongCorridor > 0 ? ['wrong corridor'] : [],
          failureReasons: [],
          blockerCount: blockers,
          safetyRiskCount: safety
        },
        grounding: null,
        manualReview: { status: 'not-reviewed', notes: '' }
      }
    ]
  };
}

describe('Scout Reliability Arena grouping', () => {
  it('groups repeated runs by model, repo version, and environment', () => {
    const groups = buildScoutReliabilityArenaGroups([
      run({ id: 'run-1', sha: 'abc123', score: 80, passRate: 75 }),
      run({ id: 'run-2', sha: 'abc123', score: 100, passRate: 100 }),
      run({ id: 'run-3', sha: 'def456', score: 60, passRate: 50 })
    ]);

    assert.equal(groups.length, 2);
    const abc = groups.find((group) => group.repoSha === 'abc123');
    assert.ok(abc);
    assert.equal(abc.runCount, 2);
    assert.equal(abc.averageScore, 90);
    assert.equal(abc.bestScore, 100);
    assert.equal(abc.worstScore, 80);
    assert.equal(abc.averagePassRate, 88);
  });

  it('keeps environments and repo revisions as separate leaderboard rows', () => {
    const groups = buildScoutReliabilityArenaGroups([
      run({ id: 'run-1', sha: 'abc123', environment: 'local', score: 100 }),
      run({ id: 'run-2', sha: 'abc123', environment: 'Forge', score: 100 })
    ]);

    assert.equal(groups.length, 2);
    assert.deepEqual(new Set(groups.map((group) => group.environment)), new Set(['local', 'Forge']));
  });

  it('surfaces wrong-corridor risk counts and scenario consistency', () => {
    const groups = buildScoutReliabilityArenaGroups([
      run({ id: 'run-1', sha: 'abc123', score: 45, passRate: 0, wrongCorridor: 1, status: 'failed' }),
      run({ id: 'run-2', sha: 'abc123', score: 100, passRate: 100 })
    ]);

    assert.equal(groups[0].wrongCorridorCount, 1);
    assert.equal(groups[0].wrongCorridorFrequency, 1);
    assert.equal(groups[0].scenarioLevelConsistency, 0);
    assert.equal(groups[0].scenarioConsistency[0].passRate, 50);
  });
});
