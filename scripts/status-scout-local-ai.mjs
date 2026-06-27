import { access, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	requiredAppLabel,
	verifyScoutLocalAiDeviceProof
} from './lib/scout-local-ai-device-proof.mjs';
import {
	parseCliArgs,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';
import {
	summarizeRunSourceEvidence
} from './lib/scout-local-ai-source-evidence.mjs';
import {
	summarizeScoutLocalAiSuiteCoverage
} from './lib/scout-local-ai-suite-coverage.mjs';
import {
	scoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_MOBILE_SUITE = 'mobile/static/scout/dad-local-ai-100.json';
const DEFAULT_RUNS_DIR = 'data/scout-local-ai/runs';
const DEFAULT_DEVICE_RUNS_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_INBOX_DIR = 'data/scout-local-ai/inbox';
const DEFAULT_REVIEWS_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_BACKLOG_DIR = 'data/scout-local-ai/backlog';
const DEFAULT_ITERATIONS_DIR = 'data/scout-local-ai/iterations';
const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';

const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';
const SCAFFOLD_EVIDENCE_LANE = 'scaffold-not-model';
const DEVICE_REVIEW_PREP_COMMAND = 'npm run prepare-review:scout-local-ai-device-run -- --run inbox';

const cli = parseCliArgs(process.argv.slice(2));

const status = await buildStatus({
	suitePath: resolveInputPath(cli.suite ?? DEFAULT_SUITE),
	mobileSuitePath: resolveInputPath(cli.mobileSuite ?? DEFAULT_MOBILE_SUITE),
	runsDir: resolveInputPath(cli.runsDir ?? DEFAULT_RUNS_DIR),
	deviceRunsDir: resolveInputPath(cli.deviceRunsDir ?? DEFAULT_DEVICE_RUNS_DIR),
	inboxDir: resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR),
	reviewsDir: resolveInputPath(cli.reviewsDir ?? DEFAULT_REVIEWS_DIR),
	backlogDir: resolveInputPath(cli.backlogDir ?? DEFAULT_BACKLOG_DIR),
	iterationsDir: resolveInputPath(cli.iterationsDir ?? DEFAULT_ITERATIONS_DIR),
	xcodeProjectPath: resolveInputPath(cli.xcodeProject ?? DEFAULT_XCODE_PROJECT),
	releaseEvidencePath: resolveInputPath(cli.releaseEvidence ?? DEFAULT_RELEASE_EVIDENCE)
});

if (cli.json) {
	console.log(JSON.stringify(status, null, 2));
} else {
	console.log(createStatusMarkdown(status));
}

async function buildStatus(paths) {
	const generatedAt = new Date().toISOString();
	const suite = await readJson(paths.suitePath);
	const mobileSuite = await readOptionalJson(paths.mobileSuitePath);
	const suiteIdentity = scoutLocalAiSuiteIdentity(suite);
	const finalProof = summarizeFinalProofRequirement(suite);
	const suiteErrors = validateSuite(suite, mobileSuite, suiteIdentity);
	const suiteCoverage = summarizeScoutLocalAiSuiteCoverage(suite);
	const runs = await loadJsonFiles(paths.runsDir);
	const deviceRuns = await loadJsonFiles(paths.deviceRunsDir);
	const reviews = await loadJsonFiles(paths.reviewsDir);
	const backlogs = await loadJsonFiles(paths.backlogDir);
	const iterationFiles = await loadJsonFiles(paths.iterationsDir);
	const inbox = await summarizeInbox(paths.inboxDir);
	const iosBuild = await readOptionalIosBuildSettings(paths.xcodeProjectPath);
	const releaseEvidence = await readOptionalJson(paths.releaseEvidencePath);
	const testflight = summarizeTestFlightTarget({ iosBuild, releaseEvidence, finalProof, paths });
	const allRuns = [...runs, ...deviceRuns];
	const reviewsByRunId = new Map(reviews.map((entry) => [entry.value.runId, entry]));
	const currentRuns = allRuns.filter((entry) => isCurrentRun(entry.value, suite, suiteIdentity));
	const currentBacklogs = backlogs.filter((entry) => isCurrentBacklog(entry.value, suite, suiteIdentity));
	const currentIterationPlans = iterationFiles.filter((entry) => isCurrentIterationPlan(entry.value, suite, suiteIdentity));
	const currentDeviceRuns = currentRuns.filter((entry) => entry.value.evidenceLane === DEVICE_EVIDENCE_LANE);
	const currentFullDeviceRuns = currentDeviceRuns.filter((entry) => isFullRun(entry.value, suite));
	const currentPartialDeviceRuns = currentDeviceRuns.filter((entry) => !isFullRun(entry.value, suite));
	testflight.currentTargetDeviceRunCount = currentFullDeviceRuns.filter((entry) => deviceRunMatchesTargetBuild(entry.value, testflight)).length;
	testflight.currentTargetPartialDeviceRunCount = currentPartialDeviceRuns.filter((entry) => deviceRunMatchesTargetBuild(entry.value, testflight)).length;
	testflight.targetBuildAvailableForDad = testflight.targetBuildReadyForDad || testflight.currentTargetDeviceRunCount > 0;
	const currentFullToolCompleteRuns = currentRuns.filter(
		(entry) => isFullRun(entry.value, suite) && hasCompleteToolExpectations(entry.value, suite) && hasCompleteSourceEvidence(entry.value)
	);
	const currentFullRoutingRuns = currentRuns.filter(
		(entry) => entry.value.evidenceLane === SCAFFOLD_EVIDENCE_LANE && isFullRun(entry.value, suite) && hasCompleteToolExpectations(entry.value, suite) && hasCompleteSourceEvidence(entry.value)
	);
	const reviewSummaries = reviews.map((entry) => ({
		path: entry.path,
		runId: entry.value.runId ?? '<missing>',
		evidenceLane: entry.value.evidenceLane ?? '<missing>',
		suiteVersion: entry.value.suiteVersion ?? '<missing>',
		suiteHash: entry.value.suiteHash ?? '<missing>',
		summary: summarizeReview(entry.value)
	}));
	const currentDeviceReviewSummaries = reviewSummaries.filter((entry) => {
		const run = currentFullDeviceRuns.find((candidate) => candidate.value.runId === entry.runId)?.value;
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
	const strictDeviceProofs = currentFullDeviceRuns.map((runEntry) => {
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
			ok: result.errors.length === 0,
			errorCount: result.errors.length,
			errors: result.errors.slice(0, 12)
		};
	});
	const strictDeviceProofPasses = strictDeviceProofs.filter((proof) => proof.ok);
	const gates = createGates({
		suiteErrors,
		suiteCoverage,
		suite,
		suiteIdentity,
		testflight,
		iterationDebt,
		currentFullRoutingRuns,
		currentFullToolCompleteRuns,
		currentFullDeviceRuns,
		currentPartialDeviceRuns,
		completeFiveStarDeviceReviews,
		strictDeviceProofPasses
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
			errors: suiteErrors
		},
		paths: {
			runsDir: relative(REPO_ROOT, paths.runsDir),
			deviceRunsDir: relative(REPO_ROOT, paths.deviceRunsDir),
			inboxDir: relative(REPO_ROOT, paths.inboxDir),
			reviewsDir: relative(REPO_ROOT, paths.reviewsDir),
			backlogDir: relative(REPO_ROOT, paths.backlogDir),
			iterationsDir: relative(REPO_ROOT, paths.iterationsDir),
			xcodeProject: relative(REPO_ROOT, paths.xcodeProjectPath),
			releaseEvidence: relative(REPO_ROOT, paths.releaseEvidencePath)
		},
		testflight,
		inbox,
		runs: {
			totalLoaded: allRuns.length,
			currentSuiteRuns: currentRuns.length,
			currentFullRoutingRuns: summarizeRunList(currentFullRoutingRuns),
			currentFullDeviceRuns: summarizeRunList(currentFullDeviceRuns),
			currentPartialDeviceRuns: summarizeRunList(currentPartialDeviceRuns),
			currentFullToolCompleteRuns: summarizeRunList(currentFullToolCompleteRuns),
			byLane: countBy(allRuns, (entry) => entry.value.evidenceLane ?? '<missing>')
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
		strictDeviceProofs,
		gates,
		nextAction: nextActionFor(
			gates,
			currentFullDeviceRuns,
			currentPartialDeviceRuns,
			currentDeviceReviewSummaries,
			completeFiveStarDeviceReviews,
			currentBacklogs,
			currentIterationPlans,
			strictDeviceProofs,
			testflight,
			inbox
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
	const routingOk = input.currentFullRoutingRuns.length > 0 || input.currentFullToolCompleteRuns.length > 0;
	const testflightOk = input.testflight.targetBuildAvailableForDad && input.testflight.targetBuildMeetsSuiteRequirement;
	const deviceOk = input.currentFullDeviceRuns.length > 0;
	const reviewOk = input.completeFiveStarDeviceReviews.length > 0;
	const iterationDebtOk = input.iterationDebt.ok;
	const strictOk = input.strictDeviceProofPasses.length > 0;
	const stabilityOk = new Set(input.strictDeviceProofPasses.map((proof) => proof.runId)).size >= 2;
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
			id: 'routing',
			label: 'Full-suite tool routing proof',
			ok: routingOk,
			evidence: routingOk
				? `${input.currentFullToolCompleteRuns.length} current full run(s) with all required tools hit and source evidence recorded`
				: 'No current full 100-case run has complete required-tool hits and source evidence'
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
				? `${input.currentFullDeviceRuns.length} current full device run(s) found`
				: input.currentPartialDeviceRuns.length
					? `No current full device-on-device-gemma run found; ${input.currentPartialDeviceRuns.length} partial device run(s) imported: ${input.currentPartialDeviceRuns.map((entry) => `${entry.value.runId ?? '<missing>'} ${entry.value.caseCount ?? 0}/${entry.value.totalSuiteCases ?? '?'}`).join(', ')}`
				: 'No current full device-on-device-gemma run found'
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
				? 'At least two distinct strict TestFlight/iPhone proof runs pass'
				: 'Need two distinct strict full TestFlight/iPhone runs before stability proof'
		}
	];
}

function nextActionFor(
	gates,
	currentFullDeviceRuns,
	currentPartialDeviceRuns,
	currentDeviceReviewSummaries,
	completeFiveStarDeviceReviews,
	currentBacklogs,
	currentIterationPlans,
	strictDeviceProofs,
	testflight,
	inbox
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
	if (!gate('routing')?.ok) {
		return {
			kind: 'prove-routing',
			text: 'Run npm run eval:scout-local-ai and fix any missing required-tool hits before Dad spends time on phone review.'
		};
	}
	if (!gate('testflight-target')?.ok) {
		if (!testflight?.targetBuildMeetsSuiteRequirement) {
			return {
				kind: 'align-suite-build',
				text: `Align the Xcode target build with the suite final-proof requirement ${testflight?.suiteRequiredBuild ?? '<unknown>'}; current target is ${testflight?.targetBuild ?? '<unknown>'}.`
			};
		}
		return {
			kind: 'publish-target-build',
			text: `Upload and attach target iOS build ${testflight.targetBuild ?? '<unknown>'} to Dad Pilot first; release evidence currently records Dad Pilot on ${testflight.recordedDadPilotBuild ?? '<unknown>'}, while the suite requires ${testflight.suiteRequiredBuild ?? '<unknown>'}. After App Store Connect shows the target build through the TestFlight link, update the iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then prepare review with ${DEVICE_REVIEW_PREP_COMMAND}.`
		};
	}
	if (!gate('device-run')?.ok) {
		if (inbox?.latestCandidate) {
			const candidate = inbox.latestCandidate;
			return {
				kind: 'prepare-inbox-export',
				text: `A likely Scout Eval Lab export is already in ${inbox.path}: ${candidate.path} (${candidate.runId}, ${candidate.caseCount} cases). Inspect and import it with ${DEVICE_REVIEW_PREP_COMMAND}. If inspection blocks it, fix that export or rerun Run 100 on the phone; do not count it as final Dad proof until intake creates a current full device-on-device-gemma run.`
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
		return {
			kind: 'get-device-run',
			text: `Install the latest TestFlight build on Dad/Chris iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then prepare review with ${DEVICE_REVIEW_PREP_COMMAND}.`
		};
	}
	const latestDeviceRun = currentFullDeviceRuns.at(-1)?.value.runId ?? '<run-id>';
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
		return {
			kind: 'finish-review',
			text: `Fill ratings/checklists in data/scout-local-ai/reviews/${latestDeviceRun}.review.json, then run npm run review:scout-local-ai -- --run data/scout-local-ai/device-runs/${latestDeviceRun}.json --review data/scout-local-ai/reviews/${latestDeviceRun}.review.json.`
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
			missingSourceEvidenceCases: entry.value.summary?.missingSourceEvidenceCases ?? sourceEvidence.missingSourceEvidenceCases
		};
	});
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

function parseAppBuildLabel(label) {
	const match = String(label ?? '').match(/^(\d+(?:\.\d+)*)\s+\((\d+)\)$/u);
	if (!match) return null;
	return {
		version: match[1],
		build: Number(match[2])
	};
}

function testflightTargetEvidence(testflight) {
	const pieces = [
		`target ${testflight.targetBuild ?? '<unknown>'}`,
		`suite requires ${testflight.suiteRequiredBuild ?? '<unknown>'}`,
		`Dad Pilot records ${testflight.recordedDadPilotBuild ?? '<unknown>'}`
	];
	if (testflight.currentTargetDeviceRunCount > 0) {
		pieces.push(`${testflight.currentTargetDeviceRunCount} imported full device run(s) already used the target TestFlight build`);
	}
	if (!testflight.targetBuildMeetsSuiteRequirement) {
		return `Current Xcode target does not meet the suite final-proof requirement: ${pieces.join('; ')}`;
	}
	if (!testflight.targetBuildAvailableForDad) {
		return `Target build is not yet recorded as available for Dad: ${pieces.join('; ')}`;
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

async function summarizeInbox(dir) {
	if (!(await exists(dir))) {
		return {
			path: relative(REPO_ROOT, dir),
			exists: false,
			jsonFileCount: 0,
			candidateCount: 0,
			ignoredFileCount: 0,
			unreadableCount: 0,
			latestCandidate: null
		};
	}
	const candidates = [];
	let jsonFileCount = 0;
	let ignoredFileCount = 0;
	let unreadableCount = 0;
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isFile() || entry.name === '.gitkeep') continue;
		const path = resolve(dir, entry.name);
		if (!entry.name.toLowerCase().endsWith('.json')) {
			ignoredFileCount += 1;
			continue;
		}
		jsonFileCount += 1;
		const stats = await stat(path);
		const parsed = await readScoutEvalCandidate(path);
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
	return {
		path: relative(REPO_ROOT, dir),
		exists: true,
		jsonFileCount,
		candidateCount: candidates.length,
		ignoredFileCount,
		unreadableCount,
		latestCandidate: latest ? withoutMtime(latest) : null
	};
}

async function readScoutEvalCandidate(path) {
	try {
		const parsed = await readJson(path);
		if (!parsed || typeof parsed !== 'object') return { readable: true, candidate: null };
		if (parsed.schemaVersion !== 1) return { readable: true, candidate: null };
		if (parsed.suiteId !== 'dad-local-ai-100') return { readable: true, candidate: null };
		if (typeof parsed.runId !== 'string' || !parsed.runId) return { readable: true, candidate: null };
		if (!Array.isArray(parsed.results)) return { readable: true, candidate: null };
		const app = parsed.runContext?.app ?? {};
		return {
			readable: true,
			candidate: {
				path: relative(REPO_ROOT, path),
				runId: parsed.runId,
				suiteId: parsed.suiteId,
				suiteVersion: parsed.suiteVersion ?? '<missing>',
				suiteHash: parsed.suiteHash ?? '<missing>',
				caseCount: typeof parsed.caseCount === 'number' ? parsed.caseCount : parsed.results.length,
				evidenceLane: parsed.evidenceLane ?? '<missing>',
				appVersion: app.version ?? null,
				appBuild: app.build ?? null,
				installSource: installSourceLabel(parsed.runContext?.installSource),
				generatedAt: parsed.generatedAt ?? '<missing>'
			}
		};
	} catch {
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
		'',
		'Coverage areas:',
		'',
		...status.suite.coverage.areas.map((area) => `- ${area.ok ? '[x]' : '[ ]'} ${area.label}: ${area.count}/${area.minCases}`),
		'',
		'## TestFlight Target',
		'',
		`- Target iOS build: \`${status.testflight.targetBuild ?? '<unknown>'}\``,
		`- Suite-required app build: \`${status.testflight.suiteRequiredBuild ?? '<unknown>'}\``,
		`- Target build meets suite requirement: ${status.testflight.targetBuildMeetsSuiteRequirement ? 'yes' : 'no'}`,
		`- Recorded Dad Pilot build: \`${status.testflight.recordedDadPilotBuild ?? '<unknown>'}\``,
		`- Recorded Dad Pilot build meets suite requirement: ${status.testflight.recordedDadPilotMeetsSuiteRequirement ? 'yes' : 'no'}`,
		`- Target build ready for Dad: ${status.testflight.targetBuildReadyForDad ? 'yes' : 'no'}`,
		`- Imported target-build device runs: ${status.testflight.currentTargetDeviceRunCount}`,
		`- Dad TestFlight link: ${status.testflight.publicLink ?? '<unknown>'}`,
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
		`- Full routing/tool-complete runs: ${status.runs.currentFullToolCompleteRuns.length}`,
		`- Full device runs: ${status.runs.currentFullDeviceRuns.length}`,
		`- Partial device runs: ${status.runs.currentPartialDeviceRuns.length}`,
		...inboxEvidenceLines(status.inbox),
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

function inboxEvidenceLines(inbox) {
	const path = inbox?.path ?? DEFAULT_INBOX_DIR;
	const lines = [
		`- Inbox candidate exports: ${inbox?.candidateCount ?? 0}`
	];
	if (!inbox?.exists) {
		lines.push(`- Inbox folder: \`${path}\` is missing`);
		return lines;
	}
	if (inbox.latestCandidate) {
		const candidate = inbox.latestCandidate;
		const app = candidate.appVersion && candidate.appBuild
			? `, app ${candidate.appVersion} (${candidate.appBuild})`
			: '';
		const install = candidate.installSource ? `, ${candidate.installSource}` : '';
		lines.push(`- Latest inbox export: \`${candidate.path}\` (${candidate.runId}, ${candidate.caseCount} cases${app}${install})`);
		return lines;
	}
	lines.push(`- Latest inbox export: none; drop Dad's shared JSON into \`${path}\``);
	return lines;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}
