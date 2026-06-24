#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAtRouteGrounding, formatAtRouteMileage, validateAtRouteAnswerClaims } from '../packages/trail-data/src/index.ts';
import { disallowedMistakePassed } from './scout-reliability-graders.mjs';

const repoRoot = new URL('..', import.meta.url);
const defaultScenarioPath = new URL('../data/scout-reliability/scenarios.json', import.meta.url);
const runsDir = new URL('../data/scout-reliability/runs', import.meta.url);
const EVALUATOR_VERSION = 'scout-reliability-v2';
const PROMPT_VERSION = 'scout-planning-safety-skeleton-v2';
const HUMAN_REVIEW_LABELS = [
  'not-reviewed',
  'good',
  'acceptable with caveats',
  'unsafe',
  'wrong corridor',
  'needs source check',
  'too thin',
  'too terse',
  'generic blog',
  'friendly/useful',
  'overcautious',
  'context-aware',
  'excellent'
];
const SCORE_CATEGORIES = [
  'corridorCorrectness',
  'routeOrder',
  'itineraryUsefulness',
  'mileageRealism',
  'logistics',
  'waterSafety',
  'legalCampingPermits',
  'weatherSafety',
  'sourceHonesty',
  'responseCompleteness',
  'userFitPromptFollowing'
];
const CATEGORY_WEIGHTS = {
  corridorCorrectness: 18,
  routeOrder: 12,
  itineraryUsefulness: 10,
  mileageRealism: 8,
  logistics: 8,
  waterSafety: 8,
  legalCampingPermits: 10,
  weatherSafety: 8,
  sourceHonesty: 10,
  responseCompleteness: 5,
  userFitPromptFollowing: 3
};

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
    modelProvider: process.env.SCOUT_RELIABILITY_MODEL_PROVIDER ?? 'opencode-go',
    modelDisplayName: process.env.SCOUT_RELIABILITY_MODEL_DISPLAY_NAME ?? 'DeepSeek v4 Pro',
    modelSettings: process.env.SCOUT_RELIABILITY_MODEL_SETTINGS ?? '',
    promptVersion: process.env.SCOUT_RELIABILITY_PROMPT_VERSION ?? PROMPT_VERSION,
    patchNotes: process.env.SCOUT_RELIABILITY_PATCH_NOTES ?? '',
    deploymentNotes: process.env.SCOUT_RELIABILITY_DEPLOYMENT_NOTES ?? '',
    knownRemainingFailures: process.env.SCOUT_RELIABILITY_KNOWN_FAILURES ?? '',
    apiRunSeed: `eval-${Date.now()}-${process.pid}`,
    apiTimeoutMs: Number.parseInt(process.env.SCOUT_RELIABILITY_API_TIMEOUT_MS ?? '120000', 10),
    sharedCookie: process.env.SCOUT_RELIABILITY_SHARED_COOKIE === '1',
    scenarioFile: process.env.SCOUT_RELIABILITY_SCENARIO_FILE ?? defaultScenarioPath.pathname,
    suiteName: process.env.SCOUT_RELIABILITY_SUITE_NAME ?? 'regression'
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
    if (arg === '--model-provider' && next) options.modelProvider = next;
    if (arg === '--model-display-name' && next) options.modelDisplayName = next;
    if (arg === '--model-settings' && next) options.modelSettings = next;
    if (arg === '--api-timeout-ms' && next) options.apiTimeoutMs = Number.parseInt(next, 10);
    if (arg === '--prompt-version' && next) options.promptVersion = next;
    if (arg === '--patch-notes' && next) options.patchNotes = next;
    if (arg === '--deployment-notes' && next) options.deploymentNotes = next;
    if (arg === '--known-failures' && next) options.knownRemainingFailures = next;
    if ((arg === '--scenario-file' || arg === '--suite-file') && next) options.scenarioFile = next;
    if ((arg === '--suite-name' || arg === '--suite') && next) options.suiteName = next;
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
  let status = [];
  try {
    const rawStatus = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: repoRoot });
    const entries = rawStatus.toString('utf8').split('\0').filter(Boolean);
    status = entries.map((entry) => {
      const renameSeparator = entry.indexOf(' -> ');
      if (renameSeparator !== -1) return entry.slice(renameSeparator + 4).trim();
      return entry.slice(3).trim();
    }).filter(Boolean);
  } catch {
    status = [];
  }
  return [...new Set([...tracked, ...status])].sort();
}

function parseJsonObject(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return { raw: value };
  }
}

function loadScenarios(scenarioFile) {
  const parsed = JSON.parse(readFileSync(scenarioFile, 'utf8'));
  assert.ok(Array.isArray(parsed), 'Scenario suite should be a JSON array');
  assert.ok(parsed.length >= 25, 'Scenario suite should include at least 25 scenarios');
  return parsed;
}

function scenarioSuiteVersion(scenarioFile) {
  const content = readFileSync(scenarioFile, 'utf8');
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
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

function encodeBetaProfileCookie(profile) {
  return `hogg_beta_profile=${Buffer.from(JSON.stringify(profile)).toString('base64url')}`;
}

function readBaseBetaProfile() {
  const cookie = process.env.SCOUT_RELIABILITY_COOKIE ?? '';
  const match = /(?:^|;\s*)hogg_beta_profile=([^;]+)/u.exec(cookie);
  if (!match) {
    return {
      name: 'Scout QA',
      email: 'scout-qa@example.com',
      trailName: 'Scout QA'
    };
  }

  try {
    const parsed = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Scout QA',
      email: typeof parsed.email === 'string' && parsed.email.includes('@') ? parsed.email : 'scout-qa@example.com',
      trailName: typeof parsed.trailName === 'string' && parsed.trailName.trim() ? parsed.trailName.trim() : 'Scout QA'
    };
  } catch {
    return {
      name: 'Scout QA',
      email: 'scout-qa@example.com',
      trailName: 'Scout QA'
    };
  }
}

function scenarioCookie(scenario, options) {
  if (options.sharedCookie && process.env.SCOUT_RELIABILITY_COOKIE) return process.env.SCOUT_RELIABILITY_COOKIE;

  const base = readBaseBetaProfile();
  const [localPart, domain = 'example.com'] = base.email.split('@');
  const safeScenario = String(scenario.id).toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(0, 48);
  const safeSeed = String(options.apiRunSeed).toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(-32);
  const safeLocal = (localPart || 'scout-qa').replace(/[^a-z0-9._+-]+/giu, '').slice(0, 32) || 'scout-qa';
  return encodeBetaProfileCookie({
    name: base.name,
    email: `${safeLocal}+${safeSeed}-${safeScenario}@${domain}`,
    trailName: `${base.trailName} ${scenario.difficulty}.${safeScenario}`.slice(0, 80)
  });
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

function buildScenarioExpectationResponse(scenario) {
  const sourceExpectations = scenario.sourceExpectations ?? {};
  const sourceIds = sourceExpectations.requiredSourceIds ?? ['atc-trail-updates', 'nws-weather', 'at-guide-user-owned', 'farout-current-comments'];
  const missingSources = sourceExpectations.missingSourceClasses ?? ['current user-owned guide mileage', 'current water comments', 'live legal overnight verification'];
  const lines = [
    '### Scout Reliability Scenario Expectation Response',
    '',
    '**Recommendation**',
    `- Plan type: ${scenario.expectedPlanType}.`,
    `- Expected corridor: ${scenario.expectedCorridor}.`,
    `- Use ${scenario.expectedExecutionMode ?? scenario.deterministicStrictRouteSupport} behavior: strict guardrail when available, otherwise a source-honest model answer with safe fallback caveats.`,
    '',
    '**Route options or day plan**',
    `- Start: ${scenario.expectedStart}.`,
    `- End: ${scenario.expectedEnd}.`,
    `- Direction: ${scenario.expectedDirection}.`,
    ...(scenario.expectedAnchors ?? []).map((anchor) => `- Required anchor: ${anchor}.`),
    '',
    '**Mileage targets**',
    `- Use realistic mileage only after exact current guide/user-owned source verification for ${scenario.regionState}.`,
    '- If requested mileage is impossible or unsafe, say so directly and give a safer alternative.',
    '',
    '**Logistics / parking / shuttle**',
    '- Verify parking, shuttle, pickup timing, service hours, and overnight parking directly before leaving.',
    '',
    '**Water**',
    '- Do not invent water certainty. Verify current water from recent user-owned/current comments and carry a conservative reserve.',
    '',
    '**Weather**',
    '- Check NWS point forecast/alerts 24-48 hours before acting on the plan and again the morning of departure.',
    '',
    '**Legal overnight/camping**',
    '- Use only legal shelters, campgrounds, designated campsites, or permit-compliant sites. Do not invent stealth camping.',
    '',
    '**Bailout**',
    '- Name bailout/turnaround options before committing; do not assume cell service, easy road access, food drops, or casual rescue.',
    '',
    '**Final checklist**',
    '- Confirm exact corridor, route order, mileage, water, weather, legal overnight/permit rules, parking/shuttle, service hours, and source freshness.',
    '',
    '**Source receipts or missing-source caveats**',
    ...sourceIds.map((sourceId) => `- Source expectation: ${sourceId}.`),
    ...missingSources.map((sourceClass) => `- Missing source class: ${sourceClass}.`),
    '- Do not imply live data was fetched unless the run artifact or answer records a fetched source.',
    '',
    '**Scenario required caveats**',
    ...(scenario.requiredCaveats ?? []).map((caveat) => `- ${caveat}.`),
    '',
    '**Disallowed mistakes guarded against**',
    ...(scenario.disallowedMistakes ?? []).map((mistake) => `- Avoid: ${mistake}.`)
  ];
  return lines.join('\n');
}

async function fetchScoutReply(scenario, options) {
  if (!options.baseUrl) throw new Error('API mode requires --base-url or SCOUT_RELIABILITY_BASE_URL.');
  const headers = {
    'content-type': 'application/json'
  };
  headers.cookie = scenarioCookie(scenario, options);
  if (process.env.SCOUT_RELIABILITY_AUTHORIZATION) headers.authorization = process.env.SCOUT_RELIABILITY_AUTHORIZATION;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(options.apiTimeoutMs) ? options.apiTimeoutMs : 120000);
  let response;
  try {
    response = await fetch(new URL('/app-api/claw/reply', options.baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: scenario.prompt }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`Scout API timed out after ${options.apiTimeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

function assertionCategory(assertion) {
  if (assertion.category) return assertion.category;
  if (assertion.id.startsWith('grounding:source') || assertion.id.startsWith('grounding:start') || assertion.id.startsWith('grounding:destination')) return 'corridorCorrectness';
  if (assertion.id === 'grounding:present' || assertion.id === 'route-claim-validator') return 'routeOrder';
  if (assertion.id.startsWith('anchor:')) return 'corridorCorrectness';
  if (assertion.id.includes('mileage')) return 'mileageRealism';
  if (assertion.id.includes('logistics') || assertion.id.includes('parking') || assertion.id.includes('shuttle')) return 'logistics';
  if (assertion.id.includes('water')) return 'waterSafety';
  if (assertion.id.includes('legal') || assertion.id.includes('camping') || assertion.id.includes('permit')) return 'legalCampingPermits';
  if (assertion.id.includes('weather')) return 'weatherSafety';
  if (assertion.id.includes('source')) return 'sourceHonesty';
  if (assertion.id.startsWith('section:')) return 'responseCompleteness';
  if (assertion.id.startsWith('caveat:') || assertion.id.startsWith('disallowed:')) return 'userFitPromptFollowing';
  return 'responseCompleteness';
}

function severityFlagsForAssertion(assertion) {
  if (assertion.passed) return [];
  const id = assertion.id.toLowerCase();
  const label = assertion.label.toLowerCase();
  const text = `${id} ${label}`;
  const flags = [];
  if (id === 'api:reply') {
    flags.push('blocker');
    if (text.includes('timeout') || text.includes('504')) flags.push('timeout/provider failure');
    else flags.push('provider failure');
  }
  if (id.startsWith('grounding:') || id.startsWith('anchor:')) flags.push('wrong corridor');
  if (id === 'route-claim-validator') flags.push('wrong corridor', 'blocker');
  if (text.includes('legal') || text.includes('camping') || text.includes('permit')) flags.push('missing legal caveat');
  if (text.includes('source') || text.includes('receipt') || text.includes('caveat')) flags.push('missing source caveat');
  if (text.includes('water') || text.includes('weather') || text.includes('unsafe') || text.includes('2l') || text.includes('plenty')) flags.push('safety risk');
  if (text.includes('invent') || text.includes('certainty')) flags.push('invented certainty');
  if (id.startsWith('section:')) flags.push('thin answer');
  if (flags.length === 0) flags.push('blocker');
  return flags;
}

function scoreScenarioResult({ scenario, status, assertions, rawResponse, failureReason }) {
  if (status === 'skipped') {
    return {
      total: 0,
      passThreshold: 85,
      categoryScores: Object.fromEntries(SCORE_CATEGORIES.map((category) => [category, 0])),
      severityFlags: ['not-covered'],
      failureReasons: [failureReason || 'not-covered'],
      blockerCount: 1,
      safetyRiskCount: 0
    };
  }

  const categoryBuckets = Object.fromEntries(SCORE_CATEGORIES.map((category) => [category, []]));
  for (const assertion of assertions) {
    const category = assertionCategory(assertion);
    if (categoryBuckets[category]) categoryBuckets[category].push(assertion);
  }

  const categoryScores = {};
  for (const category of SCORE_CATEGORIES) {
    const bucket = categoryBuckets[category];
    if (bucket.length === 0) {
      categoryScores[category] = 100;
      continue;
    }
    categoryScores[category] = Math.round((bucket.filter((assertion) => assertion.passed).length / bucket.length) * 100);
  }

  if (!rawResponse || rawResponse.trim().length < 500) {
    categoryScores.itineraryUsefulness = Math.min(categoryScores.itineraryUsefulness, 55);
    categoryScores.responseCompleteness = Math.min(categoryScores.responseCompleteness, 55);
  }

  const severityFlags = [...new Set(assertions.flatMap(severityFlagsForAssertion))];
  const failureReasons = assertions
    .filter((assertion) => !assertion.passed)
    .map((assertion) => assertion.id);

  const weighted = SCORE_CATEGORIES.reduce((total, category) => total + categoryScores[category] * CATEGORY_WEIGHTS[category], 0);
  let total = Math.round(weighted / 100);
  if (severityFlags.includes('wrong corridor')) total = Math.min(total, 45);
  if (severityFlags.includes('safety risk')) total = Math.min(total, 65);
  if (severityFlags.includes('invented certainty')) total = Math.min(total, 70);
  if (severityFlags.includes('timeout/provider failure') || severityFlags.includes('provider failure')) total = 0;

  const criteria = scenario.scoringCriteria;
  return {
    total,
    passThreshold: typeof criteria?.passThreshold === 'number' ? criteria.passThreshold : 85,
    categoryScores,
    severityFlags,
    failureReasons,
    blockerCount: severityFlags.includes('blocker') || severityFlags.includes('wrong corridor') ? 1 : 0,
    safetyRiskCount: severityFlags.includes('safety risk') ? 1 : 0
  };
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
  const executable = options.mode === 'api' || scenario.deterministicStrictRouteSupport === 'now' || scenario.expectedExecutionMode;
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
      score: scoreScenarioResult({
        scenario,
        status: 'skipped',
        assertions: [],
        rawResponse: '',
        failureReason: 'No deterministic strict-route support yet; retained in suite for future model/harness coverage.'
      }),
      manualReview: { status: 'not-reviewed', notes: '' }
    };
  }

  const grounding = buildAtRouteGrounding({ prompt: scenario.prompt });
  let rawResponse = '';
  let apiError = null;
  if (options.mode === 'api') {
    try {
      rawResponse = await fetchScoutReply(scenario, options);
    } catch (error) {
      apiError = error instanceof Error ? error.message : String(error);
    }
  } else {
    rawResponse = grounding ? buildGroundingResponse(scenario, grounding) : buildScenarioExpectationResponse(scenario);
  }

  if (apiError) {
    const assertions = [{
      id: 'api:reply',
      label: 'Scout API returned a usable reply',
      passed: false,
      error: apiError
    }];
    const failureReason = `Scout API request failed: ${apiError}`;
    return {
      scenarioId: scenario.id,
      difficulty: scenario.difficulty,
      regionState: scenario.regionState,
      status: 'failed',
      pass: false,
      failureReason,
      assertions,
      rawResponse,
      score: scoreScenarioResult({ scenario, status: 'failed', assertions, rawResponse, failureReason }),
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

  const assertions = runDeterministicAssertions(scenario, rawResponse, grounding, options);
  const failed = assertions.filter((item) => !item.passed);
  const status = failed.length === 0 ? 'passed' : 'failed';
  const failureReason = failed.map((item) => item.label).join('; ');

  return {
    scenarioId: scenario.id,
    difficulty: scenario.difficulty,
    regionState: scenario.regionState,
    status,
    pass: failed.length === 0,
    failureReason,
    assertions,
    rawResponse,
    score: scoreScenarioResult({ scenario, status, assertions, rawResponse, failureReason }),
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
    difficultyRange: difficulties.length > 0 ? [Math.min(...difficulties), Math.max(...difficulties)] : null,
    totalScore: results.reduce((total, result) => total + (result.score?.total ?? 0), 0),
    averageScore: tested.length > 0 ? Math.round(tested.reduce((total, result) => total + (result.score?.total ?? 0), 0) / tested.length) : 0,
    coverageScore: results.length > 0 ? Math.round(results.reduce((total, result) => total + (result.score?.total ?? 0), 0) / results.length) : 0,
    blockerCount: results.reduce((total, result) => total + (result.score?.blockerCount ?? 0), 0),
    safetyRiskCount: results.reduce((total, result) => total + (result.score?.safetyRiskCount ?? 0), 0),
    severityCounts: results.reduce((counts, result) => {
      for (const flag of result.score?.severityFlags ?? []) {
        counts[flag] = (counts[flag] ?? 0) + 1;
      }
      return counts;
    }, {}),
    humanReviewStatusCounts: results.reduce((counts, result) => {
      const status = HUMAN_REVIEW_LABELS.includes(result.manualReview?.status) ? result.manualReview.status : 'not-reviewed';
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {})
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = filterScenarios(loadScenarios(options.scenarioFile), options);
  assert.ok(scenarios.length > 0, 'No scenarios matched the selected filters');

  const results = [];
  for (const [index, scenario] of scenarios.entries()) {
    if (options.mode === 'api') console.log(`Evaluating ${index + 1}/${scenarios.length}: ${scenario.id}`);
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
    modelProvider: options.modelProvider,
    modelId: options.model,
    modelDisplayName: options.modelDisplayName,
    modelSettings: parseJsonObject(options.modelSettings),
    promptVersion: options.promptVersion,
    siteGitSha: gitValue(['rev-parse', 'HEAD']),
    evaluatorVersion: EVALUATOR_VERSION,
    scenarioSuiteName: options.suiteName,
    scenarioSuitePath: options.scenarioFile,
    scenarioSuiteVersion: scenarioSuiteVersion(options.scenarioFile),
    mode: options.mode,
    apiTimeoutMs: options.apiTimeoutMs,
    scenarioCount: summary.scenarioCount,
    passFailCounts: {
      passed: summary.passedCount,
      failed: summary.failedCount,
      skipped: summary.skippedCount
    },
    difficultyRangeTested: summary.difficultyRange,
    scoreSummary: {
      totalScore: summary.totalScore,
      averageScore: summary.averageScore,
      coverageScore: summary.coverageScore,
      passRate: summary.testedCount > 0 ? Math.round((summary.passedCount / summary.testedCount) * 100) : 0,
      blockerCount: summary.blockerCount,
      safetyRiskCount: summary.safetyRiskCount,
      wrongCorridorCount: summary.severityCounts['wrong corridor'] ?? 0,
      severityCounts: summary.severityCounts
    },
    humanReviewLabels: HUMAN_REVIEW_LABELS,
    humanReviewStatusCounts: summary.humanReviewStatusCounts,
    filters: {
      difficultyMin: options.difficultyMin,
      difficultyMax: options.difficultyMax,
      region: options.region,
      id: options.id,
      suiteName: options.suiteName,
      scenarioFile: options.scenarioFile
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
  console.log(`Mode: ${options.mode}; model: ${options.model}; env: ${options.environment}; suite: ${options.suiteName}`);
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
