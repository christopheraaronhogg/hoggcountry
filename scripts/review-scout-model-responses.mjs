#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = new URL('..', import.meta.url);
const defaultReferencesPath = new URL('../data/scout-reliability/reference-responses.json', import.meta.url).pathname;
const reviewDir = new URL('../data/scout-reliability/model-reviews', import.meta.url).pathname;

function argValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function deterministicArchitectureReason(text) {
  const first = text.slice(0, 600).toLowerCase();
  if (first.includes('scout deterministic planning guardrail')) {
    return 'Response is a deterministic planning guardrail, not model-authored output.';
  }
  if (first.includes('scout strict-route plan')) {
    return 'Response is a strict-route deterministic plan, not model-authored output.';
  }
  if (first.includes('deterministic scout reliability fallback')) {
    return 'Response is a deterministic reliability fallback, not model-authored output.';
  }
  return null;
}

function scoreNonDeterministicResponse(result, reference) {
  const text = result.rawResponse ?? '';
  const lowered = text.toLowerCase();
  const notes = [];
  let score = 100;

  for (const criterion of reference.mustHave ?? []) {
    const terms = criterion.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length >= 5);
    const hits = terms.filter((term) => lowered.includes(term)).length;
    if (hits < Math.min(2, terms.length)) {
      notes.push(`Check manually: may miss or weaken criterion — ${criterion}`);
      score -= 6;
    }
  }

  for (const mistake of reference.blockers ?? []) {
    const terms = mistake.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length >= 5);
    if (terms.length > 0 && terms.every((term) => lowered.includes(term))) {
      notes.push(`Possible blocker, requires human review — ${mistake}`);
      score -= 20;
    }
  }

  if (text.trim().length < 900) {
    notes.push('Response may be too thin for a real trail-planning answer.');
    score -= 10;
  }
  if (!/source|receipt|verify|current|official|nws|atc|guide|farout/iu.test(text)) {
    notes.push('Weak source-honesty language; check whether live/current facts are overclaimed.');
    score -= 12;
  }
  if (!/water/iu.test(text)) {
    notes.push('Water planning appears missing or too thin.');
    score -= 8;
  }
  if (!/weather|forecast|storm|heat|cold|wind/iu.test(text)) {
    notes.push('Weather/go-no-go planning appears missing or too thin.');
    score -= 8;
  }

  return {
    status: Math.max(0, score) >= 85 ? 'provisionally-good-needs-human-review' : 'needs-critical-review',
    score: Math.max(0, score),
    notes: notes.length > 0 ? notes : ['No obvious rubric gaps from text scan; still requires critical model/human review, not regex trust.']
  };
}

function reviewResult(result, reference) {
  const text = result.rawResponse ?? '';
  const architectureReason = deterministicArchitectureReason(text);
  if (architectureReason) {
    return {
      scenarioId: result.scenarioId,
      status: 'excluded-deterministic-architecture',
      score: null,
      invalidForModelComparison: true,
      reason: architectureReason,
      criticalNotes: [
        'Do not count this row as DeepSeek quality evidence or leaderboard proof.',
        'The response may contain useful route/source material, but it was authored by application architecture rather than the model.',
        'Re-run after deploying the resource-supplement architecture, then evaluate the model-authored draft against the reference and rubric.',
        'Adherence to the reference wording is not required; judge correctness, source honesty, safety, and usefulness.'
      ],
      referenceSummary: reference?.referenceResponse ?? null
    };
  }

  const scored = scoreNonDeterministicResponse(result, reference ?? {});
  return {
    scenarioId: result.scenarioId,
    status: scored.status,
    score: scored.score,
    invalidForModelComparison: false,
    reason: null,
    criticalNotes: scored.notes,
    referenceSummary: reference?.referenceResponse ?? null
  };
}

const runPath = argValue('--run');
assert.ok(runPath, 'Usage: node scripts/review-scout-model-responses.mjs --run <run.json> [--references reference-responses.json]');
const referencesPath = argValue('--references', defaultReferencesPath);
const run = loadJson(runPath);
const references = loadJson(referencesPath);
const byScenario = new Map(references.scenarios.map((item) => [item.scenarioId, item]));

const reviews = run.results.map((result) => reviewResult(result, byScenario.get(result.scenarioId)));
const excluded = reviews.filter((item) => item.invalidForModelComparison).length;
const scored = reviews.filter((item) => !item.invalidForModelComparison && typeof item.score === 'number');
const artifact = {
  metadata: {
    reviewVersion: 'scout-model-critical-review-v1',
    reviewedAt: new Date().toISOString(),
    runId: run.metadata?.runId ?? basename(runPath, '.json'),
    runPath,
    referencesPath,
    modelDisplayName: run.metadata?.modelDisplayName ?? null,
    modelId: run.metadata?.modelId ?? run.metadata?.model ?? null,
    environment: run.metadata?.environment ?? null,
    evaluatorKind: 'assistant-critical-rubric-plus-architecture-exclusion',
    deterministicRowsExcluded: excluded,
    scoredRows: scored.length,
    averageScore: scored.length > 0 ? Math.round(scored.reduce((total, item) => total + item.score, 0) / scored.length) : null,
    leaderboardEligible: excluded === 0,
    notes: [
      'Reference responses are evaluation aids, not golden text.',
      'A model can beat the reference if it is more accurate, safer, or more useful.',
      'Deterministic guardrail/strict-route rows are excluded because they are not model-authored responses.'
    ]
  },
  reviews
};

mkdirSync(reviewDir, { recursive: true });
const outputPath = join(reviewDir, `${artifact.metadata.runId}.review.json`);
writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Scout model review artifact: ${outputPath}`);
console.log(`Leaderboard eligible: ${artifact.metadata.leaderboardEligible}`);
console.log(`Deterministic rows excluded: ${excluded}/${reviews.length}`);
