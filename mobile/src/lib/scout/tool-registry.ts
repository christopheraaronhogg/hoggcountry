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
	{ keywords: ['water', 'spring', 'creek'], toolId: 'next_water' },
	{ keywords: ['shelter', 'camp', 'camping', 'campsite', 'tent site', 'lean-to', 'where sleep'], toolId: 'next_shelter' },
	{ keywords: ['town', 'resupply', 'hostel', 'shuttle', 'outfitter', 'laundry', 'groceries', 'mail drop'], toolId: 'next_town' },
	{ keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'forecast'], toolId: 'weather_lookup' },
	{
		keywords: ['closure', 'closed', 'detour', 'reroute', 'fire', 'burn ban', 'washout', 'bridge out', 'blowdown', 'high water', 'alert'],
		toolId: 'trail_conditions'
	},
	{
		keywords: ['visitor center', 'ranger', 'ranger station', 'campground', 'national park', 'park office', 'wayside', 'permit office'],
		toolId: 'park_services'
	},
	{ keywords: ['miles', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20', 'terrain', 'climb', 'descent', 'elevation'], toolId: 'upcoming_terrain' },
	{ keywords: ['gear', 'pack', 'loadout', 'carry', 'packed', 'base weight', 'rain gear', 'first aid', 'food carry'], toolId: 'loadout_check' },
	{ keywords: ['where am i', 'current mile', 'how far'], toolId: 'current_mile' },
	{
		keywords: [
			'bible',
			'scripture',
			'verse',
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
		keywords: ['water', 'spring', 'creek', 'flow', 'filter', 'hydrate'],
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
		keywords: ['shelter', 'camp', 'camping', 'campsite', 'tent site', 'lean-to', 'hut', 'privy', 'where sleep'],
		queryHints: ['shelter discipline', 'camping', 'capacity', 'rules', 'legal overnight', 'verify current status']
	},
	{
		id: 'town',
		keywords: ['town', 'resupply', 'hostel', 'shuttle', 'laundry', 'groceries', 'outfitter', 'mail drop', 'motel', 'restaurant'],
		queryHints: ['town discipline', 'resupply', 'recovery', 'services', 'access', 'same day confirmation']
	},
	{
		id: 'weather',
		keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'forecast', 'heat'],
		queryHints: ['weather discipline', 'exposure', 'wind', 'cold', 'rain', 'storm', 'verify forecast']
	},
	{
		id: 'trail conditions',
		keywords: ['closure', 'closed', 'detour', 'reroute', 'fire', 'burn ban', 'washout', 'bridge out', 'blowdown', 'high water', 'alert'],
		queryHints: ['trail conditions', 'closures', 'detours', 'hazards', 'official source', 'verify live']
	},
	{
		id: 'safety',
		keywords: ['safety', 'injury', 'hurt', 'pain', 'blister', 'medical', 'sick', 'bear', 'bailout', 'emergency', 'ford', 'flood'],
		queryHints: ['safety discipline', 'body risk', 'bailout', 'emergency boundaries', 'official source', 'choose safer stop']
	},
	{
		id: 'park services',
		keywords: ['visitor center', 'ranger', 'ranger station', 'campground', 'national park', 'park office', 'wayside', 'permit office'],
		queryHints: ['park services', 'visitor center', 'ranger station', 'campground', 'permits', 'hours']
	},
	{
		id: 'terrain',
		keywords: ['miles', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20', 'terrain', 'climb', 'descent', 'elevation'],
		queryHints: ['terrain discipline', 'pace', 'mileage', 'terrain', 'decision point', 'daylight']
	},
	{
		id: 'loadout',
		keywords: ['gear', 'pack', 'loadout', 'carry', 'packed', 'base weight', 'rain gear', 'first aid', 'food carry'],
		queryHints: ['loadout', 'gear', 'pack contents', 'carried items', 'weight', 'safety gear']
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

function sourceSkillQuery(skill: SourceSkillTrigger, prompt: string, pack: ContextPack): string {
	return [
		prompt,
		...skill.queryHints,
		`current mile ${pack.hiker.currentMile.toFixed(1)}`,
		pack.hiker.direction,
		`day ${pack.hiker.dayNumber}`
	].join(' ');
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
		if (!trigger.keywords.some((keyword) => lower.includes(keyword)) || fired.has(trigger.toolId)) {
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
			if (!skill.keywords.some((keyword) => lower.includes(keyword))) continue;
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
	}

	if (!invocations.length) {
		const currentMile = registry.get('current_mile');
		if (currentMile) invocations.push(await currentMile.run({}, ctx));

		if (sourceSearch) invocations.push(await sourceSearch.run({ query: prompt }, ctx));
	}

	return invocations;
}
