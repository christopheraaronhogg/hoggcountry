import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	DEVICE_EVIDENCE_LANE,
	validateScoutLocalAiDeviceRunContext
} from './scout-local-ai-device-proof.mjs';
import {
	matchesToolExpectation,
	sourceEvidenceProblems,
	summarizeRunSourceEvidence
} from './scout-local-ai-source-evidence.mjs';
import {
	scoutLocalAiSuiteIdentity
} from './scout-local-ai-suite.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');

export function inspectDeviceRun({ run, suite, inputPath }) {
	const suiteIdentity = scoutLocalAiSuiteIdentity(suite);
	const structuralErrors = [];
	const warnings = [];
	const staleReasons = [];
	const contextProblems = [];
	const sourceEvidenceSummary = summarizeRunSourceEvidence(run?.results ?? []);
	const totalSuiteCases = Array.isArray(suite?.cases) ? suite.cases.length : 0;
	const caseCount = Array.isArray(run?.results) ? run.results.length : 0;

	if (!run || typeof run !== 'object' || Array.isArray(run)) {
		return buildReport({
			run,
			suite,
			inputPath,
			status: 'invalid-export',
			readyForFinalIntake: false,
			readyForPartialIntake: false,
			structuralErrors: ['run JSON must be an object'],
			warnings,
			staleReasons,
			contextProblems,
			sourceEvidenceSummary,
			caseCount,
			totalSuiteCases
		});
	}

	if (run.schemaVersion !== 1) structuralErrors.push('run.schemaVersion must be 1');
	if (!run.runId || typeof run.runId !== 'string') structuralErrors.push('run.runId must be a string');
	if (!Array.isArray(run.results)) structuralErrors.push('run.results must be an array');
	if (!run.failureCategories?.length) structuralErrors.push('run.failureCategories must be present');
	if (!run.ratingScale || typeof run.ratingScale !== 'object') structuralErrors.push('run.ratingScale must be present');
	if (run.suiteId !== suite.suiteId) staleReasons.push(`run.suiteId ${run.suiteId ?? '<missing>'} does not match ${suite.suiteId}`);
	if (run.suiteVersion !== suiteIdentity.suiteVersion) {
		staleReasons.push(`run.suiteVersion ${run.suiteVersion ?? '<missing>'} does not match ${suiteIdentity.suiteVersion}`);
	}
	if (run.suiteHash !== suiteIdentity.suiteHash) {
		staleReasons.push(`run.suiteHash ${run.suiteHash ?? '<missing>'} does not match ${suiteIdentity.suiteHash}`);
	}
	if (run.evidenceLane !== DEVICE_EVIDENCE_LANE) {
		contextProblems.push(`run.evidenceLane must be ${DEVICE_EVIDENCE_LANE}, got ${run.evidenceLane ?? '<missing>'}`);
	}

	if (Array.isArray(run.results) && Array.isArray(suite.cases)) {
		const canonicalById = new Map(suite.cases.map((testCase) => [testCase.id, testCase]));
		const seen = new Set();
		for (const result of run.results) {
			if (!result?.caseId) {
				structuralErrors.push('each result must have caseId');
				continue;
			}
			if (seen.has(result.caseId)) structuralErrors.push(`${result.caseId}: duplicate result`);
			seen.add(result.caseId);
			const expectedCase = canonicalById.get(result.caseId);
			if (!expectedCase) {
				structuralErrors.push(`${result.caseId}: not found in canonical suite`);
				continue;
			}
			if (result.case?.prompt !== expectedCase.prompt) {
				structuralErrors.push(`${result.caseId}: prompt does not match canonical suite`);
			}
			if (result.case?.documentTask !== expectedCase.documentTask) {
				structuralErrors.push(`${result.caseId}: documentTask does not match canonical suite`);
			}
			if (!sameStringArray(result.case?.requiredTools, expectedCase.requiredTools)) {
				structuralErrors.push(`${result.caseId}: requiredTools do not match canonical suite`);
			}
			if (typeof result.answer !== 'string') structuralErrors.push(`${result.caseId}: answer must be a string`);
			if (result.answerOrigin !== run.evidenceLane) {
				contextProblems.push(`${result.caseId}: answerOrigin must match run.evidenceLane ${run.evidenceLane ?? '<missing>'}, got ${result.answerOrigin ?? '<missing>'}`);
			}
			if (run.evidenceLane === DEVICE_EVIDENCE_LANE && result.mode !== 'on-device') {
				contextProblems.push(`${result.caseId}: mode must be on-device for ${DEVICE_EVIDENCE_LANE}, got ${result.mode ?? '<missing>'}`);
			}
			if (run.evidenceLane === DEVICE_EVIDENCE_LANE && result.provider !== 'on-device-gemma') {
				contextProblems.push(`${result.caseId}: provider must be on-device-gemma for ${DEVICE_EVIDENCE_LANE}, got ${result.provider ?? '<missing>'}`);
			}
			if (result.error) warnings.push(`${result.caseId}: provider error recorded: ${result.error}`);
			if (!String(result.answer ?? '').trim() && !result.error) {
				warnings.push(`${result.caseId}: answer is empty and no provider error was recorded`);
			}
			if (!result.toolExpectations || !Array.isArray(result.toolExpectations.missing)) {
				structuralErrors.push(`${result.caseId}: toolExpectations.missing must be present`);
			}
			if (!Array.isArray(result.toolInvocations)) {
				structuralErrors.push(`${result.caseId}: toolInvocations must be recorded`);
			} else {
				const actualExpectations = evaluateToolExpectations(expectedCase.requiredTools, result.toolInvocations);
				if (actualExpectations.missing.length) {
					warnings.push(`${result.caseId}: actual toolInvocations missed required tools: ${actualExpectations.missing.join(', ')}`);
				}
				if (!sameStringArray(result.toolExpectations?.hit, actualExpectations.hit)) {
					structuralErrors.push(`${result.caseId}: toolExpectations.hit does not match actual toolInvocations`);
				}
				if (!sameStringArray(result.toolExpectations?.missing, actualExpectations.missing)) {
					structuralErrors.push(`${result.caseId}: toolExpectations.missing does not match actual toolInvocations`);
				}
				for (const problem of sourceEvidenceProblems(expectedCase.requiredTools, result.toolInvocations)) {
					warnings.push(`${result.caseId}: ${problem.message}`);
				}
			}
		}
		const missingCanonical = suite.cases.filter((testCase) => !seen.has(testCase.id)).map((testCase) => testCase.id);
		if (missingCanonical.length) {
			warnings.push(`export is missing ${missingCanonical.length} canonical case(s): ${missingCanonical.slice(0, 10).join(', ')}`);
		}
	}

	if (run.caseCount !== caseCount) {
		structuralErrors.push(`run.caseCount ${run.caseCount ?? '<missing>'} does not match results length ${caseCount}`);
	}
	if (run.totalSuiteCases !== totalSuiteCases) {
		structuralErrors.push(`run.totalSuiteCases ${run.totalSuiteCases ?? '<missing>'} does not match canonical suite length ${totalSuiteCases}`);
	}
	if (sourceEvidenceSummary.missingSourceEvidenceCases) {
		warnings.push(`source evidence missing for ${sourceEvidenceSummary.missingSourceEvidenceCases} case(s): ${formatSourceEvidenceCounts(sourceEvidenceSummary.missingSourceEvidenceCounts)}`);
	}

	if (run.evidenceLane === DEVICE_EVIDENCE_LANE && caseCount >= totalSuiteCases && totalSuiteCases > 0) {
		contextProblems.push(...validateScoutLocalAiDeviceRunContext({ suite, run }));
	}

	const fullRun = totalSuiteCases > 0 && caseCount >= totalSuiteCases && run.totalSuiteCases === totalSuiteCases;
	const hasBlockingStructure = structuralErrors.length > 0;
	const hasStaleSuite = staleReasons.length > 0;
	const hasContextProblems = contextProblems.length > 0;
	const readyForFinalIntake = fullRun && !hasBlockingStructure && !hasStaleSuite && !hasContextProblems;
	const readyForPartialIntake = !readyForFinalIntake &&
		!fullRun &&
		caseCount > 0 &&
		!hasBlockingStructure &&
		!hasStaleSuite &&
		run.evidenceLane === DEVICE_EVIDENCE_LANE;
	const status = readyForFinalIntake
		? 'ready-for-final-intake'
		: readyForPartialIntake
			? 'partial-diagnostic'
			: hasStaleSuite
				? 'stale-suite'
				: hasContextProblems
					? 'wrong-proof-context'
					: 'invalid-export';

	return buildReport({
		run,
		suite,
		inputPath,
		status,
		readyForFinalIntake,
		readyForPartialIntake,
		structuralErrors,
		warnings,
		staleReasons,
		contextProblems,
		sourceEvidenceSummary,
		caseCount,
		totalSuiteCases
	});
}

function buildReport({
	run,
	suite,
	inputPath,
	status,
	readyForFinalIntake,
	readyForPartialIntake,
	structuralErrors,
	warnings,
	staleReasons,
	contextProblems,
	sourceEvidenceSummary,
	caseCount,
	totalSuiteCases
}) {
	const runArg = formatPathForCommand(inputPath);
	const nextCommand = readyForFinalIntake
		? `npm run intake:scout-local-ai-device-run -- --run ${runArg}`
		: readyForPartialIntake
			? `npm run intake:scout-local-ai-device-run -- --run ${runArg} --allow-partial`
			: null;
	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		status,
		readyForFinalIntake,
		readyForPartialIntake,
		nextCommand,
		inputPath: formatPathForDisplay(inputPath),
		run: {
			runId: run?.runId ?? '<missing>',
			evidenceLane: run?.evidenceLane ?? '<missing>',
			suiteId: run?.suiteId ?? '<missing>',
			suiteVersion: run?.suiteVersion ?? '<missing>',
			suiteHash: run?.suiteHash ?? '<missing>',
			caseCount,
			totalSuiteCases: run?.totalSuiteCases ?? '<missing>',
			appVersion: run?.runContext?.app?.version ?? '<missing>',
			appBuild: run?.runContext?.app?.build ?? '<missing>',
			installSource: run?.runContext?.installSource?.type ?? '<missing>',
			nativePlatform: run?.runContext?.native?.platform ?? '<missing>',
			modelId: run?.runContext?.modelId ?? '<missing>',
			executionId: run?.runContext?.execution?.id ?? '<missing>'
		},
		suite: {
			suiteId: suite?.suiteId ?? '<missing>',
			version: suite?.version ?? '<missing>',
			hash: scoutLocalAiSuiteIdentity(suite).suiteHash,
			caseCount: totalSuiteCases
		},
		handoff: normalizeExportHandoff(run?.exportHandoff),
		summary: {
			requiredToolComplete: run?.summary?.toolExpectationComplete ?? 0,
			missingToolCases: run?.summary?.missingToolCases ?? 0,
			sourceEvidenceComplete: sourceEvidenceSummary.sourceEvidenceComplete,
			missingSourceEvidenceCases: sourceEvidenceSummary.missingSourceEvidenceCases,
			errorCases: (run?.results ?? []).filter((result) => Boolean(result?.error)).length
		},
		structuralErrors,
		staleReasons,
		contextProblems,
		warnings: warnings.slice(0, 40),
		warningCount: warnings.length
	};
}

function evaluateToolExpectations(requiredTools, invocations) {
	const hit = [];
	const missing = [];
	for (const expectation of requiredTools ?? []) {
		if ((invocations ?? []).some((record) => matchesToolExpectation(expectation, record))) {
			hit.push(expectation);
		} else {
			missing.push(expectation);
		}
	}
	return { hit, missing };
}

function sameStringArray(left, right) {
	return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function formatSourceEvidenceCounts(counts) {
	const entries = Object.entries(counts ?? {}).sort((left, right) => right[1] - left[1]);
	if (!entries.length) return 'none';
	return entries.slice(0, 6).map(([key, count]) => `${key}=${count}`).join(', ');
}

function normalizeExportHandoff(handoff) {
	if (!handoff || typeof handoff !== 'object' || Array.isArray(handoff)) return null;
	return {
		kind: stringOrMissing(handoff.kind),
		label: stringOrMissing(handoff.label),
		expectedAcceptanceStatus: stringOrMissing(handoff.expectedAcceptanceStatus),
		canStartFinalReview: handoff.canStartFinalReview === true,
		reviewInboxPath: stringOrMissing(handoff.reviewInboxPath),
		prepareReviewCommand: stringOrMissing(handoff.prepareReviewCommand),
		proofBoundary: stringOrMissing(handoff.proofBoundary),
		recommendedAction: stringOrMissing(handoff.recommendedAction),
		proofContextProblems: Array.isArray(handoff.proofContextProblems)
			? handoff.proofContextProblems.map((problem) => String(problem)).filter(Boolean)
			: []
	};
}

function stringOrMissing(value) {
	return typeof value === 'string' && value ? value : '<missing>';
}

function formatPathForDisplay(path) {
	const relativePath = relative(REPO_ROOT, path);
	return relativePath.startsWith('..') ? path : relativePath;
}

function formatPathForCommand(path) {
	const display = formatPathForDisplay(path);
	return /[\s"'`$\\]/u.test(display) ? JSON.stringify(display) : display;
}
