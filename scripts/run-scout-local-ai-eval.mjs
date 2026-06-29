import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScoutRuntime, cloneDefaultContextPack } from '../mobile/src/lib/scout/index.ts';
import { VALID_FAILURE_CATEGORIES } from './lib/scout-local-ai-review.mjs';
import { scoutLocalAiSuiteIdentity } from './lib/scout-local-ai-suite.mjs';
import { summarizeRunSourceEvidence } from './lib/scout-local-ai-source-evidence.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_OUTPUT_DIR = 'data/scout-local-ai/runs';

const cli = parseArgs(process.argv.slice(2));
const suitePath = resolve(REPO_ROOT, String(cli.suite ?? DEFAULT_SUITE));
const outputDir = resolve(REPO_ROOT, String(cli.outputDir ?? DEFAULT_OUTPUT_DIR));
const now = new Date();
const runId = String(cli.runId ?? `dad-local-ai-${compactTimestamp(now)}`);
const bridgeMode = String(cli.mode ?? (process.env.SCOUT_LOCAL_AI_COMMAND ? 'command' : 'scaffold'));
const command = String(cli.command ?? process.env.SCOUT_LOCAL_AI_COMMAND ?? '');
const timeoutMs = Number(cli.timeoutMs ?? process.env.SCOUT_LOCAL_AI_TIMEOUT_MS ?? 120_000);

installLocalBibleAssetFetch();

const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const suiteIdentity = scoutLocalAiSuiteIdentity(suite);
const selectedCases = filterCases(suite.cases, cli);
const caseRef = { current: null };
const bridgeDiagnostics = new Map();
const bridge = createEvalBridge({ mode: bridgeMode, command, timeoutMs, caseRef, bridgeDiagnostics });
const results = [];

for (const [index, testCase] of selectedCases.entries()) {
	caseRef.current = testCase;
	const pack = buildEvalPack(testCase, now);
	const { runtime } = createScoutRuntime({ initialPack: pack, onDeviceBridge: bridge, onDeviceTier: 'balanced' });
	const declaredContext = declaredConversationContextFor(testCase);
	const startedAt = new Date();

	try {
		const answer = await runtime.ask({
			prompt: testCase.prompt,
			onlineStatus: false,
			allowCloud: false,
			preferredMode: 'on-device',
			conversationHistory: declaredContext.conversationHistory
		});
		const expectations = evaluateToolExpectations(testCase.requiredTools, answer.toolInvocations);
		results.push({
			caseId: testCase.id,
			index: index + 1,
			case: compactCase(testCase),
			caseContext: declaredContext.caseContext,
			answer: answer.answer,
			answerOrigin: bridgeMode === 'command' ? 'external-local-model-command' : 'scaffold-not-model',
			confidence: answer.confidence,
			mode: answer.mode,
			provider: answer.provider,
			generatedAt: answer.generatedAt,
			durationMs: new Date().getTime() - startedAt.getTime(),
			contextUsed: answer.contextUsed,
			receipts: answer.receipts,
			requiredConfirmations: answer.requiredConfirmations,
			safetyFlags: answer.safetyFlags,
			toolInvocations: answer.toolInvocations,
			toolExpectations: expectations,
			bridge: bridgeDiagnostics.get(testCase.id) ?? null,
			rating: null,
			reviewerNotes: '',
			failureMode: null,
			suggestedFailureCategories: suggestedFailures(expectations),
			improvementTask: null
		});
	} catch (error) {
		results.push({
			caseId: testCase.id,
			index: index + 1,
			case: compactCase(testCase),
			caseContext: declaredConversationContextFor(testCase).caseContext,
			answer: '',
			answerOrigin: bridgeMode === 'command' ? 'external-local-model-command' : 'scaffold-not-model',
			confidence: 'low',
			mode: 'on-device',
			provider: 'on-device-gemma',
			generatedAt: now.toISOString(),
			durationMs: new Date().getTime() - startedAt.getTime(),
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
			bridge: bridgeDiagnostics.get(testCase.id) ?? null,
			error: error instanceof Error ? error.message : String(error),
			rating: null,
			reviewerNotes: '',
			failureMode: 'provider-error',
			suggestedFailureCategories: ['local-model-limitation'],
			improvementTask: null
		});
	}
}
caseRef.current = null;

const run = {
	schemaVersion: 1,
	runId,
	suiteId: suite.suiteId,
	suiteTitle: suite.title,
	suiteVersion: suiteIdentity.suiteVersion,
	suiteHash: suiteIdentity.suiteHash,
	suitePath: relative(REPO_ROOT, suitePath),
	generatedAt: now.toISOString(),
	evidenceLane: bridgeMode === 'command' ? 'external-local-model-command' : 'scaffold-not-model',
	modelCommand: bridgeMode === 'command' ? redactCommand(command) : null,
	caseCount: results.length,
	totalSuiteCases: suite.cases.length,
	filters: filterSummary(cli),
	ratingScale: suite.ratingScale,
	failureCategories: suite.failureCategories ?? VALID_FAILURE_CATEGORIES,
	summary: summarizeResults(results),
	results
};

await mkdir(outputDir, { recursive: true });
const runPath = resolve(outputDir, `${runId}.json`);
await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);

const summary = run.summary;
console.log(`Scout local-AI eval run saved: ${relative(REPO_ROOT, runPath)}`);
console.log(`Cases: ${run.caseCount}/${run.totalSuiteCases}`);
console.log(`Evidence lane: ${run.evidenceLane}`);
console.log(`Required-tool complete: ${summary.toolExpectationComplete}/${run.caseCount}`);
console.log(`Missing required tool hits: ${summary.missingToolCases}`);
console.log(`Source-evidence complete: ${summary.sourceEvidenceComplete}/${run.caseCount}`);
if (run.evidenceLane === 'scaffold-not-model') {
	console.log('Note: scaffold answers are not local-model proof. Re-run with SCOUT_LOCAL_AI_COMMAND or a device bridge before scoring release readiness.');
}

function installLocalBibleAssetFetch() {
	const nativeFetch = globalThis.fetch?.bind(globalThis);
	if (!nativeFetch || globalThis.__scoutLocalBibleAssetFetchInstalled) return;
	globalThis.__scoutLocalBibleAssetFetchInstalled = true;
	globalThis.fetch = async (input, init) => {
		const url = fetchInputUrl(input);
		if (url === '/bible/kjv.json' || url.endsWith('/bible/kjv.json')) {
			const body = await readFile(resolve(REPO_ROOT, 'mobile/static/bible/kjv.json'), 'utf8');
			return new Response(body, {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
		return nativeFetch(input, init);
	};
}

function fetchInputUrl(input) {
	if (typeof input === 'string') return input;
	if (input instanceof URL) return input.pathname;
	if (input && typeof input.url === 'string') return input.url;
	return '';
}

function parseArgs(argv) {
	const parsed = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith('--')) continue;
		const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
		const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
		if (inlineValue !== undefined) {
			parsed[key] = inlineValue;
			continue;
		}
		const next = argv[i + 1];
		if (next && !next.startsWith('--')) {
			parsed[key] = next;
			i += 1;
		} else {
			parsed[key] = true;
		}
	}
	return parsed;
}

function filterCases(cases, options) {
	let selected = [...cases];
	if (options.id) {
		const ids = new Set(String(options.id).split(',').map((value) => value.trim()).filter(Boolean));
		selected = selected.filter((testCase) => ids.has(testCase.id));
	}
	if (options.domain) {
		const domains = new Set(String(options.domain).split(',').map((value) => value.trim()));
		selected = selected.filter((testCase) => domains.has(testCase.domain));
	}
	if (options.phase) {
		const phases = new Set(String(options.phase).split(',').map((value) => value.trim()));
		selected = selected.filter((testCase) => phases.has(testCase.phase));
	}
	if (options.limit) selected = selected.slice(0, Number(options.limit));
	if (!selected.length) throw new Error('No eval cases matched the provided filters.');
	return selected;
}

function filterSummary(options) {
	return {
		id: options.id ?? null,
		domain: options.domain ?? null,
		phase: options.phase ?? null,
		limit: options.limit ? Number(options.limit) : null
	};
}

function compactTimestamp(date) {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function compactCase(testCase) {
	return {
		id: testCase.id,
		phase: testCase.phase,
		domain: testCase.domain,
		prompt: testCase.prompt,
		mile: testCase.mile,
		requiredTools: testCase.requiredTools,
		expectedTraits: testCase.expectedTraits,
		safetyCaveats: testCase.safetyCaveats,
		documentTask: testCase.documentTask,
		improvementTags: testCase.improvementTags
	};
}

function createEvalBridge({ mode, command, timeoutMs, caseRef, bridgeDiagnostics }) {
	if (mode === 'command' && !command) {
		throw new Error('Command bridge selected, but no --command or SCOUT_LOCAL_AI_COMMAND was provided.');
	}
	if (!['scaffold', 'command'].includes(mode)) {
		throw new Error(`Unsupported bridge mode "${mode}". Use "scaffold" or "command".`);
	}

	return {
		async isAvailable() {
			return true;
		},
		async describeModel() {
			return {
				tier: 'balanced',
				modelId: mode === 'command' ? `command:${hashText(command)}` : 'eval-scaffold-not-a-model',
				maxContextTokens: 4096
			};
		},
		async generate(input, onToken) {
			const testCase = caseRef.current;
			const caseId = testCase?.id ?? 'unknown-case';
			const diagnostics = {
				caseId,
				mode,
				promptChars: input.prompt.length,
				systemContextChars: input.systemContext.length,
				systemContext: input.systemContext
			};

			if (mode === 'command') {
				const payload = {
					caseId,
					prompt: input.prompt,
					systemContext: input.systemContext,
					maxTokens: input.maxTokens,
					case: testCase ? compactCase(testCase) : null
				};
				const result = await runCommandBridge(command, payload, timeoutMs);
				bridgeDiagnostics.set(caseId, {
					...diagnostics,
					commandHash: hashText(command),
					stdoutChars: result.rawStdout.length,
					stderrPreview: result.stderrPreview
				});
				if (onToken) onToken(result.text);
				return { text: result.text, truncated: result.truncated };
			}

			const text = scaffoldAnswer(input);
			bridgeDiagnostics.set(caseId, diagnostics);
			if (onToken) onToken(text);
			return { text, truncated: false };
		}
	};
}

function scaffoldAnswer(input) {
	const toolLines = extractToolLines(input.systemContext);
	const firstToolLine = toolLines[0] ?? 'No Scout tool finding was present in the model context.';
	return [
		'EVAL SCAFFOLD ONLY - this is not Dad local AI proof.',
		`Question: ${input.prompt}`,
		`First Scout finding: ${firstToolLine.replace(/^- /, '')}`,
		toolLines.length > 1 ? `Other findings seen: ${toolLines.slice(1, 4).map((line) => line.replace(/^- /, '')).join(' | ')}` : '',
		'Reviewer action: run this suite through the real TestFlight/on-device model or SCOUT_LOCAL_AI_COMMAND before assigning a release-readiness rating.'
	].filter(Boolean).join('\n');
}

function extractToolLines(systemContext) {
	const match = systemContext.match(/Trail tool findings:\n([\s\S]*?)\n\nCite sources/u);
	if (!match) return [];
	return match[1].split('\n').map((line) => line.trim()).filter(Boolean);
}

function runCommandBridge(command, payload, timeoutMs) {
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(command, [], {
			cwd: REPO_ROOT,
			env: process.env,
			shell: true,
			stdio: ['pipe', 'pipe', 'pipe']
		});
		let stdout = '';
		let stderr = '';
		let finished = false;
		const timer = setTimeout(() => {
			if (finished) return;
			finished = true;
			child.kill('SIGTERM');
			rejectPromise(new Error(`SCOUT_LOCAL_AI_COMMAND timed out after ${timeoutMs}ms.`));
		}, timeoutMs);

		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');
		child.stdout.on('data', (chunk) => {
			stdout += chunk;
		});
		child.stderr.on('data', (chunk) => {
			stderr += chunk;
		});
		child.on('error', (error) => {
			if (finished) return;
			finished = true;
			clearTimeout(timer);
			rejectPromise(error);
		});
		child.on('close', (code) => {
			if (finished) return;
			finished = true;
			clearTimeout(timer);
			if (code !== 0) {
				rejectPromise(new Error(`SCOUT_LOCAL_AI_COMMAND exited ${code}: ${stderr.slice(0, 800)}`));
				return;
			}
			try {
				resolvePromise(parseCommandOutput(stdout, stderr));
			} catch (error) {
				rejectPromise(error);
			}
		});
		child.stdin.end(`${JSON.stringify(payload)}\n`);
	});
}

function parseCommandOutput(stdout, stderr) {
	const trimmed = stdout.trim();
	if (!trimmed) throw new Error('SCOUT_LOCAL_AI_COMMAND returned empty stdout.');
	try {
		const parsed = JSON.parse(trimmed);
		const text = String(parsed.text ?? parsed.answer ?? '').trim();
		if (!text) throw new Error('SCOUT_LOCAL_AI_COMMAND JSON did not include text or answer.');
		return {
			text,
			truncated: Boolean(parsed.truncated),
			rawStdout: stdout,
			stderrPreview: stderr.slice(0, 1000)
		};
	} catch (error) {
		if (error instanceof SyntaxError) {
			return {
				text: trimmed,
				truncated: false,
				rawStdout: stdout,
				stderrPreview: stderr.slice(0, 1000)
			};
		}
		throw error;
	}
}

function buildEvalPack(testCase, now) {
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
	pack.water = waterFor(mile, prompt);
	pack.shelters = sheltersFor(mile);
	pack.towns = townsFor(mile);
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

function terrainFor(mile, generatedAt) {
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

function waterFor(mile, prompt) {
	const heatNote = prompt.includes('heat') || prompt.includes('hot')
		? 'Hot-day carry: top off at the last confirmed source, carry extra if the next source is seasonal or unverified, and stop/cool down for heat-illness symptoms.'
		: 'Treat/filter before drinking.';
	return [
		{name: 'Last known spring behind', mile: Math.max(0, mile - 2.4), reliability: 'reliable', note: 'Behind you; useful only if you turn back.'},
		{name: 'Seasonal seep ahead', mile: mile + 1.8, reliability: 'seasonal', note: 'Seasonal open-reference candidate; confirm current flow.'},
		{name: 'Reliable creek crossing', mile: mile + 6.2, reliability: 'reliable', note: heatNote},
		{name: 'Thin mapped branch', mile: mile + 11.4, reliability: 'thin', note: 'Mapped candidate with unknown current flow.'}
	];
}

function sheltersFor(mile) {
	return [
		{name: 'Near Ridge Shelter', mile: mile + 3.4, capacity: 8, note: 'Open-data candidate; verify current status, water, and crowding.'},
		{name: 'Pine Gap Campsite', mile: mile + 8.9, capacity: 10, note: 'Tent sites reported near trail; check land-manager rules.'},
		{name: 'Long Hollow Shelter', mile: mile + 14.2, capacity: 12, note: 'Water may require a side trail; verify before counting on it.'}
	];
}

function townsFor(mile) {
	return [
		{name: 'Pilot Gap Road', mile: mile + 4.8, access: 'road crossing; emergency exit candidate, confirm shuttle or pickup', servicesNote: 'No guaranteed services at the crossing.'},
		{name: 'Trail Town Market', mile: mile + 18.6, access: '0.7 mi road walk from crossing', servicesNote: 'Open-data services candidate: groceries, laundry, charging, and lodging must be confirmed same day.'},
		{name: 'Next Resupply Town', mile: mile + 37.5, access: 'shuttle-dependent road access', servicesNote: 'Good resupply candidate if hours and lodging are confirmed.'}
	];
}

function weatherFor(mile, prompt, now) {
	const lower = prompt.toLowerCase();
	const stale = lower.includes('stale');
	const storm = /\b(?:storm|storms|thunder|thunderstorm|thunderstorms|lightning|heavy rain|rain)\b/.test(lower);
	const cold = /\b(?:cold|35 degrees|wind|hypothermia|freez[a-z]*)\b/.test(lower);
	const hot = /hot|heat|dizzy/.test(lower);
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

function conditionsFor(prompt, now) {
	const lower = prompt.toLowerCase();
	const items = [];
	if (/closure|closed|detour|reroute/.test(lower)) {
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
	if (/fire|smoke|burn/.test(lower)) {
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
	if (/bear/.test(lower)) {
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

function parkServicesFor(now) {
	return {
		parks: ['Appalachian National Scenic Trail'],
		fetchedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
		note: 'Eval NPS facilities data.',
		items: [
			{kind: 'visitor-center', name: 'Eval Visitor Contact Station', parkLabel: 'Appalachian Trail', summary: 'Information, current conditions, and permit/ranger questions; verify hours before relying on it.', url: 'https://www.nps.gov/appa/index.htm', reservationUrl: null, lat: null, lon: null},
			{kind: 'campground', name: 'Eval Developed Campground', parkLabel: 'Appalachian Trail', summary: 'Legal developed camping example for backup planning; reservations and seasonal status must be confirmed.', url: 'https://www.nps.gov/appa/index.htm', reservationUrl: 'https://www.recreation.gov/', lat: null, lon: null}
		]
	};
}

function loadoutFor(prompt) {
	const cold = /\b(?:cold|rain|hypothermia|freez[a-z]*)\b/.test(prompt);
	return [
		{name: 'Shelter and stakes', category: 'shelter', weightOz: 32, carried: true, note: 'Required sleep shelter.'},
		{name: 'Quilt and dry sleep base layer', category: 'sleep', weightOz: 38, carried: true, note: 'Protect from moisture.'},
		{name: 'Rain jacket', category: 'clothing', weightOz: 9, carried: true, note: 'Keep accessible.'},
		{name: 'Rain pants', category: 'clothing', weightOz: 7, carried: cold, note: cold ? 'Useful in cold rain/wind.' : 'Optional candidate, decide from forecast and warmth.'},
		{name: 'Water filter', category: 'kitchen', weightOz: 3, carried: true, note: 'Protect from freezing.'},
		{name: 'Backup water tablets', category: 'safety', weightOz: 1, carried: true, note: 'Backup treatment if filter fails.'},
		{name: 'First aid and blister kit', category: 'safety', weightOz: 5, carried: true, note: 'Blister care, tape, usual meds.'},
		{name: 'Phone and battery bank', category: 'electronics', weightOz: 14, carried: true, note: 'Charge in town and conserve offline.'},
		{name: 'Camp shoes', category: 'clothing', weightOz: 9, carried: /camp shoes/.test(prompt), note: 'Comfort item; evaluate after shakedown.'}
	];
}

function evalGuideExcerpts() {
	return [
		{id: 'eval-pretrip-discipline', title: 'Pretrip and first-week discipline', body: 'Pretrail answers should turn preparation into a short first-week plan. Include this week: two or three loaded shakedown walks, foot care and blister practice, a gear/loadout check, water treatment practice, and an offline app/model rehearsal. Before leaving service, charge the phone and battery bank, refresh the field pack, confirm current mile, download the local AI model on Wi-Fi and power, download offline maps/docs, verify the Bible text is available offline, then turn on airplane mode, relaunch, and ask Scout a water question. On first install, set the hiker profile and current mile first, refresh the field pack, confirm the pack age/status looks current, download or update the local AI model on Wi-Fi and power, save offline maps/docs, let cloud sync finish if signed in, then run the airplane-mode test. Scout is not ready for offline trail use until the field-pack refresh, model download, and airplane-mode test succeed. Scout is a field companion, not an emergency communicator; keep the inReach, PLB, 911 plan, or family emergency plan separate.', tags: ['pretrip', 'prep', 'shakedown', 'foot-care', 'offline', 'local-ai', 'field-pack', 'bible'], citation: 'Dad Local AI eval source skill: pretrip'},
		{id: 'eval-airplane-mode-capability-boundary', title: 'Airplane mode capability boundary', body: 'In airplane mode, Scout can answer only from what is already on the phone: the cached field pack, the on-device local AI model, saved offline maps/docs, saved document summaries, and Bible text if it was packaged or downloaded. Scout cannot fetch fresh weather, official closures or fire alerts, new water reports, town or service changes, cloud sync/backup, messages, or live/tramily location until the phone is back online. Treat cached weather, closures, water, and services as stale until refreshed again, and keep inReach, PLB, 911, or the family emergency plan separate.', tags: ['safety', 'offline', 'airplane-mode', 'local-ai', 'field-pack', 'weather', 'closures', 'sync', 'live-location', 'bible'], citation: 'Dad Local AI eval source skill: airplane mode'},
		{id: 'eval-model-download-status-discipline', title: 'Model download status discipline', body: 'If Scout says the model is still downloading, the on-device local AI model is not ready for offline Scout yet. Keep the phone on Wi-Fi and power, let download and verification finish, and check Scout model status or progress until it says ready. If the download is stuck or failed, retry, cancel, or restart it from the model download control while back on Wi-Fi. Do not trust offline/local AI until the model reports ready and an airplane-mode Scout question succeeds; Scout must not pretend a fake offline answer came from the local model.', tags: ['pretrip', 'offline', 'local-ai', 'model-download', 'status', 'airplane-mode', 'safety'], citation: 'Dad Local AI eval source skill: model download'},
		{id: 'eval-field-pack-staleness-discipline', title: 'Field pack staleness discipline', body: "Scout's field pack is the cached trail data on the phone, not the physical backpack. Before trusting it, check the pack age/status, current mile or downloaded region, and source timestamps when shown. If it is old, expired, for the wrong mile/region, or was loaded before weather, closures, water, or services changed, treat it as stale. Refresh on Wi-Fi or in town before water, weather, closure, bailout, or town-service decisions. Until refreshed, cached weather, closures, water, and services are caution signals, not current proof.", tags: ['pretrip', 'offline', 'field-pack', 'stale', 'weather', 'closures', 'water', 'safety'], citation: 'Dad Local AI eval source skill: field pack freshness'},
		{id: 'eval-signin-cloud-sync-discipline', title: 'Sign-in and cloud sync discipline', body: 'Accounts are invite-only. If the hiker has an invite, sign in before trail on Wi-Fi so backup, restore, and cloud sync can finish before leaving service. Sign-in helps recover data if the phone is replaced, restore documents/settings, and sync changes between devices. Offline Scout/local AI is separate: after setup, it can work from the downloaded field pack, on-device model, and saved maps/docs without a live login. Cloud sync and sign-in are not an emergency safety system and do not replace inReach, PLB, 911, or the family emergency plan.', tags: ['pretrip', 'account', 'sign-in', 'cloud-sync', 'backup', 'restore', 'offline', 'safety'], citation: 'Dad Local AI eval source skill: account sync'},
		{id: 'eval-current-mile-profile-discipline', title: 'Current mile and profile discipline', body: 'Scout follows the hiker only after their hike profile/current mile is set. On first run, use the hike setup sheet, choose Start my hike, and enter the Current AT mile. Later, use Settings > Edit hike details or a confirmed mile update, then check Today and Scout both show the new mile. Refresh the field pack when online and re-ask water, shelter, town, terrain, or bailout questions after changing mile. A wrong mile shifts every nearby answer, especially water, shelter, town, terrain, and bailout advice. Confirm the mile against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap before relying on Scout.', tags: ['profile', 'current-mile', 'onboarding', 'navigation', 'water', 'shelter', 'town', 'bailout'], citation: 'Dad Local AI eval source skill: current mile'},
		{id: 'eval-wrong-mile-recovery-discipline', title: 'Wrong mile recovery discipline', body: 'If the hiker enters the wrong trail mile, correct the Current AT mile in the first-run hike setup, Settings > Edit hike details, or a confirmed manual mile update. Confirm the corrected mile against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap. Then check Today and Scout both show the corrected mile, refresh the field pack when online, and re-ask Scout for water, shelter, town, terrain, and bailout. A wrong mile shifts water, shelter, town, terrain, and bailout answers; do not make water, shelter, town, or safety decisions from a wrong mile.', tags: ['safety', 'profile', 'current-mile', 'wrong-mile', 'navigation', 'water', 'shelter', 'town', 'bailout'], citation: 'Dad Local AI eval source skill: wrong mile recovery'},
		{id: 'eval-terrain-mileage-discipline', title: 'Terrain and mileage discipline', body: 'Mileage decisions start with body condition, daylight, elevation, water spacing, weather, pack weight, foot or knee condition, and next legal shelter/campsite/town stop. For the first trail week, start low, protect feet and knees, stop while you can still recover normally, and adjust only after several normal mornings. Do not promise a fixed daily mileage; use the constraints in front of you that day.', tags: ['terrain', 'pace', 'mileage', 'daylight', 'first-week', 'recovery'], citation: 'Dad Local AI eval source skill: terrain'},
		{id: 'eval-water-discipline', title: 'Water discipline', body: 'Water answers must lead with the nearest loaded source, reliability, distance, and uncertainty. Seasonal and mapped candidates are not promises. If current flow is unknown, recommend a safer carry or verified stop. For ridge or camel-up decisions, tell the hiker to camel up at the last confirmed source and carry extra when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only use the lighter carry when the next reliable water is confirmed and conditions are mild. For dry stretches, start from roughly 0.5-1 liter per 3-5 miles and increase for heat, exposure, climbing, slow pace, or personal thirst; top off at the last confirmed source and carry enough to reach the next reliable source when the next source is seasonal or unverified. For questionable water when tired or low on daylight, keep treatment non-negotiable: filter or backflush if needed, use backup tablets or boil if the filter is slow or suspect, never drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.', tags: ['water', 'spring', 'creek', 'flow', 'ridge', 'heat', 'treatment', 'daylight'], citation: 'Dad Local AI eval source skill: water'},
		{id: 'eval-shelter-discipline', title: 'Shelter and camping discipline', body: 'Sleep decisions need legal camping rules, daylight, fatigue, weather, water, crowding, and backup options. A tired hiker should be steered to the safer legal stop rather than extra miles for pride. If the shelter is full while daylight remains, stay courteous, use legal established overflow tenting only if allowed, choose a backup before dark, and avoid unsafe or illegal camping. If it is already dark, slow down, use the headlamp, take the nearest safe legal option, avoid extra risky night miles, and keep a fallback if the shelter is full. Do not stealth camp in regulated or prohibited areas; if exhausted, choose a safer legal shelter, campsite, town stop, or established legal site and stop earlier. For storm camps, set up early in a protected legal spot, avoid exposed ridges, dead trees, drainages, and flood-prone ground, keep dry sleep layers protected, and stop or bail out for lightning, flooding, hypothermia risk, or worsening conditions. For low-impact camping, use established or durable surfaces, stay roughly 200 feet from water and trail when local rules allow, and follow posted rules over general advice. Around climbs, stop before the climb if daylight, legs, water, weather, or legal camp options are weak; climb only when you have enough daylight, water, energy, and a known legal stop after it. After dark, slow down, use the headlamp, avoid risky night navigation when tired, and keep a backup plan if the shelter is full. For a shelter with no reliable water, top off before the shelter, carry enough to the next verified source, or stop where both legal sleep and water are workable.', tags: ['shelter', 'camping', 'campsite', 'rules', 'daylight', 'storm', 'water'], citation: 'Dad Local AI eval source skill: shelter'},
		{id: 'eval-weather-discipline', title: 'Weather discipline', body: 'Weather is volatile. Stale cached weather can guide caution but must not be treated as live proof. Thunderstorms, lightning, heat, cold rain, wind, flooding or high water, closures or fire/smoke alerts, and exposed ridges require current checks when possible. For thunderstorms, avoid exposed ridges and high points during the storm window, shift timing or mileage earlier/lower, and stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears. For lightning on a ridge, leave exposed high ground if it is safe to move, avoid lone trees, open knobs, metal objects, and water, spread out from partners, wait well after the last thunder, and do not keep hiking exposed terrain. For cold wind on a ridge, cap target miles, eat more often, drink steadily, protect hands, head, and feet, keep insulation and sleep layers dry, and treat wet wind as hypothermia risk. For hot days, hike harder miles early, schedule shade breaks, carry more water when sources are uncertain, and stop/cool/escalate for dizziness, confusion, headache, nausea, cramps, stopped sweating, or worsening symptoms. For wet-weather hypothermia, watch for shivering, clumsiness, confusion, apathy, slurred speech, and poor coordination; stop, get sheltered, change into dry insulation, and get help for severe or worsening symptoms. For a heavy-rain start, recommend conservative mileage, keeping sleep layers dry, footing caution on slick roots/rocks/descents, and a bailout or stop plan if lightning, hypothermia risk, flooding, or worsening conditions appear. For cold-rain camping, protect the dry sleep layer and warm layer first, set up early, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry.', tags: ['weather', 'wind', 'cold', 'rain', 'heat', 'storm', 'footing', 'bailout', 'hypothermia', 'lightning'], citation: 'Dad Local AI eval source skill: weather'},
		{id: 'eval-town-discipline', title: 'Town discipline', body: 'Town stops are recovery first: eat, shower, laundry, foot care, sleep, charge, download, then logistics. Services, hostels, shuttles, mail, and store hours need same-day confirmation. If a hostel is full, treat hostels, shuttles, visitor centers, campgrounds, and road crossings as candidates until confirmed; call or message ahead when service exists, confirm bed space, shuttle or pickup, hours, reservations or seasonal status, and legal overnight rules, then choose backup lodging, a legal campground or public option, or an earlier legal stop, short day, or nero if tired or injured. Zero and nero decisions should weigh body condition or injury, cached/current weather, chores, budget, and the next section; rest is an investment, not failure. Default resupply rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops. Bad-weather nero decisions should compare storm severity, temperature, footing, exposure, daylight, body condition, terrain, and town access, then choose a short day, town stop, or early legal stop if the full plan is less safe. To dry gear in town without wasting the day, dry the sleeping bag or quilt and insulation first, then socks, shoes or liners, wet clothes, and rain gear using laundry, safe dryer settings, drying rooms, or motel airflow before charging, repacking, and leaving town. For mail-drop versus buy-in-town questions, ask for or name the missing decision inputs before firm advice: diet restrictions, daily pace, next town timing, store hours, post-office hours, hostel/shuttle access, and whether the item is hard to find locally. Never say hard-to-find items are better bought in town unless a current town source proves availability. Budget advice should separate daily burn, town spikes, hostel/shuttle/laundry/meals, gear replacement, and an emergency cushion; it should stay flexible around actual pace and town services and never sound like a financial guarantee.', tags: ['town', 'resupply', 'recovery', 'hostel', 'laundry', 'budget', 'mail-drop', 'zero', 'nero', 'weather'], citation: 'Dad Local AI eval source skill: town'},
		{id: 'eval-loadout-discipline', title: 'Loadout discipline', body: 'Gear advice starts from actual carried items. Cut duplicate comfort weight before rain protection, insulation, water treatment, first aid, battery, navigation, or sleep safety. A shakedown hike should prove the sleep system, rain system, cooking/food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn every failure into a specific gear or app fix before Springer, and do not treat one shakedown as proof every condition is solved. Camp shoes are optional comfort and recovery gear, not automatic safety gear; weigh foot recovery, shelter and camp comfort, appropriate stream-crossing use, hygiene, and weight, then test them through the first section and reassess at the first town. Dry priorities are the sleep base layer, socks, insulation or warm layer, quilt or bag, and critical electronics; protect them in a pack liner or dry bag because wet-cold mistakes can become hypothermia risk. A battery-bank plan should use phone model, days between town charging, navigation/maps/photos/family check-in habits, local AI/model use, and an actual airplane-mode drain test with the phone and bank. Do not mail home rain protection, insulation or warm layers, water treatment, first aid, battery/navigation power, or sleep safety just because one forecast looks warm; tie mail-home choices to forecast, next town timing, and replacement options.', tags: ['loadout', 'gear', 'pack', 'weight', 'shakedown', 'battery', 'dry-clothes', 'mail-home', 'camp-shoes'], citation: 'Dad Local AI eval source skill: loadout'},
		{id: 'eval-food-on-the-move-discipline', title: 'Food on the move discipline', body: 'For food-packing questions, tell the hiker to split the day food before leaving camp. Put the next 3-4 hours of snacks and lunch where they can be reached without unpacking: hip belt pockets, shoulder pouch, top pocket, or outside mesh. Keep cook/camp meals, extra days of food, and trash packed separately so hiking food does not get buried. Tie this to steady energy, warmth, and safer mileage, water, and shelter decisions. Do not give medical nutrition advice.', tags: ['loadout', 'food', 'snacks', 'ration', 'lunch', 'packing', 'energy'], citation: 'Dad Local AI eval source skill: food on the move'},
		{id: 'eval-safety-discipline', title: 'Safety discipline', body: 'For injury, heat illness, hypothermia, lightning, unsafe people, lost/off-trail, fire, bear near camp, or severe fatigue, Scout should choose lower-risk stops, exits, or help. For severe fatigue or unclear thinking, start with stop hiking, sit in a safe spot, eat, drink treated water or electrolytes, adjust layers for warmth or cooling, and check daylight, weather, body symptoms, and whether the hiker can think clearly. Then use loaded water, shelter, town, or bailout context to choose the nearest lower-risk legal stop or help option; escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for confusion, worsening symptoms, injury, exposure, inability to continue safely, or inability to make decisions. For prayer plus safe-plan prompts, a short prayer-like support can be included when requested, but encouragement must stay separate from trail facts. Prayer alone is not a request for Bible quotes; quote only loaded KJV verses if the hiker explicitly asks for scripture or verses. Use loaded shelter/water/town/bailout context as candidates, verify status, water, crowding, weather, alerts, and legal options, choose the lower-risk option, and say prayer is support, not a substitute for evacuation or help. For scared or alone nighttime support, comfort can include loaded scripture when requested, but the practical safety plan still matters: check immediate hazards, weather, and alerts if possible, get warm and dry, eat or drink if needed, use the headlamp, choose the nearest safe legal sleep option or known public/help option, treat loaded shelter context as a candidate rather than a guarantee, and escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic. Do not spiritualize away real danger or symptoms. For smoke or visible fire near the trail, do not continue toward or through the hazard; move away toward a known safe road, town, ranger station, or public area when safe, follow official closures, evacuation orders, rangers, 911, or emergency-device instructions, and do not invent a safe route through smoke or fire. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger. For a bear near camp, stay calm, create distance, do not run, give the bear an exit, secure food/trash/scented items away from sleep, and do not approach, feed, corner, or try to retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available, and do not invent species- or park-specific rules unless loaded. Use emergency communication or local authorities/rangers if there is immediate danger. For heat illness risk, tell the hiker to stop hiking, find shade, cool down, sip treated water with electrolytes if available, and escalate if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms appear. For knee or joint pain, do not tell the hiker to train through pain; recommend pain-free load reduction, low-impact conditioning, strength/mobility work, and a clinician or physical therapist when pain persists, worsens, swells, or changes gait. For first-aid and blister kit questions, keep the kit compact and personal: prevention tape, blister treatment, wound basics, normal personal meds, and a warning to stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait. Scout must not diagnose, replace emergency services, or replace a dedicated emergency communicator.', tags: ['safety', 'risk', 'injury', 'bailout', 'emergency', 'first-aid', 'blisters', 'wound', 'infection', 'heat', 'bear'], citation: 'Dad Local AI eval source skill: safety'},
		{id: 'eval-offline-documents-discipline', title: 'Offline documents and sensitive information discipline', body: 'Before day one, save personal documents outside Scout where you can reach them offline: photo ID, insurance card, emergency contacts, medication/allergy notes, itinerary/check-in plan, permits or reservations if needed, shuttle/lodging confirmations, and the Scout field pack/offline map status. Distinguish personal documents from Scout trail data: Scout can ground on cached field pack, saved docs, Bible text, and map data, but it should explicitly tell you not to paste private ID, insurance, medical, payment, or reservation numbers into Scout chat.', tags: ['safety', 'documents', 'offline', 'pretrip', 'itinerary', 'insurance', 'permits', 'sensitive'], citation: 'Dad Local AI eval source skill: safety documents'},
		{id: 'eval-family-checkin-discipline', title: 'Family check-in and missed-contact discipline', body: 'Family check-ins should set expectations before the trail: usual cadence, current mile or location, how you feel, planned stop, and next expected contact. Normal gaps can happen from dead zones, battery conservation, rain, or town chaos. Give family an escalation window and the emergency contact/itinerary sheet ahead of time. Tell family: if they do not hear from you after that window, use direct calls/texts, emergency contacts, hostels/shuttles/rangers when appropriate, and then emergency services. Repeated missed check-ins, bad weather, health concerns, or itinerary mismatch should escalate. Do not promise live location is always available.', tags: ['safety', 'check-ins', 'family', 'offline', 'emergency', 'itinerary'], citation: 'Dad Local AI eval source skill: safety check-ins'},
		{id: 'eval-trail-conditions-discipline', title: 'Trail conditions discipline', body: 'Closures, detours, fires, burn bans, bridge outs, washouts, and bear activity require current official verification. Scout can summarize loaded alerts, but must not invent alternate routes or route a hiker through smoke, fire, closures, or evacuation areas.', tags: ['closure', 'detour', 'hazard', 'condition', 'fire'], citation: 'Dad Local AI eval source skill: trail conditions'},
		{id: 'eval-park-services-discipline', title: 'Park services discipline', body: 'Visitor centers, ranger stations, permit offices, and developed campgrounds are official-service candidates, not thru-hiker shelter guarantees. Verify hours, reservations, and seasonal access.', tags: ['park', 'ranger', 'visitor', 'campground', 'permit'], citation: 'Dad Local AI eval source skill: park services'}
	];
}

function evalDocuments(now) {
	const timestamp = now.toISOString();
	return [
		{id: 'dad-offline-setup', title: 'Dad offline setup checklist', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Before leaving town: charge phone and battery bank, refresh field pack, confirm current mile, download local AI model on Wi-Fi and power, download offline maps or references, verify Bible text is available offline, turn on airplane mode, relaunch, and ask Scout a water question. The phone and Scout do not replace inReach, PLB, 911, or a family emergency plan.'},
		{id: 'dad-offline-documents', title: 'Dad document vault personal checklist', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Document vault summary: save ID, insurance, emergency contacts, itinerary, check-in plan, permits or reservations if needed, medication/allergy notes, and shuttle/lodging confirmations somewhere available offline. Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; Scout only needs source summaries and trail context.'},
		{id: 'dad-family-checkins', title: 'Dad family check-in expectations', source: 'manual', createdAt: timestamp, updatedAt: timestamp, body: 'Family check-ins should include current mile or location, destination, how you feel, and next expected contact. If they do not hear from you after the escalation window, they should use direct calls/texts, emergency contacts, hostels/shuttles/rangers when appropriate, and then emergency services. Missed check-ins can happen from dead zones, but repeated misses, bad weather, health concerns, or itinerary mismatch should escalate. Live location may be delayed or unavailable.'}
	];
}

function declaredConversationContextFor(testCase) {
	if (testCase.id !== 'DLA-097') {
		return {
			conversationHistory: [],
			caseContext: {
				mode: 'standalone-fresh-context',
				source: 'none',
				fixtureId: null,
				conversationTurns: 0
			}
		};
	}
	const conversationHistory = [
		{
			role: 'user',
			content: 'Can you pray with me but also help me make a safe plan?',
			timestamp: '2026-06-26T11:59:00.000Z'
		},
		{
			role: 'assistant',
			content: 'Yes. Stop hiking for a minute, get safe, eat and drink treated water, check daylight/weather, choose the nearest legal safe stop or help option, and escalate for danger or worsening symptoms. Lord, give calm judgment and safe next steps.',
			timestamp: '2026-06-26T11:59:30.000Z'
		}
	];
	return {
		conversationHistory,
		caseContext: {
			mode: 'declared-conversation-fixture',
			source: 'suite-declared-fixture',
			fixtureId: 'dla-097-shorter-followup-fixture',
			conversationTurns: conversationHistory.length
		}
	};
}

function evaluateToolExpectations(requiredTools, invocations) {
	const hit = [];
	const missing = [];
	for (const expectation of requiredTools) {
		if (invocations.some((record) => matchesToolExpectation(expectation, record))) {
			hit.push(expectation);
		} else {
			missing.push(expectation);
		}
	}
	return { required: requiredTools, hit, missing };
}

function matchesToolExpectation(expectation, record) {
	const [toolId, sourceSkill] = expectation.split(':');
	if (record.toolId !== toolId) return false;
	if (!sourceSkill) return true;
	return String(record.args?.sourceSkill ?? '').toLowerCase() === sourceSkill.toLowerCase();
}

function suggestedFailures(expectations) {
	const categories = new Set();
	if (expectations.missing.length) {
		categories.add('bad-routing');
		categories.add('weak-tool');
	}
	return Array.from(categories);
}

function summarizeResults(results) {
	const missingToolCounts = {};
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
		missingToolCounts,
		...summarizeRunSourceEvidence(results)
	};
}

function hashText(text) {
	return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

function redactCommand(commandText) {
	return commandText.replace(/(sk-[A-Za-z0-9_-]+)/g, 'sk-redacted').replace(/([A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*=)[^\s]+/giu, '$1redacted');
}
