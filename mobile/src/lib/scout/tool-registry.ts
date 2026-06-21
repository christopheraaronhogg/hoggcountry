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

const TOOL_TRIGGERS: ToolTrigger[] = [
	{ keywords: ['water', 'spring', 'creek'], toolId: 'next_water' },
	{ keywords: ['shelter', 'camp', 'tent site'], toolId: 'next_shelter' },
	{ keywords: ['town', 'resupply', 'hostel', 'shuttle'], toolId: 'next_town' },
	{ keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'forecast'], toolId: 'weather_lookup' },
	{ keywords: ['miles', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20'], toolId: 'upcoming_terrain' },
	{ keywords: ['gear', 'pack', 'loadout', 'carry'], toolId: 'loadout_check' },
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

function argsForTrigger(trigger: ToolTrigger, prompt: string): Record<string, unknown> {
	if (trigger.toolId === 'bible_search') return { query: prompt };
	return trigger.args ?? {};
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

	for (const trigger of TOOL_TRIGGERS) {
		if (!trigger.keywords.some((keyword) => lower.includes(keyword)) || fired.has(trigger.toolId)) {
			continue;
		}

		const tool = registry.get(trigger.toolId);
		if (!tool) continue;

		invocations.push(await tool.run(argsForTrigger(trigger, prompt), ctx));
		fired.add(trigger.toolId);
	}

	if (!invocations.length) {
		const currentMile = registry.get('current_mile');
		if (currentMile) invocations.push(await currentMile.run({}, ctx));

		const sourceSearch = registry.get('source_search');
		if (sourceSearch) invocations.push(await sourceSearch.run({ query: prompt }, ctx));
	}

	return invocations;
}
