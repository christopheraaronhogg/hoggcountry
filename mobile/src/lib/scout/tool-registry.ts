import { defaultScoutTools } from './built-in-tools.ts';
import type { ContextPack, ToolContext, ToolHandler, ToolInvocationRecord, ToolRegistry } from './types.ts';

export class InMemoryToolRegistry implements ToolRegistry {
	private tools = new Map<string, ToolHandler>();

	constructor(initial: ToolHandler[] = []) {
		for (const tool of initial) this.tools.set(tool.id, tool);
	}

	register(handler: ToolHandler): void {
		this.tools.set(handler.id, handler);
	}

	get(id: string): ToolHandler | undefined {
		return this.tools.get(id);
	}

	list(): ToolHandler[] {
		return Array.from(this.tools.values());
	}
}

export function defaultToolRegistry(): ToolRegistry {
	return new InMemoryToolRegistry(defaultScoutTools);
}

interface ToolTrigger {
	keywords: string[];
	toolId: string;
	args?: Record<string, unknown>;
}

interface SourceSkillTrigger {
	id: string;
	keywords: string[];
	queryHints: string[];
}

const TOOL_TRIGGERS: ToolTrigger[] = [
	{ keywords: ['water', 'spring', 'creek', 'source', 'seasonal', 'dry stretch', 'camel up', 'hydrate', 'filter', 'questionable', 'hot', 'heat', 'dizzy', 'big climb', 'too tired', 'keep going'], toolId: 'next_water' },
	{ keywords: ['shelter', 'camp', 'camping', 'campsite', 'tent site', 'lean-to', 'where sleep', 'sleep', 'overnight', 'tonight', 'after dark', 'dark', 'full when i arrive', 'bear activity', 'big climb', 'stop before', 'too tired', 'keep going', 'safe plan'], toolId: 'next_shelter' },
	{ keywords: ['town', 'resupply', 'hostel', 'shuttle', 'outfitter', 'laundry', 'groceries', 'mail drop', 'road crossing', 'bailout', 'exit', 'nero', 'zero', 'food', 'lodging', 'unsafe', 'overdue', 'ankle', 'budget'], toolId: 'next_town' },
	{ keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'thunderstorm', 'thunderstorms', 'forecast', 'heat', 'hot', 'thunder', 'lightning', 'hypothermia', 'freez', 'dizzy', 'ridge', 'push past', 'stop there', 'dry gear', 'bad weather', 'tomorrow', 'dry stretch', 'smoke', 'fire', 'zero', 'nero', 'stop hiking'], toolId: 'weather_lookup' },
	{
		keywords: ['closure', 'closed', 'detour', 'reroute', 'fire', 'smoke', 'burn ban', 'washout', 'bridge out', 'blowdown', 'high water', 'alert', 'bear activity', 'bear reports', 'bear near', 'bear in camp', 'bear at camp'],
		toolId: 'trail_conditions'
	},
	{
		keywords: ['visitor center', 'ranger', 'ranger station', 'campground', 'national park', 'park office', 'wayside', 'permit office', 'hostel is full', 'hostel full', 'backup lodging', 'legal public'],
		toolId: 'park_services'
	},
	{ keywords: ['miles', 'mileage', 'mileage goals', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20', 'terrain', 'climb', 'descent', 'elevation', 'ridge', 'first week', 'overdoing', 'body responds', 'dry stretch', 'road crossing', 'bailout', 'next stretch', 'resupply point', 'tired early', "today's hike"], toolId: 'upcoming_terrain' },
	{ keywords: ['gear', 'pack', 'loadout', 'carry', 'packed', 'base weight', 'rain gear', 'rain pants', 'first aid', 'first-aid', 'food carry', 'shakedown', 'sleep system', 'rain system', 'pack fit', 'battery drain', 'clothes', 'dry', 'filter', 'battery bank', 'camp shoes', 'kit'], toolId: 'loadout_check' },
	{ keywords: ['where am i', 'current mile', 'trail mile', 'my mile', 'set my mile', 'mile manually', 'wrong trail mile', 'wrong mile', 'gps', 'bailout', 'update in scout', 'offline', 'stealth camp', 'map', 'basemap', 'cell signal', 'off trail', 'junction', 'ankle', 'sos', 'support circle', 'signal', 'overdue', 'too tired', 'keep going'], toolId: 'current_mile' },
	{
		keywords: [
			'bible',
			'scripture',
			'verse',
			'john ',
			'john 3:16',
			'romans',
			'psalm',
			'gospel',
			'jesus',
			'christ',
			'faith',
			'pray',
			'prayer',
			'lord',
			'salvation',
			'be saved',
			'born again',
			'eternal life',
			'everlasting life',
			'scriptures',
			'god',
			'holy',
			'blessing',
			'blessed',
			'sermon',
			'proverb'
		],
		toolId: 'bible_search'
	}
];

const SOURCE_SKILL_TRIGGERS: SourceSkillTrigger[] = [
	{
		id: 'water',
		keywords: ['water', 'spring', 'creek', 'flow', 'filter', 'hydrate', 'seasonal', 'dry stretch', 'camel up', 'hot', 'heat', 'dizzy', 'questionable', 'source'],
		queryHints: [
			'water discipline',
			'current flow',
			'reliability',
			'mapped candidate',
			'seasonal spring',
			'top off',
			'treat filter'
		]
	},
	{
		id: 'shelter',
		keywords: ['shelter', 'camp', 'camping', 'campsite', 'tent site', 'lean-to', 'hut', 'privy', 'where sleep', 'sleep', 'overnight', 'tonight', 'after dark', 'dark', 'stealth'],
		queryHints: ['shelter discipline', 'camping', 'capacity', 'rules', 'legal overnight', 'verify current status']
	},
	{
		id: 'town',
		keywords: ['town', 'resupply', 'hostel', 'shuttle', 'laundry', 'groceries', 'outfitter', 'mail drop', 'motel', 'restaurant', 'road crossing', 'bailout', 'exit', 'nero', 'zero', 'food', 'charge', 'download', 'lodging', 'budget', 'overplanning', 'daily burn', 'emergency cushion'],
		queryHints: ['town discipline', 'zero', 'nero', 'weather', 'next section', 'resupply', 'recovery', 'services', 'access', 'same day confirmation', 'budget', 'town spikes', 'gear replacement', 'emergency cushion']
	},
	{
		id: 'weather',
		keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'thunderstorm', 'thunderstorms', 'forecast', 'heat', 'hot', 'thunder', 'lightning', 'hypothermia', 'freez', 'dizzy', 'ridge', 'dry gear', 'bad weather', 'tomorrow', 'zero', 'nero', 'stop hiking'],
		queryHints: ['weather discipline', 'exposure', 'wind', 'cold', 'rain', 'storm', 'thunderstorm', 'lightning', 'verify forecast']
	},
	{
		id: 'trail conditions',
		keywords: ['closure', 'closed', 'detour', 'reroute', 'fire', 'smoke', 'burn ban', 'washout', 'bridge out', 'blowdown', 'high water', 'alert', 'bear activity', 'bear reports', 'bear near', 'bear in camp', 'bear at camp'],
		queryHints: ['trail conditions', 'closures', 'detours', 'hazards', 'official source', 'verify live']
	},
	{
		id: 'safety',
		keywords: ['safety', 'safe', 'unsafe', 'injury', 'hurt', 'pain', 'knee', 'ankle', 'rolled', 'dizzy', 'symptoms', 'blister', 'blisters', 'first aid', 'first-aid', 'wound', 'wounds', 'infection', 'medical', 'sick', 'bear', 'bailout', 'emergency', 'sos', 'support circle', 'signal', 'cell service', 'airplane mode', 'offline', 'stale', 'trust', 'wrong trail mile', 'wrong mile', 'documents', 'personal documents', 'offline documents', 'photo id', 'driver license', 'insurance', 'emergency contacts', 'itinerary', 'permits', 'reservations', 'screenshot', 'check-ins', 'check ins', 'check-in', 'family', 'miss one', 'missed check-in', 'miss a check-in', 'stealth', 'exhausted', 'after dark', 'dark', 'lost', 'off trail', 'gps', 'junction', 'overdue', 'smoke', 'fire', 'scared', 'alone', 'tired', 'hypothermia', 'lightning', 'charge', 'refresh', 'download', 'update in scout', 'stop hiking', 'make miles', 'download failed', 'model download failed', 'ford', 'flood'],
		queryHints: ['safety discipline', 'body risk', 'bailout', 'emergency boundaries', 'official source', 'choose safer stop']
	},
	{
		id: 'pretrip',
		keywords: ['8 weeks', 'springer', 'trail prep', 'pre-trail', 'before trail', 'before day one', 'day one', 'first week', 'train', 'training', 'shakedown', 'foot care', 'local ai', 'model download', 'model is still downloading', 'still downloading', 'model status', 'offline setup', 'phone settings', 'offline downloads', 'going offline', 'field pack', 'sign in', 'log in', 'login', 'account', 'invite-only', 'invited', 'cloud sync', 'backup', 'restore', 'body responds', 'mileage goals', 'documents'],
		queryHints: ['pretrip discipline', 'shakedown', 'foot care', 'offline setup', 'local AI model', 'field pack refresh', 'phone settings', 'first week', 'day one']
	},
	{
		id: 'park services',
		keywords: ['visitor center', 'ranger', 'ranger station', 'campground', 'national park', 'park office', 'wayside', 'permit office'],
		queryHints: ['park services', 'visitor center', 'ranger station', 'campground', 'permits', 'hours']
	},
	{
		id: 'terrain',
		keywords: ['miles', 'mileage', 'mileage goals', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20', 'terrain', 'climb', 'descent', 'elevation', 'ridge', 'first week', 'trail prep', 'springer', 'overdoing', 'body responds', 'road crossing', 'bailout', 'next stretch', 'resupply point', 'guidebook', 'trail sign'],
		queryHints: ['terrain discipline', 'pace', 'mileage', 'terrain', 'decision point', 'daylight', 'body condition', 'pack weight', 'legal stop', 'first week']
	},
	{
		id: 'loadout',
		keywords: ['gear', 'pack', 'loadout', 'carry', 'packed', 'base weight', 'rain gear', 'rain pants', 'first aid', 'first-aid', 'food carry', 'shakedown', 'sleep system', 'rain system', 'pack fit', 'battery drain', 'clothes', 'dry', 'filter', 'battery bank', 'camp shoes', 'kit'],
		queryHints: ['loadout', 'gear', 'pack contents', 'carried items', 'weight', 'safety gear', 'shakedown', 'sleep system', 'rain system', 'water filtering', 'battery', 'pack fit']
	}
];

function argsForTrigger(trigger: ToolTrigger, prompt: string): Record<string, unknown> {
	if (trigger.toolId === 'bible_search') return { query: prompt };
	if (trigger.toolId === 'next_water') {
		const wantsReliable = /\b(reliable|confirmed|dependable|depend on|count on|trust)\b/iu.test(prompt);
		return wantsReliable ? { reliabilityPreference: 'reliable' } : {};
	}
	return trigger.args ?? {};
}

function promptMatchesKeyword(prompt: string, keyword: string): boolean {
	const normalized = keyword.trim().toLowerCase();
	if (!normalized) return false;

	if (normalized === 'freez') {
		return /\bfreez[a-z]*\b/u.test(prompt);
	}

	const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'u').test(prompt);
}

function promptMatchesAnyKeyword(prompt: string, keywords: string[]): boolean {
	return keywords.some((keyword) => promptMatchesKeyword(prompt, keyword));
}

function sourceSkillQuery(skill: SourceSkillTrigger, prompt: string, pack: ContextPack): string {
	const queryHints = sourceSkillQueryHints(skill, prompt);
	return [
		prompt,
		...queryHints,
		`current mile ${pack.hiker.currentMile.toFixed(1)}`,
		pack.hiker.direction,
		`day ${pack.hiker.dayNumber}`
	].join(' ');
}

function sourceSkillQueryHints(skill: SourceSkillTrigger, prompt: string): string[] {
	const lower = prompt.toLowerCase();
	if (isScoutFieldPackDataPrompt(lower)) {
		return ['field pack staleness discipline', 'cached Scout trail data', 'pack age status', 'current mile downloaded region', 'source timestamps', 'refresh on Wi-Fi in town', 'weather closures water services stale', 'caution signals not current proof'];
	}
	if (skill.id === 'pretrip' && /\b(?:sign in|log in|login|account|invite-only|invited|cloud sync|backup|restore)\b/u.test(lower)) {
		return ['sign-in and cloud sync discipline', 'invite-only account', 'backup restore', 'cloud sync on Wi-Fi', 'offline Scout local AI separate', 'downloaded field pack model maps docs', 'not emergency safety'];
	}
	if (skill.id === 'pretrip' && /\b(?:model is still downloading|still downloading|model status|download(?:ing)?|not ready|stuck|failed)\b/u.test(lower)) {
		return ['model download status discipline', 'still downloading', 'on-device local AI not ready', 'Wi-Fi power', 'download verification', 'check Scout model status progress ready', 'retry cancel restart stuck failed', 'airplane mode Scout question'];
	}
	if (skill.id !== 'safety') return skill.queryHints;
	if (/\b(?:wrong trail mile|wrong mile|enter(?:ed)? .*wrong .*mile|mile .*mistake|mistake .*mile)\b/u.test(lower)) {
		return ['wrong mile recovery discipline', 'current mile profile discipline', 'wrong mile shifts water shelter town terrain bailout', 'correct Current AT mile', 'Settings Edit hike details', 'manual mile update', 'refresh field pack', 're-ask Scout', 'do not make water shelter town safety decisions'];
	}
	if (/\b(?:test|rehearsal|rehearse|try|verify)\b.*\b(?:airplane mode|airplane-mode|offline)\b/u.test(lower)) {
		return ['pretrip offline readiness real rehearsal', 'airplane mode capability boundary', 'charge phone battery bank', 'refresh field pack current mile', 'download local AI model offline maps docs', 'turn on airplane mode relaunch', 'ask Scout water weather offline question', 'cached answers versus live data', 'return online stale safety-critical data'];
	}
	if (/\b(?:airplane mode|airplane-mode|no cell|cell service|without service|without signal|what can (?:you|scout) still answer|what still works|works? offline)\b/u.test(lower)) {
		return ['airplane mode capability boundary', 'cached field pack', 'on-device local AI model', 'saved offline maps docs', 'Bible text', 'fresh weather', 'official closures', 'cloud sync', 'live tramily location', 'stale cached data'];
	}
	if (
		/documents|personal documents|offline documents|information|insurance|emergency contacts|itinerary|permits|reservations|day one/u.test(lower)
	) {
		return ['offline documents', 'personal documents', 'insurance', 'emergency contacts', 'itinerary', 'permits', 'reservations', 'sensitive numbers'];
	}
	if (/check-ins|check ins|check-in|family|miss one|missed check-in|miss a check-in/u.test(lower)) {
		return ['family check-ins', 'missed contact', 'escalation window', 'emergency contacts', 'itinerary', 'live location'];
	}
	if (/first aid|first-aid|blister|blisters|wound|wounds|infection|injury|hurt|pain|knee|ankle|rolled|symptoms|medical|sick/u.test(lower)) {
		return ['first aid', 'blisters', 'wound basics', 'infection warning', 'injury', 'knee pain', 'joint pain', 'do not train through pain', 'clinician', 'physical therapist', 'stop if pain worsens', 'bailout'];
	}
	return skill.queryHints;
}

function isScoutFieldPackDataPrompt(prompt: string): boolean {
	const mentionsScoutDataPack = /\b(?:field[-\s]?pack|scout\s+pack|cached\s+(?:trail\s+)?pack|trail\s+data\s+pack)\b/u.test(prompt);
	const asksFreshness = /\b(?:stale|fresh|current|trust|age|status|refresh|old|outdated|valid|expired)\b/u.test(prompt);
	return mentionsScoutDataPack && asksFreshness;
}

function shouldSkipToolTrigger(trigger: ToolTrigger, prompt: string): boolean {
	return trigger.toolId === 'loadout_check' && isScoutFieldPackDataPrompt(prompt);
}

function firstSourceDocumentId(record: ToolInvocationRecord): string | null {
	return record.sourceDocumentIds?.find((id) => typeof id === 'string' && id.trim().length > 0) ?? null;
}

async function openFirstSourceDocument(
	record: ToolInvocationRecord,
	sourceSkill: string,
	registry: ToolRegistry,
	ctx: ToolContext,
	openedSourceDocuments: Set<string>
): Promise<ToolInvocationRecord | null> {
	const documentId = firstSourceDocumentId(record);
	if (!documentId || openedSourceDocuments.has(documentId)) return null;
	const openSourceDoc = registry.get('open_source_doc');
	if (!openSourceDoc) return null;

	openedSourceDocuments.add(documentId);
	return openSourceDoc.run({ documentId, sourceSkill }, ctx);
}

export async function runToolsFor(
	prompt: string,
	pack: ContextPack,
	registry: ToolRegistry,
	now: Date
): Promise<ToolInvocationRecord[]> {
	const lower = prompt.toLowerCase();
	const ctx: ToolContext = { pack, now };
	const invocations: ToolInvocationRecord[] = [];
	const fired = new Set<string>();
	const openedSourceDocuments = new Set<string>();

	for (const trigger of TOOL_TRIGGERS) {
		if (shouldSkipToolTrigger(trigger, lower) || !promptMatchesAnyKeyword(lower, trigger.keywords) || fired.has(trigger.toolId)) {
			continue;
		}

		const tool = registry.get(trigger.toolId);
		if (!tool) continue;

		invocations.push(await tool.run(argsForTrigger(trigger, prompt), ctx));
		fired.add(trigger.toolId);
	}

	const sourceSearch = registry.get('source_search');
	if (sourceSearch) {
		for (const skill of SOURCE_SKILL_TRIGGERS) {
			if (!promptMatchesAnyKeyword(lower, skill.keywords)) continue;
			const sourceRecord = await sourceSearch.run(
				{
					query: sourceSkillQuery(skill, prompt, pack),
					sourceSkill: skill.id
				},
				ctx
			);
			invocations.push(sourceRecord);

			const openedRecord = await openFirstSourceDocument(
				sourceRecord,
				skill.id,
				registry,
				ctx,
				openedSourceDocuments
			);
			if (openedRecord) invocations.push(openedRecord);
		}

		if (invocations.length && !invocations.some((record) => record.toolId === 'source_search')) {
			invocations.push(await sourceSearch.run({ query: prompt }, ctx));
		}
	}

	if (!invocations.length) {
		const currentMile = registry.get('current_mile');
		if (currentMile) invocations.push(await currentMile.run({}, ctx));

		if (sourceSearch) invocations.push(await sourceSearch.run({ query: prompt }, ctx));
	}

	return invocations;
}
