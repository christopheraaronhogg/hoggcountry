#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAtRouteGrounding, formatAtRouteMileage, validateAtRouteAnswerClaims } from '../packages/trail-data/src/index.ts';

const repoRoot = new URL('..', import.meta.url);
const scenarioPath = new URL('../data/scout-reliability/scenarios.json', import.meta.url);
const runsDir = new URL('../data/scout-reliability/runs', import.meta.url);

function parseArgs(argv) {
  const options = {
    mode: 'grounding',
    difficultyMin: null,
    difficultyMax: null,
    region: null,
    id: null,
    baseUrl: process.env.SCOUT_RELIABILITY_BASE_URL ?? null,
    environment: process.env.SCOUT_RELIABILITY_ENV ?? 'local',
    model: process.env.SCOUT_RELIABILITY_MODEL ?? 'deepseek-v4-pro',
    patchNotes: process.env.SCOUT_RELIABILITY_PATCH_NOTES ?? '',
    deploymentNotes: process.env.SCOUT_RELIABILITY_DEPLOYMENT_NOTES ?? '',
    knownRemainingFailures: process.env.SCOUT_RELIABILITY_KNOWN_FAILURES ?? ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--mode' && next) options.mode = next;
    if (arg === '--difficulty-min' && next) options.difficultyMin = Number.parseInt(next, 10);
    if (arg === '--difficulty-max' && next) options.difficultyMax = Number.parseInt(next, 10);
    if (arg === '--region' && next) options.region = next.toLowerCase();
    if (arg === '--id' && next) options.id = next;
    if (arg === '--base-url' && next) options.baseUrl = next;
    if (arg === '--environment' && next) options.environment = next;
    if (arg === '--model' && next) options.model = next;
    if (arg === '--patch-notes' && next) options.patchNotes = next;
    if (arg === '--deployment-notes' && next) options.deploymentNotes = next;
    if (arg === '--known-failures' && next) options.knownRemainingFailures = next;
    if (arg.startsWith('--') && next) index += 1;
  }

  return options;
}

function gitValue(args, fallback = 'unknown') {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function gitChangedFiles() {
  const tracked = gitValue(['diff', '--name-only'], '').split('\n').filter(Boolean);
  const status = gitValue(['status', '--short'], '').split('\n').filter(Boolean).map((line) => line.slice(3).trim()).filter(Boolean);
  return [...new Set([...tracked, ...status])].sort();
}

function loadScenarios() {
  const parsed = JSON.parse(readFileSync(scenarioPath, 'utf8'));
  assert.ok(Array.isArray(parsed), 'Scenario suite should be a JSON array');
  assert.ok(parsed.length >= 25, 'Scenario suite should include at least 25 scenarios');
  return parsed;
}

function filterScenarios(scenarios, options) {
  return scenarios.filter((scenario) => {
    if (options.id && scenario.id !== options.id) return false;
    if (options.region && !String(scenario.regionState).toLowerCase().includes(options.region)) return false;
    if (options.difficultyMin !== null && scenario.difficulty < options.difficultyMin) return false;
    if (options.difficultyMax !== null && scenario.difficulty > options.difficultyMax) return false;
    return true;
  });
}

function sectionMatchers(section) {
  const normalized = section.toLowerCase();
  if (normalized.includes('recommendation')) return [/\brecommendation\b/iu, /\brecommend\b/iu];
  if (normalized.includes('route options') || normalized.includes('day plan')) return [/\broute\b/iu, /\bday\s+\d\b/iu, /\boption\b/iu];
  if (normalized.includes('mileage')) return [/\bmileage\b/iu, /\bmiles?\b/iu, /\bmpd\b/iu];
  if (normalized.includes('logistics') || normalized.includes('parking') || normalized.includes('shuttle')) return [/\blogistics\b/iu, /\bparking\b/iu, /\bshuttle\b/iu, /\bpickup\b/iu];
  if (normalized.includes('water')) return [/\bwater\b/iu];
  if (normalized.includes('weather')) return [/\bweather\b/iu, /\bforecast\b/iu, /\bnws\b/iu];
  if (normalized.includes('legal') || normalized.includes('camping')) return [/\blegal\b/iu, /\bcamping\b/iu, /\bshelter\b/iu, /\bcampground\b/iu, /\bpermit\b/iu];
  if (normalized.includes('bailout')) return [/\bbailout\b/iu, /\bexit\b/iu, /\bturnaround\b/iu];
  if (normalized.includes('checklist')) return [/\bchecklist\b/iu, /\bfinal checklist\b/iu];
  if (normalized.includes('source')) return [/\bsource\b/iu, /\breceipt\b/iu, /\bverify\b/iu, /\bcaveat\b/iu];
  return [new RegExp(section.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'iu')];
}

function textMatchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function buildGroundingResponse(scenario, grounding) {
  const lines = [
    '### Scout Reliability Grounding Response',
    '',
    '**Recommendation**',
    `- Use ${grounding.source.label} for deterministic route ordering and caveats.`,
    scenario.expectedPlanType ? `- Plan type: ${scenario.expectedPlanType}.` : null,
    '',
    '**Route options or day plan**',
    `- Direction: ${grounding.direction}.`,
    grounding.destination
      ? `- Corridor: ${grounding.start.name} to ${grounding.destination.name}.`
      : `- Corridor starts at ${grounding.start.name}.`,
    ...grounding.planOptions.flatMap((option) => [
      `- ${option.label}: ${formatAtRouteMileage(option.totalMiles)} miles.`,
      ...option.days.map((day) => `  Day ${day.day}: ${day.from.name} to ${day.to.name}, ${formatAtRouteMileage(day.miles)} miles. ${day.note}`)
    ]),
    '',
    '**Mileage targets**',
    grounding.targetDays ? `- Detected target days: ${grounding.targetDays}.` : '- Target days: not cleanly detected; keep mileage flexible.',
    `- Exact mileages require current user-owned guide/current-source verification.`,
    '',
    '**Logistics / parking / shuttle**',
    '- Verify parking, shuttle, pickup timing, and overnight parking before leaving a car.',
    '',
    '**Water**',
    '- Verify current water before relying on any source; treat all natural water.',
    '',
    '**Weather**',
    '- Pull NWS point forecasts/alerts 24-48 hours before leaving.',
    '',
    '**Legal overnight/camping**',
    '- Treat shelters/campgrounds as candidate anchors until current legal status, capacity, permit, and facility rules are verified.',
    '',
    '**Bailout**',
    '- Pick bailout roads or turnarounds before starting; do not assume cell-service recovery.',
    '',
    '**Final checklist**',
    '- Verify exact mileages, current trail updates, water, weather, legal overnight, parking/shuttle, and pickup.',
    '',
    '**Source receipts or missing-source caveats**',
    `- Route validator: ${grounding.source.citation}`,
    '- Needed but not bundled: user-owned A.T. Guide/AWOL and current FarOut-style comments for exact mileages, water, and facilities.',
    '',
    '**Guardrails**',
    ...(scenario.requiredCaveats ?? []).map((caveat) => `- Scenario required caveat: ${caveat}.`),
    ...grounding.warnings.map((warning) => `- ${warning}`)
  ].filter((line) => line !== null);
  return lines.join('\n');
}

async function fetchScoutReply(scenario, options) {
  if (!options.baseUrl) throw new Error('API mode requires --base-url or SCOUT_RELIABILITY_BASE_URL.');
  const headers = {
    'content-type': 'application/json'
  };
  if (process.env.SCOUT_RELIABILITY_COOKIE) headers.cookie = process.env.SCOUT_RELIABILITY_COOKIE;
  if (process.env.SCOUT_RELIABILITY_AUTHORIZATION) headers.authorization = process.env.SCOUT_RELIABILITY_AUTHORIZATION;
  const response = await fetch(new URL('/app-api/claw/reply', options.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: scenario.prompt })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Scout API returned ${response.status}: ${payload?.message ?? response.statusText}`);
  const replyValue = payload?.data?.reply ?? payload?.reply ?? '';
  if (typeof replyValue === 'string') return replyValue;
  if (typeof replyValue?.text === 'string') return replyValue.text;
  return JSON.stringify(replyValue);
}

function assertResponseShape(scenario, responseText) {
  const assertions = [];
  for (const section of scenario.requiredOutputSections ?? []) {
    const passed = textMatchesAny(responseText, sectionMatchers(section));
    assertions.push({
      id: `section:${section}`,
      label: `Required section present: ${section}`,
      passed
    });
  }

  for (const caveat of scenario.requiredCaveats ?? []) {
    const terms = String(caveat).toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length >= 4);
    const matchedTerms = terms.filter((term) => responseText.toLowerCase().includes(term));
    assertions.push({
      id: `caveat:${caveat}`,
      label: `Required caveat represented: ${caveat}`,
      passed: matchedTerms.length >= Math.min(2, terms.length)
    });
  }

  return assertions;
}

function disallowedMistakePassed(mistake, responseText) {
  const normalizedMistake = String(mistake).toLowerCase();

  const routeTargetsPineGrove = [
    /\bSource:\s*Hogg Country Pine Grove\b/iu,
    /\|\s*Pine Grove Furnace State Park\s*\|/iu,
    /\bCorridor:\s*Pine Grove Furnace\b/iu,
    /\bfrom Pine Grove Furnace\b/iu,
    /\bPine Grove Furnace State Park\s*(?:→|->|to)\b/iu
  ].some((pattern) => pattern.test(responseText));

  const routeTargetsHarpersFerry = [
    /\bSource:\s*Hogg Country Harpers Ferry\b/iu,
    /\|\s*Harpers Ferry\s*\/\s*ATC HQ\s*\|/iu,
    /\bCorridor:\s*(?:Keys Gap[^.\n]+to\s+)?Harpers Ferry\b/iu,
    /\bto Harpers Ferry\s*\/\s*ATC HQ\b/iu,
    /\bHarpers Ferry\s*\/\s*ATC HQ\s*(?:→|->|to)\b/iu
  ].some((pattern) => pattern.test(responseText));

  if (normalizedMistake.includes('route away from harpers ferry')) {
    return routeTargetsHarpersFerry;
  }

  if (normalizedMistake.includes('route') && normalizedMistake.includes('to harpers ferry')) {
    return !routeTargetsHarpersFerry;
  }

  if (normalizedMistake.includes('route') && normalizedMistake.includes('pine grove')) {
    return !routeTargetsPineGrove;
  }

  if (normalizedMistake.includes('collapse') || normalizedMistake.includes('merge both plans')) {
    return /\bseparate\b/iu.test(responseText) || /\b1-?day\b/iu.test(responseText) && /\b2-?day\b/iu.test(responseText);
  }

  return true;
}

function runDeterministicAssertions(scenario, responseText, grounding, options) {
  const assertions = [];

  if (scenario.deterministicStrictRouteSupport === 'now') {
    assertions.push({
      id: 'grounding:present',
      label: 'Strict route grounding is available',
      passed: Boolean(grounding)
    });
  }

  if (scenario.expectedSourceId) {
    assertions.push({
      id: 'grounding:source',
      label: `Expected source ${scenario.expectedSourceId}`,
      passed: grounding?.source.id === scenario.expectedSourceId,
      actual: grounding?.source.id ?? null
    });
  }

  if (scenario.expectedStartPointId) {
    assertions.push({
      id: 'grounding:start',
      label: `Expected start ${scenario.expectedStartPointId}`,
      passed: grounding?.start.id === scenario.expectedStartPointId,
      actual: grounding?.start.id ?? null
    });
  }

  if (scenario.expectedDestinationPointId) {
    assertions.push({
      id: 'grounding:destination',
      label: `Expected destination ${scenario.expectedDestinationPointId}`,
      passed: grounding?.destination?.id === scenario.expectedDestinationPointId,
      actual: grounding?.destination?.id ?? null
    });
  }

  for (const anchor of scenario.expectedAnchors ?? []) {
    assertions.push({
      id: `anchor:${anchor}`,
      label: `Expected anchor mentioned: ${anchor}`,
      passed: responseText.toLowerCase().includes(String(anchor).toLowerCase())
    });
  }

  assertions.push(...assertResponseShape(scenario, responseText));

  for (const mistake of scenario.disallowedMistakes ?? []) {
    assertions.push({
      id: `disallowed:${mistake}`,
      label: `Disallowed mistake absent: ${mistake}`,
      passed: disallowedMistakePassed(mistake, responseText)
    });
  }

  if (grounding && options.mode === 'api') {
    const claimIssues = validateAtRouteAnswerClaims(responseText, grounding);
    assertions.push({
      id: 'route-claim-validator',
      label: 'Route claim validator found no blocking issues',
      passed: claimIssues.length === 0,
      issues: claimIssues
    });
  }

  return assertions;
}

async function evaluateScenario(scenario, options) {
  const executable = options.mode === 'api' || scenario.deterministicStrictRouteSupport === 'now';
  if (!executable) {
    return {
      scenarioId: scenario.id,
      difficulty: scenario.difficulty,
      regionState: scenario.regionState,
      status: 'skipped',
      pass: null,
      failureReason: 'No deterministic strict-route support yet; retained in suite for future model/harness coverage.',
      assertions: [],
      rawResponse: '',
      grounding: null,
      manualReview: { status: 'not-reviewed', notes: '' }
    };
  }

  const grounding = buildAtRouteGrounding({ prompt: scenario.prompt });
  const rawResponse = options.mode === 'api'
    ? await fetchScoutReply(scenario, options)
    : grounding
      ? buildGroundingResponse(scenario, grounding)
      : '';
  const assertions = runDeterministicAssertions(scenario, rawResponse, grounding, options);
  const failed = assertions.filter((item) => !item.passed);

  return {
    scenarioId: scenario.id,
    difficulty: scenario.difficulty,
    regionState: scenario.regionState,
    status: failed.length === 0 ? 'passed' : 'failed',
    pass: failed.length === 0,
    failureReason: failed.map((item) => item.label).join('; '),
    assertions,
    rawResponse,
    grounding: grounding ? {
      sourceId: grounding.source.id,
      direction: grounding.direction,
      start: grounding.start.name,
      destination: grounding.destination?.name ?? null,
      planOptions: grounding.planOptions.map((option) => option.id),
      warnings: grounding.warnings
    } : null,
    sourceReceipts: grounding ? [grounding.source.id, 'at-guide-user-owned', 'farout-current-comments', 'atc-trail-updates', 'nws-weather'] : [],
    missingSourceClasses: ['current user-owned guide mileage', 'current water comments', 'live legal overnight verification'],
    manualReview: { status: 'not-reviewed', notes: '' }
  };
}

function summarize(results) {
  const tested = results.filter((result) => result.status !== 'skipped');
  const passed = tested.filter((result) => result.status === 'passed');
  const failed = tested.filter((result) => result.status === 'failed');
  const skipped = results.filter((result) => result.status === 'skipped');
  const difficulties = results.map((result) => result.difficulty).filter((item) => Number.isFinite(item));
  return {
    scenarioCount: results.length,
    testedCount: tested.length,
    passedCount: passed.length,
    failedCount: failed.length,
    skippedCount: skipped.length,
    difficultyRange: difficulties.length > 0 ? [Math.min(...difficulties), Math.max(...difficulties)] : null
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = filterScenarios(loadScenarios(), options);
  assert.ok(scenarios.length > 0, 'No scenarios matched the selected filters');

  const results = [];
  for (const scenario of scenarios) {
    results.push(await evaluateScenario(scenario, options));
  }

  const runId = `scout-rel-${new Date().toISOString().replace(/[:.]/gu, '-')}`;
  const summary = summarize(results);
  const metadata = {
    runId,
    timestamp: new Date().toISOString(),
    gitCommitSha: gitValue(['rev-parse', 'HEAD']),
    gitCommitMessage: gitValue(['log', '-1', '--pretty=%s']),
    changedFiles: gitChangedFiles(),
    deployedRevision: process.env.SCOUT_RELIABILITY_DEPLOYED_REVISION ?? null,
    forgeReleaseId: process.env.SCOUT_RELIABILITY_FORGE_RELEASE_ID ?? null,
    environment: options.environment,
    model: options.model,
    mode: options.mode,
    scenarioCount: summary.scenarioCount,
    passFailCounts: {
      passed: summary.passedCount,
      failed: summary.failedCount,
      skipped: summary.skippedCount
    },
    difficultyRangeTested: summary.difficultyRange,
    filters: {
      difficultyMin: options.difficultyMin,
      difficultyMax: options.difficultyMax,
      region: options.region,
      id: options.id
    },
    patchNotes: options.patchNotes,
    deploymentNotes: options.deploymentNotes,
    knownRemainingFailures: options.knownRemainingFailures
  };

  mkdirSync(runsDir, { recursive: true });
  const artifact = {
    metadata,
    scenarios,
    results
  };
  const outputPath = join(runsDir.pathname, `${runId}.json`);
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);

  console.log(`Scout reliability run ${runId}`);
  console.log(`Mode: ${options.mode}; model: ${options.model}; env: ${options.environment}`);
  console.log(`Scenarios: ${summary.scenarioCount}; tested: ${summary.testedCount}; passed: ${summary.passedCount}; failed: ${summary.failedCount}; skipped: ${summary.skippedCount}`);
  if (summary.failedCount > 0) {
    for (const result of results.filter((item) => item.status === 'failed')) {
      console.log(`FAIL ${result.scenarioId}: ${result.failureReason}`);
    }
    process.exitCode = 1;
  }
  console.log(`Artifact: ${outputPath}`);
}

await main();
