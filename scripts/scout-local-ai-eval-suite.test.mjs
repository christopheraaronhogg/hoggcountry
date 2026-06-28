import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createScoutLocalAiPhoneBuildAction } from './lib/scout-local-ai-phone-build-action.mjs';
import { summarizeRunSourceEvidence } from './lib/scout-local-ai-source-evidence.mjs';
import { summarizeScoutLocalAiSuiteCoverage } from './lib/scout-local-ai-suite-coverage.mjs';
import { scoutLocalAiSuiteHash } from './lib/scout-local-ai-suite.mjs';

const SUITE_PATH = new URL('../data/scout-local-ai/dad-local-ai-100.json', import.meta.url);
const README_PATH = new URL('../data/scout-local-ai/README.md', import.meta.url);
const TESTFLIGHT_HANDOFF_PATH = new URL('../docs/launch/testflight-dad-handoff.md', import.meta.url);
const RELEASE_EVIDENCE_PATH = new URL('../docs/launch/release-evidence.json', import.meta.url);
const MOBILE_SUITE_PATH = new URL('../mobile/static/scout/dad-local-ai-100.json', import.meta.url);
const MOBILE_EVAL_LAB_PATH = new URL('../mobile/src/lib/components/ScoutEvalLab.svelte', import.meta.url);
const IOS_SIM_GEMMA_RUNNER_PATH = new URL('../scripts/run-scout-ios-sim-gemma-eval.mjs', import.meta.url);
const PACKAGE_PATH = new URL('../package.json', import.meta.url);
const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const execFileAsync = promisify(execFile);

process.env.SCOUT_LOCAL_AI_DOWNLOADS_DIR ??= join(tmpdir(), 'scout-local-ai-default-downloads-empty');

const VALID_PHASES = new Set(['pre-trail', 'on-trail']);
const VALID_TOOL_IDS = new Set([
	'current_mile',
	'next_water',
	'next_shelter',
	'next_town',
	'upcoming_terrain',
	'weather_lookup',
	'trail_conditions',
	'park_services',
	'loadout_check',
	'source_search',
	'open_source_doc',
	'bible_search'
]);
const VALID_SOURCE_SKILLS = new Set([
	'water',
	'shelter',
	'town',
	'weather',
	'trail conditions',
	'safety',
	'park services',
	'terrain',
	'loadout'
]);
const VALID_FAILURES = new Set([
	'missing-data',
	'weak-tool',
	'bad-routing',
	'bad-prompt',
	'unsafe-wording',
	'poor-ux',
	'local-model-limitation'
]);
const EXPECTED_DOMAINS = [
	'pretrip',
	'onboarding',
	'gear',
	'water',
	'shelter',
	'weather',
	'navigation',
	'safety',
	'town',
	'spiritual-offline-edge'
];

test('phone build action lets Dad run after support-only source changes', () => {
	const action = createScoutLocalAiPhoneBuildAction({
		testflight: {
			targetBuild: '1.0 (19)',
			recordedDadPilotBuild: '1.0 (19)',
			suiteRequiredBuild: '1.0 (>= 13)',
			targetBuildMeetsSuiteRequirement: true,
			recordedDadPilotMeetsSuiteRequirement: true,
			targetBuildReadyForDad: true,
			targetBuildAvailableForDad: true
		},
		nativeSource: {
			latestNativeUploadHasCurrentSource: false,
			sourceNewerThanLatestNativeUpload: true,
			nativeAppSourceNewerThanLatestNativeUpload: false,
			sourceDiffersFromLatestNativeUpload: true,
			nativeAppChangedFileCount: 0
		}
	});

	assert.equal(action.kind, 'run-support-only-source-changes');
	assert.equal(action.canRunNow, true);
	assert.equal(action.requiresNewUploadBeforeRun100, false);
	assert.equal(action.requiresNewUploadForLatestAppSourceProof, false);
	assert.match(action.text, /Run 100 now on the latest Dad Pilot TestFlight build 1\.0 \(19\)/u);
	assert.match(action.text, /outside native app source/u);
	assert.match(action.text, /no fresh TestFlight upload is needed/u);
});

test('phone build action flags native app changes as latest-source upload work', () => {
	const action = createScoutLocalAiPhoneBuildAction({
		testflight: {
			targetBuild: '1.0 (19)',
			recordedDadPilotBuild: '1.0 (19)',
			suiteRequiredBuild: '1.0 (>= 13)',
			targetBuildMeetsSuiteRequirement: true,
			recordedDadPilotMeetsSuiteRequirement: true,
			targetBuildReadyForDad: true,
			targetBuildAvailableForDad: true
		},
		nativeSource: {
			latestNativeUploadHasCurrentSource: false,
			sourceNewerThanLatestNativeUpload: true,
			nativeAppSourceNewerThanLatestNativeUpload: true,
			sourceDiffersFromLatestNativeUpload: true,
			nativeAppChangedFileCount: 2
		}
	});

	assert.equal(action.kind, 'upload-native-app-source-for-latest-proof');
	assert.equal(action.canRunNow, true);
	assert.equal(action.requiresNewUploadBeforeRun100, false);
	assert.equal(action.requiresNewUploadForLatestAppSourceProof, true);
	assert.match(action.text, /Dad can still run a suite-compatible build for diagnosis/u);
	assert.match(action.text, /latest-app-source proof needs a fresh TestFlight upload/u);
});

test('Dad local AI eval suite has 100 complete, reviewable cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	assert.equal(suite.schemaVersion, 1);
	assert.equal(suite.suiteId, 'dad-local-ai-100');
	assert.match(suite.version, /^\d{4}-\d{2}-\d{2}\.\d+$/u);
	assert.deepEqual(suite.finalProof, {
		nativePlatform: 'ios',
		installSource: 'testflight',
		minAppVersion: '1.0',
		minAppBuild: 13
	});
	assert.equal(suite.cases.length, 100);

	const ids = new Set();
	const domains = new Map();
	let preTrail = 0;
	let onTrail = 0;

	for (const testCase of suite.cases) {
		assert.match(testCase.id, /^DLA-\d{3}$/u, `${testCase.id} should use DLA-### id format`);
		assert.equal(ids.has(testCase.id), false, `${testCase.id} is duplicated`);
		ids.add(testCase.id);

		assert.ok(VALID_PHASES.has(testCase.phase), `${testCase.id} has invalid phase`);
		if (testCase.phase === 'pre-trail') preTrail += 1;
		if (testCase.phase === 'on-trail') onTrail += 1;

		assert.equal(typeof testCase.domain, 'string', `${testCase.id} needs a domain`);
		domains.set(testCase.domain, (domains.get(testCase.domain) ?? 0) + 1);

		assert.equal(typeof testCase.prompt, 'string', `${testCase.id} prompt must be a string`);
		assert.ok(testCase.prompt.length >= 20, `${testCase.id} prompt is too short`);
		assert.equal(typeof testCase.mile, 'number', `${testCase.id} mile must be numeric`);
		assert.ok(Number.isFinite(testCase.mile), `${testCase.id} mile must be finite`);

		assertNonEmptyStringArray(testCase.requiredTools, `${testCase.id} requiredTools`);
		assertNonEmptyStringArray(testCase.expectedTraits, `${testCase.id} expectedTraits`);
		assertNonEmptyStringArray(testCase.safetyCaveats, `${testCase.id} safetyCaveats`);
		assertNonEmptyStringArray(testCase.improvementTags, `${testCase.id} improvementTags`);

		for (const expectation of testCase.requiredTools) {
			assertValidToolExpectation(expectation, testCase.id);
		}
	}

	assert.ok(preTrail >= 20, 'suite should cover pre-trail preparation and setup');
	assert.ok(onTrail >= 60, 'suite should emphasize on-trail decisions');
	for (const domain of EXPECTED_DOMAINS) {
		assert.equal(domains.get(domain), 10, `${domain} should have exactly 10 cases`);
	}

	for (const category of suite.failureCategories) {
		assert.ok(VALID_FAILURES.has(category), `unknown failure category ${category}`);
	}
});

test('Dad local AI eval suite covers requested hiker objective areas', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const coverage = summarizeScoutLocalAiSuiteCoverage(suite);
	const byId = Object.fromEntries(coverage.areas.map((area) => [area.id, area]));

	assert.equal(coverage.ok, true, coverage.errors.join('\n'));
	assert.equal(coverage.errors.length, 0);
	assert.ok(byId['trail-prep'].count >= 25);
	assert.ok(byId['daily-hiking-decisions'].count >= 45);
	assert.ok(byId.water.count >= 10);
	assert.ok(byId.shelter.count >= 10);
	assert.ok(byId.weather.count >= 10);
	assert.ok(byId.resupply.count >= 10);
	assert.ok(byId.safety.count >= 20);
	assert.ok(byId.gear.count >= 10);
	assert.ok(byId['bible-spiritual-support'].count >= 5);
	assert.ok(byId['offline-local-ai-use'].count >= 10);
	assert.ok(byId['confusing-edge-cases'].count >= 10);
});

test('package scripts expose the Scout local AI review handoff commands', async () => {
	const packageJson = JSON.parse(await readFile(PACKAGE_PATH, 'utf8'));
	assert.equal(packageJson.scripts['review-status:scout-local-ai'], 'node scripts/status-scout-local-ai-review.mjs');
	assert.equal(packageJson.scripts['status:scout-local-ai-review'], 'node scripts/status-scout-local-ai-review.mjs');
	assert.equal(packageJson.scripts['finalize-review:scout-local-ai'], 'node scripts/finalize-scout-local-ai-review.mjs');
	assert.equal(packageJson.scripts['rate-case:scout-local-ai'], 'node scripts/rate-scout-local-ai-review-case.mjs');
	assert.equal(packageJson.scripts['prepare-review:scout-local-ai-device-run'], 'node scripts/prepare-scout-local-ai-device-review.mjs');
	assert.equal(packageJson.scripts['message:scout-local-ai-dad'], 'node scripts/scout-local-ai-dad-handoff.mjs --dad-message');
	assert.equal(packageJson.scripts['receive:scout-local-ai-device-run'], 'node scripts/receive-scout-local-ai-device-run.mjs');
	assert.equal(packageJson.scripts['wait:scout-local-ai-device-run'], 'node scripts/wait-scout-local-ai-device-run.mjs');
	assert.equal(packageJson.scripts['eval:scout-local-ai:ios-sim-gemma'], 'node scripts/run-scout-ios-sim-gemma-eval.mjs');
	assert.equal(packageJson.scripts['scan:scout-local-ai-answers'], 'node scripts/scan-scout-local-ai-answer-quality.mjs');
});

test('README documents device review acceptance states', async () => {
	const readme = await readFile(README_PATH, 'utf8');
	assert.match(readme, /Review Acceptance/u);
	assert.match(readme, /final-review-ready/u);
	assert.match(readme, /diagnostic-review-only/u);
	assert.match(readme, /blocked-before-review/u);
	assert.match(readme, /wait:scout-local-ai-device-run -- --timeout-ms 300000 --poll-ms 10000/u);
	assert.match(readme, /answer-quality scan/u);
	assert.match(readme, /sibling\s+`\.scan\.json` answer-quality scan/u);
	assert.match(readme, /does not\s+replace reading and rating every answer 1-5/u);
	assert.match(readme, /Final Dad\s+readiness still requires all 100 cases rated 5\/5/u);
});

test('iOS simulator Gemma runner writes answer-quality scan artifacts', async () => {
	const runner = await readFile(IOS_SIM_GEMMA_RUNNER_PATH, 'utf8');
	assert.match(runner, /scanScoutLocalAiAnswerQuality/u);
	assert.match(runner, /ios-sim-gemma-\$\{runJson\.runId\}\.scan\.json/u);
	assert.match(runner, /Saved answer-quality scan:/u);
	assert.match(runner, /Answer-quality flags:/u);
	assert.match(runner, /Answer-quality scan command: npm run scan:scout-local-ai-answers/u);
	assert.match(runner, /human 1-5 review and final\s+TestFlight\/iPhone proof remain separate/u);
});

test('Dad TestFlight handoff documents the current Dad Pilot Run 100 path', async () => {
	const handoff = await readFile(TESTFLIGHT_HANDOFF_PATH, 'utf8');
	const releaseEvidence = JSON.parse(await readFile(RELEASE_EVIDENCE_PATH, 'utf8'));
	const summary = releaseEvidence.items?.['dad-testflight-invite']?.summary ?? '';
	const buildMatch = summary.match(/iOS build (\d+\.\d+) \((\d+)\)/u);
	assert.ok(buildMatch, 'release evidence should identify the current Dad Pilot build');
	const currentBuild = `${buildMatch[1]} (${buildMatch[2]})`;

	assert.ok(handoff.includes(`Build \`${currentBuild}\` is live in Dad Pilot`));
	assert.match(handoff, /https:\/\/testflight\.apple\.com\/join\/BagBCrzf/u);
	assert.match(handoff, /Primary Local Regression/u);
	assert.match(handoff, /eval:scout-local-ai:ios-sim-gemma -- --full --timeout-ms 1800000/u);
	assert.match(handoff, /install source is debug\/simulator, not TestFlight on a physical iPhone/u);
	assert.match(handoff, /answer-quality scan/u);
	assert.match(handoff, /does\s+not replace the full human 1-5 review/u);
	assert.match(handoff, /Settings > Scout Eval Lab/u);
	assert.match(handoff, /tap `Run 100`/u);
	assert.match(handoff, /npm run receive:scout-local-ai-device-run -- --clipboard/u);
	assert.match(handoff, /npm run wait:scout-local-ai-device-run/u);
	assert.match(handoff, /wait:scout-local-ai-device-run -- --timeout-ms 300000 --poll-ms 10000/u);
	assert.match(handoff, /Device\/local-AI proof: still pending/u);
	assert.doesNotMatch(handoff, /Next native candidate `1\.0 \(14\)`/u);
	assert.doesNotMatch(handoff, /Dad Pilot is still on `1\.0 \(13\)`/u);
});

test('objective coverage summary fails when a requested objective area disappears', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const weakened = {
		...suite,
		cases: suite.cases.filter((testCase) => testCase.domain !== 'spiritual-offline-edge')
	};
	const coverage = summarizeScoutLocalAiSuiteCoverage(weakened);

	assert.equal(coverage.ok, false);
	assert.match(coverage.errors.join('\n'), /Bible and spiritual support coverage/u);
});

test('mobile embedded Dad local AI eval suite matches canonical suite', async () => {
	const canonical = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const mobile = JSON.parse(await readFile(MOBILE_SUITE_PATH, 'utf8'));
	assert.deepEqual(mobile, canonical);
});

test('mobile Eval Lab exposes resilient iPhone export paths', async () => {
	const component = await readFile(MOBILE_EVAL_LAB_PATH, 'utf8');
	assert.match(component, /navigator\.share/u, 'Eval Lab needs native Share Sheet export');
	assert.match(component, /navigator\.clipboard\.writeText/u, 'Eval Lab needs clipboard export');
	assert.match(component, /document\.execCommand\('copy'\)/u, 'Eval Lab needs a textarea copy fallback');
	assert.match(component, /textShare: ShareData = \{\s*title: handoff\.shareTitle,\s*text: exportText\s*\}/u, 'Text-only Share fallback should stay parseable JSON');
	assert.match(component, /proofStatus\.canRunFinal/u, 'Run 100 should be gated by final-proof readiness');
	assert.match(component, /proofStatus\.canRunSmoke/u, 'Run 3 should remain available for smoke readiness');
	assert.match(component, /setCapacitorScoutEvalKeepAwake/u, 'Run 100 should request native iOS keep-awake while it runs');
	assert.match(component, /nativeKeepAwake/u, 'Eval Lab should not rely only on browser Wake Lock support');
	assert.match(component, /runElapsedLabel/u, 'Eval Lab should show elapsed time during long local-model runs');
	assert.match(component, /formatElapsedDuration/u, 'Elapsed time should stay formatted for Dad-facing progress');
	assert.match(component, /finalExportReady/u, 'Final Run 100 exports should have a persistent handoff state');
	assert.match(component, /shareButtonClass/u, 'Share should become the primary action after a final Run 100 export');
	assert.match(component, /Final Run 100 saved\. Tap Share/u, 'Dad should get a durable final-export reminder');
	assert.match(component, /TestFlight/u, 'Eval Lab should surface TestFlight install-source readiness');
	assert.match(component, />\s*Share\s*</u, 'Share action should be visible when a run exists');
	assert.match(component, />\s*Copy\s*</u, 'Copy action should be visible when a run exists');
	assert.match(component, />\s*Download\s*</u, 'Download action should remain available');
});

test('mobile Eval Lab surfaces saved-run rescue and device proof metadata', async () => {
	const component = await readFile(MOBILE_EVAL_LAB_PATH, 'utf8');
	assert.match(component, /Saved export/u, 'Eval Lab should label the export saved on device');
	assert.match(component, /Partial export/u, 'Eval Lab should distinguish interrupted partial exports');
	assert.match(component, /Resume or share for recovery/u, 'Eval Lab should make partial-run recovery explicit');
	assert.match(component, /Last saved/u, 'Eval Lab should show when the export last autosaved');
	assert.match(component, /Run ID/u, 'Eval Lab should show the saved export run id');
	assert.match(component, /Execution ID/u, 'Eval Lab should show the saved export execution id');
	assert.match(component, /executionIdLabel/u, 'Eval Lab should read the durable execution id from run context');
	assert.match(component, /Errors/u, 'Eval Lab should show errored result count');
	assert.match(component, /Required tools/u, 'Eval Lab should show required-tool gaps before review');
	assert.match(component, /Source evidence/u, 'Eval Lab should show source-evidence gaps before review');
	assert.match(component, /Suite/u, 'Eval Lab should show whether the saved export matches the current suite');
	assert.match(component, /App build/u, 'Eval Lab should show exported app version/build proof metadata');
	assert.match(component, /Install/u, 'Eval Lab should show exported install-source proof metadata');
	assert.match(component, /runContext/u, 'Eval Lab should read proof metadata from the exported run context');
	assert.match(component, /summarizeRunFreshness/u, 'Eval Lab should evaluate saved-run freshness before export');
	assert.match(component, /Stale export/u, 'Eval Lab should visibly flag stale saved exports');
	assert.match(component, /Old suite/u, 'Eval Lab should identify saved exports from old suite versions');
	assert.match(component, /scoutLocalAiEvalRunContextProblems/u, 'Eval Lab should block stale full exports from old app/install proof');
	assert.match(component, /Proof mismatch/u, 'Eval Lab should explain when a full export is not valid final Dad proof');
	assert.match(component, /Clear it and run again/u, 'Eval Lab should tell Dad how to recover from stale saved exports');
	assert.match(component, /activeRunCanExport/u, 'Eval Lab should block stale saved exports from sharing');
	assert.match(component, /confirmClearSavedRun/u, 'Eval Lab should require confirmation before deleting a saved export');
	assert.match(component, /Share or download it first if Chris may need it/u, 'Clear confirmation should warn Dad before losing recovery/final proof JSON');
});

test('mobile Eval Lab labels final exports for inbox review', async () => {
	const component = await readFile(MOBILE_EVAL_LAB_PATH, 'utf8');
	assert.match(component, /summarizeExportHandoff/u, 'Eval Lab should derive export handoff state');
	assert.match(component, /REVIEW_INBOX_PATH = 'data\/scout-local-ai\/inbox\/'/u, 'Final Run 100 exports should point at the repo inbox');
	assert.match(component, /Send this JSON to Chris for review/u, 'Final Run 100 exports should give Dad a simple share handoff');
	assert.match(component, /Chris: save the shared JSON into \$\{REVIEW_INBOX_PATH\}/u, 'Final Run 100 exports should preserve the repo inbox handoff');
	assert.match(component, /Execution ID \$\{executionLabel\}/u, 'Shared exports should include the durable execution id');
	assert.match(component, /npm run prepare-review:scout-local-ai-device-run -- --run inbox/u, 'Final Run 100 exports should name the review prep command');
	assert.match(component, /Final Run 100 JSON ready\. Send it to Chris for review/u, 'Final share/copy/download status should confirm Dad-facing review handoff');
	assert.match(component, /diagnostic only, not final Dad proof/u, 'Smoke and partial exports should not be confused with final proof');
	assert.match(component, /send it only if Chris needs recovery details/u, 'Diagnostic share/copy/download status should preserve proof boundaries');
});

test('mobile Eval Lab turns proof state into the next Dad checkpoint', async () => {
	const component = await readFile(MOBILE_EVAL_LAB_PATH, 'utf8');
	assert.match(component, /summarizeNextCheckpoint/u, 'Eval Lab should derive one immediate phone action from proof state');
	assert.match(component, /Next checkpoint/u, 'Eval Lab should label the immediate next action for Dad');
	assert.match(component, /Prepare local model/u, 'Eval Lab should point at local model readiness before running');
	assert.match(component, /Use local AI lane/u, 'Eval Lab should protect final proof from cloud Scout');
	assert.match(component, /Open iPhone app/u, 'Eval Lab should keep final proof on the installed iOS path');
	assert.match(component, /Run smoke check/u, 'Eval Lab should surface Run 3 when final proof is not ready yet');
	assert.match(component, /Run 100/u, 'Eval Lab should surface the final full-suite action when proof gates pass');
	assert.match(component, /Resume saved run/u, 'Eval Lab should prefer resuming an interrupted saved run');
	assert.match(component, /Share final JSON/u, 'Eval Lab should surface final JSON sharing after a completed run');
	assert.match(component, /Share diagnostic JSON/u, 'Eval Lab should distinguish interrupted diagnostic exports');
	assert.match(component, /Clear saved export/u, 'Eval Lab should tell Dad when a stale export must be cleared');
	assert.match(component, /data-state=\{nextCheckpoint\.state\}/u, 'Eval Lab should expose checkpoint state for visual status');
});

test('status command keeps routing proof separate from missing device proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-routing-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const inboxRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-inbox-latest',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	inboxRun.exportHandoff = exportHandoffForRun(inboxRun, suite);
	await writeFile(join(inboxDir, 'Dad notes.json'), '{"suiteId":"dad-local-ai-100","runId":"missing-results"}\n');
	await writeFile(join(inboxDir, 'AirDrop Hoggcountry latest.json'), `${JSON.stringify(inboxRun, null, 2)}\n`);
	await utimes(join(inboxDir, 'Dad notes.json'), new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(join(inboxDir, 'AirDrop Hoggcountry latest.json'), new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(status.suite.caseCount, 100);
	assert.equal(status.suite.coverage.ok, true);
	assert.equal(gates.suite.ok, true);
	assert.equal(gates.coverage.ok, true);
	assert.equal(gates.routing.ok, true);
	assert.equal(gates['testflight-target'].ok, true);
	assert.equal(gates['device-run'].ok, false);
	assert.equal(gates['iteration-loop'].ok, true);
	assert.match(gates['iteration-loop'].evidence, /No completed below-5 device reviews yet/u);
	assert.equal(status.runs.currentFullRoutingRuns.length, 1);
	assert.equal(status.strictDeviceProofs.length, 0);
	assert.equal(status.suite.finalProof.requiredApp, '1.0 (>= 13)');
	assert.equal(status.testflight.targetBuild, '1.0 (27)');
	assert.equal(status.testflight.suiteRequiredBuild, '1.0 (>= 13)');
	assert.equal(status.testflight.targetBuildMeetsSuiteRequirement, true);
	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (27)');
	assert.equal(status.testflight.recordedDadPilotMeetsSuiteRequirement, true);
	assert.equal(status.testflight.targetBuildReadyForDad, true);
	assert.equal(status.testflight.targetBuildAvailableForDad, true);
	assert.match(gates['testflight-target'].evidence, /Target build is available for Dad/u);
	assert.match(gates['testflight-target'].evidence, /Dad Pilot records 1\.0 \(27\)/u);
	assert.equal(status.inbox.exists, true);
	assert.equal(status.inbox.jsonFileCount, 2);
	assert.equal(status.inbox.candidateCount, 1);
	assert.equal(status.inbox.readyForFinalIntakeCount, 1);
	assert.equal(status.inbox.partialDiagnosticCount, 0);
	assert.equal(status.inbox.blockedCandidateCount, 0);
	assert.equal(status.inbox.ignoredFileCount, 1);
	assert.equal(status.inbox.latestCandidate.runId, 'device-status-inbox-latest');
	assert.equal(status.inbox.latestCandidate.caseCount, 100);
	assert.equal(status.inbox.latestCandidate.evidenceLane, 'device-on-device-gemma');
	assert.equal(status.inbox.latestCandidate.appVersion, '1.0');
	assert.equal(status.inbox.latestCandidate.appBuild, '13');
	assert.equal(status.inbox.latestCandidate.installSource, 'testflight');
	assert.equal(status.inbox.latestCandidate.inspectionStatus, 'ready-for-final-intake');
	assert.equal(status.inbox.latestCandidate.readyForFinalIntake, true);
	assert.equal(status.inbox.latestCandidate.readyForPartialIntake, false);
	assert.equal(status.inbox.latestCandidate.blockingReasonCount, 0);
	assert.equal(status.inbox.latestCandidate.missingSourceEvidenceCases, 0);
	assert.equal(status.inbox.latestCandidate.errorCases, 0);
	assert.equal(status.inbox.latestCandidate.handoff.kind, 'final-run-100');
	assert.equal(status.inbox.latestCandidate.handoff.expectedAcceptanceStatus, 'final-review-ready');
	assert.match(status.inbox.latestCandidate.handoff.prepareReviewCommand, /prepare-review:scout-local-ai-device-run/u);
	assert.equal(status.inbox.latestReadyCandidate.runId, 'device-status-inbox-latest');
	assert.equal(status.nextAction.kind, 'prepare-inbox-export');
	assert.match(status.nextAction.text, /likely Scout Eval Lab export is already/u);
	assert.match(status.nextAction.text, /ready-for-final-intake/u);
	assert.match(status.nextAction.text, /device-status-inbox-latest/u);
	assert.match(status.nextAction.text, /prepare-review:scout-local-ai-device-run/u);
	assert.match(status.nextAction.text, /--run inbox/u);
	assert.match(status.nextAction.text, /do not count it as final Dad proof/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(textResult.stdout, /Latest inbox handoff: Final Run 100 JSON ready for inbox review \(final-review-ready\)/u);
	assert.match(textResult.stdout, /Latest inbox boundary: This starts human review only/u);
});

test('status command can prepare a final Run 100 export from Downloads', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-downloads-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const downloadsDir = join(outputDir, 'Downloads');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	await mkdir(downloadsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-downloads',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-downloads.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const downloadsRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-downloads-latest',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	downloadsRun.exportHandoff = exportHandoffForRun(downloadsRun, suite);
	await writeFile(join(downloadsDir, 'random-settings.json'), '{"ok":true}\n');
	await writeFile(join(downloadsDir, 'Hoggcountry Scout Eval Run 100.json'), `${JSON.stringify(downloadsRun, null, 2)}\n`);
	await utimes(join(downloadsDir, 'random-settings.json'), new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(join(downloadsDir, 'Hoggcountry Scout Eval Run 100.json'), new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--downloads-dir',
			downloadsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.inbox.candidateCount, 0);
	assert.equal(status.downloads.exists, true);
	assert.equal(status.downloads.jsonFileCount, 2);
	assert.equal(status.downloads.candidateCount, 1);
	assert.equal(status.downloads.readyForFinalIntakeCount, 1);
	assert.equal(status.downloads.partialDiagnosticCount, 0);
	assert.equal(status.downloads.blockedCandidateCount, 0);
	assert.equal(status.downloads.ignoredFileCount, 1);
	assert.equal(status.downloads.latestCandidate.runId, 'device-status-downloads-latest');
	assert.equal(status.downloads.latestCandidate.caseCount, 100);
	assert.equal(status.downloads.latestCandidate.evidenceLane, 'device-on-device-gemma');
	assert.equal(status.downloads.latestCandidate.readyForFinalIntake, true);
	assert.equal(status.downloads.latestReadyCandidate.runId, 'device-status-downloads-latest');
	assert.equal(status.nextAction.kind, 'prepare-downloads-export');
	assert.match(status.nextAction.text, /likely Scout Eval Lab export is already/u);
	assert.match(status.nextAction.text, /device-status-downloads-latest/u);
	assert.match(status.nextAction.text, /--run latest/u);
	assert.match(status.nextAction.text, /do not count it as final Dad proof/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--downloads-dir',
			downloadsDir,
			'--reviews-dir',
			reviewsDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(textResult.stdout, /Latest downloads handoff: Final Run 100 JSON ready for inbox review \(final-review-ready\); command: `npm run prepare-review:scout-local-ai-device-run -- --run latest`/u);
});

test('status command recognizes copied Scout export text in Downloads', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-downloads-text-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const downloadsDir = join(outputDir, 'Downloads');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	await mkdir(downloadsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-downloads-text',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-downloads-text.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const copiedRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-downloads-text',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	copiedRun.exportHandoff = exportHandoffForRun(copiedRun, suite);
	const copiedMessage = [
		'Dad copied the Hoggcountry Run 100 export:',
		'',
		'```json',
		JSON.stringify(copiedRun, null, 2),
		'```'
	].join('\n');
	await writeFile(join(downloadsDir, 'random-settings.json'), '{"ok":true}\n');
	await writeFile(join(downloadsDir, 'Dad trip notes.txt'), 'Remember to ask whether the shakedown hike loaded.\n');
	await writeFile(join(downloadsDir, 'Dad copied Run 100.txt'), copiedMessage);
	await utimes(join(downloadsDir, 'random-settings.json'), new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(join(downloadsDir, 'Dad trip notes.txt'), new Date('2026-06-27T01:30:00Z'), new Date('2026-06-27T01:30:00Z'));
	await utimes(join(downloadsDir, 'Dad copied Run 100.txt'), new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--downloads-dir',
			downloadsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.downloads.exists, true);
	assert.equal(status.downloads.jsonFileCount, 1);
	assert.equal(status.downloads.textFileCount, 2);
	assert.equal(status.downloads.supportedFileCount, 3);
	assert.equal(status.downloads.candidateCount, 1);
	assert.equal(status.downloads.ignoredFileCount, 2);
	assert.equal(status.downloads.unreadableCount, 0);
	assert.equal(status.downloads.latestCandidate.runId, 'device-status-downloads-text');
	assert.equal(status.downloads.latestCandidate.extractedJson, true);
	assert.match(status.downloads.latestCandidate.path, /Dad copied Run 100\.txt$/u);
	assert.equal(status.downloads.latestReadyCandidate.runId, 'device-status-downloads-text');
	assert.equal(status.nextAction.kind, 'prepare-downloads-export');
	assert.match(status.nextAction.text, /device-status-downloads-text/u);
	assert.match(status.nextAction.text, /--run latest/u);
});

test('status command asks for simulator preflight when no device export exists yet', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-wait-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-wait-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-wait-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (15), the public TestFlight link is enabled with limit 5, and App Store Connect reports external state IN_BETA_TESTING.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['local-preflight'].ok, false);
	assert.match(gates['local-preflight'].evidence, /No full simulator\/debug local preflight run found/u);
	assert.equal(status.nextAction.kind, 'run-local-preflight');
	assert.equal(status.phoneBuildAction.canRunNow, true);
	assert.equal(status.phoneBuildAction.requiresNewUploadBeforeRun100, false);
	assert.match(status.phoneBuildAction.text, /Run 100 now/u);
	assert.match(status.nextAction.text, /Mac mini simulator lane/u);
	assert.match(status.nextAction.text, /eval:scout-local-ai:ios-sim-gemma -- --limit 100/u);
	assert.match(status.nextAction.text, /preflight only/u);
	assert.match(status.nextAction.text, /does not replace final TestFlight\/iPhone proof/u);
});

test('status command blocks stale inbox exports before review work starts', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-stale-inbox-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-stale-inbox',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-stale-inbox.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const staleRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-inbox-stale',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteVersion: '2026-01-01.1',
		suiteHash: 'fnv1a32:oldhash'
	});
	await writeFile(join(inboxDir, 'AirDrop Hoggcountry stale.json'), `${JSON.stringify(staleRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.inbox.candidateCount, 1);
	assert.equal(status.inbox.readyForFinalIntakeCount, 0);
	assert.equal(status.inbox.partialDiagnosticCount, 0);
	assert.equal(status.inbox.blockedCandidateCount, 1);
	assert.equal(status.inbox.latestCandidate.runId, 'device-status-inbox-stale');
	assert.equal(status.inbox.latestCandidate.inspectionStatus, 'stale-suite');
	assert.equal(status.inbox.latestCandidate.readyForFinalIntake, false);
	assert.equal(status.inbox.latestCandidate.readyForPartialIntake, false);
	assert.match(status.inbox.latestCandidate.blockingReasons.join('\n'), /run\.suiteVersion/u);
	assert.match(status.inbox.latestCandidate.blockingReasons.join('\n'), /run\.suiteHash/u);
	assert.equal(status.inbox.latestReadyCandidate, null);
	assert.equal(status.nextAction.kind, 'fix-inbox-export');
	assert.match(status.nextAction.text, /blocked before review/u);
	assert.match(status.nextAction.text, /stale-suite/u);
	assert.match(status.nextAction.text, /run\.suiteVersion/u);
	assert.match(status.nextAction.text, /Do not rate it/u);
});

test('status command prefers an older final-ready inbox export over a newer blocked export', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-mixed-inbox-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-mixed-inbox',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-mixed-inbox.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const readyRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-inbox-ready-older',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const staleRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-inbox-stale-newer',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteVersion: '2026-01-01.1',
		suiteHash: 'fnv1a32:oldhash'
	});
	const readyPath = join(inboxDir, 'AirDrop Hoggcountry ready older.json');
	const stalePath = join(inboxDir, 'AirDrop Hoggcountry stale newer.json');
	await writeFile(readyPath, `${JSON.stringify(readyRun, null, 2)}\n`);
	await writeFile(stalePath, `${JSON.stringify(staleRun, null, 2)}\n`);
	await utimes(readyPath, new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));
	await utimes(stalePath, new Date('2026-06-27T03:00:00Z'), new Date('2026-06-27T03:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.inbox.candidateCount, 2);
	assert.equal(status.inbox.readyForFinalIntakeCount, 1);
	assert.equal(status.inbox.blockedCandidateCount, 1);
	assert.equal(status.inbox.latestCandidate.runId, 'device-status-inbox-stale-newer');
	assert.equal(status.inbox.latestCandidate.inspectionStatus, 'stale-suite');
	assert.equal(status.inbox.latestReadyCandidate.runId, 'device-status-inbox-ready-older');
	assert.equal(status.nextAction.kind, 'prepare-inbox-ready-export');
	assert.match(status.nextAction.text, /final-ready Scout Eval Lab export is already/u);
	assert.match(status.nextAction.text, /device-status-inbox-ready-older/u);
	assert.match(status.nextAction.text, /newest inbox file is stale-suite/u);
	assert.match(status.nextAction.text, /will select the final-ready export/u);
});

test('status command surfaces partial TestFlight iPhone runs without counting them as final proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-partial-device-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	await mkdir(deviceRunsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-partial-device-companion',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-partial-device-companion.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const partialRun = deviceRunForCases(suite, suite.cases.slice(0, 12), {
		runId: 'device-status-partial-12',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(join(deviceRunsDir, 'device-status-partial-12.json'), `${JSON.stringify(partialRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(status.runs.currentFullDeviceRuns.length, 0);
	assert.equal(status.runs.currentPartialDeviceRuns.length, 1);
	assert.equal(status.runs.currentPartialDeviceRuns[0].runId, 'device-status-partial-12');
	assert.equal(status.runs.currentPartialDeviceRuns[0].caseCount, 12);
	assert.equal(status.testflight.currentTargetDeviceRunCount, 0);
	assert.equal(status.testflight.currentTargetPartialDeviceRunCount, 0);
	assert.equal(status.testflight.currentSuiteCompatibleDeviceRunCount, 0);
	assert.equal(status.testflight.currentSuiteCompatiblePartialDeviceRunCount, 1);
	assert.equal(gates['device-run'].ok, false);
	assert.match(gates['device-run'].evidence, /partial device run\(s\) imported/u);
	assert.match(gates['device-run'].evidence, /device-status-partial-12 12\/100/u);
	assert.equal(status.nextAction.kind, 'resume-device-run');
	assert.match(status.nextAction.text, /Partial TestFlight\/iPhone Eval Lab run device-status-partial-12 is imported at 12\/100/u);
	assert.match(status.nextAction.text, /tap Resume/u);
	assert.match(status.nextAction.text, /prepare-review:scout-local-ai-device-run/u);
	assert.match(status.nextAction.text, /--run inbox/u);
	assert.match(status.nextAction.text, /--allow-partial for diagnosis/u);
	assert.match(status.nextAction.text, /not final Dad proof/u);
});

test('status command surfaces target TestFlight build gaps before phone eval', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-build-gap-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(runsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-build-gap-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-build-gap-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (12), and build 13 is not attached yet.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.testflight.targetBuild, '1.0 (27)');
	assert.equal(status.testflight.suiteRequiredBuild, '1.0 (>= 13)');
	assert.equal(status.testflight.targetBuildMeetsSuiteRequirement, true);
	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (12)');
	assert.equal(status.testflight.recordedDadPilotMeetsSuiteRequirement, false);
	assert.equal(status.testflight.targetBuildReadyForDad, false);
	assert.equal(status.testflight.targetBuildAvailableForDad, false);
	assert.equal(status.testflight.currentSuiteCompatibleDeviceRunCount, 0);
	assert.equal(status.nextAction.kind, 'publish-target-build');
	assert.match(status.nextAction.text, /Upload and attach target iOS build 1\.0 \(27\)/u);
	assert.match(status.nextAction.text, /Dad Pilot on 1\.0 \(12\)/u);
	assert.match(status.nextAction.text, /suite requires 1\.0 \(>= 13\)/u);
	assert.match(status.nextAction.text, /prepare-review:scout-local-ai-device-run/u);
	assert.match(status.nextAction.text, /--run inbox/u);
});

test('status command lets suite-compatible TestFlight device proof override stale Dad Pilot release evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-device-proves-build-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (12), and release evidence was not refreshed yet.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);
	const deviceRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-suite-compatible-build13',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(join(deviceRunsDir, 'device-status-suite-compatible-build13.json'), `${JSON.stringify(deviceRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(status.testflight.targetBuild, '1.0 (27)');
	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (12)');
	assert.equal(status.testflight.recordedDadPilotMeetsSuiteRequirement, false);
	assert.equal(status.testflight.targetBuildReadyForDad, false);
	assert.equal(status.testflight.targetBuildAvailableForDad, true);
	assert.equal(status.testflight.currentTargetDeviceRunCount, 0);
	assert.equal(status.testflight.currentSuiteCompatibleDeviceRunCount, 1);
	assert.equal(status.runs.currentFullDeviceRuns.length, 1);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.status, 'review-needed');
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.caseCount, 100);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.flaggedCount, 100);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.errorCount, 100);
	assert.ok(status.runs.currentFullDeviceRuns[0].answerQuality.warningCount >= 100);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.byCheck['unfinished-tail'], 100);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.byCheck['very-short-answer'], 100);
	assert.equal(status.runs.currentFullDeviceRuns[0].answerQuality.topFlagged[0].caseId, 'DLA-001');
	assert.match(status.runs.currentFullDeviceRuns[0].answerQuality.boundary, /does not replace human 1-5 ratings/u);
	assert.equal(gates['testflight-target'].ok, true);
	assert.match(gates['testflight-target'].evidence, /Imported TestFlight\/iPhone proof shows a suite-compatible build is installed/u);
	assert.match(gates['testflight-target'].evidence, /1 imported full device run\(s\) satisfy the suite-required TestFlight build/u);
	assert.equal(status.nextAction.kind, 'finish-review');
	assert.match(status.nextAction.text, /review-packets\/device-status-suite-compatible-build13\.review\.md/u);
	assert.match(status.nextAction.text, /npm run review-status:scout-local-ai/u);
	assert.match(status.nextAction.text, /npm run finalize-review:scout-local-ai/u);
	assert.match(status.nextAction.text, /device-status-suite-compatible-build13\.review\.json/u);
	assert.match(status.nextAction.text, /If the packet is missing, recreate it/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(textResult.stdout, /Latest full device answer-quality scan: `device-status-suite-compatible-build13` review-needed; 100\/100 flagged, 100 errors, \d+ warnings/u);
	assert.match(textResult.stdout, /Answer-quality boundary: Heuristic scan only/u);
	assert.match(textResult.stdout, /Top answer-quality cases: DLA-001 \(very-short-answer:warning, unfinished-tail:error\)/u);
});

test('status command does not accept full device runs from non-suite-compatible TestFlight builds', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-wrong-device-build-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(runsDir, { recursive: true });
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (13), and the public TestFlight link is enabled.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-wrong-device-build',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-wrong-device-build.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const staleBuildRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-wrong-build12',
		completeTools: true,
		runContext: finalDeviceRunContext({
			app: {
				id: 'com.hoggcountry.trailassistant',
				name: 'Hoggcountry',
				version: '1.0',
				build: '12'
			}
		})
	});
	const staleBuildReview = reviewForRun(staleBuildRun, { rating: 5 });
	await writeFile(join(deviceRunsDir, 'device-status-wrong-build12.json'), `${JSON.stringify(staleBuildRun, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-wrong-build12.review.json'), `${JSON.stringify(staleBuildReview, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (13)');
	assert.equal(status.testflight.targetBuildAvailableForDad, true);
	assert.equal(status.testflight.currentSuiteCompatibleDeviceRunCount, 0);
	assert.equal(status.runs.currentFullDeviceRuns.length, 1);
	assert.equal(status.runs.currentFullFinalProofDeviceRuns.length, 0);
	assert.equal(status.runs.currentFullNonFinalProofDeviceRuns.length, 1);
	assert.equal(status.reviews.currentDeviceReviews.length, 0);
	assert.equal(gates['testflight-target'].ok, true);
	assert.equal(gates['device-run'].ok, false);
	assert.match(gates['device-run'].evidence, /No current full suite-compatible TestFlight\/iPhone run found/u);
	assert.match(gates['device-run'].evidence, /device-status-wrong-build12/u);
	assert.match(gates['device-run'].evidence, /app=1\.0 \(12\), expected 1\.0 \(>= 13\)/u);
	assert.equal(gates.review.ok, false);
	assert.equal(status.strictDeviceProofs.length, 0);
	assert.equal(status.nextAction.kind, 'rerun-device-proof-context');
	assert.match(status.nextAction.text, /not valid final Dad proof/u);
	assert.match(status.nextAction.text, /Rerun Run 100 on a suite-compatible TestFlight iPhone build/u);
	assert.match(status.nextAction.text, /prepare-review:scout-local-ai-device-run/u);
});

test('status command treats clean simulator local AI runs as preflight, not final proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-local-preflight-'));
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (27), and the public TestFlight link is enabled.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);
	const simulatorRun = deviceRunForCases(suite, suite.cases, {
		runId: 'simulator-clean-local-preflight',
		completeTools: true,
		runContext: simulatorDeviceRunContext()
	});
	for (const result of simulatorRun.results) result.answer = cleanPreflightAnswer();
	await writeFile(join(deviceRunsDir, 'simulator-clean-local-preflight.json'), `${JSON.stringify(simulatorRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['local-preflight'].ok, true);
	assert.match(gates['local-preflight'].evidence, /simulator-clean-local-preflight is clean/u);
	assert.equal(gates['device-run'].ok, false);
	assert.equal(status.localPreflight.ok, true);
	assert.equal(status.localPreflight.fullRunCount, 1);
	assert.equal(status.localPreflight.partialRunCount, 0);
	assert.equal(status.localPreflight.latestFullRun.runId, 'simulator-clean-local-preflight');
	assert.equal(status.localPreflight.latestFullRun.answerQuality.status, 'clean');
	assert.match(status.localPreflight.latestProofMismatch, /install=debug, expected testflight/u);
	assert.equal(status.runs.currentFullLocalPreflightRuns.length, 1);
	assert.equal(status.runs.currentFullFinalProofDeviceRuns.length, 0);
	assert.equal(status.runs.currentFullNonFinalProofDeviceRuns.length, 1);
	assert.equal(status.nextAction.kind, 'rerun-device-proof-context');
	assert.match(status.nextAction.text, /not valid final Dad proof/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(textResult.stdout, /Simulator\/debug local preflight: clean; full runs 1, partial runs 0/u);
	assert.match(textResult.stdout, /Simulator\/debug local preflight boundary: simulator\/debug local preflight drives iteration but does not replace final TestFlight\/iPhone proof/u);
	assert.match(textResult.stdout, /Simulator\/debug local final-proof mismatch: simulator-clean-local-preflight \(install=debug, expected testflight\)/u);
});

test('status command recognizes repeated strict TestFlight iPhone proof candidates', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-device-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-pass-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-pass-b',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	runB.generatedAt = '2026-06-26T12:10:00.000Z';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	await writeFile(join(deviceRunsDir, 'device-status-pass-a.json'), `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(join(deviceRunsDir, 'device-status-pass-b.json'), `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-pass-a.review.json'), `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-pass-b.review.json'), `${JSON.stringify(reviewB, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['device-run'].ok, true);
	assert.equal(gates.review.ok, true);
	assert.equal(gates['iteration-loop'].ok, true);
	assert.equal(gates['strict-device-proof'].ok, true);
	assert.equal(gates.stability.ok, true);
	assert.match(gates.stability.evidence, /2 run ids, 2 execution fingerprints/u);
	assert.equal(status.testflight.currentTargetDeviceRunCount, 0);
	assert.equal(status.testflight.currentSuiteCompatibleDeviceRunCount, 2);
	assert.equal(gates['testflight-target'].ok, true);
	assert.equal(status.strictDeviceProofs.filter((proof) => proof.ok).length, 2);
	assert.equal(status.nextAction.kind, 'stability-ready');
});

test('status command rejects copied strict proof exports as stability-ready', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-stability-copy-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-copy-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = JSON.parse(JSON.stringify(runA));
	runB.runId = 'device-status-copy-b';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	await writeFile(join(deviceRunsDir, 'device-status-copy-a.json'), `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(join(deviceRunsDir, 'device-status-copy-b.json'), `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-copy-a.review.json'), `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-copy-b.review.json'), `${JSON.stringify(reviewB, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['device-run'].ok, true);
	assert.equal(gates.review.ok, true);
	assert.equal(gates['strict-device-proof'].ok, true);
	assert.equal(status.strictDeviceProofs.filter((proof) => proof.ok).length, 2);
	assert.equal(new Set(status.strictDeviceProofs.filter((proof) => proof.ok).map((proof) => proof.executionFingerprint)).size, 1);
	assert.equal(gates.stability.ok, false);
	assert.match(gates.stability.evidence, /Need two separate Eval Lab executions/u);
	assert.match(gates.stability.evidence, /only 1 distinct execution fingerprint/u);
	assert.equal(status.nextAction.kind, 'get-second-device-run');
});

test('status command sends completed below-5 device reviews into iteration planning', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-below-five-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const backlogDir = join(outputDir, 'backlog');
	const iterationsDir = join(outputDir, 'iterations');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await mkdir(backlogDir, { recursive: true });
	await mkdir(iterationsDir, { recursive: true });
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-below-five',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].ownerLayer = 'data';
	review.cases[0].improvementTask = 'Add current-section water reliability source docs for this trail context.';
	review.cases[1].rating = 3;
	review.cases[1].failureCategories = ['bad-routing', 'weak-tool'];
	review.cases[1].ownerLayer = 'tool-routing';
	review.cases[1].improvementTask = 'Fix source skill routing so Scout opens the relevant shelter source document.';
	await writeFile(join(deviceRunsDir, 'device-status-below-five.json'), `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-below-five.review.json'), `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--backlog-dir',
			backlogDir,
			'--iterations-dir',
			iterationsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['device-run'].ok, true);
	assert.equal(gates.review.ok, false);
	assert.equal(gates['iteration-loop'].ok, false);
	assert.match(gates['iteration-loop'].evidence, /missing backlog for device-status-below-five/u);
	assert.equal(status.reviews.currentDeviceReviews.length, 1);
	assert.equal(status.reviews.currentDeviceReviews[0].rated, 100);
	assert.equal(status.reviews.currentDeviceReviews[0].belowFive, 2);
	assert.equal(status.reviews.currentDeviceReviews[0].invalidCount, 0);
	assert.equal(status.iterations.currentBacklogs.length, 0);
	assert.equal(status.iterations.currentIterationPlans.length, 0);
	assert.equal(status.iterations.reviewDebt.totalReviews, 1);
	assert.equal(status.iterations.reviewDebt.totalBelowFive, 2);
	assert.equal(status.iterations.reviewDebt.needsBacklog[0].runId, 'device-status-below-five');
	assert.equal(status.nextAction.kind, 'write-backlog');
	assert.match(status.nextAction.text, /complete but has 2 below-5 answer\(s\)/u);
	assert.match(status.nextAction.text, /npm run review:scout-local-ai/u);
	assert.match(status.nextAction.text, /npm run plan:scout-local-ai-iteration/u);
	assert.match(status.nextAction.text, /data\/scout-local-ai\/backlog\/device-status-below-five\.backlog\.json/u);
	assert.match(status.nextAction.text, /Fix the named owner layers/u);
	assert.match(status.nextAction.text, /do not close the iteration by changing expected wording only/u);
});

test('status command follows existing below-5 backlog and iteration plan', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-iteration-artifacts-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const backlogDir = join(outputDir, 'backlog');
	const iterationsDir = join(outputDir, 'iterations');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await mkdir(backlogDir, { recursive: true });
	await mkdir(iterationsDir, { recursive: true });
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-artifacts',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const belowFiveCases = [review.cases[0], review.cases[1]];
	belowFiveCases[0].rating = 4;
	belowFiveCases[0].failureCategories = ['missing-data'];
	belowFiveCases[0].ownerLayer = 'data';
	belowFiveCases[0].improvementTask = 'Add current-section water reliability source docs for this trail context.';
	belowFiveCases[1].rating = 3;
	belowFiveCases[1].failureCategories = ['bad-routing', 'weak-tool'];
	belowFiveCases[1].ownerLayer = 'tool-routing';
	belowFiveCases[1].improvementTask = 'Fix source skill routing so Scout opens the relevant shelter source document.';
	await writeFile(join(deviceRunsDir, 'device-status-artifacts.json'), `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-artifacts.review.json'), `${JSON.stringify(review, null, 2)}\n`);
	const backlog = {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		suiteVersion: run.suiteVersion,
		suiteHash: run.suiteHash,
		evidenceLane: run.evidenceLane,
		generatedAt: '2026-06-26T12:30:00.000Z',
		summary: {
			rated: 100,
			total: 100,
			belowFive: 2,
			unrated: 0,
			ratingCounts: {'3': 1, '4': 1, '5': 98}
		},
		unratedItems: [],
		items: belowFiveCases.map((entry) => ({
			id: `${run.runId}:${entry.caseId}`,
			caseId: entry.caseId,
			domain: entry.domain,
			phase: entry.phase,
			rating: entry.rating,
			failureCategories: entry.failureCategories,
			ownerLayer: entry.ownerLayer,
			improvementTask: entry.improvementTask,
			requiredTools: entry.toolExpectations.required,
			missingTools: [],
			sourceEvidenceGaps: [],
			answerPreview: entry.answerPreview
		}))
	};
	const backlogPath = join(backlogDir, 'device-status-artifacts.backlog.json');
	await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

	const backlogOnlyResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--backlog-dir',
			backlogDir,
			'--iterations-dir',
			iterationsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlogOnlyStatus = JSON.parse(backlogOnlyResult.stdout);
	const backlogOnlyGates = Object.fromEntries(backlogOnlyStatus.gates.map((gate) => [gate.id, gate]));
	assert.equal(backlogOnlyStatus.iterations.currentBacklogs.length, 1);
	assert.equal(backlogOnlyStatus.iterations.currentIterationPlans.length, 0);
	assert.equal(backlogOnlyGates['iteration-loop'].ok, false);
	assert.match(backlogOnlyGates['iteration-loop'].evidence, /missing iteration plan for device-status-artifacts/u);
	assert.equal(backlogOnlyStatus.iterations.reviewDebt.backlogOnly[0].runId, 'device-status-artifacts');
	assert.equal(backlogOnlyStatus.nextAction.kind, 'plan-iteration');
	assert.match(backlogOnlyStatus.nextAction.text, /backlog .*device-status-artifacts\.backlog\.json already exists/u);
	assert.doesNotMatch(backlogOnlyStatus.nextAction.text, /npm run review:scout-local-ai/u);

	const plan = {
		schemaVersion: 1,
		planId: 'device-status-artifacts-plan',
		generatedAt: '2026-06-26T12:35:00.000Z',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/device-status-artifacts.backlog.json',
				runId: run.runId,
				suiteId: run.suiteId,
				suiteVersion: run.suiteVersion,
				suiteHash: run.suiteHash,
				evidenceLane: run.evidenceLane,
				belowFive: 2,
				unrated: 0
			}
		],
		summary: {
			itemCount: 2,
			regressionCaseCount: 2
		},
		regressionCaseIds: belowFiveCases.map((entry) => entry.caseId),
		rerunCommand: `npm run eval:scout-local-ai -- --id ${belowFiveCases.map((entry) => entry.caseId).join(',')}`
	};
	await writeFile(join(iterationsDir, 'device-status-artifacts-plan.iteration.json'), `${JSON.stringify(plan, null, 2)}\n`);
	const plannedResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--backlog-dir',
			backlogDir,
			'--iterations-dir',
			iterationsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plannedStatus = JSON.parse(plannedResult.stdout);
	const plannedGates = Object.fromEntries(plannedStatus.gates.map((gate) => [gate.id, gate]));
	assert.equal(plannedStatus.iterations.currentBacklogs.length, 1);
	assert.equal(plannedStatus.iterations.currentIterationPlans.length, 1);
	assert.equal(plannedStatus.iterations.currentIterationPlans[0].planId, 'device-status-artifacts-plan');
	assert.equal(plannedGates['iteration-loop'].ok, true);
	assert.match(plannedGates['iteration-loop'].evidence, /2 below-5 answer\(s\).*iteration plan\(s\): device-status-artifacts/u);
	assert.match(plannedStatus.iterations.reviewDebt.planned[0].iterationPlanPath, /iterations\/device-status-artifacts-plan\.iteration\.json$/u);
	assert.equal(plannedStatus.nextAction.kind, 'execute-iteration');
	assert.match(plannedStatus.nextAction.text, /iteration plan .*device-status-artifacts-plan\.iteration\.json is ready/u);
	assert.match(plannedStatus.nextAction.text, /npm run eval:scout-local-ai -- --id/u);
	assert.match(plannedStatus.nextAction.text, /npm run verify:scout-local-ai-iteration/u);
});

test('goal audit maps original success criteria without hiding missing device proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-goal-audit-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	const backlogDir = join(outputDir, 'backlog');
	const iterationsDir = join(outputDir, 'iterations');
	await mkdir(runsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-goal-audit-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-goal-audit-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const inboxRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-goal-audit-inbox',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(join(inboxDir, 'AirDrop Hoggcountry latest.json'), `${JSON.stringify(inboxRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/audit-scout-local-ai-goal.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--backlog-dir',
			backlogDir,
			'--iterations-dir',
			iterationsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 4 }
	);
	const audit = JSON.parse(result.stdout);
	const requirements = Object.fromEntries(audit.requirements.map((item) => [item.id, item]));

	assert.equal(audit.goalComplete, false);
	assert.equal(requirements['versioned-100-question-suite'].ok, true);
	assert.equal(requirements['per-case-rubrics-and-tools'].ok, true);
	assert.equal(requirements['runner-saves-transcripts'].ok, true);
	assert.match(requirements['runner-saves-transcripts'].evidence, /100 result transcript/u);
	assert.equal(requirements['review-ratings-and-notes'].ok, true);
	assert.equal(requirements['below-five-creates-task'].ok, true);
	assert.match(requirements['below-five-creates-task'].evidence, /Workflow guardrail present/u);
	assert.match(requirements['below-five-creates-task'].evidence, /failure categories, ownerLayer, and concrete improvementTask/u);
	assert.match(requirements['below-five-creates-task'].evidence, /Current device-review debt:/u);
	assert.equal(requirements['iterations-target-responsible-layer'].ok, true);
	assert.equal(requirements['device-proof-lane-separated'].ok, true);
	assert.match(requirements['device-proof-lane-separated'].evidence, /Boundary guardrail present/u);
	assert.match(requirements['device-proof-lane-separated'].evidence, /Current device proof status: No current full suite-compatible TestFlight\/iPhone run found/u);
	assert.match(requirements['device-proof-lane-separated'].evidence, /No strict TestFlight\/iPhone proof run passes/u);
	assert.equal(requirements['target-testflight-build'].ok, true);
	assert.match(requirements['target-testflight-build'].evidence, /Dad Pilot records 1\.0 \(27\)/u);
	assert.equal(requirements['final-100-rated-five'].ok, false);
	assert.match(requirements['final-100-rated-five'].evidence, /No strict TestFlight\/iPhone proof run passes/u);
	assert.equal(audit.currentStatus.currentFullRoutingRuns, 1);
	assert.equal(audit.currentStatus.currentFullDeviceRuns, 0);
	assert.equal(audit.currentStatus.currentPartialDeviceRuns, 0);
	assert.equal(audit.currentStatus.inboxCandidateExports, 1);
	assert.equal(audit.currentStatus.inboxJsonFiles, 1);
	assert.equal(audit.currentStatus.latestInboxExport.runId, 'device-goal-audit-inbox');
	assert.equal(audit.currentStatus.latestInboxExport.caseCount, 100);
	assert.equal(audit.currentStatus.latestInboxExport.evidenceLane, 'device-on-device-gemma');
	assert.equal(audit.currentStatus.latestInboxExport.appBuild, '13');
	assert.equal(audit.currentStatus.latestInboxExport.installSource, 'testflight');
	assert.equal(audit.currentStatus.nextAction.kind, 'prepare-inbox-export');
	assert.match(audit.currentStatus.nextAction.text, /device-goal-audit-inbox/u);
	assert.match(audit.currentStatus.nextAction.text, /--run inbox/u);
});

test('Dad handoff command summarizes current TestFlight/iPhone eval next steps', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-dad-handoff-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	const iosProofDir = join(outputDir, 'proof');
	await mkdir(runsDir, { recursive: true });
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	await mkdir(iosProofDir, { recursive: true });
	const currentRepoSha = (await execFileAsync('git', ['rev-parse', 'HEAD'], {
		cwd: REPO_ROOT
	})).stdout.trim();
	let uploadRepoSha = currentRepoSha;
	try {
		uploadRepoSha = (await execFileAsync('git', ['rev-parse', 'HEAD^'], {
			cwd: REPO_ROOT
		})).stdout.trim();
	} catch {
		uploadRepoSha = currentRepoSha;
	}
	const uploadRepoShaIsAncestor = uploadRepoSha !== currentRepoSha;
	const changedFilesSinceUpload = uploadRepoShaIsAncestor
		? (await execFileAsync('git', ['diff', '--name-only', `${uploadRepoSha}..${currentRepoSha}`], {
			cwd: REPO_ROOT
		})).stdout.split('\n').map((line) => line.trim()).filter(Boolean)
		: [];
	const nativeAppSourceChangedSinceUpload = changedFilesSinceUpload.some((path) => /^mobile\//u.test(path) || ['package.json', 'package-lock.json'].includes(path));
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-handoff-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-handoff-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	const simulatorRun = deviceRunForCases(suite, suite.cases, {
		runId: 'simulator-handoff-clean-preflight',
		completeTools: true,
		runContext: simulatorDeviceRunContext()
	});
	for (const result of simulatorRun.results) result.answer = cleanPreflightAnswer();
	await writeFile(join(deviceRunsDir, 'simulator-handoff-clean-preflight.json'), `${JSON.stringify(simulatorRun, null, 2)}\n`);
	const inboxRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-handoff-inbox-latest',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(join(inboxDir, 'AirDrop Hoggcountry latest.json'), `${JSON.stringify(inboxRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (13), the public TestFlight link is enabled with limit 5, and App Store Connect reports external state IN_BETA_TESTING.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);
	await writeFile(join(iosProofDir, 'ios-testflight-attempt-2026-06-27T02-39-27-165Z.md'), [
		'# iOS TestFlight lane attempt',
		'',
		'Checked at: 2026-06-27T02:40:36.338Z',
		'Repo SHA: see repo-sha log',
		'Status: passed',
		'',
		'## Mode',
		'',
		'- Upload: yes',
		'- App Store Connect API key provided: yes',
		'',
		'## Steps',
		'',
		'- pass repo-sha (exit 0): 01-repo-sha.log',
		''
	].join('\n'));
	await writeFile(join(iosProofDir, '01-repo-sha.log'), [
		'$ git rev-parse HEAD',
		`--- stdout ---\n${uploadRepoSha}`,
		''
	].join('\n'));
	await writeFile(join(iosProofDir, 'ios-testflight-attempt-2026-06-27T11-22-27-901Z.md'), [
		'# iOS TestFlight lane attempt',
		'',
		'Checked at: 2026-06-27T11:22:55.743Z',
		'Repo SHA: see repo-sha log',
		'Status: blocked',
		'',
		'## Mode',
		'',
		'- Upload: yes',
		'- Archive only: no',
		'- App Store Connect API key provided: no',
		'',
		'## Steps',
		'',
		'- pass repo-sha (exit 0): 11-repo-sha.log',
		'- fail upload-to-app-store-connect (exit 70): 11-upload-to-app-store-connect.log',
		''
	].join('\n'));
	await writeFile(join(iosProofDir, '11-repo-sha.log'), [
		'$ git rev-parse HEAD',
		`--- stdout ---\n${currentRepoSha}`,
		''
	].join('\n'));
	await writeFile(join(iosProofDir, 'ios-testflight-build-13-2026-06-27.md'), [
		'# Dad Pilot TestFlight target refresh',
		'',
		'Checked at: 2026-06-27T02:44:54.431Z',
		'Target build: `1.0 (13)`',
		'Build id: `build-13-id`',
		'Processing: `VALID`',
		'External state: `IN_BETA_TESTING`',
		'Dad Pilot: `Dad Pilot` (fc963396-a087-44c6-b56b-29847da31cd4)',
		'Public link: https://testflight.apple.com/join/BagBCrzf',
		'',
		'## Gates',
		'',
		'- [x] buildFound',
		'- [x] buildValid',
		'- [x] attachedToDadPilot',
		'- [x] externallyAvailable',
		'- [x] targetReadyForDad',
		''
	].join('\n'));
	await writeFile(join(iosProofDir, 'ios-testflight-build-9-2026-06-26.md'), [
		'# Dad Pilot TestFlight target refresh',
		'',
		'Checked at: 2026-06-26T18:19:17Z',
		'Target build: `1.0 (9)`',
		'Build id: `build-9-id`',
		'Processing: `VALID`',
		'External state: `IN_BETA_TESTING`',
		'Dad Pilot: `Dad Pilot` (fc963396-a087-44c6-b56b-29847da31cd4)',
		'Public link: https://testflight.apple.com/join/BagBCrzf',
		'',
		'## Gates',
		'',
		'- [x] buildFound',
		'- [x] buildValid',
		'- [x] attachedToDadPilot',
		'- [x] externallyAvailable',
		'- [x] targetReadyForDad',
		''
	].join('\n'));
	await writeFile(join(iosProofDir, 'ios-testflight-build-21-prep-2026-06-27.md'), [
		'# iOS TestFlight build 21 prep',
		'',
		'Checked at: 2026-06-27T08:49:20Z',
		'',
		'## Local candidate',
		'',
		'- Local iOS target: `1.0 (21)`',
		'',
		'This is local prep only, not App Store Connect Dad Pilot proof.',
		''
	].join('\n'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/scout-local-ai-dad-handoff.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--ios-proof-dir',
			iosProofDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(result.stdout, /# Dad Scout local AI Eval Lab handoff/u);
	assert.match(result.stdout, /Suite final-proof app requirement: `1\.0 \(>= 13\)`/u);
	assert.match(result.stdout, /Target iOS build for Dad Eval Lab: `1\.0 \(27\)`/u);
	assert.match(result.stdout, /Target build meets suite requirement: yes/u);
	assert.match(result.stdout, /Recorded Dad Pilot build: `1\.0 \(13\)`/u);
	assert.match(result.stdout, /Recorded Dad Pilot build meets suite requirement: yes/u);
	assert.match(result.stdout, /Latest Dad Pilot proof: .*ios-testflight-build-13-2026-06-27\.md` \(1\.0 \(13\), IN_BETA_TESTING/u);
	assert.match(result.stdout, /Latest Dad Pilot gates: 5\/5 checked; targetReadyForDad yes/u);
	assert.match(result.stdout, /Latest local target prep: .*ios-testflight-build-21-prep-2026-06-27\.md` \(1\.0 \(21\), checked 2026-06-27T08:49:20Z; not App Store Connect proof\)/u);
	assert.match(result.stdout, /Newer Xcode target pending App Store Connect: yes/u);
	assert.match(result.stdout, /Current checkout SHA: `[0-9a-f]{40}`/u);
	assert.match(result.stdout, /Latest native upload source: .*ios-testflight-attempt-2026-06-27T02-39-27-165Z\.md` \(repo SHA `[0-9a-f]{40}` from `.*01-repo-sha\.log`\)/u);
	assert.match(result.stdout, /Latest native upload attempt: .*ios-testflight-attempt-2026-06-27T11-22-27-901Z\.md` \(blocked, upload requested yes/u);
	assert.match(result.stdout, /## Phone build path/u);
	assert.match(result.stdout, /Use now: Dad can run the suite on the currently approved Dad Pilot build `1\.0 \(13\)`/u);
	assert.match(result.stdout, /Latest-code target: `1\.0 \(27\)` is the Xcode target\/local candidate/u);
	assert.match(result.stdout, /targetReadyForDad/u);
	assert.match(result.stdout, /## Main local test method/u);
	assert.match(result.stdout, /Main local iteration lane: iPhone Simulator Gemma on the Mac mini/u);
	assert.match(result.stdout, /eval:scout-local-ai:ios-sim-gemma -- --limit 100/u);
	assert.match(result.stdout, /Current simulator preflight: clean/u);
	assert.match(result.stdout, /Latest simulator Run 100: `simulator-handoff-clean-preflight` \(100\/100 cases, tools complete 100\/100, sources complete 100\/100, answer scan clean with 0 flagged\)/u);
	assert.match(result.stdout, /Final-proof mismatch by design: simulator-handoff-clean-preflight \(install=debug, expected testflight\)/u);
	assert.match(result.stdout, /does not replace final TestFlight\/iPhone proof/u);
	assert.match(result.stdout, /Dad can run the suite-compatible TestFlight build already in Dad Pilot/u);
	assert.match(result.stdout, /Imported full device runs: 1/u);
	assert.match(result.stdout, /Imported partial device runs: 0/u);
	assert.match(result.stdout, /Inbox candidate exports: 1/u);
	assert.match(result.stdout, /Latest inbox export: .*device-handoff-inbox-latest, 100 cases/u);
	assert.match(result.stdout, /https:\/\/testflight\.apple\.com\/join\/BagBCrzf/u);
	assert.match(result.stdout, /## Upload readiness/u);
	assert.match(result.stdout, /Xcode Release target: `1\.0 \(27\)`/u);
	assert.match(result.stdout, /Signing team\/profile: `3CFU9J87A5` \/ `Hoggcountry App Store Connect`/u);
	assert.match(result.stdout, /Latest successful native upload proof: .*ios-testflight-attempt-2026-06-27T02-39-27-165Z\.md` \(passed/u);
	assert.match(result.stdout, /Latest native upload attempt: .*ios-testflight-attempt-2026-06-27T11-22-27-901Z\.md` \(blocked/u);
	assert.match(result.stdout, /Latest successful native upload repo SHA: `[0-9a-f]{40}` from `.*01-repo-sha\.log`/u);
	if (uploadRepoShaIsAncestor && nativeAppSourceChangedSinceUpload) {
		assert.match(result.stdout, /Current checkout newer than latest native upload: yes/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: yes/u);
		assert.match(result.stdout, /Latest-source proof: current native app source is newer than the latest native upload; upload and refresh the local target build/u);
		assert.match(result.stdout, /Current source newer than latest native upload: yes/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: yes/u);
		assert.match(result.stdout, /Latest-source upload note: upload target build `1\.0 \(27\)`; bump again only if App Store Connect already has build `27`/u);
	} else if (uploadRepoShaIsAncestor) {
		assert.match(result.stdout, /Current checkout newer than latest native upload: yes/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: no/u);
		assert.match(result.stdout, /Latest-source proof: repo changed after the latest native upload, but no native app source changes are detected/u);
		assert.match(result.stdout, /Current source newer than latest native upload: yes/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: no/u);
		assert.doesNotMatch(result.stdout, /Latest-source upload note/u);
	} else {
		assert.match(result.stdout, /Current checkout newer than latest native upload: no/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: no/u);
		assert.match(result.stdout, /Latest-source proof: latest native upload contains the current checkout/u);
		assert.match(result.stdout, /Current source newer than latest native upload: no/u);
		assert.match(result.stdout, /Current native app source newer than latest native upload: no/u);
		assert.doesNotMatch(result.stdout, /Latest-source upload note/u);
	}
	assert.match(result.stdout, /App Store Connect API key in latest successful upload proof: yes/u);
	assert.match(result.stdout, /App Store Connect API key in latest upload attempt: no/u);
	assert.match(result.stdout, /APP_STORE_CONNECT_API_ISSUER_ID/u);
	assert.match(result.stdout, /npm run refresh:testflight-dad-pilot -- --build 27 --app-version 1\.0/u);
	assert.match(result.stdout, /--attach --submit-review --remove-previous --update-release-evidence/u);
	assert.match(result.stdout, /A likely Scout Eval Lab export is already/u);
	assert.match(result.stdout, /device-handoff-inbox-latest/u);
	assert.match(result.stdout, /use `Run 100` for real proof/u);
	assert.match(result.stdout, /## Valid export checklist/u);
	assert.match(result.stdout, /Suite fields: `suiteId=dad-local-ai-100`, `suiteVersion=2026-06-27\.2`, `suiteHash=fnv1a32:[0-9a-f]+`/u);
	assert.match(result.stdout, /Result count: `100\/100` completed results from `Run 100`, not `Run 3`/u);
	assert.match(result.stdout, /Evidence lane: `device-on-device-gemma` with `answerOrigin=device-on-device-gemma` answers/u);
	assert.match(result.stdout, /Native context: TestFlight iPhone install, app build satisfying `1\.0 \(>= 13\)`/u);
	assert.match(result.stdout, /Import status: `ready-for-final-intake` from the inspector, then `prepared-for-final-review`/u);
	assert.match(result.stdout, /Review triage: any provider error, missing required tool, or missing source evidence starts in the review-first queue/u);
	assert.match(result.stdout, /If any checklist item fails, do not rate it as final Dad proof/u);
	assert.match(result.stdout, /npm run prepare-review:scout-local-ai-device-run/u);
	assert.match(result.stdout, /npm run receive:scout-local-ai-device-run -- --clipboard/u);
	assert.match(result.stdout, /npm run receive:scout-local-ai-device-run -- --stdin/u);
	assert.match(result.stdout, /--run latest/u);
	assert.match(result.stdout, /--run inbox/u);
	assert.match(result.stdout, /npm run inspect:scout-local-ai-device-run/u);
	assert.match(result.stdout, /npm run intake:scout-local-ai-device-run/u);
	assert.match(result.stdout, /npm run apply-review:scout-local-ai/u);
	assert.match(result.stdout, /npm run finalize-review:scout-local-ai/u);
	assert.match(result.stdout, /npm run review-status:scout-local-ai.*--packet data\/scout-local-ai\/review-packets\/<run-id>\.review\.md/u);
	assert.match(result.stdout, /npm run verify:scout-local-ai-stability-proof/u);
	assert.match(result.stdout, /Final readiness still requires a full current-suite TestFlight\/iPhone/u);
});

test('Dad handoff command can print a concise Run 100 message for Dad', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-dad-message-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const inboxDir = join(outputDir, 'inbox');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	const iosProofDir = join(outputDir, 'proof');
	await mkdir(runsDir, { recursive: true });
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(inboxDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	await mkdir(iosProofDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-dad-message-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-dad-message-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (15), the public TestFlight link is enabled with limit 5, and App Store Connect reports external state IN_BETA_TESTING.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);
	await writeFile(join(iosProofDir, 'ios-testflight-build-15-2026-06-27.md'), [
		'# Dad Pilot TestFlight target refresh',
		'',
		'Checked at: 2026-06-27T09:22:00Z',
		'Target build: `1.0 (15)`',
		'Build id: `build-15-id`',
		'Processing: `VALID`',
		'External state: `IN_BETA_TESTING`',
		'Dad Pilot: `Dad Pilot` (fc963396-a087-44c6-b56b-29847da31cd4)',
		'Public link: https://testflight.apple.com/join/BagBCrzf',
		'',
		'## Gates',
		'',
		'- [x] buildFound',
		'- [x] buildValid',
		'- [x] attachedToDadPilot',
		'- [x] externallyAvailable',
		'- [x] targetReadyForDad',
		''
	].join('\n'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/scout-local-ai-dad-handoff.mjs',
			'--dad-message',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--inbox-dir',
			inboxDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--ios-proof-dir',
			iosProofDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(result.stdout, /Dad, can you help me run the Hoggcountry local AI test/u);
	assert.match(result.stdout, /Hoggcountry TestFlight build 1\.0 \(15\) can run this suite now/u);
	assert.match(result.stdout, /iPhone Simulator local-AI run as the main preflight/u);
	assert.match(result.stdout, /phone run is the final TestFlight proof/u);
	assert.match(result.stdout, /https:\/\/testflight\.apple\.com\/join\/BagBCrzf/u);
	assert.match(result.stdout, /Open TestFlight and update Hoggcountry/u);
	assert.match(result.stdout, /Settings > Scout Eval Lab/u);
	assert.match(result.stdout, /TestFlight ready/u);
	assert.match(result.stdout, /tap Run 100/u);
	assert.match(result.stdout, /Run 3 is only a quick smoke check; Run 100 is the real proof/u);
	assert.match(result.stdout, /tap Share and send the JSON file to Chris by Messages or AirDrop/u);
	assert.match(result.stdout, /If Share does not send a file, tap Copy and send the copied text/u);
	assert.match(result.stdout, /No need to understand the JSON/u);
	assert.match(result.stdout, /If it gets interrupted.*tap Resume/u);
	assert.doesNotMatch(result.stdout, /## Upload readiness/u);
	assert.doesNotMatch(result.stdout, /npm run ios:testflight/u);
	assert.doesNotMatch(result.stdout, /APP_STORE_CONNECT_API/u);
});

test('device run inspector classifies full and partial TestFlight exports before intake', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-inspect-'));
	const fullPath = join(outputDir, 'device-full-export.json');
	const partialPath = join(outputDir, 'device-partial-export.json');
	const fullRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-inspect-full',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	fullRun.exportHandoff = exportHandoffForRun(fullRun, suite);
	const partialRun = deviceRunForCases(suite, suite.cases.slice(0, 12), {
		runId: 'device-inspect-partial',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	partialRun.exportHandoff = exportHandoffForRun(partialRun, suite);
	await writeFile(fullPath, `${JSON.stringify(fullRun, null, 2)}\n`);
	await writeFile(partialPath, `${JSON.stringify(partialRun, null, 2)}\n`);

	const fullResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			fullPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const fullReport = JSON.parse(fullResult.stdout);
	assert.equal(fullReport.status, 'ready-for-final-intake');
	assert.equal(fullReport.readyForFinalIntake, true);
	assert.equal(fullReport.readyForPartialIntake, false);
	assert.match(fullReport.nextCommand, /npm run intake:scout-local-ai-device-run/u);
	assert.doesNotMatch(fullReport.nextCommand, /--allow-partial/u);
	assert.equal(fullReport.run.appBuild, '13');
	assert.equal(fullReport.run.installSource, 'testflight');
	assert.equal(fullReport.run.executionId, 'fixture-scout-eval-device-inspect-full');
	assert.equal(fullReport.handoff.kind, 'final-run-100');
	assert.equal(fullReport.handoff.expectedAcceptanceStatus, 'final-review-ready');
	assert.equal(fullReport.handoff.canStartFinalReview, true);
	assert.equal(fullReport.handoff.reviewInboxPath, 'data/scout-local-ai/inbox/');
	assert.match(fullReport.handoff.prepareReviewCommand, /prepare-review:scout-local-ai-device-run/u);
	assert.equal(fullReport.summary.sourceEvidenceComplete, 100);

	const fullTextResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			fullPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(fullTextResult.stdout, /Handoff: Final Run 100 JSON ready for inbox review \(final-review-ready\)/u);
	assert.match(fullTextResult.stdout, /Handoff command: npm run prepare-review:scout-local-ai-device-run -- --run inbox/u);

	const partialResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			partialPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const partialReport = JSON.parse(partialResult.stdout);
	assert.equal(partialReport.status, 'partial-diagnostic');
	assert.equal(partialReport.readyForFinalIntake, false);
	assert.equal(partialReport.readyForPartialIntake, true);
	assert.match(partialReport.nextCommand, /--allow-partial/u);
	assert.equal(partialReport.run.caseCount, 12);
	assert.equal(partialReport.run.executionId, 'fixture-scout-eval-device-inspect-partial');
	assert.equal(partialReport.handoff.kind, 'diagnostic');
	assert.equal(partialReport.handoff.expectedAcceptanceStatus, 'diagnostic-review-only');
	assert.match(partialReport.handoff.prepareReviewCommand, /--allow-partial/u);
	assert.match(partialReport.warnings.join('\n'), /missing 88 canonical case/u);
});

test('device run inspector rejects stale or wrong-context exports before review work', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-inspect-block-'));
	const stalePath = join(outputDir, 'device-stale-export.json');
	const wrongBuildPath = join(outputDir, 'device-wrong-build-export.json');
	const mixedOriginPath = join(outputDir, 'device-mixed-origin-export.json');
	const cloudModePath = join(outputDir, 'device-cloud-mode-export.json');
	const staleRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-inspect-stale',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteVersion: '2026-01-01.1',
		suiteHash: 'fnv1a32:oldhash'
	});
	const wrongBuildRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-inspect-wrong-build',
		completeTools: true,
		runContext: finalDeviceRunContext({
			app: {
				id: 'com.hoggcountry.trailassistant',
				name: 'Hoggcountry',
				version: '1.0',
				build: '12'
			}
		})
	});
	const mixedOriginRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-inspect-mixed-origin',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	mixedOriginRun.results[0].answerOrigin = 'scaffold-not-model';
	const cloudModeRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-inspect-cloud-mode',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	cloudModeRun.results[0].mode = 'online';
	cloudModeRun.results[0].provider = 'openai-api';
	await writeFile(stalePath, `${JSON.stringify(staleRun, null, 2)}\n`);
	await writeFile(wrongBuildPath, `${JSON.stringify(wrongBuildRun, null, 2)}\n`);
	await writeFile(mixedOriginPath, `${JSON.stringify(mixedOriginRun, null, 2)}\n`);
	await writeFile(cloudModePath, `${JSON.stringify(cloudModeRun, null, 2)}\n`);

	const staleResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			stalePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const staleReport = JSON.parse(staleResult.stdout);
	assert.equal(staleReport.status, 'stale-suite');
	assert.equal(staleReport.nextCommand, null);
	assert.match(staleReport.staleReasons.join('\n'), /run\.suiteVersion/u);
	assert.match(staleReport.staleReasons.join('\n'), /run\.suiteHash/u);

	const wrongBuildResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			wrongBuildPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const wrongBuildReport = JSON.parse(wrongBuildResult.stdout);
	assert.equal(wrongBuildReport.status, 'wrong-proof-context');
	assert.equal(wrongBuildReport.readyForFinalIntake, false);
	assert.equal(wrongBuildReport.nextCommand, null);
	assert.match(wrongBuildReport.contextProblems.join('\n'), /app\.build must be >= 13/u);

	const mixedOriginResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			mixedOriginPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const mixedOriginReport = JSON.parse(mixedOriginResult.stdout);
	assert.equal(mixedOriginReport.status, 'wrong-proof-context');
	assert.equal(mixedOriginReport.readyForFinalIntake, false);
	assert.equal(mixedOriginReport.nextCommand, null);
	assert.match(mixedOriginReport.contextProblems.join('\n'), /answerOrigin must match run\.evidenceLane device-on-device-gemma/u);

	const cloudModeResult = await execFileAsync(
		process.execPath,
		[
			'scripts/inspect-scout-local-ai-device-run.mjs',
			'--run',
			cloudModePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const cloudModeReport = JSON.parse(cloudModeResult.stdout);
	assert.equal(cloudModeReport.status, 'wrong-proof-context');
	assert.equal(cloudModeReport.readyForFinalIntake, false);
	assert.equal(cloudModeReport.nextCommand, null);
	assert.match(cloudModeReport.contextProblems.join('\n'), /mode must be on-device for device-on-device-gemma/u);
	assert.match(cloudModeReport.contextProblems.join('\n'), /provider must be on-device-gemma for device-on-device-gemma/u);
});

test('device review preparation command inspects, imports, and reports review status', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-'));
	const inputPath = join(outputDir, 'device-prepare-final-export.json');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-final',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.exportHandoff = exportHandoffForRun(run, suite);
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);
	const review = JSON.parse(await readFile(join(reviewsDir, 'device-prepare-final.review.json'), 'utf8'));
	const packet = await readFile(join(packetsDir, 'device-prepare-final.review.md'), 'utf8');

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.imported, true);
	assert.equal(report.partial, false);
	assert.equal(report.inspection.status, 'ready-for-final-intake');
	assert.equal(report.acceptance.status, 'final-review-ready');
	assert.equal(report.acceptance.finalReviewCanStart, true);
	assert.equal(report.acceptance.diagnosticOnly, false);
	assert.match(report.acceptance.summary, /Final human review can start/u);
	assert.match(report.acceptance.proofBoundary, /not final Dad readiness/u);
	assert.ok(report.acceptance.checklist.some((item) => item === 'inspection=ready-for-final-intake'));
	assert.ok(report.acceptance.checklist.some((item) => item === 'cases=100/100'));
	assert.ok(report.acceptance.checklist.some((item) => item === 'lane=device-on-device-gemma'));
	assert.ok(report.acceptance.checklist.some((item) => item === 'handoff=final-run-100/final-review-ready'));
	assert.ok(report.acceptance.checklist.some((item) => item === 'reviewCommand=npm run prepare-review:scout-local-ai-device-run -- --run inbox'));
	assert.equal(report.reviewStatus.progressSource, 'packet-draft');
	assert.equal(report.reviewStatus.packetDraft.applied, true);
	assert.equal(report.reviewStatus.packetDraft.updatedCases, suite.cases.length);
	assert.equal(report.reviewStatus.summary.total, suite.cases.length);
	assert.equal(report.reviewStatus.summary.unrated, suite.cases.length);
	assert.equal(report.reviewStatus.readyForBacklog, false);
	assert.ok(report.reviewStatus.reviewBatches.length >= 1);
	assert.equal(report.reviewStatus.triageSummary.focusCount, suite.cases.length);
	assert.equal(report.reviewStatus.triageSummary.unrated, suite.cases.length);
	assert.equal(report.reviewStatus.triageSummary.belowFive, 0);
	assert.equal(report.reviewStatus.triageSummary.ownerLayers['tool-routing'], suite.cases.length);
	assert.equal(report.reviewStatus.triageSummary.failureCategories['bad-routing'], suite.cases.length);
	assert.deepEqual(report.reviewStatus.triageSummary.missingTools, {});
	assert.equal(review.cases.length, suite.cases.length);
	assert.match(packet, /npm run review-status:scout-local-ai/u);
	assert.match(packet, /--packet .*device-prepare-final\.review\.md/u);
	assert.match(packet, /Human-reviewed batch helpers/u);
	assert.match(packet, /read every listed focused card first/u);
	assert.match(packet, /rate-case --cases/u);
	assert.ok(report.importOutput.some((line) => /Batch helpers:/u.test(line)));
	assert.match(report.nextAction, /review-status:scout-local-ai/u);
	assert.match(report.nextAction, /--packet .*device-prepare-final\.review\.md/u);
	assert.match(report.nextAction, /--next/u);
	assert.match(report.nextAction, /Human-reviewed batch helpers/u);
	assert.match(report.nextAction, /reading every listed focused card/u);
	assert.match(report.nextAction, /finalize-review:scout-local-ai/u);
	assert.match(report.nextAction, /device-prepare-final\.review\.md/u);
	assert.match(report.nextAction, /device-prepare-final\.review\.json/u);
	assert.match(report.nextAction, /device-prepare-final\.json/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--force'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	assert.match(textResult.stdout, /## Review Acceptance/u);
	assert.match(textResult.stdout, /Status: final-review-ready/u);
	assert.match(textResult.stdout, /Final human review can start: yes/u);
	assert.match(textResult.stdout, /Diagnostic only: no/u);
	assert.match(textResult.stdout, /inspection=ready-for-final-intake/u);
	assert.match(textResult.stdout, /cases=100\/100/u);
	assert.match(textResult.stdout, /handoff=final-run-100\/final-review-ready/u);
	assert.match(textResult.stdout, /reviewCommand=npm run prepare-review:scout-local-ai-device-run -- --run inbox/u);
	assert.match(textResult.stdout, /This is not final Dad readiness/u);
	assert.match(textResult.stdout, /Human-reviewed batch helpers/u);
});

test('device run receive command saves pasted JSON and prepares final review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-receive-final-'));
	const inboxDir = join(outputDir, 'inbox');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-receive-final',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.exportHandoff = exportHandoffForRun(run, suite);

	const result = await execFileWithInput(
		process.execPath,
		[
			'scripts/receive-scout-local-ai-device-run.mjs',
			'--stdin',
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		`${JSON.stringify(run)}\n`,
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);
	const inboxRun = JSON.parse(await readFile(join(inboxDir, 'device-receive-final.json'), 'utf8'));
	const review = JSON.parse(await readFile(join(reviewsDir, 'device-receive-final.review.json'), 'utf8'));
	const packet = await readFile(join(packetsDir, 'device-receive-final.review.md'), 'utf8');

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.mode, 'stdin');
	assert.equal(report.input.extractedJson, false);
	assert.match(report.inbox.path, /inbox\/device-receive-final\.json$/u);
	assert.equal(report.inbox.alreadyExisted, false);
	assert.equal(report.inspection.status, 'ready-for-final-intake');
	assert.equal(report.prepare.status, 'prepared-for-final-review');
	assert.match(report.nextAction, /review-status:scout-local-ai/u);
	assert.match(report.nextAction, /--next/u);
	assert.match(report.nextAction, /Human-reviewed batch helpers/u);
	assert.equal(inboxRun.runId, run.runId);
	assert.equal(review.cases.length, suite.cases.length);
	assert.match(packet, /Scout local AI device review: device-receive-final/u);
});

test('device run receive command extracts JSON from copied message text', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-receive-wrapped-'));
	const inboxDir = join(outputDir, 'inbox');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-receive-wrapped',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.exportHandoff = exportHandoffForRun(run, suite);
	const copiedMessage = [
		'Dad sent the Hoggcountry export:',
		'',
		'```json',
		JSON.stringify(run, null, 2),
		'```',
		'',
		'Sent from Messages.'
	].join('\n');

	const result = await execFileWithInput(
		process.execPath,
		[
			'scripts/receive-scout-local-ai-device-run.mjs',
			'--stdin',
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		copiedMessage,
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);
	const inboxRun = JSON.parse(await readFile(join(inboxDir, 'device-receive-wrapped.json'), 'utf8'));

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.extractedJson, true);
	assert.equal(report.inspection.status, 'ready-for-final-intake');
	assert.equal(report.prepare.status, 'prepared-for-final-review');
	assert.equal(inboxRun.runId, run.runId);
	assert.match(report.nextAction, /review-status:scout-local-ai/u);
});

test('device run receive command saves blocked exports without preparing review files', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-receive-blocked-'));
	const inboxDir = join(outputDir, 'inbox');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	const inputPath = join(outputDir, 'blocked-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-receive-blocked',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/receive-scout-local-ai-device-run.mjs',
			'--input',
			inputPath,
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 4 }
	);
	const report = JSON.parse(result.stdout);
	const inboxRun = JSON.parse(await readFile(join(inboxDir, 'device-receive-blocked.json'), 'utf8'));

	assert.equal(report.status, 'saved-blocked-before-review');
	assert.equal(report.input.mode, 'file');
	assert.equal(report.inspection.status, 'wrong-proof-context');
	assert.equal(report.prepare, null);
	assert.match(report.nextAction, /blocked export/u);
	assert.equal(inboxRun.runId, run.runId);
	await assert.rejects(readFile(join(reviewsDir, 'device-receive-blocked.review.json'), 'utf8'));
	await assert.rejects(readFile(join(packetsDir, 'device-receive-blocked.review.md'), 'utf8'));
	await assert.rejects(readFile(join(deviceRunsDir, 'device-receive-blocked.json'), 'utf8'));
});

test('device review preparation command can select the latest Scout export from Downloads', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-latest-'));
	const downloadsDir = join(outputDir, 'Downloads');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(downloadsDir, { recursive: true });

	const unrelatedPath = join(downloadsDir, 'random-settings.json');
	const olderPath = join(downloadsDir, 'scout-export-older.json');
	const latestPath = join(downloadsDir, 'scout-export-latest.json');
	const olderRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-older',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const latestRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-latest',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(unrelatedPath, '{"not":"a Scout export"}\n');
	await writeFile(olderPath, `${JSON.stringify(olderRun, null, 2)}\n`);
	await writeFile(latestPath, `${JSON.stringify(latestRun, null, 2)}\n`);
	await utimes(unrelatedPath, new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(olderPath, new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));
	await utimes(latestPath, new Date('2026-06-27T03:00:00Z'), new Date('2026-06-27T03:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			'latest',
			'--downloads-dir',
			downloadsDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.mode, 'latest-download');
	assert.equal(report.input.runId, 'device-prepare-latest');
	assert.equal(report.input.candidateCount, 2);
	assert.match(report.input.selected, /scout-export-latest\.json/u);
	assert.match(report.paths.answerQualityScan, /device-prepare-latest\.scan\.json/u);
	assert.equal(report.answerQualityScan.status, 'review-needed');
	assert.equal(report.answerQualityScan.caseCount, suite.cases.length);
	assert.equal(report.answerQualityScan.flaggedCount, suite.cases.length);
	assert.equal(report.answerQualityScan.byCheck['very-short-answer'], suite.cases.length);
	assert.equal(report.reviewStatus.summary.total, suite.cases.length);
	assert.equal(
		JSON.parse(await readFile(join(deviceRunsDir, 'device-prepare-latest.json'), 'utf8')).runId,
		'device-prepare-latest'
	);
	assert.equal(
		JSON.parse(await readFile(join(outputDir, 'answer-quality-scans', 'device-prepare-latest.scan.json'), 'utf8')).runId,
		'device-prepare-latest'
	);
	await assert.rejects(readFile(join(deviceRunsDir, 'device-prepare-older.json'), 'utf8'));
});

test('device review preparation command can select copied Scout export text from Downloads', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-text-'));
	const downloadsDir = join(outputDir, 'Downloads');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(downloadsDir, { recursive: true });

	const unrelatedPath = join(downloadsDir, 'random-settings.json');
	const copiedPath = join(downloadsDir, 'Dad copied Run 100.txt');
	const copiedRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-text',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	copiedRun.exportHandoff = exportHandoffForRun(copiedRun, suite);
	const copiedMessage = [
		'Dad copied this from the Scout Eval Lab share sheet:',
		'',
		'```json',
		JSON.stringify(copiedRun, null, 2),
		'```',
		'',
		'Sent from Messages.'
	].join('\n');
	await writeFile(unrelatedPath, '{"not":"a Scout export"}\n');
	await writeFile(copiedPath, copiedMessage);
	await utimes(unrelatedPath, new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(copiedPath, new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			'latest',
			'--downloads-dir',
			downloadsDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.mode, 'latest-download');
	assert.equal(report.input.runId, 'device-prepare-text');
	assert.equal(report.input.candidateCount, 1);
	assert.equal(report.input.selectedExtractedJson, true);
	assert.match(report.input.selected, /Dad copied Run 100\.txt/u);
	assert.equal(report.reviewStatus.summary.total, suite.cases.length);
	assert.equal(
		JSON.parse(await readFile(join(deviceRunsDir, 'device-prepare-text.json'), 'utf8')).runId,
		'device-prepare-text'
	);
	assert.equal(
		JSON.parse(await readFile(join(reviewsDir, 'device-prepare-text.review.json'), 'utf8')).runId,
		'device-prepare-text'
	);
	assert.match(await readFile(join(packetsDir, 'device-prepare-text.review.md'), 'utf8'), /Scout local AI device review: device-prepare-text/u);
});

test('device review preparation command can select the latest Scout export from the repo inbox', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-inbox-'));
	const inboxDir = join(outputDir, 'inbox');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(inboxDir, { recursive: true });

	const unrelatedPath = join(inboxDir, 'Dad notes.json');
	const olderPath = join(inboxDir, 'AirDrop Hoggcountry older.json');
	const latestPath = join(inboxDir, 'AirDrop Hoggcountry latest.json');
	const olderRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-inbox-older',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const latestRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-inbox-latest',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(unrelatedPath, '{"suiteId":"dad-local-ai-100","runId":"missing-results"}\n');
	await writeFile(olderPath, `${JSON.stringify(olderRun, null, 2)}\n`);
	await writeFile(latestPath, `${JSON.stringify(latestRun, null, 2)}\n`);
	await utimes(unrelatedPath, new Date('2026-06-27T01:00:00Z'), new Date('2026-06-27T01:00:00Z'));
	await utimes(olderPath, new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));
	await utimes(latestPath, new Date('2026-06-27T03:00:00Z'), new Date('2026-06-27T03:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			'inbox',
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.mode, 'latest-inbox');
	assert.equal(report.input.runId, 'device-prepare-inbox-latest');
	assert.equal(report.input.candidateCount, 2);
	assert.match(report.input.selected, /AirDrop Hoggcountry latest\.json/u);
	assert.equal(report.reviewStatus.summary.total, suite.cases.length);
	assert.equal(
		JSON.parse(await readFile(join(deviceRunsDir, 'device-prepare-inbox-latest.json'), 'utf8')).runId,
		'device-prepare-inbox-latest'
	);
	await assert.rejects(readFile(join(deviceRunsDir, 'device-prepare-inbox-older.json'), 'utf8'));
});

test('device review preparation command prefers a final-ready inbox export over a newer blocked export', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-mixed-inbox-'));
	const inboxDir = join(outputDir, 'inbox');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(inboxDir, { recursive: true });

	const readyPath = join(inboxDir, 'AirDrop Hoggcountry ready older.json');
	const stalePath = join(inboxDir, 'AirDrop Hoggcountry stale newer.json');
	const readyRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-inbox-ready-older',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const staleRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-inbox-stale-newer',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteVersion: '2026-01-01.1',
		suiteHash: 'fnv1a32:oldhash'
	});
	await writeFile(readyPath, `${JSON.stringify(readyRun, null, 2)}\n`);
	await writeFile(stalePath, `${JSON.stringify(staleRun, null, 2)}\n`);
	await utimes(readyPath, new Date('2026-06-27T02:00:00Z'), new Date('2026-06-27T02:00:00Z'));
	await utimes(stalePath, new Date('2026-06-27T03:00:00Z'), new Date('2026-06-27T03:00:00Z'));

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			'inbox',
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-for-final-review');
	assert.equal(report.input.mode, 'latest-inbox');
	assert.equal(report.input.runId, 'device-prepare-inbox-ready-older');
	assert.equal(report.input.candidateCount, 2);
	assert.equal(report.input.finalReadyCount, 1);
	assert.equal(report.input.blockedCandidateCount, 1);
	assert.equal(report.input.selectedInspectionStatus, 'ready-for-final-intake');
	assert.equal(report.input.selectedIsLatest, false);
	assert.match(report.input.selected, /AirDrop Hoggcountry ready older\.json/u);
	assert.match(report.input.latest.path, /AirDrop Hoggcountry stale newer\.json/u);
	assert.equal(report.input.latest.runId, 'device-prepare-inbox-stale-newer');
	assert.equal(report.input.latest.inspectionStatus, 'stale-suite');
	assert.equal(
		JSON.parse(await readFile(join(deviceRunsDir, 'device-prepare-inbox-ready-older.json'), 'utf8')).runId,
		'device-prepare-inbox-ready-older'
	);
	await assert.rejects(readFile(join(deviceRunsDir, 'device-prepare-inbox-stale-newer.json'), 'utf8'));
});

test('device run wait command prepares review when a final Run 100 export lands in the inbox', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-wait-inbox-'));
	const inboxDir = join(outputDir, 'inbox');
	const downloadsDir = join(outputDir, 'Downloads');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(inboxDir, { recursive: true });
	await mkdir(downloadsDir, { recursive: true });
	const inboxPath = join(inboxDir, 'Dad shared final Run 100.json');
	const finalRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-wait-inbox-final',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});

	const waitResult = execFileAsync(
		process.execPath,
		[
			'scripts/wait-scout-local-ai-device-run.mjs',
			'--source',
			'inbox',
			'--poll-ms',
			'50',
			'--timeout-ms',
			'2500',
			'--downloads-dir',
			downloadsDir,
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);

	await delay(150);
	await writeFile(inboxPath, `${JSON.stringify(finalRun, null, 2)}\n`);
	const result = await waitResult;
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-from-watch');
	assert.equal(report.source, 'inbox');
	assert.equal(report.prepare.status, 'prepared-for-final-review');
	assert.equal(report.prepare.input.mode, 'latest-inbox');
	assert.equal(report.prepare.input.runId, 'device-wait-inbox-final');
	assert.equal(report.prepare.acceptance.status, 'final-review-ready');
	assert.equal(report.prepare.acceptance.finalReviewCanStart, true);
	assert.match(report.prepare.paths.importedRun, /device-wait-inbox-final\.json/u);
	assert.match(report.prepare.paths.review, /device-wait-inbox-final\.review\.json/u);
	assert.match(report.prepare.paths.packet, /device-wait-inbox-final\.review\.md/u);
	assert.equal(
		JSON.parse(await readFile(join(deviceRunsDir, 'device-wait-inbox-final.json'), 'utf8')).runId,
		'device-wait-inbox-final'
	);
	assert.match(await readFile(join(packetsDir, 'device-wait-inbox-final.review.md'), 'utf8'), /DLA-001/u);
});

test('device run wait command prepares review from Downloads by default', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-wait-downloads-'));
	const inboxDir = join(outputDir, 'inbox');
	const downloadsDir = join(outputDir, 'Downloads');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	await mkdir(inboxDir, { recursive: true });
	await mkdir(downloadsDir, { recursive: true });
	const downloadsPath = join(downloadsDir, 'Dad shared final Run 100.json');
	const finalRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-wait-downloads-final',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});

	const waitResult = execFileAsync(
		process.execPath,
		[
			'scripts/wait-scout-local-ai-device-run.mjs',
			'--poll-ms',
			'50',
			'--timeout-ms',
			'2500',
			'--downloads-dir',
			downloadsDir,
			'--inbox-dir',
			inboxDir,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);

	await delay(150);
	await writeFile(downloadsPath, `${JSON.stringify(finalRun, null, 2)}\n`);
	const result = await waitResult;
	const report = JSON.parse(result.stdout);

	assert.equal(report.status, 'prepared-from-watch');
	assert.equal(report.source, 'downloads');
	assert.equal(report.prepare.status, 'prepared-for-final-review');
	assert.equal(report.prepare.input.mode, 'latest-download');
	assert.equal(report.prepare.input.runId, 'device-wait-downloads-final');
	assert.equal(report.prepare.acceptance.status, 'final-review-ready');
	assert.match(report.prepare.paths.importedRun, /device-wait-downloads-final\.json/u);
	assert.match(await readFile(join(packetsDir, 'device-wait-downloads-final.review.md'), 'utf8'), /DLA-001/u);
});

test('device run wait timeout reports every watched handoff source', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-wait-timeout-'));
	const inboxDir = join(outputDir, 'inbox');
	const downloadsDir = join(outputDir, 'Downloads');
	await mkdir(inboxDir, { recursive: true });
	await mkdir(downloadsDir, { recursive: true });

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/wait-scout-local-ai-device-run.mjs',
				'--source',
				'both',
				'--poll-ms',
				'25',
				'--timeout-ms',
				'100',
				'--downloads-dir',
				downloadsDir,
				'--inbox-dir',
				inboxDir,
				'--json'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
		),
		(err) => {
			const report = JSON.parse(err.stdout);
			assert.equal(report.status, 'timed-out');
			assert.deepEqual(report.sources, ['inbox', 'downloads']);
			assert.ok(report.sourceReports.inbox);
			assert.ok(report.sourceReports.downloads);
			assert.match(report.sourceReports.inbox.error, /No likely Scout Eval Lab JSON\/text exports found/u);
			assert.doesNotMatch(report.sourceReports.inbox.error, /Node\.js|at async|file:\/\//u);
			assert.match(report.sourceReports.downloads.error, /No likely Scout Eval Lab JSON\/text exports found/u);
			assert.doesNotMatch(report.sourceReports.downloads.error, /Node\.js|at async|file:\/\//u);
			assert.match(report.nextAction, /--run inbox/u);
			assert.match(report.nextAction, /--run latest/u);
			return true;
		}
	);
});

test('device review preparation command refuses stale and implicit partial exports', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-device-prepare-block-'));
	const stalePath = join(outputDir, 'device-prepare-stale-export.json');
	const partialPath = join(outputDir, 'device-prepare-partial-export.json');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const packetsDir = join(outputDir, 'review-packets');
	const staleRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-prepare-stale',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteVersion: '2026-01-01.1',
		suiteHash: 'fnv1a32:oldhash'
	});
	const partialRun = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-prepare-partial',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(stalePath, `${JSON.stringify(staleRun, null, 2)}\n`);
	await writeFile(partialPath, `${JSON.stringify(partialRun, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/prepare-scout-local-ai-device-review.mjs',
				'--run',
				stalePath,
				'--device-run-dir',
				deviceRunsDir,
				'--review-dir',
				reviewsDir,
				'--packet-dir',
				packetsDir,
				'--json'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
		),
		(error) => {
			const report = JSON.parse(error.stdout);
			assert.equal(report.status, 'inspection-blocked');
			assert.equal(report.imported, false);
			assert.equal(report.acceptance.status, 'blocked-before-review');
			assert.equal(report.acceptance.finalReviewCanStart, false);
			assert.equal(report.acceptance.diagnosticOnly, false);
			assert.match(report.inspection.staleReasons.join('\n'), /run\.suiteVersion/u);
			return true;
		}
	);
	await assert.rejects(readFile(join(deviceRunsDir, 'device-prepare-stale.json'), 'utf8'));

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/prepare-scout-local-ai-device-review.mjs',
				'--run',
				partialPath,
				'--device-run-dir',
				deviceRunsDir,
				'--review-dir',
				reviewsDir,
				'--packet-dir',
				packetsDir,
				'--json'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
		),
		(error) => {
			const report = JSON.parse(error.stdout);
			assert.equal(report.status, 'partial-needs-explicit-allow-partial');
			assert.equal(report.imported, false);
			assert.equal(report.acceptance.status, 'blocked-before-review');
			assert.equal(report.acceptance.finalReviewCanStart, false);
			assert.match(report.nextAction, /--allow-partial/u);
			return true;
		}
	);
	await assert.rejects(readFile(join(deviceRunsDir, 'device-prepare-partial.json'), 'utf8'));

	const partialResult = await execFileAsync(
		process.execPath,
		[
			'scripts/prepare-scout-local-ai-device-review.mjs',
			'--run',
			partialPath,
			'--device-run-dir',
			deviceRunsDir,
			'--review-dir',
			reviewsDir,
			'--packet-dir',
			packetsDir,
			'--allow-partial',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const partialReport = JSON.parse(partialResult.stdout);
	assert.equal(partialReport.status, 'prepared-for-partial-diagnostic-review');
	assert.equal(partialReport.imported, true);
	assert.equal(partialReport.partial, true);
	assert.equal(partialReport.acceptance.status, 'diagnostic-review-only');
	assert.equal(partialReport.acceptance.finalReviewCanStart, false);
	assert.equal(partialReport.acceptance.diagnosticOnly, true);
	assert.match(partialReport.acceptance.proofBoundary, /Finish or rerun Run 100/u);
	assert.equal(partialReport.reviewStatus.summary.total, 3);
	assert.equal(partialReport.reviewStatus.readyForStrictDeviceProof, false);
});

test('Dad Pilot refresh command can attach the target build and update release evidence from verified App Store Connect state', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-dad-pilot-refresh-'));
	const fixturePath = join(outputDir, 'app-store-connect-fixture.json');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	const proofPath = join(outputDir, 'ios-testflight-build-13.proof.md');
	await writeFile(fixturePath, `${JSON.stringify(dadPilotFixture(), null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (12).',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/refresh-testflight-dad-pilot.mjs',
			'--fixture',
			fixturePath,
			'--release-evidence',
			releaseEvidencePath,
			'--proof-out',
			proofPath,
			'--build',
			'13',
			'--app-version',
			'1.0',
			'--attach',
			'--remove-previous',
			'--update-release-evidence',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const summary = JSON.parse(result.stdout);
	const releaseEvidence = JSON.parse(await readFile(releaseEvidencePath, 'utf8'));
	const proof = await readFile(proofPath, 'utf8');

	assert.equal(summary.targetBuild, '1.0 (13)');
	assert.equal(summary.target.id, 'build-13-id');
	assert.equal(summary.gates.buildValid, true);
	assert.equal(summary.gates.attachedToDadPilot, true);
	assert.equal(summary.gates.externallyAvailable, true);
	assert.equal(summary.gates.targetReadyForDad, true);
	assert.equal(summary.actions.attached, true);
	assert.deepEqual(summary.actions.removedBuildIds, ['build-12-id']);
	assert.equal(summary.dadPilot.attachedBuilds.length, 1);
	assert.equal(summary.dadPilot.attachedBuilds[0].id, 'build-13-id');
	assert.match(proof, /Target build: `1\.0 \(13\)`/u);
	assert.match(proof, /This refresh only covers App Store Connect \/ Dad Pilot build availability/u);
	assert.match(releaseEvidence.items['dad-testflight-invite'].summary, /build 1\.0 \(13\)/u);
	assert.equal(releaseEvidence.items['dad-testflight-invite'].publicLink, 'https://testflight.apple.com/join/BagBCrzf');
	assert.match(releaseEvidence.items['apple-archive-upload'].summary, /external state IN_BETA_TESTING/u);
});

test('Dad Pilot refresh command can submit a valid target build for beta review before updating release evidence', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-dad-pilot-submit-'));
	const fixturePath = join(outputDir, 'app-store-connect-fixture.json');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	const proofPath = join(outputDir, 'ios-testflight-build-13-submit.proof.md');
	await writeFile(fixturePath, `${JSON.stringify(dadPilotReadyForBetaSubmissionFixture(), null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({ schemaVersion: 1, items: {} }, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/refresh-testflight-dad-pilot.mjs',
			'--fixture',
			fixturePath,
			'--release-evidence',
			releaseEvidencePath,
			'--proof-out',
			proofPath,
			'--build',
			'13',
			'--app-version',
			'1.0',
			'--attach',
			'--submit-review',
			'--review-poll-attempts',
			'1',
			'--review-poll-interval-ms',
			'0',
			'--remove-previous',
			'--update-release-evidence',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const summary = JSON.parse(result.stdout);
	const releaseEvidence = JSON.parse(await readFile(releaseEvidencePath, 'utf8'));
	const proof = await readFile(proofPath, 'utf8');

	assert.equal(summary.targetBuild, '1.0 (13)');
	assert.equal(summary.target.externalState, 'IN_BETA_TESTING');
	assert.equal(summary.target.betaReviewState, 'APPROVED');
	assert.equal(summary.gates.targetReadyForDad, true);
	assert.equal(summary.actions.attached, true);
	assert.equal(summary.actions.submittedBetaReview, true);
	assert.equal(summary.actions.reviewPolls, 1);
	assert.deepEqual(summary.actions.removedBuildIds, ['build-12-id']);
	assert.match(proof, /Submitted target build for beta review this run: yes/u);
	assert.match(releaseEvidence.items['apple-archive-upload'].commands.join('\n'), /--submit-review/u);
	assert.match(releaseEvidence.items['dad-testflight-invite'].summary, /build 1\.0 \(13\)/u);
});

test('Dad local AI eval suite routes every case through expected Scout tools', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-routing-'));
	await execFileAsync(
		process.execPath,
		[
			'--experimental-strip-types',
			'--experimental-transform-types',
			'scripts/run-scout-local-ai-eval.mjs',
			'--run-id',
			'routing-regression',
			'--output-dir',
			outputDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 4 }
	);

	const run = JSON.parse(await readFile(join(outputDir, 'routing-regression.json'), 'utf8'));
	assert.equal(run.caseCount, 100);
	assert.equal(run.evidenceLane, 'scaffold-not-model');
	assert.equal(run.suiteVersion, suite.version);
	assert.equal(run.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(run.summary.toolExpectationComplete, 100);
	assert.deepEqual(run.summary.missingToolCounts, {});
	assert.equal(run.summary.sourceEvidenceComplete, 100);
	assert.equal(run.summary.missingSourceEvidenceCases, 0);
});

test('device run intake validates exports and creates review packet', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), { completeTools: true });
	run.results[0].requiredConfirmations = [
		{
			id: 'confirm-live-weather',
			prompt: 'Confirm the current forecast before committing to exposed terrain.',
			reason: 'safety-critical'
		}
	];
	run.results[0].safetyFlags = [
		{
			id: 'lightning-risk',
			severity: 'critical',
			message: 'Lightning risk needs an exit or wait plan.'
		}
	];
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const importResult = await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const imported = JSON.parse(await readFile(join(outputDir, 'device-runs', `${run.runId}.json`), 'utf8'));
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', `${run.runId}.review.json`), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', `${run.runId}.review.md`), 'utf8');
	const scan = JSON.parse(await readFile(join(outputDir, 'answer-quality-scans', `${run.runId}.scan.json`), 'utf8'));

	assert.match(importResult.stdout, /Answer-quality scan:/u);
	assert.match(importResult.stdout, /Answer-quality flags: 2 flagged, 2 errors, 2 warnings/u);
	assert.equal(imported.evidenceLane, 'device-on-device-gemma');
	assert.equal(imported.suiteVersion, suite.version);
	assert.equal(imported.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(scan.runId, run.runId);
	assert.equal(scan.caseCount, 2);
	assert.equal(scan.flaggedCount, 2);
	assert.equal(scan.errorCount, 2);
	assert.equal(scan.warningCount, 2);
	assert.equal(scan.byCheck['unfinished-tail'], 2);
	assert.equal(scan.byCheck['very-short-answer'], 2);
	assert.equal(review.cases.length, 2);
	assert.equal(review.suiteVersion, suite.version);
	assert.equal(review.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(review.cases[0].caseId, suite.cases[0].id);
	assert.equal(review.cases[0].confidence, 'medium');
	assert.equal(review.cases[0].toolInvocationCount, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].toolInvocations.length, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].receipts.length, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].answer, `device answer for ${suite.cases[0].id}`);
	assert.equal(review.cases[0].answerLength, `device answer for ${suite.cases[0].id}`.length);
	assert.equal(review.cases[0].traitChecks.length, suite.cases[0].expectedTraits.length);
	assert.equal(review.cases[0].traitChecks[0].passed, null);
	assert.equal(review.cases[0].safetyCaveatChecks.length, suite.cases[0].safetyCaveats.length);
	assert.equal(review.cases[0].requiredConfirmationChecks.length, 1);
	assert.equal(review.cases[0].requiredConfirmationChecks[0].acknowledged, null);
	assert.equal(review.cases[0].safetyFlagChecks.length, 1);
	assert.equal(review.cases[0].safetyFlagChecks[0].acknowledged, null);
	assert.match(review.cases[0].answerPreview, /device answer for/);
	assert.match(packet, /Scout local AI device review/u);
	assert.match(packet, new RegExp(suite.cases[0].id, 'u'));
	assert.match(packet, /Confidence: `medium`/u);
	assert.match(packet, /Trait checklist to fill in review JSON:/u);
	assert.match(packet, /Safety caveat checklist to fill in review JSON:/u);
	assert.match(packet, /Required confirmation acknowledgement checklist to fill in review JSON:/u);
	assert.match(packet, /Safety flag acknowledgement checklist to fill in review JSON:/u);
	assert.match(packet, /acknowledged: null/u);
	assert.match(packet, /confirm-live-weather/u);
	assert.match(packet, /lightning-risk/u);
	assert.match(packet, /Tool invocations:/u);
	assert.match(packet, /Source evidence gaps:/u);
	assert.match(packet, /Source receipts:/u);
	assert.match(packet, /Failure mode: `none`/u);
	assert.match(packet, /Answer-quality scan: `/u);
	assert.match(packet, /## Answer-quality scan/u);
	assert.match(packet, /Flagged cases: 2/u);
	assert.match(packet, /very-short-answer:warning/u);
	assert.match(packet, /## Review-first triage/u);
	assert.match(packet, /Review-first cases: 0\/2/u);
	assert.match(packet, /Signals: none/u);
	assert.match(packet, /No hard evidence issues were recorded before human rating/u);
	assert.match(packet, /## Review queue summary/u);
	assert.match(packet, /Likely owner/u);
	assert.match(packet, /\| DLA-\d{3} \| [^|]+ \| [^|]+ \| standard \| tool-routing \| bad-routing, weak-tool \| none \|/u);
	assert.match(packet, /## Rating scale/u);
	assert.match(packet, /## Reviewer field choices/u);
	assert.match(packet, /Do not use the improvement task to weaken the eval rubric/u);
	assert.match(packet, /Valid failure categories: .*missing-data.*local-model-limitation/u);
	assert.match(packet, /Valid owner layers: data, tool-routing, prompt, safety-prompt, ui, local-model/u);
	assert.match(packet, /Suggested failure categories: `bad-routing, weak-tool`/u);
	assert.match(packet, /Suggested owner layer: `tool-routing`/u);
	assert.match(packet, /npm run apply-review:scout-local-ai/u);
	assert.match(packet, /Rating:/u);
});

test('device run intake rejects full exports with summary-only tool evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-summary-only-'));
	const inputPath = join(outputDir, 'summary-only-device-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-summary-only',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].toolInvocations = [];
	run.results[0].receipts = [];
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--device-run-dir',
				join(outputDir, 'device-runs'),
				'--review-dir',
				join(outputDir, 'reviews'),
				'--packet-dir',
				join(outputDir, 'review-packets')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Device run import failed validation/u);
			assert.match(error.stderr, /toolExpectations\.hit does not match actual toolInvocations/u);
			assert.match(error.stderr, /toolExpectations\.missing does not match actual toolInvocations; actual missing:/u);
			return true;
		}
	);
});

test('device run intake imports truthful missing-tool runs for review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-missing-tools-'));
	const inputPath = join(outputDir, 'missing-tools-device-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-missing-tools',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].toolInvocations = [];
	run.results[0].receipts = [];
	run.results[0].toolExpectations = {
		required: run.results[0].case.requiredTools,
		hit: [],
		missing: run.results[0].case.requiredTools
	};
	run.summary.toolExpectationComplete -= 1;
	run.summary.missingToolCases += 1;
	for (const missing of run.results[0].toolExpectations.missing) {
		run.summary.missingToolCounts[missing] = (run.summary.missingToolCounts[missing] ?? 0) + 1;
	}
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', 'device-intake-missing-tools.review.json'), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', 'device-intake-missing-tools.review.md'), 'utf8');

	assert.match(result.stdout, /Device run imported/u);
	assert.match(result.stdout, /Required-tool complete: 99\/100/u);
	assert.match(result.stdout, /Warnings:/u);
	assert.match(result.stdout, /actual toolInvocations missed required tools/u);
	assert.equal(review.cases.length, 100);
	assert.deepEqual(review.cases[0].toolExpectations.missing, run.results[0].case.requiredTools);
	assert.match(packet, /Import warnings/u);
	assert.match(packet, /actual toolInvocations missed required tools/u);
	assert.match(packet, /## Review-first triage/u);
	assert.match(packet, /Review-first cases: 1\/100/u);
	assert.match(packet, /Signals: review-first: missing required tools=1/u);
	assert.match(packet, /Likely owner layers: tool-routing=1/u);
	assert.match(packet, /Suggested failure categories: bad-routing=1, weak-tool=1/u);
	assert.match(packet, /Missing tools: [^\n]+/u);
	assert.match(packet, /Top review-first cases:/u);
	assert.match(packet, /Missing: /u);
});

test('device run intake imports truthful missing source receipts for review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-source-missing-'));
	const inputPath = join(outputDir, 'source-missing-device-export.json');
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-source-missing',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const result = run.results.find((entry) => entry.caseId === sourceCase.id);
	assert.ok(result, 'fixture run should include the source-backed case');
	for (const invocation of result.toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	result.receipts = result.toolInvocations.flatMap((record) => record.receipts ?? []);
	result.suggestedFailureCategories = [];
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const importResult = await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', 'device-intake-source-missing.review.json'), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', 'device-intake-source-missing.review.md'), 'utf8');

	assert.match(importResult.stdout, /Device run imported/u);
	assert.match(importResult.stdout, /Warnings:/u);
	assert.match(importResult.stdout, /source-backed required tool/u);
	assert.match(importResult.stdout, /must record at least one receipt or sourceDocumentId/u);
	assert.equal(review.cases.length, 100);
	const reviewCase = review.cases.find((entry) => entry.caseId === sourceCase.id);
	assert.deepEqual(reviewCase.failureCategories, ['weak-tool']);
	assert.match(packet, /Import warnings/u);
	assert.match(packet, new RegExp(`## ${sourceCase.id} - `, 'u'));
	assert.match(packet, /Suggested failure categories: `weak-tool`/u);
	assert.match(packet, /Suggested owner layer: `tool-routing`/u);
	assert.match(packet, /## Review-first triage/u);
	assert.match(packet, /Review-first cases: 1\/100/u);
	assert.match(packet, /Signals: review-first: source evidence gap=1/u);
	assert.match(packet, /Likely owner layers: tool-routing=1/u);
	assert.match(packet, /Suggested failure categories: weak-tool=1/u);
	assert.match(packet, /Source-evidence gaps: [^\n]+:/u);
	assert.match(packet, /Top review-first cases:/u);
	assert.match(packet, /review-first: source evidence gap/u);
	assert.match(packet, /source evidence: .*:/u);
	assert.match(packet, /Source evidence gaps:/u);
	assert.match(packet, /must record at least one receipt or sourceDocumentId/u);
});

test('review packet ratings can be applied back into review JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-apply-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-apply',
		completeTools: true
	});
	run.results[0].requiredConfirmations = [
		{
			id: 'confirm-seasonal-water',
			prompt: 'Confirm current flow before counting on the seasonal water source.',
			reason: 'volatile'
		}
	];
	run.results[0].safetyFlags = [
		{
			id: 'water-seasonal-confirm-flow',
			severity: 'warn',
			message: 'Seasonal water should not be treated as guaranteed.'
		}
	];
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-apply.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-apply.review.json');
	const backlogDir = join(outputDir, 'backlog');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = packet.replaceAll('- acknowledged: null |', '- acknowledged: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '5',
		notes: 'Dad-ready answer.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '3',
		notes: 'Needs a safer exit-first answer.',
		failureCategories: 'unsafe-wording, poor-ux',
		ownerLayer: 'safety-prompt',
		improvementTask: 'Lead with the lower-risk bailout and remove casual mileage pressure.'
	});
	await writeFile(packetPath, packet);

	const applyResult = await execFileAsync(
		process.execPath,
		[
			'scripts/apply-scout-local-ai-review-packet.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(applyResult.stdout, /Scout local AI review JSON updated from packet/u);
	assert.match(applyResult.stdout, /Updated cases: 2/u);
	assert.equal(review.cases[0].rating, 5);
	assert.equal(review.cases[0].traitChecks.every((check) => check.passed === true), true);
	assert.equal(review.cases[0].safetyCaveatChecks.every((check) => check.passed === true), true);
	assert.equal(review.cases[0].requiredConfirmationChecks.every((check) => check.acknowledged === true), true);
	assert.equal(review.cases[0].safetyFlagChecks.every((check) => check.acknowledged === true), true);
	assert.equal(review.cases[1].rating, 3);
	assert.deepEqual(review.cases[1].failureCategories, ['unsafe-wording', 'poor-ux']);
	assert.equal(review.cases[1].ownerLayer, 'safety-prompt');
	assert.match(review.cases[1].improvementTask, /lower-risk bailout/u);

	const reviewResult = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			join(outputDir, 'device-runs', 'device-packet-apply.json'),
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-packet-apply.backlog.json'), 'utf8'));

	assert.match(reviewResult.stdout, /Iteration backlog written/u);
	assert.equal(backlog.items.length, 1);
	assert.equal(backlog.items[0].caseId, run.results[1].caseId);
	assert.equal(backlog.items[0].ownerLayer, 'safety-prompt');
});

test('single-case rating command updates packet without touching review JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-rate-case-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-rate-case',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-rate-case.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-rate-case.review.json');
	const firstCaseId = run.results[0].caseId;
	const secondCaseId = run.results[1].caseId;

	const updateResult = await execFileAsync(
		process.execPath,
		[
			'scripts/rate-scout-local-ai-review-case.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath,
			'--case',
			firstCaseId,
			'--rating',
			'5',
			'--notes',
			'Dad-ready answer.',
			'--mark-all-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const packet = await readFile(packetPath, 'utf8');
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(updateResult.stdout, /Scout local AI review packet case updated/u);
	assert.match(updateResult.stdout, new RegExp(`Case: ${firstCaseId}`, 'u'));
	assert.match(updateResult.stdout, /Rating: 5/u);
	assert.match(updateResult.stdout, /Selected focused check:/u);
	assert.match(updateResult.stdout, new RegExp(`--case ${firstCaseId}`, 'u'));
	assert.match(updateResult.stdout, /Next focused check:/u);
	assert.match(updateResult.stdout, /--next/u);
	assert.match(packet, new RegExp(`## ${firstCaseId} - [\\s\\S]*?- Rating: 5[\\s\\S]*?- Notes: Dad-ready answer\\.`, 'u'));
	assert.match(packet, new RegExp(`## ${firstCaseId} - [\\s\\S]*?- passed: true \\| text:`, 'u'));
	assert.match(packet, new RegExp(`## ${secondCaseId} - [\\s\\S]*?- Rating:\\s*(?:\\n|$)`, 'u'));
	assert.deepEqual(review.cases.map((entry) => entry.rating), [null, null]);

	const statusResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			join(outputDir, 'device-runs', 'device-rate-case.json'),
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--case',
			firstCaseId,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(statusResult.stdout);

	assert.equal(progress.selectedCase.caseId, firstCaseId);
	assert.equal(progress.selectedCase.rating, 5);
	assert.equal(progress.selectedCase.notes, 'Dad-ready answer.');
	assert.equal(progress.selectedCase.traitChecks.every((check) => check.passed === true), true);
	assert.equal(progress.selectedCase.safetyCaveatChecks.every((check) => check.passed === true), true);

	const nextStatusResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			join(outputDir, 'device-runs', 'device-rate-case.json'),
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--next',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const nextProgress = JSON.parse(nextStatusResult.stdout);

	assert.equal(nextProgress.nextFocusCase.caseId, secondCaseId);
	assert.equal(nextProgress.selectedCase.caseId, secondCaseId);
	assert.equal(nextProgress.selectedCaseSource, 'next-focus-case');

	const packetBeforeInvalidUpdate = await readFile(packetPath, 'utf8');
	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/rate-scout-local-ai-review-case.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath,
				'--case',
				secondCaseId,
				'--rating',
				'4',
				'--notes',
				'Needs fresher water evidence.',
				'--failure-categories',
				'missing-data',
				'--owner-layer',
				'data'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /was not updated/u);
			assert.match(error.stderr, /ratings below 5 need an improvementTask/u);
			return true;
		}
	);
	assert.equal(await readFile(packetPath, 'utf8'), packetBeforeInvalidUpdate);

	const batchResult = await execFileAsync(
		process.execPath,
		[
			'scripts/rate-scout-local-ai-review-case.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath,
			'--cases',
			`${firstCaseId},${secondCaseId}`,
			'--rating',
			'5',
			'--notes',
			'Batch Dad-ready answers.',
			'--mark-all-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const batchPacket = await readFile(packetPath, 'utf8');
	const reviewAfterBatch = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(batchResult.stdout, /Scout local AI review packet cases updated/u);
	assert.match(batchResult.stdout, new RegExp(`Cases: ${firstCaseId}, ${secondCaseId}`, 'u'));
	assert.match(batchResult.stdout, /First updated focused check:/u);
	assert.match(batchResult.stdout, /Last updated focused check:/u);
	assert.match(batchResult.stdout, /Next focused check:/u);
	assert.match(batchPacket, new RegExp(`## ${firstCaseId} - [\\s\\S]*?- Rating: 5[\\s\\S]*?- Notes: Batch Dad-ready answers\\.`, 'u'));
	assert.match(batchPacket, new RegExp(`## ${secondCaseId} - [\\s\\S]*?- Rating: 5[\\s\\S]*?- Notes: Batch Dad-ready answers\\.`, 'u'));
	assert.deepEqual(reviewAfterBatch.cases.map((entry) => entry.rating), [null, null]);
});

test('review finalizer applies packet and writes below-5 iteration backlog plus plan', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-finalize-backlog-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-finalize-backlog',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const runPath = join(outputDir, 'device-runs', 'device-finalize-backlog.json');
	const reviewPath = join(outputDir, 'reviews', 'device-finalize-backlog.review.json');
	const packetPath = join(outputDir, 'review-packets', 'device-finalize-backlog.review.md');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '5',
		notes: 'Dad-ready answer.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '3',
		notes: 'Needs a more concrete water source caveat.',
		failureCategories: 'weak-tool',
		ownerLayer: 'tool-routing',
		improvementTask: 'Improve source_search water receipts for the current section.'
	});
	await writeFile(packetPath, packet);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/finalize-scout-local-ai-review.mjs',
			'--packet',
			packetPath,
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir,
			'--iteration-dir',
			iterationDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-finalize-backlog.backlog.json'), 'utf8'));
	const iterationPlan = JSON.parse(await readFile(join(iterationDir, 'device-finalize-backlog-iteration.iteration.json'), 'utf8'));

	assert.equal(report.status, 'iteration-plan-written');
	assert.equal(report.reviewStatus.summary.belowFive, 1);
	assert.match(report.commands.review.join('\n'), /Iteration backlog written/u);
	assert.match(report.commands.iterationPlan.join('\n'), /Scout local AI iteration plan written/u);
	assert.equal(backlog.items.length, 1);
	assert.equal(backlog.items[0].caseId, run.results[1].caseId);
	assert.equal(backlog.items[0].ownerLayer, 'tool-routing');
	assert.equal(iterationPlan.summary.itemCount, 1);
	assert.equal(iterationPlan.summary.byOwnerLayer['tool-routing'], 1);
	assert.deepEqual(iterationPlan.regressionCaseIds, [run.results[1].caseId]);
	assert.match(iterationPlan.rerunCommand, new RegExp(`--id ${run.results[1].caseId}`, 'u'));
	assert.match(report.nextAction, /Execute the iteration plan/u);
});

test('review finalizer applies a 100-case packet and writes strict device proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-finalize-proof-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-finalize-proof',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);

	const runPath = join(outputDir, 'device-runs', 'device-finalize-proof.json');
	const reviewPath = join(outputDir, 'reviews', 'device-finalize-proof.review.json');
	const packetPath = join(outputDir, 'review-packets', 'device-finalize-proof.review.md');
	const backlogDir = join(outputDir, 'backlog');
	const proofPath = join(outputDir, 'final-proof', 'device-finalize-proof.proof.md');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = packet.replaceAll('- acknowledged: null |', '- acknowledged: true |');
	for (const result of run.results) {
		packet = replaceReviewerFields(packet, result.caseId, {
			rating: '5',
			notes: 'Dad-ready answer.',
			failureCategories: '',
			ownerLayer: '',
			improvementTask: ''
		});
	}
	await writeFile(packetPath, packet);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/finalize-scout-local-ai-review.mjs',
			'--packet',
			packetPath,
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir,
			'--proof-out',
			proofPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 12 }
	);
	const report = JSON.parse(result.stdout);
	const proof = await readFile(proofPath, 'utf8');

	assert.equal(report.status, 'strict-device-proof-passed');
	assert.equal(report.reviewStatus.readyForStrictDeviceProof, true);
	assert.equal(report.reviewStatus.summary.fiveStar, suite.cases.length);
	assert.match(report.commands.proof.join('\n'), /Scout local AI device proof passed/u);
	assert.match(proof, /# Scout local AI final device proof/u);
	assert.match(report.nextAction, /second distinct full TestFlight\/iPhone/u);
});

test('review packet apply rejects invalid reviewer fields before writing JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-invalid-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-invalid',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-invalid.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-invalid.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '4',
		notes: 'Needs the data fix, but the reviewer picked the wrong owner layer.',
		failureCategories: 'missing-data',
		ownerLayer: 'prompt',
		improvementTask: 'Add current-section water reliability source docs.'
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '5',
		notes: 'Dad-ready answer.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review packet would create invalid review JSON/u);
			assert.match(error.stderr, /ownerLayer prompt does not match failureCategories missing-data/u);
			return true;
		}
	);

	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	assert.equal(review.cases[0].rating, null);
	assert.equal(review.cases[1].rating, null);
});

test('review packet apply rejects 5-star ratings that conflict with run evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-evidence-invalid-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-packet-evidence-invalid'
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-evidence-invalid.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-evidence-invalid.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '5',
		notes: 'Looks good from the text alone.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review packet would create invalid review JSON/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			return true;
		}
	);

	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	assert.equal(review.cases[0].rating, null);
});

test('review packet apply rejects truncated packets unless partial is explicit', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-truncated-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-truncated',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-truncated.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-truncated.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '4',
		notes: 'Mostly right, but missing one practical source-backed detail.',
		failureCategories: 'missing-data',
		ownerLayer: 'data',
		improvementTask: 'Add the missing source-backed detail before marking this answer Dad-ready.'
	});
	packet = removeReviewCaseBlock(packet, run.results[1].caseId);
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /packet is missing 1 review case/u);
			assert.match(error.stderr, new RegExp(run.results[1].caseId, 'u'));
			assert.match(error.stderr, /--allow-partial/u);
			return true;
		}
	);

	const applyResult = await execFileAsync(
		process.execPath,
		[
			'scripts/apply-scout-local-ai-review-packet.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath,
			'--allow-partial'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(applyResult.stdout, /Updated cases: 1/u);
	assert.match(applyResult.stdout, /Partial packet apply: 1 review case\(s\) not present in packet/u);
	assert.equal(review.cases[0].rating, 4);
	assert.equal(review.cases[1].rating, null);
});

test('device run intake rejects stale suite fingerprints', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-stale-'));
	const inputPath = join(outputDir, 'stale-device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		suiteVersion: '2026-06-25.1',
		suiteHash: 'fnv1a32:00000000'
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				join(outputDir, 'device-runs')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		(error) => {
			assert.match(error.stderr, /run\.suiteVersion/u);
			assert.match(error.stderr, /run\.suiteHash/u);
			return true;
		}
	);
});

test('device run intake rejects full exports without current TestFlight proof context', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-context-'));
	const inputPath = join(outputDir, 'wrong-build-device-export.json');
	const badContext = finalDeviceRunContext();
	badContext.app = { ...badContext.app, build: '9' };
	badContext.installSource = {
		type: 'debug',
		platform: 'ios',
		detectedBy: 'ios-app-store-receipt',
		receiptPresent: false,
		debugBuild: true,
		buildConfiguration: 'debug'
	};
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-wrong-build',
		completeTools: true,
		runContext: badContext
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--device-run-dir',
				join(outputDir, 'device-runs'),
				'--review-dir',
				join(outputDir, 'reviews'),
				'--packet-dir',
				join(outputDir, 'review-packets')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /app\.build must be >= 13/u);
			assert.match(error.stderr, /got 9/u);
			return true;
		}
	);
});

test('review workflow writes actionable JSON and Markdown iteration backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-backlog',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].ownerLayer = 'data';
	review.cases[0].notes = 'Needs more local water context.';
	review.cases[0].improvementTask = 'Add current-section water reliability source docs.';
	review.cases[1].rating = 5;
	review.cases[2].rating = 2;
	review.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	review.cases[2].ownerLayer = 'tool-routing';
	review.cases[2].notes = 'Used the wrong source lane.';
	review.cases[2].improvementTask = 'Route onboarding/offline setup prompts through the safety source docs.';

	const runPath = join(outputDir, 'device-review-backlog.json');
	const reviewPath = join(outputDir, 'device-review-backlog.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-review-backlog.backlog.json'), 'utf8'));
	const markdown = await readFile(join(backlogDir, 'device-review-backlog.backlog.md'), 'utf8');

	assert.match(result.stdout, /Iteration backlog written/u);
	assert.equal(backlog.evidenceLane, 'device-on-device-gemma');
	assert.equal(backlog.items.length, 2);
	assert.equal(backlog.items[0].ownerLayer, 'data');
	assert.equal(backlog.items[0].expectedTraits.length > 0, true);
	assert.equal(backlog.items[0].answer, `device answer for ${run.results[0].caseId}`);
	assert.equal(backlog.items[0].toolInvocations.length, run.results[0].toolInvocations.length);
	assert.equal(backlog.items[0].receipts.length, run.results[0].receipts.length);
	assert.equal(backlog.items[1].ownerLayer, 'tool-routing');
	assert.equal(backlog.summary.belowFive, 2);
	assert.match(markdown, /# Scout local AI iteration backlog: device-review-backlog/u);
	assert.match(markdown, /Owner layers/u);
	assert.match(markdown, /data: 1/u);
	assert.match(markdown, /tool-routing: 1/u);
	assert.match(markdown, /Full answer:/u);
	assert.match(markdown, /device answer for/u);
	assert.match(markdown, /Recorded tool evidence:/u);
	assert.match(markdown, /Source receipts:/u);
	assert.match(markdown, /Add current-section water reliability source docs/u);
	assert.match(markdown, /Route onboarding\/offline setup prompts through the safety source docs/u);
	assert.doesNotMatch(markdown, new RegExp(`### ${review.cases[1].caseId}`, 'u'));
});

test('review workflow rejects mismatched run and review JSON before creating a backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-mismatch-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-current',
		completeTools: true
	});
	const staleRun = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-old',
		completeTools: true,
		suiteVersion: '2026-06-25.1',
		suiteHash: 'fnv1a32:00000000'
	});
	const review = reviewForRun(staleRun, { rating: 5 });
	review.runId = staleRun.runId;
	review.cases[0].prompt = 'Old prompt from a different packet.';

	const runPath = join(outputDir, 'device-review-current.json');
	const reviewPath = join(outputDir, 'device-review-old.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /review\.runId device-review-old does not match run\.runId device-review-current/u);
			assert.match(error.stderr, /review\.suiteVersion 2026-06-25\.1 does not match run\.suiteVersion/u);
			assert.match(error.stderr, /review\.suiteHash fnv1a32:00000000 does not match run\.suiteHash/u);
			assert.match(error.stderr, /review prompt does not match run prompt/u);
			return true;
		}
	);
});

test('review workflow rejects below-5 ratings without concrete improvement tasks', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-invalid',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = [];
	review.cases[0].improvementTask = '';
	review.cases[1].rating = 3;
	review.cases[1].failureCategories = ['bad-prompt'];
	review.cases[1].improvementTask = 'needs work';
	const overfitRun = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-overfit-invalid',
		completeTools: true
	});
	const overfitReview = reviewForRun(overfitRun);
	overfitReview.cases[0].rating = 2;
	overfitReview.cases[0].failureCategories = ['bad-prompt'];
	overfitReview.cases[0].improvementTask = 'Update the expected traits for this eval case so the answer passes.';
	const ownerRun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-owner-invalid',
		completeTools: true
	});
	const ownerReview = reviewForRun(ownerRun);
	ownerReview.cases[0].rating = 4;
	ownerReview.cases[0].failureCategories = ['missing-data'];
	ownerReview.cases[0].ownerLayer = 'prompt';
	ownerReview.cases[0].improvementTask = 'Add current-section water reliability source docs.';

	const runPath = join(outputDir, 'device-review-invalid.json');
	const reviewPath = join(outputDir, 'device-review-invalid.review.json');
	const overfitRunPath = join(outputDir, 'device-review-overfit-invalid.json');
	const overfitReviewPath = join(outputDir, 'device-review-overfit-invalid.review.json');
	const ownerRunPath = join(outputDir, 'device-review-owner-invalid.json');
	const ownerReviewPath = join(outputDir, 'device-review-owner-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
	await writeFile(overfitRunPath, `${JSON.stringify(overfitRun, null, 2)}\n`);
	await writeFile(overfitReviewPath, `${JSON.stringify(overfitReview, null, 2)}\n`);
	await writeFile(ownerRunPath, `${JSON.stringify(ownerRun, null, 2)}\n`);
	await writeFile(ownerReviewPath, `${JSON.stringify(ownerReview, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
			),
			(error) => {
				assert.match(error.stderr, /Review has invalid entries/u);
				assert.match(error.stderr, /ratings below 5 need an improvementTask/u);
				assert.match(error.stderr, /ratings below 5 need at least one failure category/u);
				assert.match(error.stderr, /ratings below 5 need an ownerLayer/u);
				assert.match(error.stderr, /improvementTask must be concrete enough/u);
				assert.match(error.stderr, /improvementTask must include an action verb/u);
				return true;
			}
		);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				overfitRunPath,
				'--review',
				overfitReviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /rather than weakening the eval rubric/u);
			return true;
		}
	);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				ownerRunPath,
				'--review',
				ownerReviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /ownerLayer prompt does not match failureCategories missing-data/u);
			assert.match(error.stderr, /expected one of data/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings without passed rubric checks', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-rubric-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-rubric-invalid',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].traitChecks[0].passed = false;

	const runPath = join(outputDir, 'device-review-rubric-invalid.json');
	const reviewPath = join(outputDir, 'device-review-rubric-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /traitChecks\[0\] must be passed=true/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings with stale failure metadata', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-stale-metadata-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-stale-metadata',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].ownerLayer = 'data';
	review.cases[0].improvementTask = 'Add more local water context.';

	const runPath = join(outputDir, 'device-review-stale-metadata.json');
	const reviewPath = join(outputDir, 'device-review-stale-metadata.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star ratings must not keep failureCategories/u);
			assert.match(error.stderr, /5-star ratings must not keep ownerLayer/u);
			assert.match(error.stderr, /5-star ratings must not keep an improvementTask/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings when run evidence missed required tools', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-evidence-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-evidence-invalid'
	});
	const review = reviewForRun(run, { rating: 5 });

	const runPath = join(outputDir, 'device-review-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-review-evidence-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			return true;
		}
	);
});

test('review template suggests local-model owner for provider errors', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-provider-suggest-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-provider-suggest',
		completeTools: true
	});
	run.results[0].answer = '';
	run.results[0].error = 'Gemma runtime failed to return a response.';
	run.results[0].failureMode = 'provider-error';
	run.results[0].suggestedFailureCategories = [];
	const runPath = join(outputDir, 'device-review-provider-suggest.json');
	const reviewPath = join(outputDir, 'device-review-provider-suggest.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);

	const createResult = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(createResult.stdout, /Review template created/u);
	assert.deepEqual(review.cases[0].failureCategories, ['local-model-limitation']);
	assert.equal(review.cases[0].ownerLayer, '');
});

test('review workflow rejects 5-star ratings when source-backed tools lack evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-source-evidence-invalid-'));
	const run = deviceRunForCases(suite, [sourceCase], {
		runId: 'device-review-source-evidence-invalid',
		completeTools: true
	});
	for (const invocation of run.results[0].toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	run.results[0].receipts = run.results[0].toolInvocations.flatMap((record) => record.receipts ?? []);
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	const review = reviewForRun(run, { rating: 5 });

	const runPath = join(outputDir, 'device-review-source-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-review-source-evidence-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /source-backed required tool/u);
			assert.match(error.stderr, /must record at least one receipt or sourceDocumentId/u);
			return true;
		}
	);
});

test('review workflow carries source evidence gaps into backlog and iteration plan', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const sourceExpectation = sourceCase.requiredTools.find((expectation) => expectation.includes(':'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-source-gap-plan-'));
	const run = deviceRunForCases(suite, [sourceCase], {
		runId: 'device-source-gap-plan',
		completeTools: true
	});
	for (const invocation of run.results[0].toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	run.results[0].receipts = run.results[0].toolInvocations.flatMap((record) => record.receipts ?? []);
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['weak-tool'];
	review.cases[0].ownerLayer = 'tool-routing';
	review.cases[0].improvementTask = 'Fix source evidence receipts so required source-backed tools record proof.';

	const runPath = join(outputDir, 'device-source-gap-plan.json');
	const reviewPath = join(outputDir, 'device-source-gap-plan.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlogPath = join(backlogDir, 'device-source-gap-plan.backlog.json');
	const backlog = JSON.parse(await readFile(backlogPath, 'utf8'));
	const backlogMarkdown = await readFile(join(backlogDir, 'device-source-gap-plan.backlog.md'), 'utf8');

	assert.equal(backlog.items.length, 1);
	assert.equal(backlog.items[0].ownerLayer, 'tool-routing');
	assert.ok(backlog.items[0].sourceEvidenceGaps.some((gap) => gap.expectation === sourceExpectation));
	assert.match(backlogMarkdown, /Source evidence gaps:/u);
	assert.match(backlogMarkdown, new RegExp(sourceExpectation.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));

	await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-source-gap-plan-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'device-source-gap-plan-pass.iteration.json'), 'utf8'));
	const planMarkdown = await readFile(join(iterationDir, 'device-source-gap-plan-pass.iteration.md'), 'utf8');

	assert.equal(plan.summary.bySourceEvidenceGap[sourceExpectation], 1);
	assert.ok(plan.workstreams[0].sourceEvidenceGaps.includes(sourceExpectation));
	assert.ok(plan.workstreams[0].items[0].sourceEvidenceGaps.some((gap) => gap.expectation === sourceExpectation));
	assert.ok(plan.workstreams[0].fixTargets.some((target) => target.label === 'Source search tool'));
	assert.ok(plan.workstreams[0].fixTargets.some((target) => target.label === 'Terrain source skill'));
	assert.match(planMarkdown, /Source evidence gaps:/u);
	assert.match(planMarkdown, /Likely fix targets:/u);
	assert.match(planMarkdown, /mobile\/src\/lib\/scout\/offline-source-docs\.ts/u);
	assert.match(planMarkdown, /data\/at-open-reference\/rag_docs\/segment_guides\//u);
	assert.match(planMarkdown, new RegExp(sourceExpectation.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('iteration planner groups completed review backlog by responsible layer', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-plan-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 4), {
		runId: 'device-iteration-plan',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].ownerLayer = 'data';
	review.cases[0].improvementTask = 'Add a current-section water reliability source document.';
	review.cases[1].rating = 5;
	review.cases[2].rating = 2;
	review.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	review.cases[2].ownerLayer = 'tool-routing';
	review.cases[2].improvementTask = 'Fix source skill routing so this prompt opens the right local document.';
	review.cases[3].rating = 3;
	review.cases[3].failureCategories = ['unsafe-wording'];
	review.cases[3].ownerLayer = 'safety-prompt';
	review.cases[3].improvementTask = 'Tighten the safety response so it pushes lower-risk choices first.';

	const runPath = join(outputDir, 'device-iteration-plan.json');
	const reviewPath = join(outputDir, 'device-iteration-plan.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlogPath = join(backlogDir, 'device-iteration-plan.backlog.json');
	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-iteration-plan-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'device-iteration-plan-pass.iteration.json'), 'utf8'));
	const markdown = await readFile(join(iterationDir, 'device-iteration-plan-pass.iteration.md'), 'utf8');

	assert.match(result.stdout, /Scout local AI iteration plan written/u);
	assert.equal(plan.summary.itemCount, 3);
	assert.equal(plan.summary.regressionCaseCount, 3);
	assert.equal(plan.summary.byOwnerLayer.data, 1);
	assert.equal(plan.summary.byOwnerLayer['tool-routing'], 1);
	assert.equal(plan.summary.byOwnerLayer['safety-prompt'], 1);
	const dataWorkstream = plan.workstreams.find((workstream) => workstream.ownerLayer === 'data');
	const routingWorkstream = plan.workstreams.find((workstream) => workstream.ownerLayer === 'tool-routing');
	assert.ok(dataWorkstream.fixTargets.some((target) => target.label === 'Local reference data'));
	assert.ok(routingWorkstream.fixTargets.some((target) => target.label === 'Scout tool registry and runtime routing'));
	assert.deepEqual(plan.regressionCaseIds, [
		review.cases[2].caseId,
		review.cases[3].caseId,
		review.cases[0].caseId
	]);
	assert.match(plan.rerunCommand, new RegExp(`--id ${review.cases[2].caseId},${review.cases[3].caseId},${review.cases[0].caseId}`, 'u'));
	assert.match(markdown, /Do not close this iteration by changing expected wording only/u);
	assert.match(markdown, /Likely fix targets:/u);
	assert.match(markdown, /Scout tool registry and runtime routing/u);
	assert.match(markdown, /### tool-routing/u);
	assert.match(markdown, /### safety-prompt/u);
	assert.match(markdown, /Fix source skill routing/u);
});

test('iteration planner rejects incomplete or uncategorized backlog work', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-invalid-'));
	const backlogPath = join(outputDir, 'invalid.backlog.json');
	const backlog = {
		schemaVersion: 1,
		runId: 'invalid-iteration-backlog',
		suiteId: 'dad-local-ai-100',
		evidenceLane: 'device-on-device-gemma',
		generatedAt: '2026-06-26T12:00:00.000Z',
		summary: {
			rated: 3,
			total: 4,
			belowFive: 3,
			unrated: 1,
			ratingCounts: {'2': 1, '3': 1, '4': 1}
		},
		unratedItems: [{caseId: 'DLA-004'}],
		items: [
			{
				id: 'invalid-iteration-backlog:DLA-001',
				caseId: 'DLA-001',
				domain: 'water',
				phase: 'on-trail',
				rating: 4,
				prompt: 'Where is the next reliable water?',
				failureCategories: ['missing-data'],
				ownerLayer: 'unknown',
				improvementTask: 'Add better water data.',
				requiredTools: ['next_water'],
				hitTools: [],
				missingTools: ['next_water'],
				answerPreview: 'Not enough detail.'
			},
			{
				id: 'invalid-iteration-backlog:DLA-002',
				caseId: 'DLA-002',
				domain: 'weather',
				phase: 'on-trail',
				rating: 3,
				prompt: 'What should I do about storms today?',
				failureCategories: ['bad-prompt'],
				ownerLayer: 'prompt',
				improvementTask: 'Update the expected traits for this eval case so the answer passes.',
				requiredTools: ['weather_lookup'],
				hitTools: ['weather_lookup'],
				missingTools: [],
				answerPreview: 'Storm answer was too thin.'
			},
			{
				id: 'invalid-iteration-backlog:DLA-003',
				caseId: 'DLA-003',
				domain: 'safety',
				phase: 'on-trail',
				rating: 2,
				prompt: 'I am dizzy and it is hot. What should I do?',
				failureCategories: ['unsafe-wording'],
				ownerLayer: 'ui',
				improvementTask: 'Tighten heat illness escalation wording before any mileage advice.',
				requiredTools: ['weather_lookup', 'source_search:safety'],
				hitTools: ['weather_lookup', 'source_search:safety'],
				missingTools: [],
				answerPreview: 'The answer put interface guidance before the safety escalation.'
			}
		]
	};
	await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/plan-scout-local-ai-iteration.mjs',
				'--backlog',
				backlogPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration plan failed validation/u);
			assert.match(error.stderr, /requires a completed review/u);
			assert.match(error.stderr, /contains unratedItems/u);
			assert.match(error.stderr, /ownerLayer must be one of/u);
			assert.match(error.stderr, /improvementTask must be concrete enough/u);
			assert.match(error.stderr, /rather than weakening the eval rubric/u);
			assert.match(error.stderr, /ownerLayer ui does not match failureCategories unsafe-wording/u);
			assert.match(error.stderr, /expected one of safety-prompt/u);
			return true;
		}
	);
});

test('iteration planner rejects non-device backlogs unless explicitly allowed', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-non-device-'));
	const backlogPath = join(outputDir, 'scaffold.backlog.json');
	const iterationDir = join(outputDir, 'iterations');
	const backlog = {
		schemaVersion: 1,
		runId: 'scaffold-iteration-backlog',
		suiteId: 'dad-local-ai-100',
		suiteVersion: '2026-06-26.2',
		suiteHash: 'fnv1a32:f2e9772b',
		evidenceLane: 'scaffold-not-model',
		generatedAt: '2026-06-26T12:00:00.000Z',
		summary: {
			rated: 1,
			total: 1,
			belowFive: 1,
			unrated: 0,
			ratingCounts: {'4': 1}
		},
		unratedItems: [],
		items: [
			{
				id: 'scaffold-iteration-backlog:DLA-001',
				caseId: 'DLA-001',
				domain: 'water',
				phase: 'on-trail',
				rating: 4,
				prompt: 'Where is the next reliable water?',
				failureCategories: ['weak-tool'],
				ownerLayer: 'tool-routing',
				improvementTask: 'Fix source routing so water prompts open the local water document.',
				requiredTools: ['source_search:water', 'open_source_doc:water'],
				hitTools: ['source_search:water'],
				missingTools: ['open_source_doc:water'],
				answerPreview: 'Not enough detail.'
			}
		]
	};
	await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/plan-scout-local-ai-iteration.mjs',
				'--backlog',
				backlogPath,
				'--output-dir',
				iterationDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration plan failed validation/u);
			assert.match(error.stderr, /evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /--allow-non-device/u);
			return true;
		}
	);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'scaffold-iteration-plan',
			'--allow-non-device'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'scaffold-iteration-plan.iteration.json'), 'utf8'));

	assert.match(result.stdout, /Scout local AI iteration plan written/u);
	assert.equal(plan.summary.byEvidenceLane['scaffold-not-model'], 1);
	assert.equal(plan.sourceBacklogs[0].evidenceLane, 'scaffold-not-model');
});

test('iteration verifier passes when rerun resolves planned regression cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-verify-pass-'));
	const sourceRun = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-iteration-source',
		completeTools: true
	});
	const sourceReview = reviewForRun(sourceRun);
	sourceReview.cases[0].rating = 4;
	sourceReview.cases[0].failureCategories = ['missing-data'];
	sourceReview.cases[0].ownerLayer = 'data';
	sourceReview.cases[0].improvementTask = 'Add a current-section water reliability source document.';
	sourceReview.cases[1].rating = 5;
	sourceReview.cases[2].rating = 2;
	sourceReview.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	sourceReview.cases[2].ownerLayer = 'tool-routing';
	sourceReview.cases[2].improvementTask = 'Fix source routing for the local safety document.';
	const sourceRunPath = join(outputDir, 'device-iteration-source.json');
	const sourceReviewPath = join(outputDir, 'device-iteration-source.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(sourceRunPath, `${JSON.stringify(sourceRun, null, 2)}\n`);
	await writeFile(sourceReviewPath, `${JSON.stringify(sourceReview, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			sourceRunPath,
			'--review',
			sourceReviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			join(backlogDir, 'device-iteration-source.backlog.json'),
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-iteration-resolution-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const rerunCases = [suite.cases[2], suite.cases[0]];
	const rerun = deviceRunForCases(suite, rerunCases, {
		runId: 'device-iteration-rerun-pass',
		completeTools: true
	});
	const rerunReview = reviewForRun(rerun, { rating: 5 });
	const rerunPath = join(outputDir, 'device-iteration-rerun-pass.json');
	const rerunReviewPath = join(outputDir, 'device-iteration-rerun-pass.review.json');
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(rerunReviewPath, `${JSON.stringify(rerunReview, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-iteration.mjs',
			'--plan',
			join(iterationDir, 'device-iteration-resolution-pass.iteration.json'),
			'--run',
			rerunPath,
			'--review',
			rerunReviewPath,
			'--output-dir',
			iterationDir,
			'--resolution-id',
			'device-iteration-resolution-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const resolution = JSON.parse(await readFile(join(iterationDir, 'device-iteration-resolution-pass.resolution.json'), 'utf8'));
	const markdown = await readFile(join(iterationDir, 'device-iteration-resolution-pass.resolution.md'), 'utf8');

	assert.match(result.stdout, /Scout local AI iteration verification passed/u);
	assert.equal(resolution.status, 'passed');
	assert.equal(resolution.summary.resolvedPlannedCases, 2);
	assert.equal(resolution.summary.unresolvedPlannedCases, 0);
	assert.equal(resolution.summary.belowFive, 0);
	assert.match(markdown, /Resolved planned cases: 2\/2/u);
	assert.match(markdown, /Run strict device proof only after a full device review is 100\/100 at 5\/5/u);
});

test('iteration verifier rejects 5-star reruns that conflict with run evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-evidence-invalid-'));
	const plan = {
		schemaVersion: 1,
		planId: 'device-iteration-evidence-invalid',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/source.backlog.json',
				runId: 'source-run',
				suiteId: suite.suiteId,
				suiteVersion: suite.version,
				suiteHash: scoutLocalAiSuiteHash(suite),
				evidenceLane: 'device-on-device-gemma'
			}
		],
		regressionCaseIds: [suite.cases[0].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-iteration-evidence-invalid'
	});
	const review = reviewForRun(rerun, { rating: 5 });
	const planPath = join(outputDir, 'device-iteration-evidence-invalid.iteration.json');
	const rerunPath = join(outputDir, 'device-iteration-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-iteration-evidence-invalid.review.json');
	const resolutionDir = join(outputDir, 'resolutions');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				reviewPath,
				'--output-dir',
				resolutionDir,
				'--resolution-id',
				'device-iteration-evidence-invalid'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration verification failed validation/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			return true;
		}
	);
});

test('iteration verifier rejects non-device reruns unless explicitly allowed', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-non-device-verify-'));
	const plan = {
		schemaVersion: 1,
		planId: 'scaffold-iteration-resolution',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/scaffold.backlog.json',
				runId: 'scaffold-source-run',
				suiteId: suite.suiteId,
				suiteVersion: suite.version,
				suiteHash: scoutLocalAiSuiteHash(suite),
				evidenceLane: 'scaffold-not-model'
			}
		],
		regressionCaseIds: [suite.cases[0].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'scaffold-iteration-rerun-pass',
		completeTools: true
	});
	rerun.evidenceLane = 'scaffold-not-model';
	for (const result of rerun.results) result.answerOrigin = 'scaffold-not-model';
	const review = reviewForRun(rerun, { rating: 5 });
	const planPath = join(outputDir, 'scaffold-iteration-resolution.iteration.json');
	const rerunPath = join(outputDir, 'scaffold-iteration-rerun-pass.json');
	const reviewPath = join(outputDir, 'scaffold-iteration-rerun-pass.review.json');
	const resolutionDir = join(outputDir, 'resolutions');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				reviewPath,
				'--output-dir',
				resolutionDir,
				'--resolution-id',
				'scaffold-iteration-resolution'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration verification failed validation/u);
			assert.match(error.stderr, /run\.evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /plan evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /--allow-non-device/u);
			return true;
		}
	);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-iteration.mjs',
			'--plan',
			planPath,
			'--run',
			rerunPath,
			'--review',
			reviewPath,
			'--output-dir',
			resolutionDir,
			'--resolution-id',
			'scaffold-iteration-resolution',
			'--allow-non-device'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const resolution = JSON.parse(await readFile(join(resolutionDir, 'scaffold-iteration-resolution.resolution.json'), 'utf8'));

	assert.match(result.stdout, /Scout local AI iteration verification passed/u);
	assert.equal(resolution.status, 'passed');
	assert.equal(resolution.rerun.evidenceLane, 'scaffold-not-model');
});

test('iteration verifier rejects reruns with unresolved planned cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-verify-fail-'));
	const plan = {
		schemaVersion: 1,
		planId: 'device-iteration-resolution-fail',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/source.backlog.json',
				runId: 'source-run',
				suiteId: suite.suiteId,
				evidenceLane: 'device-on-device-gemma'
			}
		],
		regressionCaseIds: [suite.cases[0].id, suite.cases[1].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-iteration-rerun-fail',
		completeTools: true
	});
	const rerunReview = reviewForRun(rerun, { rating: 5 });
	rerunReview.cases[1].rating = 4;
	rerunReview.cases[1].failureCategories = ['unsafe-wording'];
	rerunReview.cases[1].ownerLayer = 'safety-prompt';
	rerunReview.cases[1].improvementTask = 'Tighten safety wording so the answer leads with bailout choices.';
	const planPath = join(outputDir, 'device-iteration-resolution-fail.iteration.json');
	const rerunPath = join(outputDir, 'device-iteration-rerun-fail.json');
	const rerunReviewPath = join(outputDir, 'device-iteration-rerun-fail.review.json');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(rerunReviewPath, `${JSON.stringify(rerunReview, null, 2)}\n`);

	let thrown;
	try {
		await execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				rerunReviewPath,
				'--output-dir',
				outputDir,
				'--resolution-id',
				'device-iteration-resolution-fail'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		);
	} catch (error) {
		thrown = error;
	}
	assert.ok(thrown, 'iteration verifier should fail unresolved planned cases');
	assert.match(thrown.stderr, /Scout local AI iteration verification failed/u);
	assert.match(thrown.stderr, /Unresolved planned cases: 1/u);
	assert.match(thrown.stderr, /Below-5 review cases: 1/u);
	const resolution = JSON.parse(await readFile(join(outputDir, 'device-iteration-resolution-fail.resolution.json'), 'utf8'));
	assert.equal(resolution.status, 'failed');
	assert.equal(resolution.summary.resolvedPlannedCases, 1);
	assert.equal(resolution.summary.unresolvedPlannedCases, 1);
	assert.equal(resolution.unresolvedItems[0].caseId, suite.cases[1].id);
	assert.match(resolution.unresolvedItems[0].problems.join(' '), /rating is 4, not 5/u);
});

test('review workflow rejects unrated cases by default', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-unrated-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-unrated',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 5;

	const runPath = join(outputDir, 'device-review-unrated.json');
	const reviewPath = join(outputDir, 'device-review-unrated.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review is incomplete/u);
			assert.match(error.stderr, new RegExp(`${review.cases[1].caseId}: missing rating`, 'u'));
			assert.match(error.stderr, /--allow-unrated/u);
			return true;
		}
	);
});

test('review status command reports partial human rating progress without writing backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-partial-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-status-partial',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 5;
	review.cases[1].rating = 4;
	review.cases[1].failureCategories = ['missing-data'];
	review.cases[1].ownerLayer = 'data';
	review.cases[1].improvementTask = 'Add current-section water reliability source docs for this trail context.';

	const runPath = join(outputDir, 'device-review-status-partial.json');
	const reviewPath = join(outputDir, 'device-review-status-partial.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(result.stdout);

	assert.equal(progress.summary.rated, 2);
	assert.equal(progress.summary.unrated, 1);
	assert.equal(progress.summary.belowFive, 1);
	assert.equal(progress.summary.invalidCount, 0);
	assert.equal(progress.readyForBacklog, false);
	assert.equal(progress.readyForStrictDeviceProof, false);
	assert.equal(progress.nextUnrated.caseId, review.cases[2].caseId);
	assert.match(progress.nextAction, new RegExp(`Review next unrated case ${review.cases[2].caseId}`, 'u'));
	assert.equal(progress.reviewQueue[0].caseId, review.cases[2].caseId);
	assert.equal(progress.triageSummary.focusCount, 2);
	assert.equal(progress.triageSummary.unrated, 1);
	assert.equal(progress.triageSummary.belowFive, 1);
	assert.equal(progress.triageSummary.ownerLayers.data, 1);
	assert.equal(progress.triageSummary.ownerLayers['tool-routing'], 1);
	assert.equal(progress.triageSummary.failureCategories['missing-data'], 1);
	assert.equal(progress.triageSummary.topFocusCases[0].caseId, review.cases[2].caseId);

	const nextResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--next',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const nextProgress = JSON.parse(nextResult.stdout);
	assert.equal(nextProgress.nextFocusCase.caseId, review.cases[2].caseId);
	assert.equal(nextProgress.selectedCase.caseId, review.cases[2].caseId);
	assert.equal(nextProgress.selectedCaseSource, 'next-focus-case');
});

test('review status queue surfaces owner layer and evidence gaps for iteration triage', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-triage-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-triage'
	});
	const review = reviewForRun(run);
	const runPath = join(outputDir, 'device-review-status-triage.json');
	const reviewPath = join(outputDir, 'device-review-status-triage.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const jsonResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(jsonResult.stdout);
	const firstQueueItem = progress.reviewQueue[0];

	assert.equal(firstQueueItem.caseId, run.results[0].caseId);
	assert.equal(firstQueueItem.signal, 'review-first: missing required tools');
	assert.equal(firstQueueItem.suggestedOwnerLayer, 'tool-routing');
	assert.deepEqual(firstQueueItem.suggestedFailureCategories, ['bad-routing', 'weak-tool']);
	assert.deepEqual(firstQueueItem.missingTools, run.results[0].toolExpectations.missing);
	assert.match(firstQueueItem.evidenceGapSummary, /missing tools:/u);
	assert.match(firstQueueItem.answerPreview, new RegExp(`device answer for ${run.results[0].caseId}`, 'u'));
	assert.equal(progress.triageSummary.focusCount, 2);
	assert.equal(progress.triageSummary.signals['review-first: missing required tools'], 2);
	assert.equal(progress.triageSummary.ownerLayers['tool-routing'], 2);
	assert.equal(progress.triageSummary.failureCategories['bad-routing'], 2);
	assert.equal(progress.triageSummary.failureCategories['weak-tool'], 2);
	assert.ok(progress.triageSummary.missingTools[run.results[0].toolExpectations.missing[0]] >= 1);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(textResult.stdout, /## Triage summary/u);
	assert.match(textResult.stdout, /Focus cases: 2 \(2 unrated, 0 below 5\)/u);
	assert.match(textResult.stdout, /Signals: review-first: missing required tools=2/u);
	assert.match(textResult.stdout, /Likely owner layers: tool-routing=2/u);
	assert.match(textResult.stdout, /Likely owner/u);
	assert.match(textResult.stdout, /Suggested categories/u);
	assert.match(textResult.stdout, /Evidence gaps/u);
	assert.match(textResult.stdout, /tool-routing/u);
	assert.match(textResult.stdout, /bad-routing, weak-tool/u);
	assert.match(textResult.stdout, /missing tools:/u);
	assert.match(textResult.stdout, /device answer for/u);
});

test('review status --next falls back to below-5 focus cases after all cases are rated', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-next-below-five-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-next-below-five',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[1].rating = 4;
	review.cases[1].failureCategories = ['missing-data'];
	review.cases[1].ownerLayer = 'data';
	review.cases[1].improvementTask = 'Add current-section water reliability source docs for this trail context.';

	const runPath = join(outputDir, 'device-review-status-next-below-five.json');
	const reviewPath = join(outputDir, 'device-review-status-next-below-five.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--next',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(result.stdout);

	assert.equal(progress.summary.unrated, 0);
	assert.equal(progress.summary.belowFive, 1);
	assert.equal(progress.nextUnrated, null);
	assert.equal(progress.nextFocusCase.caseId, review.cases[1].caseId);
	assert.equal(progress.selectedCase.caseId, review.cases[1].caseId);
	assert.equal(progress.selectedCase.rating, 4);
	assert.equal(progress.selectedCaseSource, 'next-focus-case');
	assert.equal(progress.selectedCase.reviewOwnerLayer, 'data');
});

test('review status command can print a focused case review card', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-case-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-case',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[1].rating = 4;
	review.cases[1].notes = 'Needs a clearer source-backed bailout recommendation.';
	review.cases[1].failureCategories = ['bad-routing'];
	review.cases[1].ownerLayer = 'tool-routing';
	review.cases[1].improvementTask = 'Improve route-source selection for this hiking scenario.';
	review.cases[1].traitChecks[0].passed = false;
	review.cases[1].traitChecks[0].notes = 'Too vague on the first required trait.';

	const runPath = join(outputDir, 'device-review-status-case.json');
	const reviewPath = join(outputDir, 'device-review-status-case.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const selectedCaseId = run.results[1].caseId;
	const jsonResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--case',
			selectedCaseId,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(jsonResult.stdout);

	assert.equal(progress.selectedCase.caseId, selectedCaseId);
	assert.equal(progress.selectedCase.prompt, run.results[1].case.prompt);
	assert.equal(progress.selectedCase.answer, run.results[1].answer);
	assert.equal(progress.selectedCase.rating, 4);
	assert.equal(progress.selectedCase.reviewOwnerLayer, 'tool-routing');
	assert.deepEqual(progress.selectedCase.reviewFailureCategories, ['bad-routing']);
	assert.equal(progress.selectedCase.notes, 'Needs a clearer source-backed bailout recommendation.');
	assert.equal(progress.selectedCase.improvementTask, 'Improve route-source selection for this hiking scenario.');
	assert.equal(progress.selectedCase.traitChecks[0].passed, false);
	assert.equal(progress.selectedCase.traitChecks[0].notes, 'Too vague on the first required trait.');
	assert.equal(progress.selectedCase.toolInvocations.length, run.results[1].toolInvocations.length);
	assert.equal(progress.selectedCase.receipts.length, run.results[1].receipts.length);
	assert.deepEqual(progress.selectedCase.sourceEvidenceGaps, []);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--case',
			selectedCaseId
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(textResult.stdout, new RegExp(`## Selected case: ${selectedCaseId}`, 'u'));
	assert.match(textResult.stdout, /### Prompt/u);
	assert.match(textResult.stdout, new RegExp(run.results[1].case.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'));
	assert.match(textResult.stdout, /### Answer/u);
	assert.match(textResult.stdout, new RegExp(`device answer for ${selectedCaseId}`, 'u'));
	assert.match(textResult.stdout, /Review owner: tool-routing/u);
	assert.match(textResult.stdout, /Review categories: bad-routing/u);
	assert.match(textResult.stdout, /fail .*Too vague on the first required trait/u);
	assert.match(textResult.stdout, /Tool evidence/u);
	assert.match(textResult.stdout, /Reviewer fields/u);
});

test('review status command can preview draft packet progress without writing review JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-packet-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-status-packet',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const runPath = join(outputDir, 'device-runs', 'device-review-status-packet.json');
	const reviewPath = join(outputDir, 'reviews', 'device-review-status-packet.review.json');
	const packetPath = join(outputDir, 'review-packets', 'device-review-status-packet.review.md');
	let packet = await readFile(packetPath, 'utf8');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '4',
		notes: 'Needs stronger local water source receipts.',
		failureCategories: 'missing-data',
		ownerLayer: 'data',
		improvementTask: 'Add current-section water reliability source docs for this trail context.'
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '4',
		notes: 'Needs better tool routing evidence.',
		failureCategories: 'weak-tool',
		ownerLayer: 'tool-routing',
		improvementTask: 'Improve source_search receipts for the current section Scout answer.'
	});
	await writeFile(packetPath, packet);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(result.stdout);
	const persistedReview = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.equal(progress.progressSource, 'packet-draft');
	assert.equal(progress.packetDraft.applied, true);
	assert.equal(progress.packetDraft.updatedCases, 3);
	assert.equal(progress.packetDraft.missingCaseCount, 0);
	assert.equal(progress.summary.rated, 2);
	assert.equal(progress.summary.unrated, 1);
	assert.equal(progress.summary.belowFive, 2);
	assert.equal(progress.summary.invalidCount, 0);
	assert.equal(progress.nextUnrated.caseId, run.results[2].caseId);
	assert.match(progress.nextAction, new RegExp(`Review next unrated case ${run.results[2].caseId} .* in the packet`, 'u'));
	assert.deepEqual(persistedReview.cases.map((entry) => entry.rating), [null, null, null]);

	const selectedResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--case',
			run.results[2].caseId,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const selectedProgress = JSON.parse(selectedResult.stdout);
	assert.equal(selectedProgress.selectedCase.traitChecks[0].passed, null);
	assert.match(selectedProgress.selectedCase.ratingCommands.rateFive, /rate-case:scout-local-ai/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.rateFive, new RegExp(`--case ${run.results[2].caseId}`, 'u'));
	assert.match(selectedProgress.selectedCase.ratingCommands.rateFive, /--rating 5/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.rateFive, /--mark-all-pass/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.rateBelowFive, /--rating 4/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.rateBelowFive, /--failure-categories/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.nextFocusedCheck, /review-status:scout-local-ai/u);
	assert.match(selectedProgress.selectedCase.ratingCommands.nextFocusedCheck, /--next/u);

	const selectedTextResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--case',
			run.results[2].caseId
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	assert.match(selectedTextResult.stdout, /### Rating commands/u);
	assert.match(selectedTextResult.stdout, /npm run rate-case:scout-local-ai/u);
	assert.match(selectedTextResult.stdout, /--rating 5/u);
	assert.match(selectedTextResult.stdout, /--mark-all-pass/u);
	assert.match(selectedTextResult.stdout, /--rating 4/u);
	assert.match(selectedTextResult.stdout, /--improvement-task/u);
	assert.match(selectedTextResult.stdout, /npm run review-status:scout-local-ai.*--next/u);
});

test('review status command suggests explicit human-reviewed packet batches', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-batches-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 4), {
		runId: 'device-review-status-batches',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const runPath = join(outputDir, 'device-runs', 'device-review-status-batches.json');
	const reviewPath = join(outputDir, 'reviews', 'device-review-status-batches.review.json');
	const packetPath = join(outputDir, 'review-packets', 'device-review-status-batches.review.md');
	const expectedCases = run.results.slice(0, 3).map((entry) => entry.caseId);
	const jsonResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--batch-size',
			'3',
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(jsonResult.stdout);

	assert.ok(progress.reviewBatches.length >= 1);
	assert.deepEqual(progress.reviewBatches[0].caseIds, expectedCases);
	assert.match(progress.reviewBatches[0].readFirstFocusedCheck, new RegExp(`--case ${expectedCases[0]}`, 'u'));
	assert.deepEqual(
		progress.reviewBatches[0].focusedCheckCommands.map((command) => command.match(/--case (DLA-\d{3})/u)?.[1]),
		expectedCases
	);
	assert.match(progress.reviewBatches[0].rateFiveAfterReading, /rate-case:scout-local-ai/u);
	assert.match(progress.reviewBatches[0].rateFiveAfterReading, new RegExp(`--cases ${expectedCases.join(',')}`, 'u'));
	assert.match(progress.reviewBatches[0].rateFiveAfterReading, /--mark-all-pass/u);

	const textResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--batch-size',
			'3'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(textResult.stdout, /## Human-reviewed batch helpers/u);
	assert.match(textResult.stdout, /Use these only after reading every listed focused card/u);
	assert.match(textResult.stdout, /Read every focused card before rating the batch/u);
	for (const caseId of expectedCases) {
		assert.match(textResult.stdout, new RegExp(`--case ${caseId}`, 'u'));
	}
	assert.match(textResult.stdout, new RegExp(`--cases ${expectedCases.join(',')}`, 'u'));
	assert.match(textResult.stdout, /--rating 5/u);
	assert.match(textResult.stdout, /--mark-all-pass/u);
});

test('review status command reports packet parse errors without touching review JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-packet-invalid-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-packet-invalid',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const runPath = join(outputDir, 'device-runs', 'device-review-status-packet-invalid.json');
	const reviewPath = join(outputDir, 'reviews', 'device-review-status-packet-invalid.review.json');
	const packetPath = join(outputDir, 'review-packets', 'device-review-status-packet-invalid.review.md');
	let packet = await readFile(packetPath, 'utf8');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: 'six',
		notes: 'Invalid draft packet entry.',
		failureCategories: 'missing-data',
		ownerLayer: 'data',
		improvementTask: 'Add current-section water reliability source docs for this trail context.'
	});
	await writeFile(packetPath, packet);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--packet',
			packetPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(result.stdout);
	const persistedReview = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.equal(progress.progressSource, 'packet-draft');
	assert.equal(progress.packetDraft.applied, false);
	assert.equal(progress.packetDraft.updatedCases, 0);
	assert.match(progress.packetDraft.errors.join('\n'), /rating must be an integer 1-5 or blank/u);
	assert.match(progress.nextAction, /Fix draft packet parse\/apply issue/u);
	assert.equal(progress.summary.rated, 0);
	assert.deepEqual(persistedReview.cases.map((entry) => entry.rating), [null, null]);
});

test('review status command surfaces invalid 5-star checklist evidence before backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-invalid',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].traitChecks[0].passed = false;

	const runPath = join(outputDir, 'device-review-status-invalid.json');
	const reviewPath = join(outputDir, 'device-review-status-invalid.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const progress = JSON.parse(result.stdout);

	assert.equal(progress.summary.rated, 2);
	assert.equal(progress.summary.invalidCount, 1);
	assert.equal(progress.readyForBacklog, false);
	assert.equal(progress.readyForStrictDeviceProof, false);
	assert.match(progress.invalidEntries[0], /traitChecks\[0\] must be passed=true before rating 5/u);
	assert.match(progress.nextAction, /Fix 1 invalid review issue/u);
});

test('review status command only marks strict proof ready for a full device 5-star review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-status-proof-'));
	const partialRun = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-status-proof-partial',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const partialReview = reviewForRun(partialRun, { rating: 5 });
	const fullRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-review-status-proof-full',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const fullReview = reviewForRun(fullRun, { rating: 5 });
	const staleBuildRun = deviceRunForCases(suite, suite.cases, {
		runId: 'device-review-status-proof-stale-build',
		completeTools: true,
		runContext: finalDeviceRunContext({
			app: {
				id: 'com.hoggcountry.trailassistant',
				name: 'Hoggcountry',
				version: '1.0',
				build: '12'
			}
		})
	});
	const staleBuildReview = reviewForRun(staleBuildRun, { rating: 5 });

	const partialRunPath = join(outputDir, 'device-review-status-proof-partial.json');
	const partialReviewPath = join(outputDir, 'device-review-status-proof-partial.review.json');
	const fullRunPath = join(outputDir, 'device-review-status-proof-full.json');
	const fullReviewPath = join(outputDir, 'device-review-status-proof-full.review.json');
	const staleBuildRunPath = join(outputDir, 'device-review-status-proof-stale-build.json');
	const staleBuildReviewPath = join(outputDir, 'device-review-status-proof-stale-build.review.json');
	await writeFile(partialRunPath, `${JSON.stringify(partialRun, null, 2)}\n`);
	await writeFile(partialReviewPath, `${JSON.stringify(partialReview, null, 2)}\n`);
	await writeFile(fullRunPath, `${JSON.stringify(fullRun, null, 2)}\n`);
	await writeFile(fullReviewPath, `${JSON.stringify(fullReview, null, 2)}\n`);
	await writeFile(staleBuildRunPath, `${JSON.stringify(staleBuildRun, null, 2)}\n`);
	await writeFile(staleBuildReviewPath, `${JSON.stringify(staleBuildReview, null, 2)}\n`);

	const partialResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			partialRunPath,
			'--review',
			partialReviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const partialProgress = JSON.parse(partialResult.stdout);
	assert.equal(partialProgress.readyForBacklog, true);
	assert.equal(partialProgress.fullDeviceRun, false);
	assert.equal(partialProgress.readyForStrictDeviceProof, false);
	assert.match(partialProgress.nextAction, /not a full TestFlight\/iPhone device proof candidate/u);

	const fullResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			fullRunPath,
			'--review',
			fullReviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 6 }
	);
	const fullProgress = JSON.parse(fullResult.stdout);
	assert.equal(fullProgress.readyForBacklog, true);
	assert.equal(fullProgress.fullDeviceRun, true);
	assert.equal(fullProgress.readyForStrictDeviceProof, true);
	assert.equal(fullProgress.strictDeviceProofErrors.length, 0);
	assert.equal(fullProgress.summary.fiveStar, suite.cases.length);
	assert.match(fullProgress.nextAction, /verify:scout-local-ai-device-proof/u);

	const staleBuildResult = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai-review.mjs',
			'--run',
			staleBuildRunPath,
			'--review',
			staleBuildReviewPath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 6 }
	);
	const staleBuildProgress = JSON.parse(staleBuildResult.stdout);
	assert.equal(staleBuildProgress.readyForBacklog, true);
	assert.equal(staleBuildProgress.fullDeviceRun, true);
	assert.equal(staleBuildProgress.readyForStrictDeviceProof, false);
	assert.match(staleBuildProgress.strictDeviceProofErrors.join('\n'), /app\.build must be >= 13/u);
	assert.match(staleBuildProgress.nextAction, /strict device proof still has/u);
});

test('partial review status keeps unrated cases explicit when allowed', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-partial-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-partial',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 5;

	const runPath = join(outputDir, 'device-review-partial.json');
	const reviewPath = join(outputDir, 'device-review-partial.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir,
			'--allow-unrated'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-review-partial.backlog.json'), 'utf8'));
	const markdown = await readFile(join(backlogDir, 'device-review-partial.backlog.md'), 'utf8');

	assert.match(result.stdout, /Unrated: 2/u);
	assert.equal(backlog.summary.unrated, 2);
	assert.equal(backlog.items.length, 0);
	assert.equal(backlog.unratedItems.length, 2);
	assert.match(markdown, /No below-5 improvement tasks are available yet because the review is incomplete/u);
	assert.match(markdown, /## Unrated cases/u);
	assert.match(markdown, new RegExp(`### ${review.cases[1].caseId}`, 'u'));
	assert.doesNotMatch(markdown, /strict device proof gate for final readiness/u);
});

test('device run intake rejects scaffold runs by default', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-reject-'));
	const inputPath = join(outputDir, 'scaffold-export.json');
	const run = {
		...deviceRunForCases(suite, suite.cases.slice(0, 1)),
		evidenceLane: 'scaffold-not-model'
	};
	run.results[0].answerOrigin = 'scaffold-not-model';
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				join(outputDir, 'device-runs')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		/evidenceLane must be device-on-device-gemma/u
	);
});

test('device run intake rejects mixed answer origins before review files are created', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-origin-reject-'));
	const inputPath = join(outputDir, 'mixed-origin-export.json');
	const deviceRunDir = join(outputDir, 'device-runs');
	const reviewDir = join(outputDir, 'reviews');
	const packetDir = join(outputDir, 'review-packets');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-mixed-answer-origin',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].answerOrigin = 'scaffold-not-model';
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				deviceRunDir,
				'--review-dir',
				reviewDir,
				'--packet-dir',
				packetDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		/answerOrigin must match run\.evidenceLane device-on-device-gemma/u
	);
	await assert.rejects(readFile(join(deviceRunDir, 'device-mixed-answer-origin.json'), 'utf8'));
	await assert.rejects(readFile(join(reviewDir, 'device-mixed-answer-origin.review.json'), 'utf8'));
});

test('device run intake rejects cloud-mode answers before review files are created', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-cloud-reject-'));
	const inputPath = join(outputDir, 'cloud-mode-export.json');
	const deviceRunDir = join(outputDir, 'device-runs');
	const reviewDir = join(outputDir, 'reviews');
	const packetDir = join(outputDir, 'review-packets');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-cloud-answer-mode',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].mode = 'online';
	run.results[0].provider = 'openai-api';
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				deviceRunDir,
				'--review-dir',
				reviewDir,
				'--packet-dir',
				packetDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		(error) => {
			assert.match(error.stderr, /mode must be on-device for device-on-device-gemma/u);
			assert.match(error.stderr, /provider must be on-device-gemma for device-on-device-gemma/u);
			return true;
		}
	);
	await assert.rejects(readFile(join(deviceRunDir, 'device-cloud-answer-mode.json'), 'utf8'));
	await assert.rejects(readFile(join(reviewDir, 'device-cloud-answer-mode.review.json'), 'utf8'));
});

test('strict device proof accepts a full 5-star device review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-pass-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-pass',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-pass.json');
	const reviewPath = join(outputDir, 'device-final-proof-pass.review.json');
	const proofPath = join(outputDir, 'device-final-proof-pass.proof.md');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-device-proof.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--proof-out',
			proofPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const proof = await readFile(proofPath, 'utf8');

	assert.match(result.stdout, /Scout local AI device proof passed/u);
	assert.match(result.stdout, /5\/5: 100\/100/u);
	assert.match(proof, /Ratings of 5: 100\/100/u);
	assert.ok(proof.includes(`Suite version: \`${suite.version}\``));
	assert.match(proof, /Suite hash: `fnv1a32:[0-9a-f]{8}`/u);
	assert.match(proof, /Required-tool complete: 100\/100/u);
	assert.match(proof, /App version\/build: `1\.0 \(13\)`/u);
	assert.match(proof, /Required app version\/build: `1\.0 \(>= 13\)`/u);
	assert.match(proof, /Install source: `testflight`/u);
	assert.match(proof, /Execution id: `fixture-scout-eval-device-final-proof-pass`/u);
});

test('strict device proof rejects 5-star reviews with missing required tool hits', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-fail',
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /run.summary.toolExpectationComplete must be 100/u);
			assert.match(error.stderr, /missing required tools/u);
			return true;
		}
	);
});

test('strict device proof rejects summary-only tool hits without invocation evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-summary-only-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-summary-only',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	for (const result of run.results) {
		result.toolInvocations = [];
		result.receipts = [];
	}
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-summary-only.json');
	const reviewPath = join(outputDir, 'device-final-proof-summary-only.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			assert.match(error.stderr, /toolExpectations\.hit does not match actual toolInvocations/u);
			return true;
		}
	);
});

test('strict device proof rejects source-backed tool hits without source evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-source-evidence-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-source-evidence',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const sourceResult = run.results.find((result) => result.caseId === sourceCase.id);
	assert.ok(sourceResult, `run should contain ${sourceCase.id}`);
	for (const invocation of sourceResult.toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	sourceResult.receipts = sourceResult.toolInvocations.flatMap((record) => record.receipts ?? []);
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-source-evidence.json');
	const reviewPath = join(outputDir, 'device-final-proof-source-evidence.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, new RegExp(`${sourceCase.id}: source-backed required tool`, 'u'));
			assert.match(error.stderr, /must record at least one receipt or sourceDocumentId/u);
			return true;
		}
	);
});

test('strict device proof rejects 5-star reviews with unchecked rubric items', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-rubric-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-rubric-fail',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].safetyCaveatChecks[0].passed = null;
	const runPath = join(outputDir, 'device-final-proof-rubric-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-rubric-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /safetyCaveatChecks\[0\] must be passed=true/u);
			return true;
		}
	);
});

test('strict device proof rejects 5-star reviews with unacknowledged safety signals', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-safety-signal-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-safety-signal-fail',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].requiredConfirmations = [
		{
			id: 'confirm-live-conditions',
			prompt: 'Confirm the current official conditions before following this plan.',
			reason: 'safety-critical'
		}
	];
	run.results[0].safetyFlags = [
		{
			id: 'official-closure-risk',
			severity: 'critical',
			message: 'Official closure risk must change the hiking plan.'
		}
	];
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].requiredConfirmationChecks[0].acknowledged = false;
	review.cases[0].safetyFlagChecks[0].acknowledged = null;
	const runPath = join(outputDir, 'device-final-proof-safety-signal-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-safety-signal-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /requiredConfirmationChecks\[0\] must be acknowledged=true/u);
			assert.match(error.stderr, /safetyFlagChecks\[0\] must be acknowledged=true/u);
			return true;
		}
	);
});

test('strict device proof rejects final reviews without native app metadata', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-metadata-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-metadata-fail',
		completeTools: true,
		runContext: { surface: 'mobile-settings-scout-eval-lab' }
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-metadata-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-metadata-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /native\.isNativePlatform must be true/u);
			assert.match(error.stderr, /native\.platform must be ios/u);
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /app\.build is required/u);
			assert.match(error.stderr, /runtimeConfigured must be true/u);
			return true;
		}
	);
});

test('strict device proof rejects non-TestFlight iPhone installs', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-install-source-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-debug-install',
		completeTools: true,
		runContext: finalDeviceRunContext({
			installSource: {
				type: 'debug',
				platform: 'ios',
				detectedBy: 'ios-app-store-receipt',
				receiptPresent: false,
				debugBuild: true,
				buildConfiguration: 'debug'
			}
		})
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-debug-install.json');
	const reviewPath = join(outputDir, 'device-final-proof-debug-install.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /got debug/u);
			return true;
		}
	);
});

test('strict device proof rejects stale TestFlight app builds', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-stale-build-'));
	const staleRunContext = finalDeviceRunContext();
	staleRunContext.app = { ...staleRunContext.app, build: '9' };
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-stale-build',
		completeTools: true,
		runContext: staleRunContext
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-stale-build.json');
	const reviewPath = join(outputDir, 'device-final-proof-stale-build.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /app\.build must be >= 13/u);
			assert.match(error.stderr, /got 9/u);
			return true;
		}
	);
});

test('strict device proof rejects stale suite fingerprints', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-stale-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-stale-suite',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteHash: 'fnv1a32:00000000'
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-stale-suite.json');
	const reviewPath = join(outputDir, 'device-final-proof-stale-suite.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /run\.suiteHash/u);
			assert.match(error.stderr, /review\.suiteHash/u);
			return true;
		}
	);
});

test('stability proof accepts two full 5-star device reviews', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-pass-'));
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-pass-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-pass-b',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	runB.generatedAt = '2026-06-26T12:10:00.000Z';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	const runAPath = join(outputDir, 'device-stability-pass-a.json');
	const runBPath = join(outputDir, 'device-stability-pass-b.json');
	const reviewAPath = join(outputDir, 'device-stability-pass-a.review.json');
	const reviewBPath = join(outputDir, 'device-stability-pass-b.review.json');
	const proofPath = join(outputDir, 'device-stability.proof.md');
	await writeFile(runAPath, `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(runBPath, `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(reviewAPath, `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(reviewBPath, `${JSON.stringify(reviewB, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-stability-proof.mjs',
			'--pairs',
			`${runAPath}:${reviewAPath},${runBPath}:${reviewBPath}`,
			'--proof-out',
			proofPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const proof = await readFile(proofPath, 'utf8');

	assert.match(result.stdout, /Scout local AI stability proof passed/u);
	assert.match(result.stdout, /Runs: 2/u);
	assert.match(result.stdout, /Per-case repeated 5\/5: 100\/100/u);
	assert.match(proof, /Reviewed runs: 2/u);
	assert.match(proof, /Run 1: device-stability-pass-a/u);
	assert.match(proof, /Run 2: device-stability-pass-b/u);
	assert.match(proof, /Run generated at: `2026-06-26T12:10:00\.000Z`/u);
	assert.match(proof, /Install source: `testflight`/u);
	assert.match(proof, /Required app version\/build: `1\.0 \(>= 13\)`/u);
	assert.match(proof, /App version\/build: `1\.0 \(13\)`/u);
	assert.match(proof, /Per-case repeated 5\/5: 100\/100/u);
});

test('stability proof rejects a single perfect device review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-fail-one-run',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-stability-fail-one-run.json');
	const reviewPath = join(outputDir, 'device-stability-fail-one-run.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-stability-proof.mjs',
				'--pairs',
				`${runPath}:${reviewPath}`
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /stability proof requires at least 2 distinct full device runs/u);
			return true;
		}
	);
});

test('stability proof rejects copied exports with new run ids', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-copy-'));
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-copy-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = JSON.parse(JSON.stringify(runA));
	runB.runId = 'device-stability-copy-b';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	const runAPath = join(outputDir, 'device-stability-copy-a.json');
	const runBPath = join(outputDir, 'device-stability-copy-b.json');
	const reviewAPath = join(outputDir, 'device-stability-copy-a.review.json');
	const reviewBPath = join(outputDir, 'device-stability-copy-b.review.json');
	await writeFile(runAPath, `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(runBPath, `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(reviewAPath, `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(reviewBPath, `${JSON.stringify(reviewB, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-stability-proof.mjs',
				'--pairs',
				`${runAPath}:${reviewAPath},${runBPath}:${reviewBPath}`
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /duplicate run execution fingerprint/u);
			assert.match(error.stderr, /separate Eval Lab executions/u);
			return true;
		}
	);
});

function dadPilotFixture() {
	const dadGroupId = 'fc963396-a087-44c6-b56b-29847da31cd4';
	const targetBuild = {
		type: 'builds',
		id: 'build-13-id',
		attributes: {
			version: '13',
			uploadedDate: '2026-06-26T18:30:00-07:00',
			processingState: 'VALID'
		},
		relationships: {
			preReleaseVersion: {
				data: { type: 'preReleaseVersions', id: 'pre-1-0' }
			},
			buildBetaDetail: {
				data: { type: 'buildBetaDetails', id: 'build-13-id' }
			},
			betaGroups: {
				data: []
			}
		}
	};
	return {
		buildQuery: {
			data: [targetBuild],
			included: [
				{
					type: 'preReleaseVersions',
					id: 'pre-1-0',
					attributes: {
						version: '1.0',
						platform: 'IOS'
					}
				},
				{
					type: 'buildBetaDetails',
					id: 'build-13-id',
					attributes: {
						internalBuildState: 'READY_FOR_BETA_TESTING',
						externalBuildState: 'IN_BETA_TESTING'
					}
				},
				{
					type: 'betaAppReviewSubmissions',
					id: 'review-build-13',
					attributes: {
						betaReviewState: 'APPROVED'
					}
				}
			]
		},
		group: {
			data: {
				type: 'betaGroups',
				id: dadGroupId,
				attributes: {
					name: 'Dad Pilot',
					publicLinkEnabled: true,
					publicLinkLimit: 5,
					publicLink: 'https://testflight.apple.com/join/BagBCrzf'
				},
				relationships: {
					betaTesters: {
						data: [{ type: 'betaTesters', id: 'dad-tester' }]
					},
					builds: {
						data: [{ type: 'builds', id: 'build-12-id' }]
					}
				}
			},
			included: [
				{
					type: 'builds',
					id: 'build-12-id',
					attributes: {
						version: '12',
						uploadedDate: '2026-06-26T14:15:00-07:00',
						processingState: 'VALID'
					}
				},
				{
					type: 'betaTesters',
					id: 'dad-tester',
					attributes: {
						firstName: 'Dad'
					}
				}
			]
		}
	};
}

function dadPilotReadyForBetaSubmissionFixture() {
	const fixture = dadPilotFixture();
	const betaDetail = fixture.buildQuery.included.find((entry) => entry.type === 'buildBetaDetails' && entry.id === 'build-13-id');
	betaDetail.attributes.externalBuildState = 'READY_FOR_BETA_SUBMISSION';
	fixture.buildQuery.included = fixture.buildQuery.included.filter((entry) => entry.type !== 'betaAppReviewSubmissions');
	return fixture;
}

function assertNonEmptyStringArray(value, label) {
	assert.ok(Array.isArray(value), `${label} must be an array`);
	assert.ok(value.length > 0, `${label} must not be empty`);
	for (const item of value) {
		assert.equal(typeof item, 'string', `${label} values must be strings`);
		assert.ok(item.trim().length > 0, `${label} values must not be blank`);
	}
}

function assertValidToolExpectation(expectation, caseId) {
	const [toolId, sourceSkill, extra] = expectation.split(':');
	assert.equal(extra, undefined, `${caseId} tool expectation ${expectation} has too many parts`);
	assert.ok(VALID_TOOL_IDS.has(toolId), `${caseId} requires unknown tool ${toolId}`);
	if (sourceSkill) {
		assert.ok(
			toolId === 'source_search' || toolId === 'open_source_doc',
			`${caseId} can only attach source skills to source_search/open_source_doc`
		);
		assert.ok(VALID_SOURCE_SKILLS.has(sourceSkill), `${caseId} has unknown source skill ${sourceSkill}`);
	}
}

function finalDeviceRunContext(patch = {}) {
	return {
		surface: 'mobile-settings-scout-eval-lab',
		scoutLane: 'ios-on-device-gemma',
		modelState: 'ready',
		modelId: 'gemma-3n-E4B-it-int4',
		runtimeConfigured: true,
		svelteKitVersion: 'test-version',
		userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X)',
		native: {
			isNativePlatform: true,
			platform: 'ios'
		},
		app: {
			id: 'com.hoggcountry.trailassistant',
			name: 'Hoggcountry',
			version: '1.0',
			build: '13'
		},
		installSource: {
			type: 'testflight',
			platform: 'ios',
			detectedBy: 'ios-app-store-receipt',
			receiptPresent: true,
			receiptLastPathComponent: 'sandboxReceipt',
			debugBuild: false,
			buildConfiguration: 'release'
		},
		...patch
	};
}

function simulatorDeviceRunContext(patch = {}) {
	return finalDeviceRunContext({
		installSource: {
			type: 'debug',
			platform: 'ios',
			detectedBy: 'simulator-debug-build',
			receiptPresent: false,
			debugBuild: true,
			buildConfiguration: 'debug'
		},
		...patch
	});
}

function cleanPreflightAnswer() {
	return 'Use the current forecast and cached weather note, then make the conservative field call from the local field pack. Keep the field pack refreshed, confirm local AI and the Gemma model are ready, let cloud sync finish for backup, check closures, and treat stale data as not current until refreshed again. For money planning, track daily burn, town spikes, hostel, shuttle, laundry, meal, gear replacement, and an emergency cushion. If a filter froze, treat it as potentially compromised, carry backup water tablets, and sleep with the filter in your sleeping bag.';
}

function deviceRunForCases(suite, cases, options = {}) {
	const runId = options.runId ?? 'device-smoke-run';
	const runContext = withFixtureExecutionContext(options.runContext ?? { surface: 'testflight-ios' }, runId);
	const results = cases.map((testCase, index) => {
		const toolInvocations = options.completeTools ? toolInvocationsFor(testCase) : [];
		return {
			caseId: testCase.id,
			index: index + 1,
			case: testCase,
			answer: `device answer for ${testCase.id}`,
			answerOrigin: 'device-on-device-gemma',
			confidence: 'medium',
			mode: 'on-device',
			provider: 'on-device-gemma',
			generatedAt: '2026-06-26T12:00:00.000Z',
			durationMs: 1200 + index,
			contextUsed: ['on-device-gemma'],
			receipts: toolInvocations.flatMap((record) => record.receipts),
			requiredConfirmations: [],
			safetyFlags: [],
			toolInvocations,
			toolExpectations: {
				required: testCase.requiredTools,
				hit: options.completeTools ? testCase.requiredTools : [],
				missing: options.completeTools ? [] : testCase.requiredTools
			},
			bridge: null,
			rating: null,
			reviewerNotes: '',
			failureMode: null,
			suggestedFailureCategories: ['bad-routing', 'weak-tool'],
			improvementTask: null
		};
	});
	const toolExpectationComplete = results.filter((result) => result.toolExpectations.missing.length === 0).length;
	const missingToolCounts = {};
	for (const result of results) {
		for (const missing of result.toolExpectations.missing) {
			missingToolCounts[missing] = (missingToolCounts[missing] ?? 0) + 1;
		}
	}
	return {
		schemaVersion: 1,
		runId,
		suiteId: suite.suiteId,
		suiteTitle: suite.title,
		suiteVersion: options.suiteVersion ?? suite.version,
		suiteHash: options.suiteHash ?? scoutLocalAiSuiteHash(suite),
		suitePath: 'mobile/static/scout/dad-local-ai-100.json',
		generatedAt: '2026-06-26T12:00:00.000Z',
		evidenceLane: 'device-on-device-gemma',
		modelCommand: null,
		runContext,
		caseCount: results.length,
		totalSuiteCases: suite.cases.length,
		filters: { id: null, domain: null, phase: null, limit: results.length },
		ratingScale: suite.ratingScale,
		failureCategories: suite.failureCategories,
		summary: {
			toolExpectationComplete,
			missingToolCases: results.length - toolExpectationComplete,
			missingToolCounts,
			...summarizeRunSourceEvidence(results)
		},
		results
	};
}

function withFixtureExecutionContext(runContext, runId) {
	if (!runContext || typeof runContext !== 'object' || Array.isArray(runContext)) return runContext;
	if (runContext.execution && typeof runContext.execution === 'object' && !Array.isArray(runContext.execution)) {
		return runContext;
	}
	return {
		...runContext,
		execution: {
			id: `fixture-scout-eval-${runId}`,
			runId,
			startedAt: '2026-06-26T12:00:00.000Z',
			evidenceLane: 'device-on-device-gemma',
			source: 'scout-local-ai-eval'
		}
	};
}

function exportHandoffForRun(run, suite, options = {}) {
	const fullRun = run.caseCount >= suite.cases.length && (run.filters?.limit ?? run.totalSuiteCases) >= suite.cases.length;
	const expectedAcceptanceStatus = options.expectedAcceptanceStatus ??
		(fullRun ? 'final-review-ready' : 'diagnostic-review-only');
	const kind = expectedAcceptanceStatus === 'final-review-ready' ? 'final-run-100' : 'diagnostic';
	return {
		schemaVersion: 1,
		kind,
		label: kind === 'final-run-100'
			? 'Final Run 100 JSON ready for inbox review'
			: 'Diagnostic export only',
		expectedAcceptanceStatus,
		canStartFinalReview: expectedAcceptanceStatus === 'final-review-ready',
		reviewInboxPath: 'data/scout-local-ai/inbox/',
		prepareReviewCommand: expectedAcceptanceStatus === 'diagnostic-review-only'
			? 'npm run prepare-review:scout-local-ai-device-run -- --run inbox --allow-partial'
			: 'npm run prepare-review:scout-local-ai-device-run -- --run inbox',
		proofBoundary: expectedAcceptanceStatus === 'final-review-ready'
			? 'This starts human review only. Final Dad readiness still requires all 100 cases rated 5/5, strict device proof, and second stability proof.'
			: 'Finish Run 100 on the TestFlight iPhone before final human rating. Smoke and partial exports are diagnostic only.',
		recommendedAction: expectedAcceptanceStatus === 'final-review-ready'
			? 'Save this JSON into data/scout-local-ai/inbox/, then run npm run prepare-review:scout-local-ai-device-run -- --run inbox.'
			: 'Use this for smoke/interrupted-run recovery only, then finish Run 100 on the TestFlight iPhone.',
		proofContextProblems: [],
		suite: {
			suiteId: suite.suiteId,
			version: suite.version,
			hash: scoutLocalAiSuiteHash(suite),
			caseCount: suite.cases.length
		},
		run: {
			runId: run.runId,
			completedCases: run.caseCount,
			targetCases: run.filters?.limit ?? run.totalSuiteCases,
			evidenceLane: run.evidenceLane
		}
	};
}

function toolInvocationsFor(testCase) {
	return testCase.requiredTools.map((expectation) => {
		const [toolId, sourceSkill] = expectation.split(':');
		const receipt = {
			id: `test-receipt:${testCase.id}:${expectation}`,
			title: `Fixture receipt for ${expectation}`,
			kind: sourceSkill ? 'field-guide' : 'trail-pack',
			citation: `Fixture citation for ${testCase.id}`
		};
		return {
			toolId,
			args: sourceSkill ? { sourceSkill } : {},
			summary: `Fixture tool invocation for ${expectation}`,
			confidence: 'medium',
			receipts: [receipt],
			sourceDocumentIds: sourceSkill ? [`fixture-doc:${sourceSkill}`] : undefined
		};
	});
}

function reviewForRun(run, options = {}) {
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		suiteVersion: run.suiteVersion,
		suiteHash: run.suiteHash,
		runPath: `${run.runId}.json`,
		evidenceLane: run.evidenceLane,
		ratingScale: run.ratingScale,
		failureCategories: run.failureCategories,
		cases: run.results.map((result) => ({
			caseId: result.caseId,
			domain: result.case.domain,
			phase: result.case.phase,
			prompt: result.case.prompt,
			answerOrigin: result.answerOrigin,
			expectedTraits: result.case.expectedTraits,
			safetyCaveats: result.case.safetyCaveats,
			traitChecks: rubricChecksFor(result.case.expectedTraits),
			safetyCaveatChecks: rubricChecksFor(result.case.safetyCaveats),
			requiredConfirmationChecks: signalChecksFor(result.requiredConfirmations, requiredConfirmationText),
			safetyFlagChecks: signalChecksFor(result.safetyFlags, safetyFlagText),
			toolExpectations: result.toolExpectations,
			safetyFlags: result.safetyFlags,
			requiredConfirmations: result.requiredConfirmations,
			answerPreview: result.answer.slice(0, 900),
			rating: options.rating ?? null,
			notes: '',
			failureCategories: [],
			improvementTask: '',
			ownerLayer: ''
		}))
	};
}

function rubricChecksFor(items) {
	return items.map((text) => ({
		text,
		passed: true,
		notes: ''
	}));
}

function signalChecksFor(items, textFor) {
	return (items ?? []).map((item) => ({
		text: textFor(item),
		acknowledged: true,
		notes: ''
	}));
}

function requiredConfirmationText(confirmation) {
	const id = confirmation?.id ?? '<missing-id>';
	const prompt = confirmation?.prompt ?? '(no prompt)';
	const reason = confirmation?.reason ?? 'reason unknown';
	return `${id}: ${prompt} (${reason})`;
}

function safetyFlagText(flag) {
	const severity = flag?.severity ?? 'unknown';
	const message = flag?.message ?? '(no message)';
	const id = flag?.id ?? '<missing-id>';
	return `${severity}: ${message} (${id})`;
}

function replaceReviewerFields(packet, caseId, fields) {
	const headingPattern = new RegExp(`^## ${caseId} - .*$`, 'mu');
	const match = packet.match(headingPattern);
	assert.ok(match?.index !== undefined, `packet should contain ${caseId}`);
	const start = match.index;
	const nextHeading = packet.slice(start + match[0].length).search(/\n## DLA-\d{3} - /u);
	const end = nextHeading === -1 ? packet.length : start + match[0].length + nextHeading;
	let block = packet.slice(start, end);
	block = block
		.replace(/^- Rating:.*$/mu, `- Rating: ${fields.rating}`)
		.replace(/^- Notes:.*$/mu, `- Notes: ${fields.notes}`)
		.replace(/^- Failure categories:.*$/mu, `- Failure categories: ${fields.failureCategories}`)
		.replace(/^- Owner layer:.*$/mu, `- Owner layer: ${fields.ownerLayer}`)
		.replace(/^- Improvement task:.*$/mu, `- Improvement task: ${fields.improvementTask}`);
	return `${packet.slice(0, start)}${block}${packet.slice(end)}`;
}

function removeReviewCaseBlock(packet, caseId) {
	const headingPattern = new RegExp(`^## ${caseId} - .*$`, 'mu');
	const match = packet.match(headingPattern);
	assert.ok(match?.index !== undefined, `packet should contain ${caseId}`);
	const start = match.index;
	const nextHeading = packet.slice(start + match[0].length).search(/\n## DLA-\d{3} - /u);
	const end = nextHeading === -1 ? packet.length : start + match[0].length + nextHeading;
	const before = packet.slice(0, start).replace(/[ \t]*\n*$/u, '\n\n');
	const after = packet.slice(end).replace(/^\n+/u, '');
	return `${before}${after}`;
}

function execFileWithInput(file, args, input, options = {}) {
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(file, args, {
			cwd: options.cwd,
			env: options.env,
			stdio: ['pipe', 'pipe', 'pipe']
		});
		let stdout = '';
		let stderr = '';
		const maxBuffer = options.maxBuffer ?? 1024 * 1024;
		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');
		child.stdout.on('data', (chunk) => {
			stdout += chunk;
			if (stdout.length > maxBuffer) child.kill();
		});
		child.stderr.on('data', (chunk) => {
			stderr += chunk;
			if (stderr.length > maxBuffer) child.kill();
		});
		child.on('error', rejectPromise);
		child.on('close', (code, signal) => {
			if (code === 0) {
				resolvePromise({ stdout, stderr });
				return;
			}
			const error = new Error(`Command failed: ${file} ${args.join(' ')}`);
			error.code = code;
			error.signal = signal;
			error.stdout = stdout;
			error.stderr = stderr;
			rejectPromise(error);
		});
		child.stdin.end(input);
	});
}
