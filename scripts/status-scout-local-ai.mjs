import { execFile } from 'node:child_process';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
	requiredAppLabel,
	verifyScoutLocalAiDeviceProof
} from './lib/scout-local-ai-device-proof.mjs';
import {
	inspectDeviceRun
} from './lib/scout-local-ai-device-run-inspector.mjs';
import {
	parseCliArgs,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';
import {
	createScoutLocalAiPhoneBuildAction
} from './lib/scout-local-ai-phone-build-action.mjs';
import {
	summarizeRunSourceEvidence
} from './lib/scout-local-ai-source-evidence.mjs';
import {
	summarizeScoutLocalAiGeneralizationCoverage
} from './lib/scout-local-ai-generalization.mjs';
import {
	scoutLocalAiStabilityRunFingerprint
} from './lib/scout-local-ai-stability.mjs';
import {
	summarizeScoutLocalAiSuiteCoverage
} from './lib/scout-local-ai-suite-coverage.mjs';
import {
	summarizeScoutLocalAiTaskClassCoverage
} from './lib/scout-local-ai-task-classes.mjs';
import {
	scoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';
import {
	ScoutEvalRunJsonParseError,
	isSupportedScoutEvalExportFileName,
	readScoutEvalRunJson
} from './lib/scout-local-ai-run-json.mjs';
import {
	scanScoutLocalAiAnswerQuality
} from './scan-scout-local-ai-answer-quality.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const execFileAsync = promisify(execFile);

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_MOBILE_SUITE = 'mobile/static/scout/dad-local-ai-100.json';
const DEFAULT_RUNS_DIR = 'data/scout-local-ai/runs';
const DEFAULT_DEVICE_RUNS_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_INBOX_DIR = 'data/scout-local-ai/inbox';
const DEFAULT_DOWNLOADS_DIR = process.env.SCOUT_LOCAL_AI_DOWNLOADS_DIR ?? '~/Downloads';
const DEFAULT_REVIEWS_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_SCAN_DIR = 'data/scout-local-ai/answer-quality-scans';
const DEFAULT_BACKLOG_DIR = 'data/scout-local-ai/backlog';
const DEFAULT_ITERATIONS_DIR = 'data/scout-local-ai/iterations';
const DEFAULT_HISTORY_JSON = 'data/scout-local-ai/history/scout-local-ai-history.json';
const DEFAULT_HISTORY_HTML = 'data/scout-local-ai/history/scout-local-ai-history.html';
const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';
const DEFAULT_IOS_PROOF_DIR = 'docs/launch/proof';

const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';
const SCAFFOLD_EVIDENCE_LANE = 'scaffold-not-model';
const DEVICE_REVIEW_PREP_COMMAND = 'npm run prepare-review:scout-local-ai-device-run -- --run inbox';
const DEVICE_REVIEW_PREP_DOWNLOADS_COMMAND = 'npm run prepare-review:scout-local-ai-device-run -- --run latest';
const DEVICE_REVIEW_WAIT_COMMAND = 'npm run wait:scout-local-ai-device-run';
const DEVICE_REVIEW_WAIT_ALL_COMMAND = 'npm run wait:scout-local-ai-device-run -- --source all';
const DEVICE_REVIEW_WAIT_CLIPBOARD_COMMAND = 'npm run wait:scout-local-ai-device-run -- --source clipboard';
const DEVICE_RECEIVE_CLIPBOARD_COMMAND = 'npm run receive:scout-local-ai-device-run -- --clipboard';
const DEVICE_RECEIVE_STDIN_COMMAND = 'npm run receive:scout-local-ai-device-run -- --stdin';
const REVIEW_STATUS_COMMAND = 'npm run review-status:scout-local-ai';
const FINALIZE_REVIEW_COMMAND = 'npm run finalize-review:scout-local-ai';
const REVIEW_PACKET_DIR = 'data/scout-local-ai/review-packets';
const LOCAL_PREFLIGHT_IGNORED_SOURCE_PATHS = new Set([
	'mobile/scripts/ios-testflight.mjs'
]);

if (!isImported()) {
	const cli = parseCliArgs(process.argv.slice(2));
	const status = await buildStatus({
		suitePath: resolveInputPath(cli.suite ?? DEFAULT_SUITE),
		mobileSuitePath: resolveInputPath(cli.mobileSuite ?? DEFAULT_MOBILE_SUITE),
		runsDir: resolveInputPath(cli.runsDir ?? DEFAULT_RUNS_DIR),
		deviceRunsDir: resolveInputPath(cli.deviceRunsDir ?? DEFAULT_DEVICE_RUNS_DIR),
		inboxDir: resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR),
		downloadsDir: resolveInputPath(cli.downloadsDir ?? DEFAULT_DOWNLOADS_DIR),
		reviewsDir: resolveInputPath(cli.reviewsDir ?? DEFAULT_REVIEWS_DIR),
		scanDir: resolveInputPath(cli.scanDir ?? DEFAULT_SCAN_DIR),
		backlogDir: resolveInputPath(cli.backlogDir ?? DEFAULT_BACKLOG_DIR),
		iterationsDir: resolveInputPath(cli.iterationsDir ?? DEFAULT_ITERATIONS_DIR),
		historyJsonPath: resolveInputPath(cli.historyJson ?? DEFAULT_HISTORY_JSON),
		historyHtmlPath: resolveInputPath(cli.historyHtml ?? DEFAULT_HISTORY_HTML),
		xcodeProjectPath: resolveInputPath(cli.xcodeProject ?? DEFAULT_XCODE_PROJECT),
		releaseEvidencePath: resolveInputPath(cli.releaseEvidence ?? DEFAULT_RELEASE_EVIDENCE),
		iosProofDir: resolveInputPath(cli.iosProofDir ?? DEFAULT_IOS_PROOF_DIR)
	});

	if (cli.json) {
		console.log(JSON.stringify(status, null, 2));
	} else {
		console.log(createStatusMarkdown(status));
	}
}

export async function buildStatus(paths) {
	paths = {
		suitePath: resolve(REPO_ROOT, DEFAULT_SUITE),
		mobileSuitePath: resolve(REPO_ROOT, DEFAULT_MOBILE_SUITE),
		runsDir: resolve(REPO_ROOT, DEFAULT_RUNS_DIR),
		deviceRunsDir: resolve(REPO_ROOT, DEFAULT_DEVICE_RUNS_DIR),
		inboxDir: resolve(REPO_ROOT, DEFAULT_INBOX_DIR),
		downloadsDir: resolveInputPath(DEFAULT_DOWNLOADS_DIR),
		reviewsDir: resolve(REPO_ROOT, DEFAULT_REVIEWS_DIR),
		scanDir: resolve(REPO_ROOT, DEFAULT_SCAN_DIR),
		backlogDir: resolve(REPO_ROOT, DEFAULT_BACKLOG_DIR),
		iterationsDir: resolve(REPO_ROOT, DEFAULT_ITERATIONS_DIR),
		historyJsonPath: resolve(REPO_ROOT, DEFAULT_HISTORY_JSON),
		historyHtmlPath: resolve(REPO_ROOT, DEFAULT_HISTORY_HTML),
		xcodeProjectPath: resolve(REPO_ROOT, DEFAULT_XCODE_PROJECT),
		releaseEvidencePath: resolve(REPO_ROOT, DEFAULT_RELEASE_EVIDENCE),
		iosProofDir: resolve(REPO_ROOT, DEFAULT_IOS_PROOF_DIR),
		...paths
	};
	const generatedAt = new Date().toISOString();
	const suite = await readJson(paths.suitePath);
	const mobileSuite = await readOptionalJson(paths.mobileSuitePath);
	const suiteIdentity = scoutLocalAiSuiteIdentity(suite);
	const finalProof = summarizeFinalProofRequirement(suite);
	const suiteErrors = validateSuite(suite, mobileSuite, suiteIdentity);
	const suiteCoverage = summarizeScoutLocalAiSuiteCoverage(suite);
	const taskClassCoverage = summarizeScoutLocalAiTaskClassCoverage(suite);
	const generalizationCoverage = summarizeScoutLocalAiGeneralizationCoverage(suite);
	const runs = await loadJsonFiles(paths.runsDir);
	const deviceRuns = await loadJsonFiles(paths.deviceRunsDir);
	const reviews = await loadJsonFiles(paths.reviewsDir);
	const backlogs = await loadJsonFiles(paths.backlogDir);
	const iterationFiles = await loadJsonFiles(paths.iterationsDir);
	const inbox = await summarizeInbox(paths.inboxDir, suite);
	const downloads = await summarizeDownloads(paths.downloadsDir, suite);
	const iosBuild = await readOptionalIosBuildSettings(paths.xcodeProjectPath);
	const releaseEvidence = await readOptionalJson(paths.releaseEvidencePath);
	const nativeSource = await summarizeNativeSource({
		iosProofDir: paths.iosProofDir,
		mobileSuitePath: paths.mobileSuitePath,
		suiteIdentity
	});
	const testflight = summarizeTestFlightTarget({ iosBuild, releaseEvidence, finalProof, paths });
	const allRuns = [...runs, ...deviceRuns];
	const reviewsByRunId = new Map(reviews.map((entry) => [entry.value.runId, entry]));
	const currentRuns = allRuns.filter((entry) => isCurrentRun(entry.value, suite, suiteIdentity));
	const currentBacklogs = backlogs.filter((entry) => isCurrentBacklog(entry.value, suite, suiteIdentity));
	const currentIterationPlans = iterationFiles.filter((entry) => isCurrentIterationPlan(entry.value, suite, suiteIdentity));
	const currentDeviceRuns = currentRuns.filter((entry) => entry.value.evidenceLane === DEVICE_EVIDENCE_LANE);
	const currentFullDeviceRuns = currentDeviceRuns.filter((entry) => isFullRun(entry.value, suite));
	const currentPartialDeviceRuns = currentDeviceRuns.filter((entry) => !isFullRun(entry.value, suite));
	const currentFullFinalProofDeviceRuns = currentFullDeviceRuns.filter((entry) => deviceRunSatisfiesFinalProof(entry.value, finalProof));
	const currentFullNonFinalProofDeviceRuns = currentFullDeviceRuns.filter((entry) => !deviceRunSatisfiesFinalProof(entry.value, finalProof));
	const currentFullLocalPreflightRuns = currentFullDeviceRuns.filter((entry) => isLocalPreflightRun(entry.value, finalProof));
	const currentPartialLocalPreflightRuns = currentPartialDeviceRuns.filter((entry) => isLocalPreflightRun(entry.value, finalProof));
	testflight.currentTargetDeviceRunCount = currentFullDeviceRuns.filter((entry) => deviceRunMatchesTargetBuild(entry.value, testflight)).length;
	testflight.currentTargetPartialDeviceRunCount = currentPartialDeviceRuns.filter((entry) => deviceRunMatchesTargetBuild(entry.value, testflight)).length;
	testflight.currentSuiteCompatibleDeviceRunCount = currentFullDeviceRuns.filter((entry) => deviceRunSatisfiesFinalProof(entry.value, finalProof)).length;
	testflight.currentSuiteCompatiblePartialDeviceRunCount = currentPartialDeviceRuns.filter((entry) => deviceRunSatisfiesFinalProof(entry.value, finalProof)).length;
	testflight.latestNativeUploadHasCurrentSuite = nativeSource.latestNativeUploadHasCurrentSuite;
	testflight.latestNativeUploadSuiteVersion = nativeSource.latestNativeUploadSuiteVersion;
	testflight.latestNativeUploadSuiteHash = nativeSource.latestNativeUploadSuiteHash;
	testflight.currentSuiteVersion = suiteIdentity.suiteVersion;
	testflight.currentSuiteHash = suiteIdentity.suiteHash;
	testflight.targetBuildContainsCurrentSuite = Boolean(testflight.targetBuildReadyForDad && nativeSource.latestNativeUploadHasCurrentSuite);
	testflight.suiteCompatibleDadPilotBuildAvailable = Boolean(
		testflight.recordedDadPilotMeetsSuiteRequirement && nativeSource.latestNativeUploadHasCurrentSuite
	);
	testflight.targetBuildAvailableForDad =
		testflight.targetBuildContainsCurrentSuite ||
		testflight.suiteCompatibleDadPilotBuildAvailable ||
		testflight.currentTargetDeviceRunCount > 0 ||
		testflight.currentSuiteCompatibleDeviceRunCount > 0;
	const phoneBuildAction = createScoutLocalAiPhoneBuildAction({ testflight, nativeSource });
	const currentFullToolCompleteRuns = currentRuns.filter(
		(entry) => isFullRun(entry.value, suite) && hasCompleteToolExpectations(entry.value, suite) && hasCompleteSourceEvidence(entry.value)
	);
	const currentFullRoutingRuns = currentRuns.filter(
		(entry) => entry.value.evidenceLane === SCAFFOLD_EVIDENCE_LANE && isFullRun(entry.value, suite) && hasCompleteToolExpectations(entry.value, suite) && hasCompleteSourceEvidence(entry.value)
	);
	const localPreflight = await summarizeLocalPreflight({
		currentFullLocalPreflightRuns,
		currentPartialLocalPreflightRuns,
		suite,
		finalProof
	});
	const reviewSummaries = reviews.map((entry) => ({
		path: entry.path,
		runId: entry.value.runId ?? '<missing>',
		evidenceLane: entry.value.evidenceLane ?? '<missing>',
		suiteVersion: entry.value.suiteVersion ?? '<missing>',
		suiteHash: entry.value.suiteHash ?? '<missing>',
		summary: summarizeReview(entry.value)
	}));
	const currentDeviceReviewSummaries = reviewSummaries.filter((entry) => {
		const run = currentFullFinalProofDeviceRuns.find((candidate) => candidate.value.runId === entry.runId)?.value;
		return Boolean(run) && entry.evidenceLane === DEVICE_EVIDENCE_LANE;
	});
	const completeFiveStarDeviceReviews = currentDeviceReviewSummaries.filter(
		(entry) => entry.summary.total === suite.cases.length &&
			entry.summary.rated === suite.cases.length &&
			entry.summary.belowFive === 0 &&
			(entry.summary.ratingCounts['5'] ?? 0) === suite.cases.length &&
			entry.summary.invalid.length === 0
	);
	const iterationDebt = summarizeIterationDebt(
		currentDeviceReviewSummaries,
		currentBacklogs,
		currentIterationPlans
	);
	const latestGitEvent = await latestGitEventForHistory();
	const history = await summarizeHistoryFreshness({
		historyJsonPath: paths.historyJsonPath,
		historyHtmlPath: paths.historyHtmlPath,
		sourceFiles: [
			paths.suitePath,
			paths.mobileSuitePath,
			resolve(REPO_ROOT, 'scripts/build-scout-local-ai-history.mjs'),
			resolve(REPO_ROOT, 'scripts/scan-scout-local-ai-answer-quality.mjs')
		],
		sourceDirs: [
			paths.runsDir,
			paths.deviceRunsDir,
			paths.reviewsDir,
			paths.scanDir
		],
		sourceEvents: latestGitEvent ? [latestGitEvent] : [],
		repoRoot: REPO_ROOT
	});
	const strictDeviceProofs = currentFullFinalProofDeviceRuns.map((runEntry) => {
		const reviewEntry = reviewsByRunId.get(runEntry.value.runId);
		if (!reviewEntry) {
			return {
				runId: runEntry.value.runId,
				runPath: relative(REPO_ROOT, runEntry.path),
				reviewPath: null,
				ok: false,
				errorCount: 1,
				errors: ['matching review file is missing']
			};
		}
		const result = verifyScoutLocalAiDeviceProof({
			suite,
			run: runEntry.value,
			review: reviewEntry.value
		});
		return {
			runId: runEntry.value.runId,
			runPath: relative(REPO_ROOT, runEntry.path),
			reviewPath: relative(REPO_ROOT, reviewEntry.path),
			executionFingerprint: scoutLocalAiStabilityRunFingerprint(runEntry.value),
			ok: result.errors.length === 0,
			errorCount: result.errors.length,
			errors: result.errors.slice(0, 12)
		};
	});
	const strictDeviceProofPasses = strictDeviceProofs.filter((proof) => proof.ok);
	const gates = createGates({
		suiteErrors,
		suiteCoverage,
		taskClassCoverage,
		generalizationCoverage,
		suite,
		suiteIdentity,
		testflight,
		iterationDebt,
		currentFullRoutingRuns,
		currentFullToolCompleteRuns,
		localPreflight,
		currentFullDeviceRuns,
		currentFullFinalProofDeviceRuns,
		currentFullNonFinalProofDeviceRuns,
		currentPartialDeviceRuns,
		completeFiveStarDeviceReviews,
		strictDeviceProofPasses,
		finalProof
	});
	return {
		schemaVersion: 1,
		generatedAt,
		suite: {
			path: relative(REPO_ROOT, paths.suitePath),
			mobilePath: relative(REPO_ROOT, paths.mobileSuitePath),
			suiteId: suite.suiteId ?? '<missing>',
			version: suite.version ?? '<missing>',
			hash: suiteIdentity.suiteHash,
			caseCount: Array.isArray(suite.cases) ? suite.cases.length : 0,
			finalProof,
			mobileCopyMatches: mobileSuite ? stableJson(mobileSuite) === stableJson(suite) : false,
			coverage: suiteCoverage,
			taskClassCoverage,
			generalizationCoverage,
			errors: suiteErrors
		},
		paths: {
			runsDir: relative(REPO_ROOT, paths.runsDir),
			deviceRunsDir: relative(REPO_ROOT, paths.deviceRunsDir),
			inboxDir: relative(REPO_ROOT, paths.inboxDir),
			downloadsDir: displayPath(paths.downloadsDir),
			reviewsDir: relative(REPO_ROOT, paths.reviewsDir),
			scanDir: relative(REPO_ROOT, paths.scanDir),
			backlogDir: relative(REPO_ROOT, paths.backlogDir),
			iterationsDir: relative(REPO_ROOT, paths.iterationsDir),
			historyJson: relative(REPO_ROOT, paths.historyJsonPath),
			historyHtml: relative(REPO_ROOT, paths.historyHtmlPath),
			xcodeProject: relative(REPO_ROOT, paths.xcodeProjectPath),
			releaseEvidence: relative(REPO_ROOT, paths.releaseEvidencePath),
			iosProofDir: relative(REPO_ROOT, paths.iosProofDir)
		},
		nativeSource,
		phoneBuildAction,
		testflight,
		localPreflight,
		inbox,
		downloads,
		runs: {
			totalLoaded: allRuns.length,
			currentSuiteRuns: currentRuns.length,
			currentFullRoutingRuns: summarizeRunList(currentFullRoutingRuns),
			currentFullDeviceRuns: summarizeRunList(currentFullDeviceRuns),
			currentFullFinalProofDeviceRuns: summarizeRunList(currentFullFinalProofDeviceRuns),
			currentFullNonFinalProofDeviceRuns: summarizeRunList(currentFullNonFinalProofDeviceRuns),
			currentFullLocalPreflightRuns: summarizeRunList(currentFullLocalPreflightRuns),
			currentPartialLocalPreflightRuns: summarizeRunList(currentPartialLocalPreflightRuns),
			currentPartialDeviceRuns: summarizeRunList(currentPartialDeviceRuns),
			currentFullToolCompleteRuns: summarizeRunList(currentFullToolCompleteRuns),
			byLane: countBy(allRuns, (entry) => entry.value.evidenceLane ?? '<missing>'),
			currentByLane: countBy(currentRuns, (entry) => entry.value.evidenceLane ?? '<missing>'),
			byModelRuntime: countBy(allRuns, (entry) => modelRuntimeKey(entry.value)),
			currentByModelRuntime: countBy(currentRuns, (entry) => modelRuntimeKey(entry.value))
		},
		reviews: {
			totalLoaded: reviews.length,
			currentDeviceReviews: currentDeviceReviewSummaries.map((entry) => ({
				runId: entry.runId,
				path: relative(REPO_ROOT, entry.path),
				rated: entry.summary.rated,
				total: entry.summary.total,
				belowFive: entry.summary.belowFive,
				unrated: entry.summary.unrated,
				fiveStar: entry.summary.ratingCounts['5'] ?? 0,
				invalidCount: entry.summary.invalid.length
			})),
			completeFiveStarDeviceReviews: completeFiveStarDeviceReviews.map((entry) => ({
				runId: entry.runId,
				path: relative(REPO_ROOT, entry.path)
			}))
		},
		iterations: {
			totalBacklogsLoaded: backlogs.length,
			currentBacklogs: summarizeBacklogList(currentBacklogs),
			totalIterationFilesLoaded: iterationFiles.length,
			currentIterationPlans: summarizeIterationPlanList(currentIterationPlans),
			reviewDebt: iterationDebt
		},
		history,
		strictDeviceProofs,
		gates,
		nextAction: nextActionFor(
			gates,
			currentFullDeviceRuns,
			currentFullFinalProofDeviceRuns,
			currentFullNonFinalProofDeviceRuns,
			currentPartialDeviceRuns,
			currentDeviceReviewSummaries,
			completeFiveStarDeviceReviews,
			currentBacklogs,
			currentIterationPlans,
			strictDeviceProofs,
			testflight,
			inbox,
			downloads,
			finalProof,
			phoneBuildAction,
			localPreflight
		)
	};
}

function validateSuite(suite, mobileSuite, suiteIdentity) {
	const errors = [];
	if (suite.schemaVersion !== 1) errors.push('suite.schemaVersion must be 1');
	if (suite.suiteId !== 'dad-local-ai-100') errors.push(`suite.suiteId must be dad-local-ai-100, got ${suite.suiteId ?? '<missing>'}`);
	if (!String(suite.version ?? '').trim()) errors.push('suite.version is required');
	if (!Array.isArray(suite.cases) || suite.cases.length !== 100) {
		errors.push(`suite must contain exactly 100 cases, got ${suite.cases?.length ?? '<missing>'}`);
	}
	if (!suiteIdentity.suiteHash) errors.push('suite hash could not be computed');
	if (!mobileSuite) {
		errors.push('mobile embedded suite copy is missing');
	} else if (stableJson(mobileSuite) !== stableJson(suite)) {
		errors.push('mobile embedded suite copy differs from canonical suite');
	}
	return errors;
}

function createGates(input) {
	const suiteOk = input.suiteErrors.length === 0;
	const coverageOk = input.suiteCoverage.ok;
	const taskClassCoverageOk = input.taskClassCoverage.ok;
	const generalizationCoverageOk = input.generalizationCoverage.ok;
	const routingOk = input.currentFullRoutingRuns.length > 0 || input.currentFullToolCompleteRuns.length > 0;
	const localPreflightOk = input.localPreflight?.ok === true;
	const testflightOk = input.testflight.targetBuildAvailableForDad && input.testflight.targetBuildMeetsSuiteRequirement;
	const deviceOk = input.currentFullFinalProofDeviceRuns.length > 0;
	const reviewOk = input.completeFiveStarDeviceReviews.length > 0;
	const iterationDebtOk = input.iterationDebt.ok;
	const strictOk = input.strictDeviceProofPasses.length > 0;
	const stabilityRunIds = new Set(input.strictDeviceProofPasses.map((proof) => proof.runId));
	const stabilityFingerprints = new Set(input.strictDeviceProofPasses.map((proof) => proof.executionFingerprint));
	const stabilityOk = stabilityRunIds.size >= 2 && stabilityFingerprints.size >= 2;
	return [
		{
			id: 'suite',
			label: 'Versioned 100-question suite',
			ok: suiteOk,
			evidence: suiteOk
				? `${input.suite.cases.length} cases, version ${input.suite.version}, hash ${input.suiteIdentity.suiteHash}`
				: input.suiteErrors.join('; ')
		},
		{
			id: 'coverage',
			label: 'Objective coverage across hiker situations',
			ok: coverageOk,
			evidence: coverageOk
				? input.suiteCoverage.areas.map((area) => `${area.id}=${area.count}`).join(', ')
				: input.suiteCoverage.errors.join('; ')
		},
		{
			id: 'task-class-coverage',
			label: 'Representative task-class anti-overfit coverage',
			ok: taskClassCoverageOk,
			evidence: taskClassCoverageOk
				? input.taskClassCoverage.areas.map((area) => `${area.id}=${area.count}`).join(', ')
				: input.taskClassCoverage.errors.join('; ')
		},
		{
			id: 'generalization-coverage',
			label: 'Neighbor prompt-frame generalization coverage',
			ok: generalizationCoverageOk,
			evidence: generalizationCoverageOk
				? input.generalizationCoverage.profiles.map((profile) => {
					const frames = profile.promptFrames.map((frame) => `${frame.id}=${frame.count}`).join('/');
					return `${profile.id}=${profile.count}(${frames})`;
				}).join(', ')
				: input.generalizationCoverage.errors.join('; ')
		},
		{
			id: 'routing',
			label: 'Full-suite tool routing proof',
			ok: routingOk,
			evidence: routingOk
				? `${input.currentFullToolCompleteRuns.length} current full run(s) with all required tools hit and source evidence recorded`
				: 'No current full 100-case run has complete required-tool hits and source evidence'
		},
		{
			id: 'local-preflight',
			label: 'Simulator/debug local full-suite preflight',
			ok: localPreflightOk,
			evidence: input.localPreflight?.evidence ?? 'No simulator/debug local preflight summary was created'
		},
		{
			id: 'testflight-target',
			label: 'Dad Pilot has current suite-required TestFlight build',
			ok: testflightOk,
			evidence: testflightTargetEvidence(input.testflight)
		},
		{
			id: 'device-run',
			label: 'Full TestFlight/iPhone Eval Lab run imported',
			ok: deviceOk,
			evidence: deviceOk
				? `${input.currentFullFinalProofDeviceRuns.length} current full suite-compatible TestFlight/iPhone device run(s) found`
				: input.currentFullNonFinalProofDeviceRuns.length
					? `No current full suite-compatible TestFlight/iPhone run found; ${input.currentFullNonFinalProofDeviceRuns.length} full device-on-device-gemma run(s) failed final-proof context: ${input.currentFullNonFinalProofDeviceRuns.slice(0, 3).map((entry) => deviceRunFinalProofMismatchEvidence(entry, input.finalProof)).join('; ')}`
					: input.currentPartialDeviceRuns.length
						? `No current full suite-compatible TestFlight/iPhone run found; ${input.currentPartialDeviceRuns.length} partial device run(s) imported: ${input.currentPartialDeviceRuns.map((entry) => `${entry.value.runId ?? '<missing>'} ${entry.value.caseCount ?? 0}/${entry.value.totalSuiteCases ?? '?'}`).join(', ')}`
						: 'No current full suite-compatible TestFlight/iPhone run found'
		},
		{
			id: 'review',
			label: 'Human review complete at 100/100 5-star',
			ok: reviewOk,
			evidence: reviewOk
				? `${input.completeFiveStarDeviceReviews.length} current full device review(s) rated all 5/5`
				: 'No current full device review is rated 100/100 at 5/5'
		},
		{
			id: 'iteration-loop',
			label: 'Below-5 answers create iteration work',
			ok: iterationDebtOk,
			evidence: iterationDebtEvidence(input.iterationDebt)
		},
		{
			id: 'strict-device-proof',
			label: 'Strict final device proof passed',
			ok: strictOk,
			evidence: strictOk
				? `${input.strictDeviceProofPasses.length} strict TestFlight/iPhone proof run(s) pass`
				: 'No strict TestFlight/iPhone proof run passes'
		},
		{
			id: 'stability',
			label: 'Repeated stability proof ready',
			ok: stabilityOk,
			evidence: stabilityOk
				? `At least two distinct strict TestFlight/iPhone proof executions pass (${stabilityRunIds.size} run ids, ${stabilityFingerprints.size} execution fingerprints)`
				: stabilityRunIds.size >= 2
					? `Need two separate Eval Lab executions before stability proof; ${input.strictDeviceProofPasses.length} strict proof run(s) pass but only ${stabilityFingerprints.size} distinct execution fingerprint(s)`
					: 'Need two distinct strict full TestFlight/iPhone runs before stability proof'
		}
	];
}

function nextActionFor(
	gates,
	currentFullDeviceRuns,
	currentFullFinalProofDeviceRuns,
	currentFullNonFinalProofDeviceRuns,
	currentPartialDeviceRuns,
	currentDeviceReviewSummaries,
	completeFiveStarDeviceReviews,
	currentBacklogs,
	currentIterationPlans,
	strictDeviceProofs,
	testflight,
	inbox,
	downloads,
	finalProof,
	phoneBuildAction,
	localPreflight
) {
	const gate = (id) => gates.find((item) => item.id === id);
	if (!gate('suite')?.ok) {
		return {
			kind: 'fix-suite',
			text: 'Fix the canonical suite/mobile copy drift, then run npm run sync:scout-local-ai-suite and the suite test.'
		};
	}
	if (!gate('coverage')?.ok) {
		return {
			kind: 'fix-suite-coverage',
			text: 'Add or restore objective coverage in data/scout-local-ai/dad-local-ai-100.json, sync the mobile copy, then rerun the Scout local-AI suite test.'
		};
	}
	if (!gate('task-class-coverage')?.ok) {
		return {
			kind: 'fix-suite-task-class-coverage',
			text: 'Restore representative task-class coverage in data/scout-local-ai/dad-local-ai-100.json so the benchmark covers reusable hiker/document-agent jobs instead of only exact prompts; sync the mobile copy, then rerun the Scout local-AI suite test.'
		};
	}
	if (!gate('generalization-coverage')?.ok) {
		return {
			kind: 'fix-suite-generalization-coverage',
			text: 'Restore neighbor prompt-frame coverage in data/scout-local-ai/dad-local-ai-100.json so each core capability has varied prompts instead of one memorized wording; sync the mobile copy, then rerun the Scout local-AI suite test.'
		};
	}
	if (!gate('routing')?.ok) {
		return {
			kind: 'prove-routing',
			text: 'Run npm run eval:scout-local-ai and fix any missing required-tool hits before Dad spends time on phone review.'
		};
	}
	if (!gate('device-run')?.ok) {
		const handoffSources = [
			{
				name: 'inbox',
				label: 'inbox',
				path: inbox?.path,
				prepareCommand: DEVICE_REVIEW_PREP_COMMAND,
				latestCandidate: inbox?.latestCandidate ?? null,
				latestReadyCandidate: inbox?.latestReadyCandidate ?? null
			},
			{
				name: 'downloads',
				label: 'Downloads',
				path: downloads?.path,
				prepareCommand: DEVICE_REVIEW_PREP_DOWNLOADS_COMMAND,
				latestCandidate: downloads?.latestCandidate ?? null,
				latestReadyCandidate: downloads?.latestReadyCandidate ?? null
			}
		];
		const readySource = handoffSources.find((source) => source.latestReadyCandidate);
		if (readySource) {
			const candidate = readySource.latestCandidate ?? readySource.latestReadyCandidate;
			const readyCandidate = readySource.latestReadyCandidate;
			if (readyCandidate && readyCandidate.path !== candidate.path) {
				return {
					kind: `prepare-${readySource.name}-ready-export`,
					text: `A final-ready Scout Eval Lab export is already in ${readySource.path}: ${readyCandidate.path} (${readyCandidate.runId}, ${readyCandidate.caseCount} cases, ${readyCandidate.inspectionStatus}). The newest ${readySource.label} file is ${candidate.inspectionStatus}: ${candidate.path} (${candidate.runId}). ${readySource.prepareCommand} will select the final-ready export before blocked or partial files.`
				};
			}
			return {
				kind: `prepare-${readySource.name}-export`,
				text: `A likely Scout Eval Lab export is already in ${readySource.path}: ${readyCandidate.path} (${readyCandidate.runId}, ${readyCandidate.caseCount} cases, ${readyCandidate.inspectionStatus}). Inspect and import it with ${readySource.prepareCommand}, and do not count it as final Dad proof until intake creates a current full device-on-device-gemma run.`
			};
		}
		const latestSource = handoffSources.find((source) => source.latestCandidate);
		if (latestSource) {
			const candidate = latestSource.latestCandidate;
			if (candidate.readyForPartialIntake) {
				return {
					kind: `finish-${latestSource.name}-export`,
					text: `The latest ${latestSource.label} export is only a partial diagnostic: ${candidate.path} (${candidate.runId}, ${candidate.caseCount} cases, ${candidate.inspectionStatus}). Finish Run 100 on the phone, Share the final JSON, then prepare review with ${latestSource.prepareCommand}. Import this partial only with --allow-partial if you are debugging an interrupted run.`
				};
			}
			const reasons = candidate.blockingReasons?.length
				? ` Blocking reason(s): ${candidate.blockingReasons.join('; ')}.`
				: '';
			return {
				kind: `fix-${latestSource.name}-export`,
				text: `The latest ${latestSource.label} export is blocked before review: ${candidate.path} (${candidate.runId}, ${candidate.caseCount} cases, ${candidate.inspectionStatus}).${reasons} Fix that export or rerun Run 100 on the phone, then prepare review with ${latestSource.prepareCommand}. Do not rate it until inspection says ready-for-final-intake.`
			};
		}
		const currentFullWrongDeviceProofRuns = currentFullNonFinalProofDeviceRuns.filter(
			(entry) => !isLocalPreflightRun(entry.value, finalProof)
		);
		if (currentFullWrongDeviceProofRuns.length) {
			const latestNonFinalRun = currentFullWrongDeviceProofRuns.at(-1);
			return {
				kind: 'rerun-device-proof-context',
				text: `Imported full Eval Lab run ${latestNonFinalRun.value.runId ?? '<missing>'} is not valid final Dad proof (${deviceRunFinalProofMismatchEvidence(latestNonFinalRun, finalProof)}). Rerun Run 100 on a suite-compatible TestFlight iPhone build, Share the fresh JSON, then prepare review with ${DEVICE_REVIEW_PREP_COMMAND}.`
			};
		}
		const latestPartialRun = currentPartialDeviceRuns.at(-1)?.value;
		if (latestPartialRun) {
			const completed = latestPartialRun.caseCount ?? latestPartialRun.results?.length ?? 0;
			const total = latestPartialRun.totalSuiteCases ?? 100;
			const runPath = `data/scout-local-ai/device-runs/${latestPartialRun.runId}.json`;
			return {
				kind: 'resume-device-run',
				text: `Partial TestFlight/iPhone Eval Lab run ${latestPartialRun.runId} is imported at ${completed}/${total}. Reopen the same iPhone build, go to Settings > Scout Eval Lab, tap Resume, finish Run 100, Share the final JSON, then prepare review with ${DEVICE_REVIEW_PREP_COMMAND}. The partial file ${runPath} can be reviewed with --allow-partial for diagnosis, but it is not final Dad proof.`
			};
		}
		if (localPreflight && !localPreflight.ok) {
			return {
				kind: 'run-local-preflight',
				text: `${localPreflight.evidence}. Use the Mac mini simulator lane before spending Dad's TestFlight time: ${localPreflight.command}. This is preflight only; ${localPreflight.boundary}`
			};
		}
		if (!gate('testflight-target')?.ok) {
			if (!testflight?.targetBuildMeetsSuiteRequirement) {
				return {
					kind: 'align-suite-build',
					text: `Align the Xcode target build with the suite final-proof requirement ${testflight?.suiteRequiredBuild ?? '<unknown>'}; current target is ${testflight?.targetBuild ?? '<unknown>'}.`
				};
				}
				const publishText = phoneBuildAction?.kind === 'upload-current-suite-build' && testflight?.targetBuildReadyForDad
					? phoneBuildAction.text
					: `Upload and attach target iOS build ${testflight.targetBuild ?? '<unknown>'} to Dad Pilot first; release evidence currently records Dad Pilot on ${testflight.recordedDadPilotBuild ?? '<unknown>'}, while the suite requires ${testflight.suiteRequiredBuild ?? '<unknown>'}.`;
				return {
					kind: 'publish-target-build',
					text: `${publishText} After App Store Connect shows the current-suite build through the TestFlight link, update the iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then prepare review with ${DEVICE_REVIEW_PREP_COMMAND}.`
				};
			}
		const phoneBuild =
			testflight?.targetBuildReadyForDad || !testflight?.recordedDadPilotMeetsSuiteRequirement
				? `the latest TestFlight build (${testflight?.targetBuild ?? '<unknown>'})`
				: `the current Dad Pilot TestFlight build (${testflight.recordedDadPilotBuild}; newer target ${testflight.targetBuild ?? '<unknown>'} is pending upload)`;
		return {
			kind: 'get-device-run',
			text: `${phoneBuildAction?.text ?? `Install or update ${phoneBuild} on Dad/Chris iPhone.`} Open Settings > Scout Eval Lab, run Run 100, and Share the JSON. While waiting for the file, leave ${DEVICE_REVIEW_WAIT_COMMAND} running for inbox/Downloads, or use ${DEVICE_REVIEW_WAIT_ALL_COMMAND} if the export may land in the macOS clipboard. Status also checks ${downloads?.path ?? 'Downloads'} and will use ${DEVICE_REVIEW_PREP_DOWNLOADS_COMMAND} if the export lands there. If Dad sends copied JSON text instead of a file, ${DEVICE_REVIEW_WAIT_CLIPBOARD_COMMAND} can receive it automatically, or use ${DEVICE_RECEIVE_CLIPBOARD_COMMAND} / paste into ${DEVICE_RECEIVE_STDIN_COMMAND}; the receiver saves it to the inbox, inspects it, and prepares the same review path as ${DEVICE_REVIEW_PREP_COMMAND} when it is final-ready.`
		};
	}
	const latestDeviceRun = currentFullFinalProofDeviceRuns.at(-1)?.value.runId ?? currentFullDeviceRuns.at(-1)?.value.runId ?? '<run-id>';
	if (!gate('review')?.ok) {
		const completeBelowFiveReview = currentDeviceReviewSummaries
			.filter((entry) => isCompleteBelowFiveReview(entry.summary))
			.at(-1);
		if (completeBelowFiveReview) {
			const runPath = currentFullDeviceRuns.find((entry) => entry.value.runId === completeBelowFiveReview.runId)?.path;
			const relativeRunPath = runPath ? relative(REPO_ROOT, runPath) : `data/scout-local-ai/device-runs/${completeBelowFiveReview.runId}.json`;
			const relativeReviewPath = relative(REPO_ROOT, completeBelowFiveReview.path);
			const backlogEntry = currentBacklogs.find((entry) => entry.value.runId === completeBelowFiveReview.runId);
			const relativeBacklogPath = backlogEntry
				? relative(REPO_ROOT, backlogEntry.path)
				: `data/scout-local-ai/backlog/${completeBelowFiveReview.runId}.backlog.json`;
			const iterationPlan = currentIterationPlans.find((entry) => iterationPlanIncludesRun(entry.value, completeBelowFiveReview.runId));
			if (iterationPlan) {
				const relativePlanPath = relative(REPO_ROOT, iterationPlan.path);
				const rerunCommand = iterationPlan.value.rerunCommand ?? 'npm run eval:scout-local-ai -- --id <case-ids>';
				return {
					kind: 'execute-iteration',
					text: `Review ${completeBelowFiveReview.runId} has ${completeBelowFiveReview.summary.belowFive} below-5 answer(s), and iteration plan ${relativePlanPath} is ready. Fix the named owner layers, rerun regression cases with ${rerunCommand}, then verify closure with npm run verify:scout-local-ai-iteration -- --plan ${relativePlanPath} --run data/scout-local-ai/device-runs/<rerun-id>.json --review data/scout-local-ai/reviews/<rerun-id>.review.json.`
				};
			}
			if (backlogEntry) {
				return {
					kind: 'plan-iteration',
					text: `Review ${completeBelowFiveReview.runId} is complete but has ${completeBelowFiveReview.summary.belowFive} below-5 answer(s), and backlog ${relativeBacklogPath} already exists. Run npm run plan:scout-local-ai-iteration -- --backlog ${relativeBacklogPath}. Fix the named owner layers and rerun the regression cases; do not close the iteration by changing expected wording only.`
				};
			}
			return {
				kind: 'write-backlog',
				text: `Review ${completeBelowFiveReview.runId} is complete but has ${completeBelowFiveReview.summary.belowFive} below-5 answer(s). Run npm run review:scout-local-ai -- --run ${relativeRunPath} --review ${relativeReviewPath} to write ${relativeBacklogPath}, then run npm run plan:scout-local-ai-iteration -- --backlog ${relativeBacklogPath}. Fix the named owner layers and rerun the regression cases; do not close the iteration by changing expected wording only.`
			};
		}
		const reviewPath = `data/scout-local-ai/reviews/${latestDeviceRun}.review.json`;
		const runPath = `data/scout-local-ai/device-runs/${latestDeviceRun}.json`;
		const packetPath = `${REVIEW_PACKET_DIR}/${latestDeviceRun}.review.md`;
		return {
			kind: 'finish-review',
			text: `Fill ratings/checklists in ${packetPath}, preview progress with ${REVIEW_STATUS_COMMAND} -- --run ${runPath} --review ${reviewPath} --packet ${packetPath}, then run ${FINALIZE_REVIEW_COMMAND} -- --packet ${packetPath} --review ${reviewPath}. If the packet is missing, recreate it with ${DEVICE_REVIEW_PREP_COMMAND} before rating raw JSON.`
		};
	}
	const latestFiveStarReview = completeFiveStarDeviceReviews.at(-1)?.runId ?? latestDeviceRun;
	if (!gate('strict-device-proof')?.ok) {
		const latestStrictErrors = strictDeviceProofs.find((proof) => proof.runId === latestFiveStarReview)?.errors ?? [];
		return {
			kind: 'run-strict-proof',
			text: `Run npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/${latestFiveStarReview}.json --review data/scout-local-ai/reviews/${latestFiveStarReview}.review.json and fix any proof errors.`,
			errors: latestStrictErrors
		};
	}
	if (!gate('stability')?.ok) {
		return {
			kind: 'get-second-device-run',
			text: 'Run a second full TestFlight/iPhone Eval Lab pass, review it to 100/100 at 5/5, then run npm run verify:scout-local-ai-stability-proof with both run/review pairs.'
		};
	}
	return {
		kind: 'stability-ready',
		text: 'Run or archive npm run verify:scout-local-ai-stability-proof with the two passing run/review pairs as the final repeated device proof.'
	};
}

function isCompleteBelowFiveReview(summary) {
	return summary.total > 0 &&
		summary.rated === summary.total &&
		summary.unrated === 0 &&
		summary.belowFive > 0 &&
		summary.invalid.length === 0;
}

function iterationPlanIncludesRun(plan, runId) {
	return (plan?.sourceBacklogs ?? []).some((backlog) => backlog.runId === runId);
}

function summarizeIterationDebt(currentDeviceReviewSummaries, currentBacklogs, currentIterationPlans) {
	const items = currentDeviceReviewSummaries
		.filter((entry) => isCompleteBelowFiveReview(entry.summary))
		.map((entry) => {
			const backlogEntry = currentBacklogs.find((candidate) => candidate.value.runId === entry.runId);
			const planEntry = currentIterationPlans.find((candidate) => iterationPlanIncludesRun(candidate.value, entry.runId));
			const status = planEntry ? 'planned' : backlogEntry ? 'backlog-only' : 'needs-backlog';
			return {
				runId: entry.runId,
				belowFive: entry.summary.belowFive,
				reviewPath: relative(REPO_ROOT, entry.path),
				backlogPath: backlogEntry ? relative(REPO_ROOT, backlogEntry.path) : null,
				iterationPlanPath: planEntry ? relative(REPO_ROOT, planEntry.path) : null,
				status
			};
		});
	const needsBacklog = items.filter((item) => item.status === 'needs-backlog');
	const backlogOnly = items.filter((item) => item.status === 'backlog-only');
	const planned = items.filter((item) => item.status === 'planned');
	return {
		ok: needsBacklog.length === 0 && backlogOnly.length === 0,
		totalReviews: items.length,
		totalBelowFive: items.reduce((sum, item) => sum + item.belowFive, 0),
		needsBacklog,
		backlogOnly,
		planned,
		items
	};
}

export async function summarizeHistoryFreshness({
	historyJsonPath,
	historyHtmlPath,
	sourceFiles = [],
	sourceDirs = [],
	sourceEvents = [],
	repoRoot = REPO_ROOT,
	rebuildCommand = 'npm run history:scout-local-ai'
} = {}) {
	const json = await summarizeFileForHistory(historyJsonPath, repoRoot);
	const html = await summarizeFileForHistory(historyHtmlPath, repoRoot);
	const sources = [];
	for (const file of sourceFiles.filter(Boolean)) {
		const summary = await summarizeFileForHistory(file, repoRoot);
		if (summary.exists) sources.push(summary);
	}
	for (const dir of sourceDirs.filter(Boolean)) {
		sources.push(...await summarizeJsonDirectoryForHistory(dir, repoRoot));
	}
	for (const event of sourceEvents) {
		const normalized = normalizeHistorySourceEvent(event);
		if (normalized) sources.push(normalized);
	}
	sources.sort((left, right) => right.mtimeMs - left.mtimeMs || left.path.localeCompare(right.path));
	const latestSource = sources[0] ?? null;
	const outputsExist = Boolean(json.exists && html.exists);
	const outputMtimeMs = outputsExist ? Math.min(json.mtimeMs, html.mtimeMs) : null;
	const latestOutputMtimeMs = outputsExist ? Math.max(json.mtimeMs, html.mtimeMs) : null;
	const stale = Boolean(outputsExist && latestSource && latestSource.mtimeMs > outputMtimeMs + 1000);
	const missing = [];
	if (!json.exists) missing.push(json.path);
	if (!html.exists) missing.push(html.path);
	const ok = outputsExist && !stale;
	const reason = !outputsExist
		? `missing generated history artifact(s): ${missing.join(', ')}`
		: stale
			? `latest source ${latestSource.path} changed after the older history output`
			: latestSource
				? `history outputs are newer than ${latestSource.path}`
				: 'history outputs exist; no source files were found for freshness comparison';
	return {
		ok,
		stale,
		outputsExist,
		reason,
		json,
		html,
		sourceCount: sources.length,
		latestSource: latestSource ? withoutMtime(latestSource) : null,
		latestOutputModifiedAt: latestOutputMtimeMs ? new Date(latestOutputMtimeMs).toISOString() : null,
		rebuildCommand
	};
}

function normalizeHistorySourceEvent(event) {
	const mtimeMs = Number(event?.mtimeMs ?? Date.parse(String(event?.modifiedAt ?? '')));
	if (!Number.isFinite(mtimeMs)) return null;
	const path = String(event?.path ?? event?.label ?? 'source-event').trim();
	return {
		path: path || 'source-event',
		exists: true,
		size: Number(event?.size ?? 0),
		mtimeMs,
		modifiedAt: new Date(mtimeMs).toISOString()
	};
}

async function summarizeJsonDirectoryForHistory(dir, repoRoot) {
	if (!(await exists(dir))) return [];
	const summaries = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
		const summary = await summarizeFileForHistory(resolve(dir, entry.name), repoRoot);
		if (summary.exists) summaries.push(summary);
	}
	return summaries;
}

async function summarizeFileForHistory(path, repoRoot) {
	const display = path ? relative(repoRoot, path) : '<missing>';
	if (!path || !(await exists(path))) {
		return {
			path: display,
			exists: false,
			size: 0,
			mtimeMs: 0,
			modifiedAt: null
		};
	}
	const stats = await stat(path);
	return {
		path: display,
		exists: true,
		size: stats.size,
		mtimeMs: stats.mtimeMs,
		modifiedAt: new Date(stats.mtimeMs).toISOString()
	};
}

function iterationDebtEvidence(debt) {
	if (!debt.totalReviews) {
		return 'No completed below-5 device reviews yet';
	}
	if (debt.ok) {
		return `${debt.totalBelowFive} below-5 answer(s) from ${debt.totalReviews} completed review(s) are represented by iteration plan(s): ${debt.planned.map((item) => item.runId).join(', ')}`;
	}
	const pieces = [];
	if (debt.needsBacklog.length) {
		pieces.push(`missing backlog for ${debt.needsBacklog.map((item) => item.runId).join(', ')}`);
	}
	if (debt.backlogOnly.length) {
		pieces.push(`missing iteration plan for ${debt.backlogOnly.map((item) => item.runId).join(', ')}`);
	}
	return `Below-5 review debt needs artifacts: ${pieces.join('; ')}`;
}

function summarizeRunList(entries) {
	return entries.map((entry) => {
		const sourceEvidence = summarizeRunSourceEvidence(entry.value.results ?? []);
		const answerQuality = summarizeAnswerQualityScan(scanScoutLocalAiAnswerQuality(entry.value));
		return {
			runId: entry.value.runId ?? '<missing>',
			path: relative(REPO_ROOT, entry.path),
			evidenceLane: entry.value.evidenceLane ?? '<missing>',
			generatedAt: entry.value.generatedAt ?? '<missing>',
			caseCount: entry.value.caseCount ?? 0,
			totalSuiteCases: entry.value.totalSuiteCases ?? 0,
			toolExpectationComplete: entry.value.summary?.toolExpectationComplete ?? 0,
			missingToolCases: entry.value.summary?.missingToolCases ?? 0,
			sourceEvidenceComplete: entry.value.summary?.sourceEvidenceComplete ?? sourceEvidence.sourceEvidenceComplete,
			missingSourceEvidenceCases: entry.value.summary?.missingSourceEvidenceCases ?? sourceEvidence.missingSourceEvidenceCases,
			answerQuality
		};
	});
}

function summarizeAnswerQualityScan(scan) {
	return {
		status: scan.flaggedCount ? 'review-needed' : 'clean',
		caseCount: scan.caseCount,
		flaggedCount: scan.flaggedCount,
		errorCount: scan.errorCount,
		warningCount: scan.warningCount,
		byCheck: scan.byCheck,
		topFlagged: scan.flagged.slice(0, 8).map((item) => ({
			caseId: item.caseId,
			domain: item.domain,
			checks: item.checks.map((check) => `${check.id}:${check.severity}`)
		})),
		boundary: scan.note
	};
}

async function summarizeLocalPreflight({ currentFullLocalPreflightRuns, currentPartialLocalPreflightRuns, suite, finalProof }) {
	const latestEntry = currentFullLocalPreflightRuns.at(-1) ?? null;
	const latestRun = latestEntry?.value ?? null;
	const latestFullRun = latestEntry ? summarizeRunList([latestEntry])[0] : null;
	const toolComplete = latestRun ? hasCompleteToolExpectations(latestRun, suite) : false;
	const sourceComplete = latestRun ? hasCompleteSourceEvidence(latestRun) : false;
	const scanClean = latestFullRun?.answerQuality?.status === 'clean';
	const sourceFreshness = latestRun
		? await summarizeLocalPreflightSourceFreshness(latestRun)
		: null;
	const baseOk = Boolean(latestRun && toolComplete && sourceComplete && scanClean);
	const ok = Boolean(baseOk && sourceFreshness?.ok);
	const command = 'npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100';
	const boundary = 'simulator/debug local preflight drives iteration but does not replace final TestFlight/iPhone proof.';
	const latestContext = latestRun ? localPreflightContextLabel(latestRun) : null;
	const issues = [];
	if (!latestRun) {
		issues.push('no full simulator/debug local run exists');
	} else {
		if (!toolComplete) issues.push(`${latestFullRun?.missingToolCases ?? latestRun.summary?.missingToolCases ?? '?'} missing tool case(s)`);
		if (!sourceComplete) issues.push(`${latestFullRun?.missingSourceEvidenceCases ?? latestRun.summary?.missingSourceEvidenceCases ?? '?'} missing source-evidence case(s)`);
		if (!scanClean) {
			const scan = latestFullRun.answerQuality;
			issues.push(`${scan.flaggedCount}/${scan.caseCount} answer-quality case(s) flagged`);
		}
		if (sourceFreshness && !sourceFreshness.ok) {
			issues.push(sourceFreshness.evidence);
		}
	}
	const evidence = ok
		? `Latest simulator/debug local preflight ${latestFullRun.runId} is clean: ${latestFullRun.caseCount}/${latestFullRun.totalSuiteCases} cases, complete tools/source evidence, ${latestContext}`
		: latestRun
			? `Latest simulator/debug local preflight ${latestFullRun.runId} needs work: ${issues.join('; ')}, ${latestContext}`
			: `No full simulator/debug local preflight run found; run ${command}`;
	return {
		ok,
		command,
		boundary,
		fullRunCount: currentFullLocalPreflightRuns.length,
		partialRunCount: currentPartialLocalPreflightRuns.length,
		baseOk,
		sourceFresh: sourceFreshness?.ok ?? false,
		sourceFreshness,
		latestFullRun,
		latestProofMismatch: latestRun ? deviceRunFinalProofMismatchEvidence(latestRun, finalProof) : null,
		evidence
	};
}

async function summarizeLocalPreflightSourceFreshness(run) {
	const timestamp = localPreflightSourceTimestamp(run);
	if (!timestamp) {
		return {
			ok: false,
			timestamp: null,
			commitCount: 0,
			changedFileCount: 0,
			changedFiles: [],
			latestCommit: null,
			evidence: 'local preflight run has no timestamp for source freshness comparison'
		};
	}
	const commits = await gitCommitsAfter(timestamp);
	const relevantCommits = commits
		.map((commit) => ({
			...commit,
			files: commit.files.filter(isLocalPreflightSourcePath)
		}))
		.filter((commit) => commit.files.length > 0);
	const changedFiles = [...new Set(relevantCommits.flatMap((commit) => commit.files))]
		.sort((left, right) => left.localeCompare(right));
	const latestCommit = relevantCommits[0] ?? null;
	if (!changedFiles.length) {
		return {
			ok: true,
			timestamp,
			commitCount: 0,
			changedFileCount: 0,
			changedFiles: [],
			latestCommit: null,
			evidence: `no app/eval/source changes after ${timestamp}`
		};
	}
	const sample = changedFiles.slice(0, 6).join(', ');
	const more = changedFiles.length > 6 ? `, +${changedFiles.length - 6} more` : '';
	return {
		ok: false,
		timestamp,
		commitCount: relevantCommits.length,
		changedFileCount: changedFiles.length,
		changedFiles: changedFiles.slice(0, 20),
		latestCommit: latestCommit
			? {
				sha: latestCommit.sha,
				committedAt: latestCommit.committedAt,
				subject: latestCommit.subject
			}
			: null,
		evidence: `source changed after run: ${relevantCommits.length} relevant commit(s), ${changedFiles.length} file(s): ${sample}${more}`
	};
}

function localPreflightSourceTimestamp(run) {
	const candidates = [
		run?.runContext?.execution?.completedAt,
		run?.runContext?.execution?.finishedAt,
		run?.runContext?.execution?.endedAt,
		run?.generatedAt,
		run?.runContext?.execution?.startedAt
	];
	for (const candidate of candidates) {
		const iso = normalizeIsoTimestamp(candidate);
		if (iso) return iso;
	}
	return null;
}

function normalizeIsoTimestamp(value) {
	const time = Date.parse(String(value ?? ''));
	if (!Number.isFinite(time)) return null;
	return new Date(time).toISOString();
}

async function gitCommitsAfter(timestamp) {
	const sinceMs = Date.parse(timestamp);
	if (!Number.isFinite(sinceMs)) return [];
	try {
		const result = await execFileAsync('git', [
			'log',
			`--since=${timestamp}`,
			'--name-only',
			'--format=%x1e%H%x09%cI%x09%s'
		], {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024 * 8
		});
		return parseGitNameOnlyLog(result.stdout)
			.filter((commit) => {
				const committedMs = Date.parse(commit.committedAt);
				return Number.isFinite(committedMs) && committedMs > sinceMs;
			});
	} catch {
		return [];
	}
}

async function latestGitEventForHistory() {
	try {
		const result = await execFileAsync('git', ['log', '-1', '--format=%H%x09%cI%x09%s'], {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024
		});
		const [sha, committedAt, ...subjectParts] = result.stdout.trim().split('\t');
		const time = Date.parse(committedAt);
		if (!sha || !Number.isFinite(time)) return null;
		const shortSha = sha.slice(0, 8);
		const subject = subjectParts.join('\t').trim();
		return {
			path: `git:${shortSha}${subject ? ` ${subject}` : ''}`,
			mtimeMs: time,
			modifiedAt: new Date(time).toISOString(),
			size: 0
		};
	} catch {
		return null;
	}
}

function parseGitNameOnlyLog(text) {
	const commits = [];
	let current = null;
	for (const rawLine of String(text ?? '').split('\n')) {
		const line = rawLine.trim();
		if (!line) continue;
		if (line.startsWith('\x1e')) {
			if (current) commits.push(current);
			const [sha, committedAt, subject] = line.slice(1).split('\t');
			current = {
				sha: sha ?? '<unknown>',
				committedAt: committedAt ?? '<unknown>',
				subject: subject ?? '<unknown>',
				files: []
			};
			continue;
		}
		if (current) current.files.push(line);
	}
	if (current) commits.push(current);
	return commits;
}

function isLocalPreflightSourcePath(path) {
	const normalized = String(path ?? '').trim();
	if (!normalized) return false;
	if (LOCAL_PREFLIGHT_IGNORED_SOURCE_PATHS.has(normalized)) return false;
	if (isNativeAppSourcePath(normalized)) return true;
	if (normalized === DEFAULT_SUITE || normalized === DEFAULT_MOBILE_SUITE) return true;
	if (/^scripts\/run-scout-(?:local-ai|ios-sim-gemma)-eval\.mjs$/u.test(normalized)) return true;
	if (/^scripts\/eval-scout-/u.test(normalized)) return true;
	if (/^scripts\/lib\/scout-local-ai-suite\.mjs$/u.test(normalized)) return true;
	if (/^data\/at-/u.test(normalized)) return true;
	if (/^public\/at-/u.test(normalized)) return true;
	if (/^public\/scout\//u.test(normalized)) return true;
	if (/^apps\/openclaw-web\/src\/lib\/server\/public-mobile-field-pack\//u.test(normalized)) return true;
	return false;
}

function localPreflightContextLabel(run) {
	const app = run?.runContext?.app;
	const installSource = run?.runContext?.installSource;
	const modelId = run?.runContext?.modelId ?? '<missing model>';
	const appLabel = app?.version && app?.build ? `${app.version} (${app.build})` : '<missing app build>';
	const installType = installSource?.type ?? '<missing install source>';
	return `app ${appLabel}, install=${installType}, model=${modelId}`;
}

function summarizeBacklogList(entries) {
	return entries.map((entry) => ({
		runId: entry.value.runId ?? '<missing>',
		path: relative(REPO_ROOT, entry.path),
		evidenceLane: entry.value.evidenceLane ?? '<missing>',
		generatedAt: entry.value.generatedAt ?? '<missing>',
		rated: entry.value.summary?.rated ?? 0,
		total: entry.value.summary?.total ?? 0,
		belowFive: entry.value.summary?.belowFive ?? entry.value.items?.length ?? 0,
		unrated: entry.value.summary?.unrated ?? entry.value.unratedItems?.length ?? 0,
		itemCount: entry.value.items?.length ?? 0
	}));
}

function summarizeIterationPlanList(entries) {
	return entries.map((entry) => ({
		planId: entry.value.planId ?? '<missing>',
		path: relative(REPO_ROOT, entry.path),
		generatedAt: entry.value.generatedAt ?? '<missing>',
		sourceRunIds: (entry.value.sourceBacklogs ?? []).map((backlog) => backlog.runId).filter(Boolean),
		itemCount: entry.value.summary?.itemCount ?? 0,
		regressionCaseCount: entry.value.summary?.regressionCaseCount ?? entry.value.regressionCaseIds?.length ?? 0,
		rerunCommand: entry.value.rerunCommand ?? null
	}));
}

async function summarizeNativeSource({ iosProofDir, mobileSuitePath, suiteIdentity }) {
	const currentRepoSha = await currentGitSha();
	const iosUploadProofs = await findIosUploadProofs(iosProofDir);
	const uploadAttempts = iosUploadProofs.filter((proof) => proof.uploadRequested);
	const latestNativeUploadAttempt = uploadAttempts.at(-1) ?? null;
	const latestNativeUploadProof = uploadAttempts
		.filter((proof) => proof.status === 'passed')
		.at(-1) ?? null;
	const latestNativeUploadSha = latestNativeUploadProof?.repoSha ?? null;
	const comparable = Boolean(currentRepoSha && latestNativeUploadSha);
	const matchesCurrent = comparable && gitShaMatches(currentRepoSha, latestNativeUploadSha);
	const latestUploadIsAncestor = comparable && !matchesCurrent
		? await gitCommitIsAncestor(latestNativeUploadSha, currentRepoSha)
		: false;
	const changedFiles = comparable && !matchesCurrent
		? await gitChangedFiles(latestNativeUploadSha, currentRepoSha)
		: [];
	const nativeAppChangedFiles = changedFiles.filter(isNativeAppSourcePath);
	const latestNativeUploadSuite = latestNativeUploadSha
		? await readJsonAtGitSha(latestNativeUploadSha, mobileSuitePath)
		: null;
	const latestNativeUploadSuiteIdentityFromGit = latestNativeUploadSuite
		? scoutLocalAiSuiteIdentity(latestNativeUploadSuite)
		: null;
	const latestNativeUploadSuiteIdentityFromProof = latestNativeUploadProof?.suiteVersion && latestNativeUploadProof?.suiteHash
		? {
			suiteVersion: latestNativeUploadProof.suiteVersion,
			suiteHash: latestNativeUploadProof.suiteHash
		}
		: null;
	const latestNativeUploadSuiteIdentity = latestNativeUploadSuiteIdentityFromProof ?? latestNativeUploadSuiteIdentityFromGit;
	return {
		currentRepoSha,
		iosProofDir: relative(REPO_ROOT, iosProofDir),
		latestNativeUploadAttempt,
		latestNativeUploadProof,
		latestNativeUploadSha,
		latestNativeUploadAttemptStatus: latestNativeUploadAttempt?.status ?? null,
		latestNativeUploadAttemptWasSuccessful: latestNativeUploadAttempt?.status === 'passed',
		latestNativeUploadHasCurrentSource: matchesCurrent,
		latestNativeUploadSuiteVersion: latestNativeUploadSuiteIdentity?.suiteVersion ?? null,
		latestNativeUploadSuiteHash: latestNativeUploadSuiteIdentity?.suiteHash ?? null,
		latestNativeUploadSuiteSource: latestNativeUploadSuiteIdentityFromProof
			? latestNativeUploadProof.suiteIdentitySource
			: latestNativeUploadSuiteIdentityFromGit
				? 'git-sha'
				: null,
		latestNativeUploadHasCurrentSuite: Boolean(
			latestNativeUploadSuiteIdentity &&
			latestNativeUploadSuiteIdentity.suiteVersion === suiteIdentity.suiteVersion &&
			latestNativeUploadSuiteIdentity.suiteHash === suiteIdentity.suiteHash
		),
		sourceNewerThanLatestNativeUpload: latestUploadIsAncestor,
		nativeAppSourceNewerThanLatestNativeUpload: latestUploadIsAncestor && nativeAppChangedFiles.length > 0,
		sourceDiffersFromLatestNativeUpload: comparable && !matchesCurrent,
		changedFileCount: changedFiles.length,
		nativeAppChangedFileCount: nativeAppChangedFiles.length,
		nativeAppChangedFiles: nativeAppChangedFiles.slice(0, 12)
	};
}

async function readJsonAtGitSha(sha, path) {
	try {
		const gitPath = relative(REPO_ROOT, path);
		const result = await execFileAsync('git', ['show', `${sha}:${gitPath}`], {
			cwd: REPO_ROOT,
			maxBuffer: 64 * 1024 * 1024
		});
		return JSON.parse(result.stdout);
	} catch {
		return null;
	}
}

async function currentGitSha() {
	try {
		const result = await execFileAsync('git', ['rev-parse', 'HEAD'], {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024
		});
		return result.stdout.trim() || null;
	} catch {
		return null;
	}
}

async function findIosUploadProofs(iosProofDir) {
	try {
		const files = (await readdir(iosProofDir))
			.filter((file) => /^ios-testflight-attempt-.*\.md$/u.test(file))
			.sort();
		const proofs = [];
		for (const file of files) {
			const proofPath = resolve(iosProofDir, file);
			proofs.push(await readIosUploadProof(proofPath));
		}
		return proofs;
	} catch {
		return [];
	}
}

async function readIosUploadProof(proofPath) {
	const text = await readFile(proofPath, 'utf8');
	const repoSha = await repoShaFromIosUploadProof(text, proofPath);
	const suiteIdentity = suiteIdentityFromIosUploadProof(text);
	return {
		path: relative(REPO_ROOT, proofPath),
		checkedAt: cleanMarkdownValue(firstMarkdownValue(text, 'Checked at')) ?? '<unknown>',
		status: normalizeMarkdownValue(firstMarkdownValue(text, 'Status')) ?? '<unknown>',
		uploadRequested: markdownYes(firstMarkdownValue(text, 'Upload')),
		ascApiKeyProvided: cleanMarkdownValue(firstMarkdownValue(text, 'App Store Connect API key provided')) ?? '<unknown>',
		repoSha: repoSha?.sha ?? null,
		repoShaSource: repoSha?.source ?? null,
		suiteVersion: suiteIdentity?.suiteVersion ?? null,
		suiteHash: suiteIdentity?.suiteHash ?? null,
		suiteIdentitySource: suiteIdentity?.source ?? null
	};
}

function suiteIdentityFromIosUploadProof(text) {
	const patterns = [
		{
			source: 'eval-suite-mode-line',
			re: /Eval suite:\s+`?[^`\n,]+`?\s+version\s+`?([^`,\s]+)`?,\s+hash\s+`?(fnv1a32:[0-9a-f]+)`?/iu
		},
		{
			source: 'current-eval-suite-line',
			re: /Current eval suite:\s+`?([^`\s]+)`?\s*\/\s*`?(fnv1a32:[0-9a-f]+)`?/iu
		},
		{
			source: 'suite-fields-line',
			re: /Suite fields:.*?suiteVersion=([^`,\s]+).*?suiteHash=(fnv1a32:[0-9a-f]+)/iu
		}
	];
	for (const pattern of patterns) {
		const match = text.match(pattern.re);
		if (!match) continue;
		return {
			suiteVersion: cleanMarkdownValue(match[1]),
			suiteHash: cleanMarkdownValue(match[2]),
			source: pattern.source
		};
	}
	return null;
}

async function repoShaFromIosUploadProof(text, proofPath) {
	const direct = cleanMarkdownValue(firstMarkdownValue(text, 'Repo SHA'));
	if (isGitSha(direct)) {
		return { sha: direct, source: 'proof' };
	}
	const repoShaLog = [...text.matchAll(/repo-sha[^\n]*:\s*(.+)$/gimu)]
		.map((match) => cleanMarkdownValue(match[1]))
		.find(Boolean);
	if (!repoShaLog) return null;
	const logPaths = [
		resolve(dirname(proofPath), repoShaLog),
		resolve(REPO_ROOT, repoShaLog)
	];
	for (const logPath of logPaths) {
		const logText = await readOptionalText(logPath);
		const sha = logText?.match(/\b[0-9a-f]{40}\b/iu)?.[0]?.toLowerCase();
		if (sha) return { sha, source: relative(REPO_ROOT, logPath) };
	}
	return null;
}

async function gitCommitIsAncestor(ancestorSha, descendantSha) {
	try {
		await execFileAsync('git', ['merge-base', '--is-ancestor', ancestorSha, descendantSha], {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024
		});
		return true;
	} catch {
		return false;
	}
}

function gitShaMatches(currentSha, candidateSha) {
	const current = String(currentSha ?? '').toLowerCase();
	const candidate = String(candidateSha ?? '').toLowerCase();
	return Boolean(current && candidate && (current === candidate || current.startsWith(candidate)));
}

async function gitChangedFiles(baseSha, headSha) {
	try {
		const result = await execFileAsync('git', ['diff', '--name-only', `${baseSha}..${headSha}`], {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024 * 4
		});
		return result.stdout
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.sort((left, right) => left.localeCompare(right));
	} catch {
		return [];
	}
}

export function isNativeAppSourcePath(path) {
	return /^mobile\//u.test(path);
}

async function readOptionalIosBuildSettings(path) {
	const text = await readOptionalText(path);
	if (!text) return null;
	return {
		projectPath: relative(REPO_ROOT, path),
		marketingVersion: uniqueBuildSetting(text, 'MARKETING_VERSION') ?? '<missing>',
		buildNumber: uniqueBuildSetting(text, 'CURRENT_PROJECT_VERSION') ?? '<missing>',
		teamId: uniqueBuildSetting(text, 'DEVELOPMENT_TEAM') ?? '<missing>',
		releaseProfile: uniqueBuildSetting(text, 'PROVISIONING_PROFILE_SPECIFIER') ?? '<missing>'
	};
}

function uniqueBuildSetting(text, name) {
	const matches = [...text.matchAll(new RegExp(`${name}\\s*=\\s*([^;]+);`, 'gu'))]
		.map((match) => match[1].trim())
		.filter(Boolean);
	const unique = [...new Set(matches)];
	if (unique.length === 1) return unique[0];
	if (unique.length > 1) return unique.join(' / ');
	return null;
}

function summarizeTestFlightTarget({ iosBuild, releaseEvidence, finalProof, paths }) {
	const dadTestFlightEvidence = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite');
	const targetBuild = iosBuild ? `${iosBuild.marketingVersion} (${iosBuild.buildNumber})` : null;
	const recordedDadPilotBuild = extractRecordedDadBuild(releaseEvidence);
	const targetBuildMeetsSuiteRequirement = appBuildSatisfiesFinalProof(targetBuild, finalProof);
	const recordedDadPilotMeetsSuiteRequirement = appBuildSatisfiesFinalProof(recordedDadPilotBuild, finalProof);
	return {
		targetBuild,
		recordedDadPilotBuild,
		suiteRequiredBuild: finalProof.requiredApp,
		targetBuildMeetsSuiteRequirement,
		recordedDadPilotMeetsSuiteRequirement,
		targetBuildReadyForDad: Boolean(targetBuild && recordedDadPilotBuild && targetBuild === recordedDadPilotBuild && recordedDadPilotMeetsSuiteRequirement),
		targetBuildAvailableForDad: false,
		currentTargetDeviceRunCount: 0,
		currentTargetPartialDeviceRunCount: 0,
		currentSuiteCompatibleDeviceRunCount: 0,
		currentSuiteCompatiblePartialDeviceRunCount: 0,
		publicLink: dadTestFlightEvidence?.publicLink ?? null,
		xcodeProject: relative(REPO_ROOT, paths.xcodeProjectPath),
		releaseEvidence: relative(REPO_ROOT, paths.releaseEvidencePath)
	};
}

function summarizeFinalProofRequirement(suite) {
	const raw = suite?.finalProof ?? {};
	const minAppBuild = raw?.minAppBuild === undefined || raw?.minAppBuild === null
		? null
		: Number(raw.minAppBuild);
	return {
		nativePlatform: String(raw?.nativePlatform ?? 'ios').trim() || 'ios',
		installSource: String(raw?.installSource ?? 'testflight').trim() || 'testflight',
		minAppVersion: String(raw?.minAppVersion ?? '').trim() || null,
		minAppBuild: Number.isInteger(minAppBuild) && minAppBuild > 0 ? minAppBuild : null,
		requiredApp: requiredAppLabel(suite)
	};
}

function appBuildSatisfiesFinalProof(label, finalProof) {
	const parsed = parseAppBuildLabel(label);
	if (!parsed) return false;
	if (finalProof.minAppVersion && parsed.version !== finalProof.minAppVersion) return false;
	if (finalProof.minAppBuild !== null && parsed.build < finalProof.minAppBuild) return false;
	return true;
}

function deviceRunMatchesTargetBuild(run, testflight) {
	if (!testflight.targetBuild) return false;
	const app = run?.runContext?.app;
	const installSource = run?.runContext?.installSource;
	const runBuild = app?.version && app?.build ? `${app.version} (${app.build})` : null;
	return runBuild === testflight.targetBuild && installSource?.type === 'testflight';
}

function deviceRunSatisfiesFinalProof(run, finalProof) {
	const app = run?.runContext?.app;
	const installSource = run?.runContext?.installSource;
	const native = run?.runContext?.native;
	const runBuild = app?.version && app?.build ? `${app.version} (${app.build})` : null;
	return installSource?.type === finalProof.installSource &&
		native?.platform === finalProof.nativePlatform &&
		appBuildSatisfiesFinalProof(runBuild, finalProof);
}

function isLocalPreflightRun(run, finalProof) {
	return run?.evidenceLane === DEVICE_EVIDENCE_LANE &&
		run?.runContext?.installSource?.type !== finalProof.installSource;
}

function deviceRunFinalProofMismatchEvidence(entry, finalProof) {
	const run = entry?.value ?? entry;
	const runId = run?.runId ?? '<missing>';
	const app = run?.runContext?.app;
	const installSource = run?.runContext?.installSource;
	const native = run?.runContext?.native;
	const runBuild = app?.version && app?.build ? `${app.version} (${app.build})` : '<missing app build>';
	const installType = installSource?.type ?? '<missing install source>';
	const nativePlatform = native?.platform ?? '<missing native platform>';
	const problems = [];
	if (installType !== finalProof.installSource) {
		problems.push(`install=${installType}, expected ${finalProof.installSource}`);
	}
	if (nativePlatform !== finalProof.nativePlatform) {
		problems.push(`platform=${nativePlatform}, expected ${finalProof.nativePlatform}`);
	}
	if (!appBuildSatisfiesFinalProof(runBuild, finalProof)) {
		problems.push(`app=${runBuild}, expected ${finalProof.requiredApp}`);
	}
	return `${runId} (${problems.join(', ') || 'unknown final-proof mismatch'})`;
}

function parseAppBuildLabel(label) {
	const match = String(label ?? '').match(/^(\d+(?:\.\d+)*)\s+\((\d+)\)$/u);
	if (!match) return null;
	return {
		version: match[1],
		build: Number(match[2])
	};
}

function firstMarkdownValue(text, label) {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
	const match = text.match(new RegExp(`^(?:-\\s*)?${escaped}:\\s*(.+)$`, 'imu'));
	return match?.[1]?.trim() ?? null;
}

function cleanMarkdownValue(value) {
	if (!value) return null;
	return value.trim().replace(/^`|`$/gu, '');
}

function normalizeMarkdownValue(value) {
	return cleanMarkdownValue(value)?.toLowerCase() ?? null;
}

function markdownYes(value) {
	return normalizeMarkdownValue(value) === 'yes';
}

function isGitSha(value) {
	return /^[0-9a-f]{7,40}$/iu.test(String(value ?? ''));
}

function testflightTargetEvidence(testflight) {
	const pieces = [
		`target ${testflight.targetBuild ?? '<unknown>'}`,
		`suite requires ${testflight.suiteRequiredBuild ?? '<unknown>'}`,
		`Dad Pilot records ${testflight.recordedDadPilotBuild ?? '<unknown>'}`,
		`latest native upload suite ${testflight.latestNativeUploadSuiteVersion ?? '<unknown>'} (${testflight.latestNativeUploadSuiteHash ?? '<unknown>'})`,
		`current suite ${testflight.currentSuiteVersion ?? '<unknown>'} (${testflight.currentSuiteHash ?? '<unknown>'})`
	];
	if (testflight.currentTargetDeviceRunCount > 0) {
		pieces.push(`${testflight.currentTargetDeviceRunCount} imported full device run(s) already used the target TestFlight build`);
	}
	if (testflight.currentSuiteCompatibleDeviceRunCount > 0) {
		pieces.push(`${testflight.currentSuiteCompatibleDeviceRunCount} imported full device run(s) satisfy the suite-required TestFlight build`);
	}
	if (!testflight.targetBuildMeetsSuiteRequirement) {
		return `Current Xcode target does not meet the suite final-proof requirement: ${pieces.join('; ')}`;
	}
	if (!testflight.targetBuildReadyForDad && testflight.currentSuiteCompatibleDeviceRunCount > 0) {
		return `Imported TestFlight/iPhone proof shows a suite-compatible build is installed; newer Xcode target may still be pending App Store Connect: ${pieces.join('; ')}`;
	}
	if (!testflight.latestNativeUploadHasCurrentSuite) {
		return `Latest TestFlight upload does not contain the current eval suite: ${pieces.join('; ')}`;
	}
	if (!testflight.targetBuildAvailableForDad) {
		return `Target build is not yet recorded as available for Dad: ${pieces.join('; ')}`;
	}
	if (!testflight.targetBuildReadyForDad && testflight.recordedDadPilotMeetsSuiteRequirement) {
		return `Dad Pilot has a suite-compatible TestFlight build; newer Xcode target is pending App Store Connect: ${pieces.join('; ')}`;
	}
	return `Target build is available for Dad: ${pieces.join('; ')}`;
}

function extractRecordedDadBuild(releaseEvidence) {
	const summary = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite')?.summary ?? '';
	const match = String(summary).match(/build\s+(\d+(?:\.\d+)*)\s+\((\d+)\)/iu);
	if (match) return `${match[1]} (${match[2]})`;
	return null;
}

function releaseEvidenceItem(releaseEvidence, key) {
	return releaseEvidence?.items?.[key] ??
		releaseEvidence?.evidence?.[key] ??
		releaseEvidence?.gates?.[key] ??
		releaseEvidence?.[key] ??
		null;
}

function isCurrentRun(run, suite, suiteIdentity) {
	return run?.suiteId === suite.suiteId &&
		run.suiteVersion === suiteIdentity.suiteVersion &&
		run.suiteHash === suiteIdentity.suiteHash;
}

function isCurrentBacklog(backlog, suite, suiteIdentity) {
	return backlog?.schemaVersion === 1 &&
		backlog.suiteId === suite.suiteId &&
		backlog.suiteVersion === suiteIdentity.suiteVersion &&
		backlog.suiteHash === suiteIdentity.suiteHash;
}

function isCurrentIterationPlan(plan, suite, suiteIdentity) {
	if (plan?.schemaVersion !== 1 || !Array.isArray(plan.sourceBacklogs)) return false;
	return plan.sourceBacklogs.some((backlog) => backlog.suiteId === suite.suiteId &&
		backlog.suiteVersion === suiteIdentity.suiteVersion &&
		backlog.suiteHash === suiteIdentity.suiteHash);
}

function isFullRun(run, suite) {
	return run.caseCount === suite.cases.length && run.totalSuiteCases === suite.cases.length;
}

function hasCompleteToolExpectations(run, suite) {
	return run.summary?.toolExpectationComplete === suite.cases.length &&
		(run.summary?.missingToolCases ?? 0) === 0;
}

function hasCompleteSourceEvidence(run) {
	const sourceEvidence = summarizeRunSourceEvidence(run.results ?? []);
	return sourceEvidence.missingSourceEvidenceCases === 0;
}

async function summarizeInbox(dir, suite) {
	return summarizeHandoffDirectory(dir, suite);
}

async function summarizeDownloads(dir, suite) {
	return summarizeHandoffDirectory(dir, suite);
}

async function summarizeHandoffDirectory(dir, suite) {
	if (!(await exists(dir))) {
		return {
			path: displayPath(dir),
			exists: false,
			jsonFileCount: 0,
			textFileCount: 0,
			supportedFileCount: 0,
			candidateCount: 0,
			readyForFinalIntakeCount: 0,
			partialDiagnosticCount: 0,
			blockedCandidateCount: 0,
			ignoredFileCount: 0,
			unreadableCount: 0,
			latestCandidate: null,
			latestReadyCandidate: null
		};
	}
	const candidates = [];
	let jsonFileCount = 0;
	let textFileCount = 0;
	let supportedFileCount = 0;
	let ignoredFileCount = 0;
	let unreadableCount = 0;
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isFile() || entry.name === '.gitkeep') continue;
		const path = resolve(dir, entry.name);
		if (!isSupportedScoutEvalExportFileName(entry.name)) {
			ignoredFileCount += 1;
			continue;
		}
		const lowerName = entry.name.toLowerCase();
		if (lowerName.endsWith('.json')) jsonFileCount += 1;
		if (lowerName.endsWith('.txt') || lowerName.endsWith('.text')) textFileCount += 1;
		supportedFileCount += 1;
		const stats = await stat(path);
		const parsed = await readScoutEvalCandidate(path, suite);
		if (!parsed.readable) {
			unreadableCount += 1;
			continue;
		}
		if (!parsed.candidate) {
			ignoredFileCount += 1;
			continue;
		}
		candidates.push({
			...parsed.candidate,
			mtimeMs: stats.mtimeMs,
			modifiedAt: new Date(stats.mtimeMs).toISOString()
		});
	}
	candidates.sort((left, right) => right.mtimeMs - left.mtimeMs || left.path.localeCompare(right.path));
	const latest = candidates[0] ?? null;
	const latestReady = candidates.find((candidate) => candidate.readyForFinalIntake) ?? null;
	return {
		path: displayPath(dir),
		exists: true,
		jsonFileCount,
		textFileCount,
		supportedFileCount,
		candidateCount: candidates.length,
		readyForFinalIntakeCount: candidates.filter((candidate) => candidate.readyForFinalIntake).length,
		partialDiagnosticCount: candidates.filter((candidate) => candidate.readyForPartialIntake).length,
		blockedCandidateCount: candidates.filter((candidate) => !candidate.readyForFinalIntake && !candidate.readyForPartialIntake).length,
		ignoredFileCount,
		unreadableCount,
		latestCandidate: latest ? withoutMtime(latest) : null,
		latestReadyCandidate: latestReady ? withoutMtime(latestReady) : null
	};
}

async function readScoutEvalCandidate(path, suite) {
	try {
		const { run: parsed, extractedJson } = await readScoutEvalRunJson(path);
		if (!parsed || typeof parsed !== 'object') return { readable: true, candidate: null };
		if (parsed.schemaVersion !== 1) return { readable: true, candidate: null };
		if (parsed.suiteId !== 'dad-local-ai-100') return { readable: true, candidate: null };
		if (typeof parsed.runId !== 'string' || !parsed.runId) return { readable: true, candidate: null };
		if (!Array.isArray(parsed.results)) return { readable: true, candidate: null };
		const app = parsed.runContext?.app ?? {};
		const inspection = inspectDeviceRun({ run: parsed, suite, inputPath: path });
		const blockingReasons = [
			...inspection.structuralErrors,
			...inspection.staleReasons,
			...inspection.contextProblems
		];
		return {
			readable: true,
			candidate: {
				path: displayPath(path),
				extractedJson,
				runId: parsed.runId,
				suiteId: parsed.suiteId,
				suiteVersion: parsed.suiteVersion ?? '<missing>',
				suiteHash: parsed.suiteHash ?? '<missing>',
				caseCount: typeof parsed.caseCount === 'number' ? parsed.caseCount : parsed.results.length,
				evidenceLane: parsed.evidenceLane ?? '<missing>',
				appVersion: app.version ?? null,
				appBuild: app.build ?? null,
				installSource: installSourceLabel(parsed.runContext?.installSource),
				generatedAt: parsed.generatedAt ?? '<missing>',
				inspectionStatus: inspection.status,
				readyForFinalIntake: inspection.readyForFinalIntake,
				readyForPartialIntake: inspection.readyForPartialIntake,
				blockingReasonCount: blockingReasons.length,
				blockingReasons: blockingReasons.slice(0, 6),
				warningCount: inspection.warningCount,
				missingSourceEvidenceCases: inspection.summary.missingSourceEvidenceCases,
				errorCases: inspection.summary.errorCases,
				handoff: inspection.handoff
			}
		};
	} catch (error) {
		if (error instanceof ScoutEvalRunJsonParseError && error.code === 'no-run-json') {
			return { readable: true, candidate: null };
		}
		return { readable: false, candidate: null };
	}
}

function installSourceLabel(value) {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'object' && typeof value.type === 'string') return value.type;
	return null;
}

function withoutMtime(candidate) {
	const copy = { ...candidate };
	delete copy.mtimeMs;
	return copy;
}

async function loadJsonFiles(dir) {
	if (!(await exists(dir))) return [];
	const names = await readdir(dir);
	const entries = [];
	for (const name of names.sort()) {
		if (!name.endsWith('.json')) continue;
		const path = resolve(dir, name);
		try {
			entries.push({ path, value: await readJson(path) });
		} catch (error) {
			entries.push({
				path,
				value: {
					runId: name,
					evidenceLane: 'unreadable-json',
					loadError: error instanceof Error ? error.message : String(error)
				}
			});
		}
	}
	return entries;
}

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function readOptionalJson(path) {
	if (!(await exists(path))) return null;
	return readJson(path);
}

async function readOptionalText(path) {
	if (!(await exists(path))) return null;
	return readFile(path, 'utf8');
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function countBy(items, keyFor) {
	const counts = {};
	for (const item of items) {
		const key = keyFor(item);
		counts[key] = (counts[key] ?? 0) + 1;
	}
	return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function createStatusMarkdown(status) {
	const lines = [
		'# Scout local AI eval status',
		'',
		`Generated at: ${status.generatedAt}`,
		'',
		'## Suite',
		'',
		`- Canonical: \`${status.suite.path}\``,
		`- Mobile copy: \`${status.suite.mobilePath}\``,
		`- Version/hash: \`${status.suite.version}\` / \`${status.suite.hash}\``,
		`- Cases: ${status.suite.caseCount}`,
		`- Final proof app requirement: \`${status.suite.finalProof.requiredApp}\``,
		`- Mobile copy matches: ${status.suite.mobileCopyMatches ? 'yes' : 'no'}`,
		`- Objective coverage: ${status.suite.coverage.ok ? 'yes' : 'no'}`,
		`- Task-class anti-overfit coverage: ${status.suite.taskClassCoverage.ok ? 'yes' : 'no'}`,
		`- Neighbor prompt-frame generalization coverage: ${status.suite.generalizationCoverage.ok ? 'yes' : 'no'}`,
		'',
		'Coverage areas:',
		'',
		...status.suite.coverage.areas.map((area) => `- ${area.ok ? '[x]' : '[ ]'} ${area.label}: ${area.count}/${area.minCases}`),
		'',
		'Task-class areas:',
		'',
		...status.suite.taskClassCoverage.areas.map((area) => `- ${area.ok ? '[x]' : '[ ]'} ${area.label}: ${area.count}/${area.minCases}`),
		'',
		'Generalization profiles:',
		'',
		...status.suite.generalizationCoverage.profiles.map((profile) => {
			const frames = profile.promptFrames.map((frame) => `${frame.id} ${frame.count}/${frame.minCases}`).join('; ');
			return `- ${profile.ok ? '[x]' : '[ ]'} ${profile.label}: ${profile.count}/${profile.minCases} (${frames})`;
		}),
		'',
		'## TestFlight Target',
		'',
		`- Target iOS build: \`${status.testflight.targetBuild ?? '<unknown>'}\``,
		`- Suite-required app build: \`${status.testflight.suiteRequiredBuild ?? '<unknown>'}\``,
		`- Target build meets suite requirement: ${status.testflight.targetBuildMeetsSuiteRequirement ? 'yes' : 'no'}`,
		`- Latest native upload contains current suite: ${status.testflight.latestNativeUploadHasCurrentSuite ? 'yes' : 'no'}`,
		`- Latest native upload suite: \`${status.testflight.latestNativeUploadSuiteVersion ?? '<unknown>'}\` / \`${status.testflight.latestNativeUploadSuiteHash ?? '<unknown>'}\``,
		`- Target build contains current suite: ${status.testflight.targetBuildContainsCurrentSuite ? 'yes' : 'no'}`,
		`- Recorded Dad Pilot build: \`${status.testflight.recordedDadPilotBuild ?? '<unknown>'}\``,
		`- Recorded Dad Pilot build meets suite requirement: ${status.testflight.recordedDadPilotMeetsSuiteRequirement ? 'yes' : 'no'}`,
		`- Suite-compatible Dad Pilot build available: ${status.testflight.suiteCompatibleDadPilotBuildAvailable ? 'yes' : 'no'}`,
		`- Target build ready for Dad: ${status.testflight.targetBuildReadyForDad ? 'yes' : 'no'}`,
		`- Imported target-build device runs: ${status.testflight.currentTargetDeviceRunCount}`,
		`- Imported suite-compatible device runs: ${status.testflight.currentSuiteCompatibleDeviceRunCount}`,
		`- Imported suite-compatible partial runs: ${status.testflight.currentSuiteCompatiblePartialDeviceRunCount}`,
		`- Dad TestFlight link: ${status.testflight.publicLink ?? '<unknown>'}`,
		'',
		'## Source vs Native Upload',
		'',
		`- Current checkout SHA: \`${status.nativeSource?.currentRepoSha ?? '<unknown>'}\``,
		`- Latest native upload attempt: ${status.nativeSource?.latestNativeUploadAttempt?.path ? `\`${status.nativeSource.latestNativeUploadAttempt.path}\` (${status.nativeSource.latestNativeUploadAttempt.status})` : '<none>'}`,
		`- Latest native upload attempt succeeded: ${status.nativeSource?.latestNativeUploadAttemptWasSuccessful ? 'yes' : 'no'}`,
		`- Latest successful native upload proof: ${status.nativeSource?.latestNativeUploadProof?.path ? `\`${status.nativeSource.latestNativeUploadProof.path}\`` : '<none>'}`,
		`- Latest successful native upload SHA: \`${status.nativeSource?.latestNativeUploadSha ?? '<unknown>'}\``,
		`- Latest native upload has current source: ${status.nativeSource?.latestNativeUploadHasCurrentSource ? 'yes' : 'no'}`,
		`- Latest native upload has current suite: ${status.nativeSource?.latestNativeUploadHasCurrentSuite ? 'yes' : 'no'}`,
		`- Latest native upload suite: \`${status.nativeSource?.latestNativeUploadSuiteVersion ?? '<unknown>'}\` / \`${status.nativeSource?.latestNativeUploadSuiteHash ?? '<unknown>'}\``,
		`- Current source newer than latest native upload: ${status.nativeSource?.sourceNewerThanLatestNativeUpload ? 'yes' : 'no'}`,
		`- Current native app source newer than latest native upload: ${status.nativeSource?.nativeAppSourceNewerThanLatestNativeUpload ? 'yes' : 'no'}`,
		`- Native app files changed since latest native upload: ${status.nativeSource?.nativeAppChangedFileCount ?? 0}`,
		'',
		'## Phone Build Action',
		'',
		`- Decision: ${status.phoneBuildAction?.text ?? '<unknown>'}`,
		`- Can run Run 100 now: ${status.phoneBuildAction?.canRunNow ? 'yes' : 'no'}`,
		`- Fresh upload required before Run 100: ${status.phoneBuildAction?.requiresNewUploadBeforeRun100 ? 'yes' : 'no'}`,
		`- Fresh upload required for latest app-source proof: ${status.phoneBuildAction?.requiresNewUploadForLatestAppSourceProof ? 'yes' : 'no'}`,
		'',
		'## History Timeline',
		'',
		`- Current: ${status.history?.ok ? 'yes' : 'no'}`,
		`- Reason: ${status.history?.reason ?? '<unknown>'}`,
		`- JSON: \`${status.history?.json?.path ?? status.paths.historyJson ?? DEFAULT_HISTORY_JSON}\` (${status.history?.json?.exists ? 'exists' : 'missing'})`,
		`- Timeline: \`${status.history?.html?.path ?? status.paths.historyHtml ?? DEFAULT_HISTORY_HTML}\` (${status.history?.html?.exists ? 'exists' : 'missing'})`,
		`- Latest output modified: ${status.history?.latestOutputModifiedAt ?? '<missing>'}`,
		`- Latest source checked: ${status.history?.latestSource ? `${status.history.latestSource.path} at ${status.history.latestSource.modifiedAt}` : '<none>'}`,
		`- Source files checked: ${status.history?.sourceCount ?? 0}`,
		`- Rebuild command: \`${status.history?.rebuildCommand ?? 'npm run history:scout-local-ai'}\``,
		'',
		'## Gates',
		''
	];
	for (const gate of status.gates) {
		lines.push(`- ${gate.ok ? '[x]' : '[ ]'} ${gate.label}: ${gate.evidence}`);
	}
	lines.push(
		'',
		'## Current Evidence',
		'',
		`- Runs loaded: ${status.runs.totalLoaded} (${status.runs.currentSuiteRuns} current suite)`,
		`- Proof lanes (all runs): ${formatCounts(status.runs.byLane)}`,
		`- Proof lanes (current suite): ${formatCounts(status.runs.currentByLane)}`,
		`- Model/runtime lanes (all runs): ${formatCounts(status.runs.byModelRuntime)}`,
		`- Model/runtime lanes (current suite): ${formatCounts(status.runs.currentByModelRuntime)}`,
		`- Full routing/tool-complete runs: ${status.runs.currentFullToolCompleteRuns.length}`,
		`- Full device runs: ${status.runs.currentFullDeviceRuns.length}`,
		`- Partial device runs: ${status.runs.currentPartialDeviceRuns.length}`,
		...localPreflightEvidenceLines(status),
		...answerQualityEvidenceLines(status),
		...handoffEvidenceLines(status.inbox, {
			label: 'Inbox',
			emptyAction: `drop Dad's shared JSON into \`${status.inbox?.path ?? DEFAULT_INBOX_DIR}\``,
			prepareCommand: null
		}),
		...handoffEvidenceLines(status.downloads, {
			label: 'Downloads',
			emptyAction: `save Dad's shared JSON there or keep ${DEVICE_REVIEW_WAIT_COMMAND} running`,
			prepareCommand: DEVICE_REVIEW_PREP_DOWNLOADS_COMMAND
		}),
		`- Device reviews: ${status.reviews.currentDeviceReviews.length}`,
		`- Below-5 review debt: ${status.iterations.reviewDebt.totalReviews} review(s) / ${status.iterations.reviewDebt.totalBelowFive} answer(s)`,
		`- Below-5 debt missing backlog: ${status.iterations.reviewDebt.needsBacklog.length}`,
		`- Below-5 debt missing iteration plan: ${status.iterations.reviewDebt.backlogOnly.length}`,
		`- Below-5 debt with iteration plan: ${status.iterations.reviewDebt.planned.length}`,
		`- Current below-5 backlogs: ${status.iterations.currentBacklogs.length}`,
		`- Current iteration plans: ${status.iterations.currentIterationPlans.length}`,
		`- Strict device proof passes: ${status.strictDeviceProofs.filter((proof) => proof.ok).length}`,
		'',
		'## Next Action',
		'',
		status.nextAction.text
	);
	if (status.nextAction.errors?.length) {
		lines.push('', 'Current proof errors:', '');
		for (const error of status.nextAction.errors) lines.push(`- ${error}`);
	}
	return `${lines.join('\n')}\n`;
}

function handoffEvidenceLines(summary, options) {
	const label = options.label;
	const lowerLabel = label.toLowerCase();
	const path = summary?.path ?? (label === 'Inbox' ? DEFAULT_INBOX_DIR : DEFAULT_DOWNLOADS_DIR);
	const lines = [
		`- ${label} candidate exports: ${summary?.candidateCount ?? 0}`
	];
	if (!summary?.exists) {
		lines.push(`- ${label} folder: \`${path}\` is missing`);
		return lines;
	}
	if (summary.latestCandidate) {
		const candidate = summary.latestCandidate;
		const app = candidate.appVersion && candidate.appBuild
			? `, app ${candidate.appVersion} (${candidate.appBuild})`
			: '';
		const install = candidate.installSource ? `, ${candidate.installSource}` : '';
		lines.push(`- ${label} final-ready exports: ${summary.readyForFinalIntakeCount ?? 0}; partial diagnostics: ${summary.partialDiagnosticCount ?? 0}; blocked: ${summary.blockedCandidateCount ?? 0}`);
		lines.push(`- Latest ${lowerLabel} export: \`${candidate.path}\` (${candidate.runId}, ${candidate.caseCount} cases${app}${install}, ${candidate.inspectionStatus ?? 'not inspected'})`);
		if (candidate.handoff) {
			const command = options.prepareCommand ?? candidate.handoff.prepareReviewCommand;
			lines.push(`- Latest ${lowerLabel} handoff: ${candidate.handoff.label} (${candidate.handoff.expectedAcceptanceStatus}); command: \`${command}\``);
			lines.push(`- Latest ${lowerLabel} boundary: ${candidate.handoff.proofBoundary}`);
		}
		if (summary.latestReadyCandidate && summary.latestReadyCandidate.path !== candidate.path) {
			const ready = summary.latestReadyCandidate;
			lines.push(`- Latest final-ready ${lowerLabel} export: \`${ready.path}\` (${ready.runId}, ${ready.caseCount} cases, ${ready.inspectionStatus})`);
		}
		if (candidate.blockingReasons?.length) {
			lines.push(`- Latest ${lowerLabel} block: ${candidate.blockingReasons.join('; ')}`);
		}
		return lines;
	}
	lines.push(`- Latest ${lowerLabel} export: none; ${options.emptyAction}`);
	return lines;
}

function localPreflightEvidenceLines(status) {
	const preflight = status.localPreflight;
	if (!preflight) return ['- Simulator/debug local preflight: unavailable'];
	const lines = [
		`- Simulator/debug local preflight: ${preflight.ok ? 'clean' : 'needs work'}; full runs ${preflight.fullRunCount}, partial runs ${preflight.partialRunCount}`,
		`- Simulator/debug local preflight evidence: ${preflight.evidence}`,
		`- Simulator/debug local preflight boundary: ${preflight.boundary}`
	];
	if (!preflight.ok) {
		lines.push(`- Simulator/debug local preflight command: \`${preflight.command}\``);
	}
	if (preflight.latestProofMismatch) {
		lines.push(`- Simulator/debug local final-proof mismatch: ${preflight.latestProofMismatch}`);
	}
	return lines;
}

function answerQualityEvidenceLines(status) {
	const latestFullDevice = status.runs.currentFullDeviceRuns.at(-1);
	if (!latestFullDevice) {
		return ['- Latest full device answer-quality scan: none'];
	}
	const scan = latestFullDevice.answerQuality;
	const lines = [
		`- Latest full device answer-quality scan: \`${latestFullDevice.runId}\` ${scan.status}; ${scan.flaggedCount}/${scan.caseCount} flagged, ${scan.errorCount} errors, ${scan.warningCount} warnings`,
		`- Answer-quality boundary: ${scan.boundary}`
	];
	if (scan.topFlagged?.length) {
		lines.push(`- Top answer-quality cases: ${scan.topFlagged.map((item) => `${item.caseId} (${item.checks.join(', ')})`).join('; ')}`);
	}
	return lines;
}

function modelRuntimeKey(run) {
	const firstResult = run?.results?.[0] ?? {};
	const isScaffold = run?.evidenceLane === SCAFFOLD_EVIDENCE_LANE || firstResult.answerOrigin === SCAFFOLD_EVIDENCE_LANE;
	const modelId = isScaffold ? SCAFFOLD_EVIDENCE_LANE : (run?.runContext?.modelId ?? run?.modelId);
	const mode = isScaffold ? 'scaffold' : (firstResult.mode ?? run?.mode);
	const provider = isScaffold ? SCAFFOLD_EVIDENCE_LANE : (firstResult.provider ?? run?.provider ?? firstResult.answerOrigin);
	const installType = run?.runContext?.installSource?.type ?? run?.app?.installType;
	return [
		normalizeStatusFacet(modelId, '<missing model>'),
		normalizeStatusFacet(mode, '<missing mode>'),
		normalizeStatusFacet(provider, '<missing provider>'),
		normalizeStatusFacet(installType, '<missing install>')
	].join(' / ');
}

function normalizeStatusFacet(value, fallback) {
	const text = String(value ?? '').trim();
	return text || fallback;
}

function formatCounts(counts) {
	const entries = Object.entries(counts ?? {});
	if (!entries.length) return '<none>';
	return entries.map(([key, value]) => `${key}=${value}`).join(', ');
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function isImported() {
	return process.argv[1] && resolve(process.argv[1]) !== fileURLToPath(import.meta.url);
}

function displayPath(path) {
	const repoRelativePath = relative(REPO_ROOT, path);
	if (repoRelativePath && !repoRelativePath.startsWith('..') && repoRelativePath !== path) {
		return repoRelativePath;
	}
	return path;
}

function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}
