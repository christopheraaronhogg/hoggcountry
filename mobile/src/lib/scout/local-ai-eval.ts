import { cloneDefaultContextPack } from './default-pack.ts';
import {
	scoutLocalAiEvalRunContextProblems
} from './local-ai-eval-proof.ts';
import type {
	CachedWeather,
	ContextPack,
	LoadoutItem,
	LocalDocumentReference,
	ParkServicesContext,
	ScoutAnswer,
	ScoutConversationMessage,
	ToolInvocationRecord,
	TrailConditionReference,
	TrailConditionsContext
} from './types.ts';

export type ScoutLocalAiEvidenceLane =
	| 'scaffold-not-model'
	| 'external-local-model-command'
	| 'device-on-device-gemma';

export const SCOUT_LOCAL_AI_EVAL_REVIEW_INBOX_PATH = 'data/scout-local-ai/inbox/';
export const SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND = 'npm run prepare-review:scout-local-ai-device-run -- --run inbox';

export interface ScoutLocalAiEvalCase {
	id: string;
	phase: 'pre-trail' | 'on-trail';
	domain: string;
	prompt: string;
	mile: number;
	requiredTools: string[];
	expectedTraits: string[];
	safetyCaveats: string[];
	improvementTags: string[];
}

export interface ScoutLocalAiFinalProofRequirements {
	nativePlatform?: string;
	installSource?: string;
	minAppVersion?: string;
	minAppBuild?: number;
}

export interface ScoutLocalAiEvalSuite {
	schemaVersion: number;
	suiteId: string;
	title: string;
	version: string;
	createdAt: string;
	successTarget: string;
	ratingScale: Record<string, string>;
	failureCategories: string[];
	finalProof?: ScoutLocalAiFinalProofRequirements;
	cases: ScoutLocalAiEvalCase[];
}

export interface ScoutLocalAiToolExpectations {
	required: string[];
	hit: string[];
	missing: string[];
}

export interface ScoutLocalAiEvalResult {
	caseId: string;
	index: number;
	case: ScoutLocalAiEvalCase;
	answer: string;
	answerOrigin: ScoutLocalAiEvidenceLane;
	confidence: ScoutAnswer['confidence'];
	mode: ScoutAnswer['mode'];
	provider: ScoutAnswer['provider'];
	generatedAt: string;
	durationMs: number;
	contextUsed: string[];
	receipts: ScoutAnswer['receipts'];
	requiredConfirmations: ScoutAnswer['requiredConfirmations'];
	safetyFlags: ScoutAnswer['safetyFlags'];
	toolInvocations: ToolInvocationRecord[];
	toolExpectations: ScoutLocalAiToolExpectations;
	bridge: Record<string, unknown> | null;
	error?: string;
	rating: number | null;
	reviewerNotes: string;
	failureMode: string | null;
	suggestedFailureCategories: string[];
	improvementTask: string | null;
}

export interface ScoutLocalAiEvalExportHandoff {
	schemaVersion: number;
	kind: 'final-run-100' | 'diagnostic';
	label: string;
	expectedAcceptanceStatus: 'final-review-ready' | 'diagnostic-review-only' | 'blocked-before-review';
	canStartFinalReview: boolean;
	reviewInboxPath: string;
	prepareReviewCommand: string;
	proofBoundary: string;
	recommendedAction: string;
	proofContextProblems: string[];
	suite: {
		suiteId: string;
		version: string;
		hash: string;
		caseCount: number;
	};
	run: {
		runId: string;
		completedCases: number;
		targetCases: number;
		evidenceLane: ScoutLocalAiEvidenceLane;
	};
}

export interface ScoutLocalAiEvalRun {
	schemaVersion: number;
	runId: string;
	suiteId: string;
	suiteTitle: string;
	suiteVersion: string;
	suiteHash: string;
	suitePath: string;
	generatedAt: string;
	evidenceLane: ScoutLocalAiEvidenceLane;
	modelCommand: string | null;
	runContext?: Record<string, unknown>;
	exportHandoff?: ScoutLocalAiEvalExportHandoff;
	caseCount: number;
	totalSuiteCases: number;
	filters: {
		id: string | null;
		domain: string | null;
		phase: string | null;
		limit: number | null;
	};
	ratingScale: Record<string, string>;
	failureCategories: string[];
	summary: {
		toolExpectationComplete: number;
		missingToolCases: number;
		missingToolCounts: Record<string, number>;
		sourceEvidenceComplete: number;
		missingSourceEvidenceCases: number;
		missingSourceEvidenceCounts: Record<string, number>;
	};
	results: ScoutLocalAiEvalResult[];
}

export interface ScoutLocalAiEvalProgress {
	caseId: string;
	index: number;
	total: number;
	completed: number;
}

export async function runScoutLocalAiEval(input: {
	suite: ScoutLocalAiEvalSuite;
	evidenceLane: ScoutLocalAiEvidenceLane;
	runId?: string;
	limit?: number;
	caseIds?: string[];
	now?: Date;
	onProgress?: (progress: ScoutLocalAiEvalProgress) => void;
	onSnapshot?: (run: ScoutLocalAiEvalRun) => void;
	previousRun?: ScoutLocalAiEvalRun | null;
	runContext?: Record<string, unknown>;
	ask: (input: {
		testCase: ScoutLocalAiEvalCase;
		pack: ContextPack;
		conversationHistory: ScoutConversationMessage[];
	}) => Promise<ScoutAnswer>;
}): Promise<ScoutLocalAiEvalRun> {
	const now = input.now ?? new Date();
	const selectedCases = selectScoutLocalAiEvalCases(input.suite, input.caseIds, input.limit);
	const suiteHash = scoutLocalAiSuiteHash(input.suite);
	const previousRun = validateReusablePreviousRun(input.previousRun, input.suite, suiteHash, input.evidenceLane);
	const runId = input.runId ?? previousRun?.runId ?? `device-local-ai-${compactTimestamp(now)}`;
	const generatedAt = previousRun?.generatedAt ?? now.toISOString();
	const runContext = createEvalRunContext({
		runContext: input.runContext ?? previousRun?.runContext,
		previousRunContext: previousRun?.runContext,
		runId,
		generatedAt,
		evidenceLane: input.evidenceLane,
		now
	});
	const priorResults = new Map((previousRun?.results ?? []).map((result) => [result.caseId, result]));
	const results: ScoutLocalAiEvalResult[] = [];
	const snapshot = () =>
		createScoutLocalAiEvalRun({
			suite: input.suite,
			runId,
			generatedAt,
			evidenceLane: input.evidenceLane,
			suiteHash,
			runContext,
			limit: input.limit,
			caseIds: input.caseIds,
			results
		});

	for (const [index, testCase] of selectedCases.entries()) {
		input.onProgress?.({ caseId: testCase.id, index: index + 1, total: selectedCases.length, completed: results.length });
		const priorResult = priorResults.get(testCase.id);
		if (priorResult && canReusePriorResult(priorResult, testCase, input.evidenceLane)) {
			results.push(reusePriorResult(priorResult, testCase, index + 1));
			input.onSnapshot?.(snapshot());
			input.onProgress?.({ caseId: testCase.id, index: index + 1, total: selectedCases.length, completed: results.length });
			continue;
		}

		const pack = buildScoutLocalAiEvalPack(testCase, now);
		const startedAt = Date.now();

		try {
			const answer = await input.ask({
				testCase,
				pack,
				conversationHistory: conversationHistoryFor(testCase, results)
			});
			const expectations = evaluateToolExpectations(testCase.requiredTools, answer.toolInvocations);
			results.push({
				caseId: testCase.id,
				index: index + 1,
				case: compactCase(testCase),
				answer: answer.answer,
				answerOrigin: input.evidenceLane,
				confidence: answer.confidence,
				mode: answer.mode,
				provider: answer.provider,
				generatedAt: answer.generatedAt,
				durationMs: Date.now() - startedAt,
				contextUsed: answer.contextUsed,
				receipts: answer.receipts,
				requiredConfirmations: answer.requiredConfirmations,
				safetyFlags: answer.safetyFlags,
				toolInvocations: answer.toolInvocations,
				toolExpectations: expectations,
				bridge: null,
				rating: null,
				reviewerNotes: '',
				failureMode: null,
				suggestedFailureCategories: suggestedFailures(expectations),
				improvementTask: null
			});
		} catch (error) {
			results.push(failedResult(testCase, index + 1, input.evidenceLane, now, Date.now() - startedAt, error));
		}

		input.onSnapshot?.(snapshot());
		input.onProgress?.({ caseId: testCase.id, index: index + 1, total: selectedCases.length, completed: results.length });
	}

	return snapshot();
}

function selectScoutLocalAiEvalCases(
	suite: ScoutLocalAiEvalSuite,
	caseIds: string[] | undefined,
	limit: number | undefined
): ScoutLocalAiEvalCase[] {
	const requestedIds = (caseIds ?? []).map((id) => id.trim()).filter(Boolean);
	if (!requestedIds.length) {
		return limit ? suite.cases.slice(0, limit) : suite.cases;
	}
	const duplicate = requestedIds.find((id, index) => requestedIds.indexOf(id) !== index);
	if (duplicate) {
		throw new Error(`Duplicate Scout local AI eval case id requested: ${duplicate}`);
	}
	const byId = new Map(suite.cases.map((testCase) => [testCase.id, testCase]));
	return requestedIds.map((id) => {
		const testCase = byId.get(id);
		if (!testCase) throw new Error(`Unknown Scout local AI eval case id requested: ${id}`);
		return testCase;
	});
}

function createScoutLocalAiEvalRun(input: {
	suite: ScoutLocalAiEvalSuite;
	runId: string;
	generatedAt: string;
	evidenceLane: ScoutLocalAiEvidenceLane;
	suiteHash: string;
	runContext?: Record<string, unknown>;
	limit?: number;
	caseIds?: string[];
	results: ScoutLocalAiEvalResult[];
}): ScoutLocalAiEvalRun {
	return {
		schemaVersion: 1,
		runId: input.runId,
		suiteId: input.suite.suiteId,
		suiteTitle: input.suite.title,
		suiteVersion: input.suite.version,
		suiteHash: input.suiteHash,
		suitePath: 'mobile/static/scout/dad-local-ai-100.json',
		generatedAt: input.generatedAt,
		evidenceLane: input.evidenceLane,
		modelCommand: null,
		runContext: input.runContext,
		exportHandoff: createScoutLocalAiEvalExportHandoff(input),
		caseCount: input.results.length,
		totalSuiteCases: input.suite.cases.length,
		filters: {
			id: input.caseIds?.length ? input.caseIds.join(',') : null,
			domain: null,
			phase: null,
			limit: input.limit ?? null
		},
		ratingScale: input.suite.ratingScale,
		failureCategories: input.suite.failureCategories,
		summary: summarizeScoutLocalAiEvalResults(input.results),
		results: [...input.results]
	};
}

function createScoutLocalAiEvalExportHandoff(input: {
	suite: ScoutLocalAiEvalSuite;
	runId: string;
	evidenceLane: ScoutLocalAiEvidenceLane;
	suiteHash: string;
	runContext?: Record<string, unknown>;
	limit?: number;
	caseIds?: string[];
	results: ScoutLocalAiEvalResult[];
}): ScoutLocalAiEvalExportHandoff {
	const completedCases = input.results.length;
	const suiteCaseCount = input.suite.cases.length;
	const targetCases = input.caseIds?.length ? input.caseIds.length : (input.limit ?? suiteCaseCount);
	const fullSuiteTarget = suiteCaseCount > 0 && completedCases >= suiteCaseCount && targetCases >= suiteCaseCount;
	const deviceLane = input.evidenceLane === 'device-on-device-gemma';
	const proofContextProblems = fullSuiteTarget && deviceLane
		? scoutLocalAiEvalRunContextProblems({
			runContext: input.runContext,
			finalProof: input.suite.finalProof
		})
		: [];
	const canStartFinalReview = fullSuiteTarget && deviceLane && proofContextProblems.length === 0;
	const expectedAcceptanceStatus = canStartFinalReview
		? 'final-review-ready'
		: fullSuiteTarget && deviceLane
			? 'blocked-before-review'
			: 'diagnostic-review-only';
	const kind = canStartFinalReview ? 'final-run-100' : 'diagnostic';
	const proofBoundary = canStartFinalReview
		? 'This starts human review only. Final Dad readiness still requires all 100 cases rated 5/5, strict device proof, and second stability proof.'
		: fullSuiteTarget && deviceLane
			? 'Fix the blocked TestFlight/iPhone proof context before review. This export is not final Dad proof.'
			: 'Finish Run 100 on the TestFlight iPhone before final human rating. Smoke and partial exports are diagnostic only.';
	return {
		schemaVersion: 1,
		kind,
		label: canStartFinalReview
			? 'Final Run 100 JSON ready for inbox review'
			: fullSuiteTarget && deviceLane
				? 'Full export blocked before review'
				: 'Diagnostic export only',
		expectedAcceptanceStatus,
		canStartFinalReview,
		reviewInboxPath: SCOUT_LOCAL_AI_EVAL_REVIEW_INBOX_PATH,
		prepareReviewCommand: expectedAcceptanceStatus === 'diagnostic-review-only'
			? `${SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND} --allow-partial`
			: SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND,
		proofBoundary,
		recommendedAction: canStartFinalReview
			? `Save this JSON into ${SCOUT_LOCAL_AI_EVAL_REVIEW_INBOX_PATH}, then run ${SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND}.`
			: fullSuiteTarget && deviceLane
				? 'Clear the stale or wrong-context export and rerun Run 100 from the current TestFlight iPhone build.'
				: 'Use this for smoke/interrupted-run recovery only, then finish Run 100 on the TestFlight iPhone.',
		proofContextProblems,
		suite: {
			suiteId: input.suite.suiteId,
			version: input.suite.version,
			hash: input.suiteHash,
			caseCount: suiteCaseCount
		},
		run: {
			runId: input.runId,
			completedCases,
			targetCases,
			evidenceLane: input.evidenceLane
		}
	};
}

export function buildScoutLocalAiEvalPack(testCase: ScoutLocalAiEvalCase, now: Date): ContextPack {
	const prompt = testCase.prompt.toLowerCase();
	const mile = Number(testCase.mile ?? 0);
	const generatedAt = now.toISOString();
	const pack = cloneDefaultContextPack();
	pack.hiker = {
		...pack.hiker,
		currentMile: mile,
		dayNumber: Math.max(1, Math.round(mile / 12) + 1),
		targetMilesToday: prompt.includes('tired') || prompt.includes('injury') ? 8 : 12
	};
	pack.generatedAt = generatedAt;
	pack.validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
	pack.downloadedRegions = [`Eval field pack around mile ${mile.toFixed(1)}`];
	pack.water = [
		{ name: 'Last known spring behind', mile: Math.max(0, mile - 2.4), reliability: 'reliable', note: 'Behind you; useful only if you turn back.' },
		{ name: 'Seasonal seep ahead', mile: mile + 1.8, reliability: 'seasonal', note: 'Seasonal open-reference candidate; confirm current flow.' },
		{
			name: 'Reliable creek crossing',
			mile: mile + 6.2,
			reliability: 'reliable',
			note: prompt.includes('heat') || prompt.includes('hot')
				? 'Hot-day carry: top off at the last confirmed source, carry extra if the next source is seasonal or unverified, and stop/cool down for heat-illness symptoms.'
				: 'Treat/filter before drinking.'
		},
		{ name: 'Thin mapped branch', mile: mile + 11.4, reliability: 'thin', note: 'Mapped candidate with unknown current flow.' }
	];
	pack.shelters = [
		{ name: 'Near Ridge Shelter', mile: mile + 3.4, capacity: 8, note: 'Open-data candidate; verify current status, water, and crowding.' },
		{ name: 'Pine Gap Campsite', mile: mile + 8.9, capacity: 10, note: 'Tent sites reported near trail; check land-manager rules.' },
		{ name: 'Long Hollow Shelter', mile: mile + 14.2, capacity: 12, note: 'Water may require a side trail; verify before counting on it.' }
	];
	pack.towns = [
		{ name: 'Pilot Gap Road', mile: mile + 4.8, access: 'road crossing; emergency exit candidate, confirm shuttle or pickup', servicesNote: 'No guaranteed services at the crossing.' },
		{ name: 'Trail Town Market', mile: mile + 18.6, access: '0.7 mi road walk from crossing', servicesNote: 'Open-data services candidate: groceries, laundry, charging, and lodging must be confirmed same day.' },
		{ name: 'Next Resupply Town', mile: mile + 37.5, access: 'shuttle-dependent road access', servicesNote: 'Good resupply candidate if hours and lodging are confirmed.' }
	];
	pack.weather = weatherFor(mile, prompt, now);
	pack.terrain = terrainFor(mile, generatedAt);
	pack.conditions = conditionsFor(prompt, now);
	pack.parkServices = parkServicesFor(now);
	pack.loadout = loadoutFor(prompt);
	pack.guideExcerpts = [...pack.guideExcerpts, ...evalGuideExcerpts()];
	pack.documents = evalDocuments(now);
	pack.pilotNotice = 'Eval pack for Dad local-AI review. Use it to exercise Scout tools; verify volatile facts before relying on them.';
	return pack;
}

function terrainFor(mile: number, generatedAt: string): ContextPack['terrain'] {
	return {
		fromMile: Number(mile.toFixed(1)),
		toMile: Number((mile + 15).toFixed(1)),
		lookaheadMiles: 15,
		gainFt: 1420,
		lossFt: 760,
		maxGradePercent: 14.8,
		difficultyScore: 6.8,
		difficultyLabel: 'moderate-hard',
		climbs: [
			{
				startMile: Number((mile + 2.1).toFixed(1)),
				endMile: Number((mile + 3.3).toFixed(1)),
				direction: 'climb',
				gradePercent: 14.8,
				verticalFt: 640
			},
			{
				startMile: Number((mile + 8.4).toFixed(1)),
				endMile: Number((mile + 9.2).toFixed(1)),
				direction: 'descent',
				gradePercent: 11.2,
				verticalFt: -420
			}
		],
		sourceLabel: 'Scout eval cached terrain: synthetic USGS-style elevation summary for local-AI regression testing',
		generatedAt
	};
}

export function scoutLocalAiSuiteHash(suite: ScoutLocalAiEvalSuite): string {
	return `fnv1a32:${fnv1a32(stableJson(suite))}`;
}

export function evaluateToolExpectations(
	requiredTools: string[],
	invocations: ToolInvocationRecord[]
): ScoutLocalAiToolExpectations {
	const hit: string[] = [];
	const missing: string[] = [];
	for (const expectation of requiredTools) {
		if (invocations.some((record) => matchesToolExpectation(expectation, record))) {
			hit.push(expectation);
		} else {
			missing.push(expectation);
		}
	}
	return { required: requiredTools, hit, missing };
}

export function summarizeScoutLocalAiEvalResults(results: ScoutLocalAiEvalResult[]) {
	const missingToolCounts: Record<string, number> = {};
	const missingSourceEvidenceCounts: Record<string, number> = {};
	let toolExpectationComplete = 0;
	let sourceEvidenceComplete = 0;
	for (const result of results) {
		if (!result.toolExpectations.missing.length) {
			toolExpectationComplete += 1;
		}
		for (const tool of result.toolExpectations.missing) {
			missingToolCounts[tool] = (missingToolCounts[tool] ?? 0) + 1;
		}
		const sourceEvidenceMissing = sourceEvidenceProblems(
			result.case?.requiredTools ?? result.toolExpectations.required,
			result.toolInvocations
		);
		if (!sourceEvidenceMissing.length) {
			sourceEvidenceComplete += 1;
		}
		for (const expectation of sourceEvidenceMissing) {
			missingSourceEvidenceCounts[expectation] = (missingSourceEvidenceCounts[expectation] ?? 0) + 1;
		}
	}
	return {
		toolExpectationComplete,
		missingToolCases: results.length - toolExpectationComplete,
		missingToolCounts,
		sourceEvidenceComplete,
		missingSourceEvidenceCases: results.length - sourceEvidenceComplete,
		missingSourceEvidenceCounts
	};
}

function sourceEvidenceProblems(requiredTools: string[], invocations: ToolInvocationRecord[]): string[] {
	const missing: string[] = [];
	for (const expectation of requiredTools) {
		const [, sourceSkill] = expectation.split(':');
		if (!sourceSkill) continue;
		const matching = invocations.find((record) => matchesToolExpectation(expectation, record));
		if (!matching) continue;
		if (!hasSourceEvidence(matching)) missing.push(expectation);
	}
	return missing;
}

function hasSourceEvidence(record: ToolInvocationRecord): boolean {
	return (
		record.receipts.some((receipt) => Boolean(String(receipt.id ?? receipt.citation ?? receipt.title ?? '').trim())) ||
		Boolean(record.sourceDocumentIds?.some((id) => String(id ?? '').trim()))
	);
}

function weatherFor(mile: number, prompt: string, now: Date): CachedWeather {
	const stale = prompt.includes('stale');
	const storm = /\b(?:storm|storms|thunder|thunderstorm|thunderstorms|lightning|heavy rain|rain)\b/u.test(prompt);
	const cold = /\b(?:cold|35 degrees|wind|hypothermia|freez[a-z]*)\b/u.test(prompt);
	const hot = /hot|heat|dizzy/u.test(prompt);
	return {
		mile,
		summary: storm ? 'showers and possible thunderstorms' : cold ? 'cold wind and wet exposure' : hot ? 'hot, humid afternoon' : 'partly cloudy with changing mountain conditions',
		highF: hot ? 88 : cold ? 42 : 67,
		lowF: cold ? 28 : 51,
		windMph: storm || cold ? 22 : 9,
		riskNote: storm ? 'Lightning and wet-cold exposure are possible; verify live before exposed terrain.' : hot ? 'Heat illness risk increases if water or shade is limited.' : cold ? 'Wet wind can turn fatigue into hypothermia risk.' : 'Mountain weather changes quickly; refresh before safety-critical choices.',
		generatedAt: new Date(now.getTime() - (stale ? 9 : 1) * 60 * 60 * 1000).toISOString(),
		source: 'cached-pilot',
		sourceLabel: 'Eval cached weather',
		forecastUpdatedAt: new Date(now.getTime() - (stale ? 9 : 1) * 60 * 60 * 1000).toISOString()
	};
}

function conditionsFor(prompt: string, now: Date): TrailConditionsContext {
	const items: TrailConditionReference[] = [];
	if (/closure|closed|detour|reroute/u.test(prompt)) {
		items.push({
			source: 'atc',
			sourceLabel: 'ATC Trail Updates',
			category: 'closure',
			title: 'Eval closure near current section',
			summary: 'A short official closure/detour example is loaded so Scout must say to verify the current managing-agency route before committing.',
			url: 'https://appalachiantrail.org/trail-updates/',
			area: 'Eval section',
			severity: 'high',
			publishedAt: now.toISOString()
		});
	}
	if (/fire|smoke|burn/u.test(prompt)) {
		items.push({
			source: 'nps',
			sourceLabel: 'NPS Alerts',
			category: 'fire',
			title: 'Eval fire/smoke caution',
			summary: 'Smoke or fire reports should trigger an official alert check and a safer route/exit decision.',
			url: 'https://www.nps.gov/appa/planyourvisit/conditions.htm',
			area: 'Eval section',
			severity: 'high',
			publishedAt: now.toISOString()
		});
	}
	if (/bear/u.test(prompt)) {
		items.push({
			source: 'nps',
			sourceLabel: 'NPS Alerts',
			category: 'caution',
			title: 'Eval bear activity caution',
			summary: 'Bear activity reports are volatile; confirm current local guidance and use proper food storage.',
			url: 'https://www.nps.gov/appa/planyourvisit/safety.htm',
			area: 'Eval shelter area',
			severity: 'moderate',
			publishedAt: now.toISOString()
		});
	}
	return {
		items,
		fetchedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
		note: items.length ? 'Eval official condition examples loaded.' : 'No active official closure, detour, fire, or bear alert examples are loaded for this eval case; verify live before relying on it.'
	};
}

function parkServicesFor(now: Date): ParkServicesContext {
	return {
		parks: ['Appalachian National Scenic Trail'],
		fetchedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
		note: 'Eval NPS facilities data.',
		items: [
			{ kind: 'visitor-center', name: 'Eval Visitor Contact Station', parkLabel: 'Appalachian Trail', summary: 'Information, current conditions, and permit/ranger questions; verify hours before relying on it.', url: 'https://www.nps.gov/appa/index.htm', reservationUrl: null, lat: null, lon: null },
			{ kind: 'campground', name: 'Eval Developed Campground', parkLabel: 'Appalachian Trail', summary: 'Legal developed camping example for backup planning; reservations and seasonal status must be confirmed.', url: 'https://www.nps.gov/appa/index.htm', reservationUrl: 'https://www.recreation.gov/', lat: null, lon: null }
		]
	};
}

function loadoutFor(prompt: string): LoadoutItem[] {
	const cold = /\b(?:cold|rain|hypothermia|freez[a-z]*)\b/u.test(prompt);
	return [
		{ name: 'Shelter and stakes', category: 'shelter', weightOz: 32, carried: true, note: 'Required sleep shelter.' },
		{ name: 'Quilt and dry sleep base layer', category: 'sleep', weightOz: 38, carried: true, note: 'Protect from moisture.' },
		{ name: 'Rain jacket', category: 'clothing', weightOz: 9, carried: true, note: 'Keep accessible.' },
		{ name: 'Rain pants', category: 'clothing', weightOz: 7, carried: cold, note: cold ? 'Useful in cold rain/wind.' : 'Optional candidate, decide from forecast and warmth.' },
		{ name: 'Water filter', category: 'kitchen', weightOz: 3, carried: true, note: 'Protect from freezing.' },
		{ name: 'Backup water tablets', category: 'safety', weightOz: 1, carried: true, note: 'Backup treatment if filter fails.' },
		{ name: 'First aid and blister kit', category: 'safety', weightOz: 5, carried: true, note: 'Blister care, tape, usual meds.' },
		{ name: 'Phone and battery bank', category: 'electronics', weightOz: 14, carried: true, note: 'Charge in town and conserve offline.' },
		{ name: 'Camp shoes', category: 'clothing', weightOz: 9, carried: /camp shoes/u.test(prompt), note: 'Comfort item; evaluate after shakedown.' }
	];
}

function evalGuideExcerpts(): ContextPack['guideExcerpts'] {
	return [
		{ id: 'eval-pretrip-discipline', title: 'Pretrip and first-week discipline', body: 'Pretrail answers should turn preparation into a short first-week plan. Include this week: two or three loaded shakedown walks, foot care and blister practice, a gear/loadout check, water treatment practice, and an offline app/model rehearsal. Before leaving service, charge the phone and battery bank, refresh the field pack, confirm current mile, download the local AI model on Wi-Fi and power, download offline maps/docs, verify the Bible text is available offline, then turn on airplane mode, relaunch, and ask Scout a water question. On first install, set the hiker profile and current mile first, refresh the field pack, confirm the pack age/status looks current, download or update the local AI model on Wi-Fi and power, save offline maps/docs, let cloud sync finish if signed in, then run the airplane-mode test. Scout is not ready for offline trail use until the field-pack refresh, model download, and airplane-mode test succeed. Scout is a field companion, not an emergency communicator; keep the inReach, PLB, 911 plan, or family emergency plan separate.', tags: ['pretrip', 'prep', 'shakedown', 'foot-care', 'offline', 'local-ai', 'field-pack', 'bible'], citation: 'Dad Local AI eval source skill: pretrip' },
		{ id: 'eval-airplane-mode-capability-boundary', title: 'Airplane mode capability boundary', body: 'In airplane mode, Scout can answer only from what is already on the phone: the cached field pack, the on-device local AI model, saved offline maps/docs, saved document summaries, and Bible text if it was packaged or downloaded. Scout cannot fetch fresh weather, official closures or fire alerts, new water reports, town or service changes, cloud sync/backup, messages, or live/tramily location until the phone is back online. Treat cached weather, closures, water, and services as stale until refreshed again, and keep inReach, PLB, 911, or the family emergency plan separate.', tags: ['safety', 'offline', 'airplane-mode', 'local-ai', 'field-pack', 'weather', 'closures', 'sync', 'live-location', 'bible'], citation: 'Dad Local AI eval source skill: airplane mode' },
		{ id: 'eval-model-download-status-discipline', title: 'Model download status discipline', body: 'If Scout says the model is still downloading, the on-device local AI model is not ready for offline Scout yet. Keep the phone on Wi-Fi and power, let download and verification finish, and check Scout model status or progress until it says ready. If the download is stuck or failed, retry, cancel, or restart it from the model download control while back on Wi-Fi. Do not trust offline/local AI until the model reports ready and an airplane-mode Scout question succeeds; Scout must not pretend a fake offline answer came from the local model.', tags: ['pretrip', 'offline', 'local-ai', 'model-download', 'status', 'airplane-mode', 'safety'], citation: 'Dad Local AI eval source skill: model download' },
		{ id: 'eval-field-pack-staleness-discipline', title: 'Field pack staleness discipline', body: "Scout's field pack is the cached trail data on the phone, not the physical backpack. Before trusting it, check the pack age/status, current mile or downloaded region, and source timestamps when shown. If it is old, expired, for the wrong mile/region, or was loaded before weather, closures, water, or services changed, treat it as stale. Refresh on Wi-Fi or in town before water, weather, closure, bailout, or town-service decisions. Until refreshed, cached weather, closures, water, and services are caution signals, not current proof.", tags: ['pretrip', 'offline', 'field-pack', 'stale', 'weather', 'closures', 'water', 'safety'], citation: 'Dad Local AI eval source skill: field pack freshness' },
		{ id: 'eval-signin-cloud-sync-discipline', title: 'Sign-in and cloud sync discipline', body: 'Accounts are invite-only. If the hiker has an invite, sign in before trail on Wi-Fi so backup, restore, and cloud sync can finish before leaving service. Sign-in helps recover data if the phone is replaced, restore documents/settings, and sync changes between devices. Offline Scout/local AI is separate: after setup, it can work from the downloaded field pack, on-device model, and saved maps/docs without a live login. Cloud sync and sign-in are not an emergency safety system and do not replace inReach, PLB, 911, or the family emergency plan.', tags: ['pretrip', 'account', 'sign-in', 'cloud-sync', 'backup', 'restore', 'offline', 'safety'], citation: 'Dad Local AI eval source skill: account sync' },
		{ id: 'eval-current-mile-profile-discipline', title: 'Current mile and profile discipline', body: 'Scout follows the hiker only after their hike profile/current mile is set. On first run, use the hike setup sheet, choose Start my hike, and enter the Current AT mile. Later, use Settings > Edit hike details or a confirmed mile update, then check Today and Scout both show the new mile. Refresh the field pack when online and re-ask water, shelter, town, terrain, or bailout questions after changing mile. A wrong mile shifts every nearby answer, especially water, shelter, town, terrain, and bailout advice. Confirm the mile against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap before relying on Scout.', tags: ['profile', 'current-mile', 'onboarding', 'navigation', 'water', 'shelter', 'town', 'bailout'], citation: 'Dad Local AI eval source skill: current mile' },
		{ id: 'eval-wrong-mile-recovery-discipline', title: 'Wrong mile recovery discipline', body: 'If the hiker enters the wrong trail mile, correct the Current AT mile in the first-run hike setup, Settings > Edit hike details, or a confirmed manual mile update. Confirm the corrected mile against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap. Then check Today and Scout both show the corrected mile, refresh the field pack when online, and re-ask Scout for water, shelter, town, terrain, and bailout. A wrong mile shifts water, shelter, town, terrain, and bailout answers; do not make water, shelter, town, or safety decisions from a wrong mile.', tags: ['safety', 'profile', 'current-mile', 'wrong-mile', 'navigation', 'water', 'shelter', 'town', 'bailout'], citation: 'Dad Local AI eval source skill: wrong mile recovery' },
		{ id: 'eval-terrain-mileage-discipline', title: 'Terrain and mileage discipline', body: 'Mileage decisions start with body condition, daylight, elevation, water spacing, weather, pack weight, foot or knee condition, and next legal shelter/campsite/town stop. For the first trail week, start low, protect feet and knees, stop while you can still recover normally, and adjust only after several normal mornings. Do not promise a fixed daily mileage; use the constraints in front of you that day.', tags: ['terrain', 'pace', 'mileage', 'daylight', 'first-week', 'recovery'], citation: 'Dad Local AI eval source skill: terrain' },
		{ id: 'eval-water-discipline', title: 'Water discipline', body: 'Water answers must lead with the nearest loaded source, reliability, distance, and uncertainty. Seasonal and mapped candidates are not promises. If current flow is unknown, recommend a safer carry or verified stop. For ridge or camel-up decisions, tell the hiker to camel up at the last confirmed source and carry extra when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only use the lighter carry when the next reliable water is confirmed and conditions are mild. For dry stretches, start from roughly 0.5-1 liter per 3-5 miles and increase for heat, exposure, climbing, slow pace, or personal thirst; top off at the last confirmed source and carry enough to reach the next reliable source when the next source is seasonal or unverified. For questionable water when tired or low on daylight, keep treatment non-negotiable: filter or backflush if needed, use backup tablets or boil if the filter is slow or suspect, never drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.', tags: ['water', 'spring', 'creek', 'flow', 'ridge', 'heat', 'treatment', 'daylight'], citation: 'Dad Local AI eval source skill: water' },
		{ id: 'eval-shelter-discipline', title: 'Shelter and camping discipline', body: 'Sleep decisions need legal camping rules, daylight, fatigue, weather, water, crowding, and backup options. A tired hiker should be steered to the safer legal stop rather than extra miles for pride. If the shelter is full while daylight remains, stay courteous, use legal established overflow tenting only if allowed, choose a backup before dark, and avoid unsafe or illegal camping. If it is already dark, slow down, use the headlamp, take the nearest safe legal option, avoid extra risky night miles, and keep a fallback if the shelter is full. Do not stealth camp in regulated or prohibited areas; if exhausted, choose a safer legal shelter, campsite, town stop, or established legal site and stop earlier. For storm camps, set up early in a protected legal spot, avoid exposed ridges, dead trees, drainages, and flood-prone ground, keep dry sleep layers protected, and stop or bail out for lightning, flooding, hypothermia risk, or worsening conditions. For low-impact camping, use established or durable surfaces, stay roughly 200 feet from water and trail when local rules allow, and follow posted rules over general advice. Around climbs, stop before the climb if daylight, legs, water, weather, or legal camp options are weak; climb only when you have enough daylight, water, energy, and a known legal stop after it. After dark, slow down, use the headlamp, avoid risky night navigation when tired, and keep a backup plan if the shelter is full. For a shelter with no reliable water, top off before the shelter, carry enough to the next verified source, or stop where both legal sleep and water are workable.', tags: ['shelter', 'camping', 'campsite', 'rules', 'daylight', 'storm', 'water'], citation: 'Dad Local AI eval source skill: shelter' },
		{ id: 'eval-weather-discipline', title: 'Weather discipline', body: 'Weather is volatile. Stale cached weather can guide caution but must not be treated as live proof. Thunderstorms, heat, cold rain, wind, flooding, and exposed ridges require current checks when possible. For a heavy-rain start, recommend conservative mileage, keeping sleep layers dry, footing caution on slick roots/rocks/descents, and a bailout or stop plan if lightning, hypothermia risk, flooding, or worsening conditions appear. For cold-rain camping, protect the dry sleep layer and warm layer first, set up early, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry.', tags: ['weather', 'wind', 'cold', 'rain', 'heat', 'storm', 'footing', 'bailout', 'hypothermia'], citation: 'Dad Local AI eval source skill: weather' },
		{ id: 'eval-town-discipline', title: 'Town discipline', body: 'Town stops are recovery first: eat, shower, laundry, foot care, sleep, charge, download, then logistics. Services, hostels, shuttles, mail, and store hours need same-day confirmation. If a hostel is full, treat hostels, shuttles, visitor centers, campgrounds, and road crossings as candidates until confirmed; call or message ahead when service exists, confirm bed space, shuttle or pickup, hours, reservations or seasonal status, and legal overnight rules, then choose backup lodging, a legal campground or public option, or an earlier legal stop, short day, or nero if tired or injured. Zero and nero decisions should weigh body condition or injury, cached/current weather, chores, budget, and the next section; rest is an investment, not failure. For mail-drop versus buy-in-town questions, ask for or name the missing decision inputs before firm advice: diet restrictions, daily pace, next town timing, store hours, post-office hours, hostel/shuttle access, and whether the item is hard to find locally. Default resupply rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops. Never say hard-to-find items are better bought in town unless a current town source proves availability. Budget advice should separate daily burn, town spikes, hostel/shuttle/laundry/meals, gear replacement, and an emergency cushion; it should stay flexible around actual pace and town services and never sound like a financial guarantee.', tags: ['town', 'resupply', 'recovery', 'hostel', 'laundry', 'budget', 'mail-drop', 'zero', 'nero', 'weather'], citation: 'Dad Local AI eval source skill: town' },
		{ id: 'eval-loadout-discipline', title: 'Loadout discipline', body: 'Gear advice starts from actual carried items. Cut duplicate comfort weight before rain protection, insulation, water treatment, first aid, battery, navigation, or sleep safety. A shakedown hike should prove the sleep system, rain system, cooking/food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn every failure into a specific gear or app fix before Springer, and do not treat one shakedown as proof every condition is solved.', tags: ['loadout', 'gear', 'pack', 'weight', 'shakedown', 'battery'], citation: 'Dad Local AI eval source skill: loadout' },
		{ id: 'eval-food-on-the-move-discipline', title: 'Food on the move discipline', body: 'For food-packing questions, tell the hiker to split the day food before leaving camp. Put the next 3-4 hours of snacks and lunch where they can be reached without unpacking: hip belt pockets, shoulder pouch, top pocket, or outside mesh. Keep cook/camp meals, extra days of food, and trash packed separately so hiking food does not get buried. Tie this to steady energy, warmth, and safer mileage, water, and shelter decisions. Do not give medical nutrition advice.', tags: ['loadout', 'food', 'snacks', 'ration', 'lunch', 'packing', 'energy'], citation: 'Dad Local AI eval source skill: food on the move' },
		{ id: 'eval-safety-discipline', title: 'Safety discipline', body: 'For injury, heat illness, hypothermia, lightning, unsafe people, lost/off-trail, fire, bear near camp, or severe fatigue, Scout should choose lower-risk stops, exits, or help. For severe fatigue or unclear thinking, start with stop hiking, sit in a safe spot, eat, drink treated water or electrolytes, adjust layers for warmth or cooling, and check daylight, weather, body symptoms, and whether the hiker can think clearly. Then use loaded water, shelter, town, or bailout context to choose the nearest lower-risk legal stop or help option; escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for confusion, worsening symptoms, injury, exposure, inability to continue safely, or inability to make decisions. For prayer plus safe-plan prompts, a short prayer-like support can be included when requested, but encouragement must stay separate from trail facts. Prayer alone is not a request for Bible quotes; quote only loaded KJV verses if the hiker explicitly asks for scripture or verses. Use loaded shelter/water/town/bailout context as candidates, verify status, water, crowding, weather, alerts, and legal options, choose the lower-risk option, and say prayer is support, not a substitute for evacuation or help. For scared or alone nighttime support, comfort can include loaded scripture when requested, but the practical safety plan still matters: check immediate hazards, weather, and alerts if possible, get warm and dry, eat or drink if needed, use the headlamp, choose the nearest safe legal sleep option or known public/help option, treat loaded shelter context as a candidate rather than a guarantee, and escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic. Do not spiritualize away real danger or symptoms. For smoke or visible fire near the trail, do not continue toward or through the hazard; move away toward a known safe road, town, ranger station, or public area when safe, follow official closures, evacuation orders, rangers, 911, or emergency-device instructions, and do not invent a safe route through smoke or fire. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger. For a bear near camp, stay calm, create distance, do not run, give the bear an exit, secure food/trash/scented items away from sleep, and do not approach, feed, corner, or try to retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available, and do not invent species- or park-specific rules unless loaded. Use emergency communication or local authorities/rangers if there is immediate danger. For heat illness risk, tell the hiker to stop hiking, find shade, cool down, sip treated water with electrolytes if available, and escalate if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms appear. For knee or joint pain, do not tell the hiker to train through pain; recommend pain-free load reduction, low-impact conditioning, strength/mobility work, and a clinician or physical therapist when pain persists, worsens, swells, or changes gait. For first-aid and blister kit questions, keep the kit compact and personal: prevention tape, blister treatment, wound basics, normal personal meds, and a warning to stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait. Scout must not diagnose, replace emergency services, or replace a dedicated emergency communicator.', tags: ['safety', 'risk', 'injury', 'bailout', 'emergency', 'first-aid', 'blisters', 'wound', 'infection', 'heat', 'bear'], citation: 'Dad Local AI eval source skill: safety' },
		{ id: 'eval-offline-documents-discipline', title: 'Offline documents and sensitive information discipline', body: 'Before day one, save personal documents outside Scout where you can reach them offline: photo ID, insurance card, emergency contacts, medication/allergy notes, itinerary/check-in plan, permits or reservations if needed, shuttle/lodging confirmations, and the Scout field pack/offline map status. Distinguish personal documents from Scout trail data: Scout can ground on cached field pack, saved docs, Bible text, and map data, but it should explicitly tell you not to paste private ID, insurance, medical, payment, or reservation numbers into Scout chat.', tags: ['safety', 'documents', 'offline', 'pretrip', 'itinerary', 'insurance', 'permits', 'sensitive'], citation: 'Dad Local AI eval source skill: safety documents' },
		{ id: 'eval-family-checkin-discipline', title: 'Family check-in and missed-contact discipline', body: 'Family check-ins should set expectations before the trail: usual cadence, current mile or location, how you feel, planned stop, and next expected contact. Normal gaps can happen from dead zones, battery conservation, rain, or town chaos. Give family an escalation window and the emergency contact/itinerary sheet ahead of time. Tell family: if they do not hear from you after that window, use direct calls/texts, emergency contacts, hostels/shuttles/rangers when appropriate, and then emergency services. Repeated missed check-ins, bad weather, health concerns, or itinerary mismatch should escalate. Do not promise live location is always available.', tags: ['safety', 'check-ins', 'family', 'offline', 'emergency', 'itinerary'], citation: 'Dad Local AI eval source skill: safety check-ins' },
		{ id: 'eval-trail-conditions-discipline', title: 'Trail conditions discipline', body: 'Closures, detours, fires, burn bans, bridge outs, washouts, and bear activity require current official verification. Scout can summarize loaded alerts, but must not invent alternate routes or route a hiker through smoke, fire, closures, or evacuation areas.', tags: ['closure', 'detour', 'hazard', 'condition', 'fire'], citation: 'Dad Local AI eval source skill: trail conditions' },
		{ id: 'eval-park-services-discipline', title: 'Park services discipline', body: 'Visitor centers, ranger stations, permit offices, and developed campgrounds are official-service candidates, not thru-hiker shelter guarantees. Verify hours, reservations, and seasonal access.', tags: ['park', 'ranger', 'visitor', 'campground', 'permit'], citation: 'Dad Local AI eval source skill: park services' }
	];
}

function evalDocuments(now: Date): LocalDocumentReference[] {
	const timestamp = now.toISOString();
	return [
		{ id: 'dad-offline-setup', title: 'Dad offline setup checklist', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Before leaving town: charge phone and battery bank, refresh field pack, confirm current mile, download local AI model on Wi-Fi and power, download offline maps or references, verify Bible text is available offline, turn on airplane mode, relaunch, and ask Scout a water question. The phone and Scout do not replace inReach, PLB, 911, or a family emergency plan.' },
		{ id: 'dad-offline-documents', title: 'Dad document vault personal checklist', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Document vault summary: save ID, insurance, emergency contacts, itinerary, check-in plan, permits or reservations if needed, medication/allergy notes, and shuttle/lodging confirmations somewhere available offline. Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; Scout only needs source summaries and trail context.' },
		{ id: 'dad-family-checkins', title: 'Dad family check-in expectations', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Family check-ins should include current mile or location, destination, how you feel, and next expected contact. If they do not hear from you after the escalation window, they should use direct calls/texts, emergency contacts, hostels/shuttles/rangers when appropriate, and then emergency services. Missed check-ins can happen from dead zones, but repeated misses, bad weather, health concerns, or itinerary mismatch should escalate. Live location may be delayed or unavailable.' }
	];
}

function compactCase(testCase: ScoutLocalAiEvalCase): ScoutLocalAiEvalCase {
	return {
		id: testCase.id,
		phase: testCase.phase,
		domain: testCase.domain,
		prompt: testCase.prompt,
		mile: testCase.mile,
		requiredTools: testCase.requiredTools,
		expectedTraits: testCase.expectedTraits,
		safetyCaveats: testCase.safetyCaveats,
		improvementTags: testCase.improvementTags
	};
}

function createEvalRunContext(input: {
	runContext?: Record<string, unknown>;
	previousRunContext?: Record<string, unknown>;
	runId: string;
	generatedAt: string;
	evidenceLane: ScoutLocalAiEvidenceLane;
	now: Date;
}): Record<string, unknown> {
	const context = { ...(input.runContext ?? {}) };
	const previousExecution = recordAt(input.previousRunContext, 'execution');
	const currentExecution = recordAt(context, 'execution');
	context.execution = currentExecution ?? previousExecution ?? {
		id: createExecutionId(input.now),
		runId: input.runId,
		startedAt: input.generatedAt,
		evidenceLane: input.evidenceLane,
		source: 'scout-local-ai-eval'
	};
	return context;
}

function createExecutionId(now: Date): string {
	const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
	return `scout-eval-${compactTimestamp(now)}-${randomId}`;
}

function validateReusablePreviousRun(
	previousRun: ScoutLocalAiEvalRun | null | undefined,
	suite: ScoutLocalAiEvalSuite,
	currentSuiteHash: string,
	evidenceLane: ScoutLocalAiEvidenceLane
): ScoutLocalAiEvalRun | null {
	if (!previousRun) return null;
	if (previousRun.suiteId !== suite.suiteId) {
		throw new Error(`Saved eval run is for ${previousRun.suiteId}, not ${suite.suiteId}.`);
	}
	if (previousRun.suiteVersion !== suite.version) {
		throw new Error(`Saved eval run is for suite version ${previousRun.suiteVersion ?? '<missing>'}, not ${suite.version}. Clear the saved run and start a fresh eval.`);
	}
	if (previousRun.suiteHash !== currentSuiteHash) {
		throw new Error('Saved eval run is from a different 100-question suite. Clear the saved run and start a fresh eval.');
	}
	if (previousRun.evidenceLane !== evidenceLane) {
		throw new Error(`Saved eval run is ${previousRun.evidenceLane}, not ${evidenceLane}.`);
	}
	return previousRun;
}

function canReusePriorResult(
	result: ScoutLocalAiEvalResult,
	testCase: ScoutLocalAiEvalCase,
	evidenceLane: ScoutLocalAiEvidenceLane
): boolean {
	if (result.caseId !== testCase.id) return false;
	if (result.answerOrigin !== evidenceLane) return false;
	if (!result.answer || result.error) return false;
	if (result.case?.prompt !== testCase.prompt) return false;
	if (!sameStringArray(result.case?.requiredTools, testCase.requiredTools)) return false;
	return true;
}

function reusePriorResult(
	result: ScoutLocalAiEvalResult,
	testCase: ScoutLocalAiEvalCase,
	index: number
): ScoutLocalAiEvalResult {
	const toolExpectations =
		result.toolExpectations ?? evaluateToolExpectations(testCase.requiredTools, result.toolInvocations ?? []);
	return {
		...result,
		index,
		caseId: testCase.id,
		case: compactCase(testCase),
		toolExpectations,
		suggestedFailureCategories: result.suggestedFailureCategories ?? suggestedFailures(toolExpectations)
	};
}

function conversationHistoryFor(
	testCase: ScoutLocalAiEvalCase,
	priorResults: ScoutLocalAiEvalResult[]
): ScoutConversationMessage[] {
	if (testCase.id !== 'DLA-097') return [];
	const previous = [...priorResults].reverse().find((result) => result.answer);
	if (!previous) return [];
	return [
		{ role: 'user', content: previous.case.prompt, timestamp: previous.generatedAt },
		{ role: 'assistant', content: previous.answer, timestamp: previous.generatedAt }
	];
}

function failedResult(
	testCase: ScoutLocalAiEvalCase,
	index: number,
	evidenceLane: ScoutLocalAiEvidenceLane,
	now: Date,
	durationMs: number,
	error: unknown
): ScoutLocalAiEvalResult {
	return {
		caseId: testCase.id,
		index,
		case: compactCase(testCase),
		answer: '',
		answerOrigin: evidenceLane,
		confidence: 'low',
		mode: 'on-device',
		provider: 'on-device-gemma',
		generatedAt: now.toISOString(),
		durationMs,
		contextUsed: [],
		receipts: [],
		requiredConfirmations: [],
		safetyFlags: [],
		toolInvocations: [],
		toolExpectations: {
			required: testCase.requiredTools,
			hit: [],
			missing: testCase.requiredTools
		},
		bridge: null,
		error: error instanceof Error ? error.message : String(error),
		rating: null,
		reviewerNotes: '',
		failureMode: 'provider-error',
		suggestedFailureCategories: ['local-model-limitation'],
		improvementTask: null
	};
}

function matchesToolExpectation(expectation: string, record: ToolInvocationRecord): boolean {
	const [toolId, sourceSkill] = expectation.split(':');
	if (record.toolId !== toolId) return false;
	if (!sourceSkill) return true;
	return String(record.args?.sourceSkill ?? '').toLowerCase() === sourceSkill.toLowerCase();
}

function suggestedFailures(expectations: ScoutLocalAiToolExpectations): string[] {
	return expectations.missing.length ? ['bad-routing', 'weak-tool'] : [];
}

function compactTimestamp(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/u, 'Z');
}

function sameStringArray(left: unknown, right: string[]): boolean {
	if (!Array.isArray(left)) return false;
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
}

function recordAt(value: unknown, key: string): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const child = (value as Record<string, unknown>)[key];
	return child && typeof child === 'object' && !Array.isArray(child) ? child as Record<string, unknown> : null;
}

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

function fnv1a32(text: string): string {
	let hash = 0x811c9dc5;
	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}
