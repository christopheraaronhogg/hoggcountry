import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
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
	scoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_MOBILE_SUITE = 'mobile/static/scout/dad-local-ai-100.json';
const DEFAULT_RUNS_DIR = 'data/scout-local-ai/runs';
const DEFAULT_DEVICE_RUNS_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_REVIEWS_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';

const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';
const SCAFFOLD_EVIDENCE_LANE = 'scaffold-not-model';

const cli = parseCliArgs(process.argv.slice(2));

const status = await buildStatus({
	suitePath: resolveInputPath(cli.suite ?? DEFAULT_SUITE),
	mobileSuitePath: resolveInputPath(cli.mobileSuite ?? DEFAULT_MOBILE_SUITE),
	runsDir: resolveInputPath(cli.runsDir ?? DEFAULT_RUNS_DIR),
	deviceRunsDir: resolveInputPath(cli.deviceRunsDir ?? DEFAULT_DEVICE_RUNS_DIR),
	reviewsDir: resolveInputPath(cli.reviewsDir ?? DEFAULT_REVIEWS_DIR),
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
	const suiteErrors = validateSuite(suite, mobileSuite, suiteIdentity);
	const runs = await loadJsonFiles(paths.runsDir);
	const deviceRuns = await loadJsonFiles(paths.deviceRunsDir);
	const reviews = await loadJsonFiles(paths.reviewsDir);
	const iosBuild = await readOptionalIosBuildSettings(paths.xcodeProjectPath);
	const releaseEvidence = await readOptionalJson(paths.releaseEvidencePath);
	const testflight = summarizeTestFlightTarget({ iosBuild, releaseEvidence, paths });
	const allRuns = [...runs, ...deviceRuns];
	const reviewsByRunId = new Map(reviews.map((entry) => [entry.value.runId, entry]));
	const currentRuns = allRuns.filter((entry) => isCurrentRun(entry.value, suite, suiteIdentity));
	const currentDeviceRuns = currentRuns.filter((entry) => entry.value.evidenceLane === DEVICE_EVIDENCE_LANE);
	const currentFullDeviceRuns = currentDeviceRuns.filter((entry) => isFullRun(entry.value, suite));
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
		suite,
		suiteIdentity,
		currentFullRoutingRuns,
		currentFullToolCompleteRuns,
		currentFullDeviceRuns,
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
			mobileCopyMatches: mobileSuite ? stableJson(mobileSuite) === stableJson(suite) : false,
			errors: suiteErrors
		},
		paths: {
			runsDir: relative(REPO_ROOT, paths.runsDir),
			deviceRunsDir: relative(REPO_ROOT, paths.deviceRunsDir),
			reviewsDir: relative(REPO_ROOT, paths.reviewsDir),
			xcodeProject: relative(REPO_ROOT, paths.xcodeProjectPath),
			releaseEvidence: relative(REPO_ROOT, paths.releaseEvidencePath)
		},
		testflight,
		runs: {
			totalLoaded: allRuns.length,
			currentSuiteRuns: currentRuns.length,
			currentFullRoutingRuns: summarizeRunList(currentFullRoutingRuns),
			currentFullDeviceRuns: summarizeRunList(currentFullDeviceRuns),
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
		strictDeviceProofs,
		gates,
		nextAction: nextActionFor(gates, currentFullDeviceRuns, completeFiveStarDeviceReviews, strictDeviceProofs, testflight)
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
	const routingOk = input.currentFullRoutingRuns.length > 0 || input.currentFullToolCompleteRuns.length > 0;
	const deviceOk = input.currentFullDeviceRuns.length > 0;
	const reviewOk = input.completeFiveStarDeviceReviews.length > 0;
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
			id: 'routing',
			label: 'Full-suite tool routing proof',
			ok: routingOk,
			evidence: routingOk
				? `${input.currentFullToolCompleteRuns.length} current full run(s) with all required tools hit and source evidence recorded`
				: 'No current full 100-case run has complete required-tool hits and source evidence'
		},
		{
			id: 'device-run',
			label: 'Full TestFlight/iPhone Eval Lab run imported',
			ok: deviceOk,
			evidence: deviceOk
				? `${input.currentFullDeviceRuns.length} current full device run(s) found`
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

function nextActionFor(gates, currentFullDeviceRuns, completeFiveStarDeviceReviews, strictDeviceProofs, testflight) {
	const gate = (id) => gates.find((item) => item.id === id);
	if (!gate('suite')?.ok) {
		return {
			kind: 'fix-suite',
			text: 'Fix the canonical suite/mobile copy drift, then run npm run sync:scout-local-ai-suite and the suite test.'
		};
	}
	if (!gate('routing')?.ok) {
		return {
			kind: 'prove-routing',
			text: 'Run npm run eval:scout-local-ai and fix any missing required-tool hits before Dad spends time on phone review.'
		};
	}
	if (!gate('device-run')?.ok) {
		if (testflight?.targetBuild && testflight.recordedDadPilotBuild && !testflight.targetBuildReadyForDad) {
			return {
				kind: 'publish-target-build',
				text: `Upload and attach target iOS build ${testflight.targetBuild} to Dad Pilot first; release evidence currently records Dad Pilot on ${testflight.recordedDadPilotBuild}. After App Store Connect shows the target build through the TestFlight link, update the iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then import it with npm run intake:scout-local-ai-device-run.`
			};
		}
		return {
			kind: 'get-device-run',
			text: 'Install the latest TestFlight build on Dad/Chris iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then import it with npm run intake:scout-local-ai-device-run.'
		};
	}
	const latestDeviceRun = currentFullDeviceRuns.at(-1)?.value.runId ?? '<run-id>';
	if (!gate('review')?.ok) {
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

function summarizeTestFlightTarget({ iosBuild, releaseEvidence, paths }) {
	const dadTestFlightEvidence = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite');
	const targetBuild = iosBuild ? `${iosBuild.marketingVersion} (${iosBuild.buildNumber})` : null;
	const recordedDadPilotBuild = extractRecordedDadBuild(releaseEvidence);
	return {
		targetBuild,
		recordedDadPilotBuild,
		targetBuildReadyForDad: Boolean(targetBuild && recordedDadPilotBuild && targetBuild === recordedDadPilotBuild),
		publicLink: dadTestFlightEvidence?.publicLink ?? null,
		xcodeProject: relative(REPO_ROOT, paths.xcodeProjectPath),
		releaseEvidence: relative(REPO_ROOT, paths.releaseEvidencePath)
	};
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
		`- Mobile copy matches: ${status.suite.mobileCopyMatches ? 'yes' : 'no'}`,
		'',
		'## TestFlight Target',
		'',
		`- Target iOS build: \`${status.testflight.targetBuild ?? '<unknown>'}\``,
		`- Recorded Dad Pilot build: \`${status.testflight.recordedDadPilotBuild ?? '<unknown>'}\``,
		`- Target build ready for Dad: ${status.testflight.targetBuildReadyForDad ? 'yes' : 'no'}`,
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
		`- Device reviews: ${status.reviews.currentDeviceReviews.length}`,
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
