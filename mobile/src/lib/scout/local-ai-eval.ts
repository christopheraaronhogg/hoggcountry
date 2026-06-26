import { cloneDefaultContextPack } from './default-pack.ts';
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

export interface ScoutLocalAiEvalSuite {
	schemaVersion: number;
	suiteId: string;
	title: string;
	createdAt: string;
	successTarget: string;
	ratingScale: Record<string, string>;
	failureCategories: string[];
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

export interface ScoutLocalAiEvalRun {
	schemaVersion: number;
	runId: string;
	suiteId: string;
	suiteTitle: string;
	suitePath: string;
	generatedAt: string;
	evidenceLane: ScoutLocalAiEvidenceLane;
	modelCommand: string | null;
	runContext?: Record<string, unknown>;
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
	now?: Date;
	onProgress?: (progress: ScoutLocalAiEvalProgress) => void;
	runContext?: Record<string, unknown>;
	ask: (input: {
		testCase: ScoutLocalAiEvalCase;
		pack: ContextPack;
		conversationHistory: ScoutConversationMessage[];
	}) => Promise<ScoutAnswer>;
}): Promise<ScoutLocalAiEvalRun> {
	const now = input.now ?? new Date();
	const selectedCases = input.limit ? input.suite.cases.slice(0, input.limit) : input.suite.cases;
	const runId = input.runId ?? `device-local-ai-${compactTimestamp(now)}`;
	const results: ScoutLocalAiEvalResult[] = [];

	for (const [index, testCase] of selectedCases.entries()) {
		input.onProgress?.({ caseId: testCase.id, index: index + 1, total: selectedCases.length, completed: results.length });
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

		input.onProgress?.({ caseId: testCase.id, index: index + 1, total: selectedCases.length, completed: results.length });
	}

	return {
		schemaVersion: 1,
		runId,
		suiteId: input.suite.suiteId,
		suiteTitle: input.suite.title,
		suitePath: 'mobile/static/scout/dad-local-ai-100.json',
		generatedAt: now.toISOString(),
		evidenceLane: input.evidenceLane,
		modelCommand: null,
		runContext: input.runContext,
		caseCount: results.length,
		totalSuiteCases: input.suite.cases.length,
		filters: {
			id: null,
			domain: null,
			phase: null,
			limit: input.limit ?? null
		},
		ratingScale: input.suite.ratingScale,
		failureCategories: input.suite.failureCategories,
		summary: summarizeScoutLocalAiEvalResults(results),
		results
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
				? 'Hot-day carry: top off unless the next source is confirmed flowing.'
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
	pack.conditions = conditionsFor(prompt, now);
	pack.parkServices = parkServicesFor(now);
	pack.loadout = loadoutFor(prompt);
	pack.guideExcerpts = [...pack.guideExcerpts, ...evalGuideExcerpts()];
	pack.documents = evalDocuments(now);
	pack.pilotNotice = 'Eval pack for Dad local-AI review. Use it to exercise Scout tools; verify volatile facts before relying on them.';
	return pack;
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
	let toolExpectationComplete = 0;
	for (const result of results) {
		if (!result.toolExpectations.missing.length) {
			toolExpectationComplete += 1;
		}
		for (const tool of result.toolExpectations.missing) {
			missingToolCounts[tool] = (missingToolCounts[tool] ?? 0) + 1;
		}
	}
	return {
		toolExpectationComplete,
		missingToolCases: results.length - toolExpectationComplete,
		missingToolCounts
	};
}

function weatherFor(mile: number, prompt: string, now: Date): CachedWeather {
	const stale = prompt.includes('stale');
	const storm = /storm|thunder|lightning|heavy rain|rain/u.test(prompt);
	const cold = /cold|35 degrees|wind|hypothermia|freez/u.test(prompt);
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
	const cold = /cold|rain|hypothermia|freez/u.test(prompt);
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
		{ id: 'eval-terrain-mileage-discipline', title: 'Terrain and mileage discipline', body: 'Mileage decisions start with body condition, daylight, elevation, water, weather, and next legal stop. Early trail success comes from conservative targets and repeatable recovery, not heroic pushes.', tags: ['terrain', 'pace', 'mileage', 'daylight'], citation: 'Dad Local AI eval source skill: terrain' },
		{ id: 'eval-water-discipline', title: 'Water discipline', body: 'Water answers must lead with the nearest loaded source, reliability, distance, and uncertainty. Seasonal and mapped candidates are not promises. If current flow is unknown, recommend a safer carry or verified stop.', tags: ['water', 'spring', 'creek', 'flow'], citation: 'Dad Local AI eval source skill: water' },
		{ id: 'eval-shelter-discipline', title: 'Shelter and camping discipline', body: 'Sleep decisions need legal camping rules, daylight, fatigue, weather, water, crowding, and backup options. A tired hiker should be steered to the safer legal stop rather than extra miles for pride.', tags: ['shelter', 'camping', 'campsite', 'rules'], citation: 'Dad Local AI eval source skill: shelter' },
		{ id: 'eval-weather-discipline', title: 'Weather discipline', body: 'Weather is volatile. Stale cached weather can guide caution but must not be treated as live proof. Thunderstorms, heat, cold rain, wind, flooding, and exposed ridges require current checks when possible.', tags: ['weather', 'wind', 'cold', 'rain', 'heat', 'storm'], citation: 'Dad Local AI eval source skill: weather' },
		{ id: 'eval-town-discipline', title: 'Town discipline', body: 'Town stops are recovery first: eat, shower, laundry, foot care, sleep, charge, download, then logistics. Services, hostels, shuttles, mail, and store hours need same-day confirmation.', tags: ['town', 'resupply', 'recovery', 'hostel', 'laundry'], citation: 'Dad Local AI eval source skill: town' },
		{ id: 'eval-loadout-discipline', title: 'Loadout discipline', body: 'Gear advice starts from actual carried items. Cut duplicate comfort weight before rain protection, insulation, water treatment, first aid, battery, navigation, or sleep safety.', tags: ['loadout', 'gear', 'pack', 'weight'], citation: 'Dad Local AI eval source skill: loadout' },
		{ id: 'eval-safety-discipline', title: 'Safety discipline', body: 'For injury, heat illness, hypothermia, lightning, unsafe people, lost/off-trail, fire, or severe fatigue, Scout should choose lower-risk stops, exits, or help. It must not diagnose or replace emergency services.', tags: ['safety', 'risk', 'injury', 'bailout', 'emergency'], citation: 'Dad Local AI eval source skill: safety' },
		{ id: 'eval-trail-conditions-discipline', title: 'Trail conditions discipline', body: 'Closures, detours, fires, burn bans, bridge outs, washouts, and bear activity require current official verification. Scout can summarize loaded alerts but must not invent alternate routes.', tags: ['closure', 'detour', 'hazard', 'condition', 'fire'], citation: 'Dad Local AI eval source skill: trail conditions' },
		{ id: 'eval-park-services-discipline', title: 'Park services discipline', body: 'Visitor centers, ranger stations, permit offices, and developed campgrounds are official-service candidates, not thru-hiker shelter guarantees. Verify hours, reservations, and seasonal access.', tags: ['park', 'ranger', 'visitor', 'campground', 'permit'], citation: 'Dad Local AI eval source skill: park services' }
	];
}

function evalDocuments(now: Date): LocalDocumentReference[] {
	const timestamp = now.toISOString();
	return [
		{ id: 'dad-offline-setup', title: 'Dad offline setup checklist', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Before leaving town: charge phone and battery, refresh field pack, confirm current mile, download local AI model on Wi-Fi and power, download offline maps or references, verify Bible text if needed, turn on airplane mode, relaunch, and ask Scout a water question.' },
		{ id: 'dad-family-checkins', title: 'Dad family check-in expectations', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Family check-ins should include current mile or location, destination, how Dad feels, and next expected contact. Missed check-ins can happen from dead zones, but a repeated miss with bad weather or health concern should escalate to direct calls and emergency contacts.' }
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
