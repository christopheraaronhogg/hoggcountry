import type {
	CachedWeather,
	ContextPack,
	ShelterReference,
	SourceReceipt,
	ToolContext,
	ToolHandler,
	ToolInvocationRecord,
	ToolRegistry,
	TownReference,
	WaterReference
} from './types.ts';
import { loadBibleIndex } from '../bible/bible-index.ts';

const STALE_WEATHER_HOURS = 6;

function trailPackReceipt(title: string, miles?: { from: number; to?: number }): SourceReceipt {
	return {
		id: `trail-pack:${title}`.toLowerCase().replace(/\s+/g, '-'),
		title,
		kind: 'trail-pack',
		citation: 'Hogg Country calibrated AT context pack',
		miles
	};
}

function openWaterSafetyFlag(source: WaterReference): ToolInvocationRecord['safetyFlags'] {
	if (source.reliability === 'reliable') return undefined;
	return [
		{
			id: 'water-candidate-unverified',
			severity: 'warn',
			message: 'This is a mapped water candidate; reliability and potability are unknown until confirmed from a current source or in the field.'
		}
	];
}

function isOpenDataCandidate(text: string | undefined): boolean {
	return Boolean(text?.toLowerCase().includes('open-data') || text?.toLowerCase().includes('mapped candidate'));
}

function openLogisticsSafetyFlag(kind: 'shelter' | 'town'): ToolInvocationRecord['safetyFlags'] {
	return [
		{
			id: `${kind}-candidate-unverified`,
			severity: 'info',
			message: `${kind === 'shelter' ? 'Shelter' : 'Town'} entry is an open-data candidate; verify current status, access, services, fees, and rules before depending on it.`
		}
	];
}

function fieldGuideReceipt(excerptId: string, title: string, citation?: string): SourceReceipt {
	return {
		id: `field-guide:${excerptId}`,
		title,
		kind: 'field-guide',
		citation
	};
}

function weatherReceipt(weather: CachedWeather): SourceReceipt {
	return {
		id: 'cached-weather:current',
		title: `Cached weather near mile ${weather.mile.toFixed(1)}`,
		kind: 'cached-weather',
		generatedAt: weather.generatedAt
	};
}

function nextOnTrail<T extends { mile: number }>(items: T[], fromMile: number): T | null {
	const ahead = items
		.filter((item) => item.mile >= fromMile - 0.01)
		.sort((a, b) => a.mile - b.mile);
	return ahead[0] ?? null;
}

function withinMiles<T extends { mile: number }>(items: T[], fromMile: number, span: number): T[] {
	return items
		.filter((item) => item.mile >= fromMile - 0.01 && item.mile <= fromMile + span)
		.sort((a, b) => a.mile - b.mile);
}

function hoursSince(timestamp: string, now: Date): number {
	const ts = new Date(timestamp).getTime();
	if (Number.isNaN(ts)) return Infinity;
	return (now.getTime() - ts) / (60 * 60 * 1000);
}

interface NextWaterArgs {
	fromMile?: number;
	includeSeasonal?: boolean;
}

interface NextShelterArgs {
	fromMile?: number;
}

interface NextTownArgs {
	fromMile?: number;
}

interface UpcomingTerrainArgs {
	fromMile?: number;
	spanMiles?: number;
}

interface WeatherArgs {
	fromMile?: number;
}

interface LoadoutArgs {
	category?: string;
}

interface SourceSearchArgs {
	query: string;
}

const nextWaterTool: ToolHandler<NextWaterArgs> = {
	id: 'next_water',
	description: 'Return the next loaded water source or mapped candidate ahead of the hiker.',
	run(args, ctx) {
		const fromMile = args.fromMile ?? ctx.pack.hiker.currentMile;
		const includeSeasonal = args.includeSeasonal ?? false;
		const preferredCandidates = ctx.pack.water.filter(
			(source) => includeSeasonal || source.reliability === 'reliable'
		);

		const next = nextOnTrail(preferredCandidates, fromMile) ?? nextOnTrail(ctx.pack.water, fromMile);

		if (!next) {
			return {
				toolId: 'next_water',
				args: { ...args } as Record<string, unknown>,
				summary: 'No water source or mapped water candidate found in the loaded pack ahead of the hiker.',
				confidence: 'low',
				receipts: [trailPackReceipt('Water reference')],
				safetyFlags: [
					{
						id: 'water-gap',
						severity: 'warn',
						message: 'Loaded pack shows no water candidate ahead — confirm from a current source before relying on it.'
					}
				]
			};
		}

		const distance = next.mile - fromMile;
		const candidateOnly = next.reliability !== 'reliable';
		return {
			toolId: 'next_water',
			args: { ...args } as Record<string, unknown>,
			summary: `${next.name} at mile ${next.mile.toFixed(1)} (${distance.toFixed(1)} mi ahead, ${next.reliability}).${next.note ? ' ' + next.note : ''}`,
			confidence: next.reliability === 'reliable' ? 'high' : candidateOnly ? 'low' : 'medium',
			receipts: [trailPackReceipt(`Water: ${next.name}`, { from: next.mile })],
			safetyFlags: openWaterSafetyFlag(next)
		};
	}
};

const nextShelterTool: ToolHandler<NextShelterArgs> = {
	id: 'next_shelter',
	description: 'Return the next shelter ahead of the hiker.',
	run(args, ctx) {
		const fromMile = args.fromMile ?? ctx.pack.hiker.currentMile;
		const next = nextOnTrail(ctx.pack.shelters, fromMile) as ShelterReference | null;

		if (!next) {
			return {
				toolId: 'next_shelter',
				args: { ...args } as Record<string, unknown>,
				summary: 'No shelter found ahead in the loaded pack.',
				confidence: 'low',
				receipts: [trailPackReceipt('Shelter reference')]
			};
		}

		const distance = next.mile - fromMile;
		const openCandidate = isOpenDataCandidate(next.note);
		return {
			toolId: 'next_shelter',
			args: { ...args } as Record<string, unknown>,
			summary: `${next.name} at mile ${next.mile.toFixed(1)} (${distance.toFixed(1)} mi ahead).${next.note ? ' ' + next.note : ''}`,
			confidence: openCandidate ? 'medium' : 'high',
			receipts: [trailPackReceipt(`Shelter: ${next.name}`, { from: next.mile })],
			safetyFlags: openCandidate ? openLogisticsSafetyFlag('shelter') : undefined
		};
	}
};

const nextTownTool: ToolHandler<NextTownArgs> = {
	id: 'next_town',
	description: 'Return the next resupply town ahead of the hiker.',
	run(args, ctx) {
		const fromMile = args.fromMile ?? ctx.pack.hiker.currentMile;
		const next = nextOnTrail(ctx.pack.towns, fromMile) as TownReference | null;

		if (!next) {
			return {
				toolId: 'next_town',
				args: { ...args } as Record<string, unknown>,
				summary: 'No town found ahead in the loaded pack.',
				confidence: 'low',
				receipts: [trailPackReceipt('Town reference')]
			};
		}

		const distance = next.mile - fromMile;
		const openCandidate = isOpenDataCandidate(next.access) || isOpenDataCandidate(next.servicesNote);
		return {
			toolId: 'next_town',
			args: { ...args } as Record<string, unknown>,
			summary: `${next.name} at mile ${next.mile.toFixed(1)} (${distance.toFixed(1)} mi ahead via ${next.access}).${next.servicesNote ? ' ' + next.servicesNote : ''}`,
			confidence: openCandidate ? 'low' : 'medium',
			receipts: [trailPackReceipt(`Town: ${next.name}`, { from: next.mile })],
			safetyFlags: openCandidate ? openLogisticsSafetyFlag('town') : undefined
		};
	}
};

const upcomingTerrainTool: ToolHandler<UpcomingTerrainArgs> = {
	id: 'upcoming_terrain',
	description: 'Summarize landmarks (water, shelter, town) within a span ahead.',
	run(args, ctx) {
		const fromMile = args.fromMile ?? ctx.pack.hiker.currentMile;
		const span = args.spanMiles ?? 20;

		const waters = withinMiles(ctx.pack.water, fromMile, span) as WaterReference[];
		const shelters = withinMiles(ctx.pack.shelters, fromMile, span) as ShelterReference[];
		const towns = withinMiles(ctx.pack.towns, fromMile, span) as TownReference[];

		const parts: string[] = [];
		if (waters.length) parts.push(`Water: ${waters.map((w) => `${w.name} (mi ${w.mile.toFixed(1)})`).join(', ')}`);
		if (shelters.length) parts.push(`Shelter: ${shelters.map((s) => `${s.name} (mi ${s.mile.toFixed(1)})`).join(', ')}`);
		if (towns.length) parts.push(`Town: ${towns.map((t) => `${t.name} (mi ${t.mile.toFixed(1)})`).join(', ')}`);

		const summary = parts.length
			? `Next ${span} mi from ${fromMile.toFixed(1)}: ${parts.join(' | ')}`
			: `No landmarks loaded for the next ${span} mi from ${fromMile.toFixed(1)}. Verify from a current source.`;

		return {
			toolId: 'upcoming_terrain',
			args: { ...args } as Record<string, unknown>,
			summary,
			confidence: parts.length ? 'medium' : 'low',
			receipts: [trailPackReceipt(`Upcoming ${span} mi window`, { from: fromMile, to: fromMile + span })]
		};
	}
};

const weatherLookupTool: ToolHandler<WeatherArgs> = {
	id: 'weather_lookup',
	description: 'Return cached weather and stale-flag confirmations.',
	run(args, ctx) {
		const weather = ctx.pack.weather;
		const fromMile = args.fromMile ?? ctx.pack.hiker.currentMile;

		if (!weather) {
			return {
				toolId: 'weather_lookup',
				args: { ...args } as Record<string, unknown>,
				summary: 'No cached weather available; ask the hiker to refresh from a current source when online.',
				confidence: 'low',
				receipts: [],
				safetyFlags: [
					{ id: 'weather-missing', severity: 'warn', message: 'No weather data — confirm before exposed terrain.' }
				]
			};
		}

		const ageHours = hoursSince(weather.generatedAt, ctx.now);
		const stale = ageHours > STALE_WEATHER_HOURS;
		const summary = `Cached weather near mile ${weather.mile.toFixed(1)}: ${weather.summary} (high ${weather.highF}F / low ${weather.lowF}F, wind ${weather.windMph} mph).${weather.riskNote ? ' ' + weather.riskNote : ''}`;

		return {
			toolId: 'weather_lookup',
			args: { ...(args as Record<string, unknown>), fromMile },
			summary,
			confidence: stale ? 'low' : 'medium',
			receipts: [weatherReceipt(weather)],
			safetyFlags: weather.windMph >= 20 || weather.lowF <= 25
				? [
					{
						id: 'weather-exposure',
						severity: 'warn',
						message: 'Conditions suggest exposure risk on ridges; cap mileage and protect extremities.'
					}
				]
				: undefined
		};
	}
};

const loadoutCheckTool: ToolHandler<LoadoutArgs> = {
	id: 'loadout_check',
	description: 'Summarize what the hiker is carrying, optionally filtered by category.',
	run(args, ctx) {
		const items = args.category
			? ctx.pack.loadout.filter((item) => item.category === args.category)
			: ctx.pack.loadout;

		const carried = items.filter((item) => item.carried);
		const totalOz = carried.reduce((sum, item) => sum + (item.weightOz ?? 0), 0);

		const summary = `${carried.length} items carried${args.category ? ` in ${args.category}` : ''}, total ~${(totalOz / 16).toFixed(1)} lb. ${carried.map((item) => item.name).join('; ')}`;

		return {
			toolId: 'loadout_check',
			args: { ...args } as Record<string, unknown>,
			summary,
			confidence: 'medium',
			receipts: [trailPackReceipt('Loadout reference')]
		};
	}
};

const sourceSearchTool: ToolHandler<SourceSearchArgs> = {
	id: 'source_search',
	description: 'Search the loaded field guide excerpts for relevant guidance.',
	run(args, ctx) {
		const query = String(args.query ?? '').trim().toLowerCase();
		if (!query) {
			return {
				toolId: 'source_search',
				args: { ...args } as Record<string, unknown>,
				summary: 'Empty query.',
				confidence: 'draft',
				receipts: []
			};
		}

		const matches = ctx.pack.guideExcerpts.filter((excerpt) => {
			const haystack = `${excerpt.title} ${excerpt.body} ${excerpt.tags.join(' ')}`.toLowerCase();
			return query.split(/\s+/).some((token) => token.length > 2 && haystack.includes(token));
		});

		if (!matches.length) {
			return {
				toolId: 'source_search',
				args: { ...args } as Record<string, unknown>,
				summary: 'No field guide excerpts match this query in the loaded pack.',
				confidence: 'low',
				receipts: []
			};
		}

		const summary = matches.map((m) => `${m.title}: ${m.body}`).join('\n\n');
		return {
			toolId: 'source_search',
			args: { ...args } as Record<string, unknown>,
			summary,
			confidence: 'medium',
			receipts: matches.map((m) => fieldGuideReceipt(m.id, m.title, m.citation))
		};
	}
};

function scriptureReceipt(reference: string): SourceReceipt {
	return {
		id: `scripture:${reference}`.toLowerCase().replace(/[\s:]+/g, '-'),
		title: reference,
		kind: 'scripture',
		citation: 'King James Bible, Pure Cambridge Edition'
	};
}

interface BibleSearchArgs {
	query: string;
	limit?: number;
}

const bibleSearchTool: ToolHandler<BibleSearchArgs> = {
	id: 'bible_search',
	description:
		'Search the King James Bible (on-device, offline) for verses relevant to a question, so the answer can quote and cite real scripture instead of paraphrasing from memory.',
	async run(args, _ctx) {
		const query = String(args.query ?? '').trim();
		if (!query) {
			return {
				toolId: 'bible_search',
				args: { ...args } as Record<string, unknown>,
				summary: 'Empty query.',
				confidence: 'draft',
				receipts: []
			};
		}

		try {
			const index = await loadBibleIndex();
			const hits = index.search(query, args.limit ?? 4);
			if (!hits.length) {
				return {
					toolId: 'bible_search',
					args: { ...args } as Record<string, unknown>,
					summary: 'No King James Bible verses matched this query.',
					confidence: 'low',
					receipts: []
				};
			}
			const summary = hits.map((hit) => `${hit.reference} — "${hit.text}"`).join('\n');
			return {
				toolId: 'bible_search',
				args: { ...args } as Record<string, unknown>,
				summary: `Relevant King James Bible verses (quote with their reference):\n${summary}`,
				confidence: 'high',
				receipts: hits.map((hit) => scriptureReceipt(hit.reference))
			};
		} catch {
			// Asset not loadable (e.g. not yet packaged) — fail soft, never fabricate.
			return {
				toolId: 'bible_search',
				args: { ...args } as Record<string, unknown>,
				summary: 'The on-device Bible text is not available right now.',
				confidence: 'low',
				receipts: []
			};
		}
	}
};

const currentMileTool: ToolHandler<{ fromMile?: number }> = {
	id: 'current_mile',
	description: 'Report the hiker current trail mile from the calibrated frame.',
	run(args, ctx) {
		const mile = args.fromMile ?? ctx.pack.hiker.currentMile;
		const total = ctx.pack.frame.totalMiles;
		const remaining = total - mile;
		const percent = (mile / total) * 100;

		return {
			toolId: 'current_mile',
			args: { ...args } as Record<string, unknown>,
			summary: `Currently at mile ${mile.toFixed(1)} of ${total.toFixed(1)} (${percent.toFixed(1)}% complete, ${remaining.toFixed(1)} mi remaining).`,
			confidence: 'high',
			receipts: [trailPackReceipt('Calibrated AT mile frame', { from: mile })]
		};
	}
};

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
	return new InMemoryToolRegistry([
		currentMileTool,
		nextWaterTool,
		nextShelterTool,
		nextTownTool,
		upcomingTerrainTool,
		weatherLookupTool,
		loadoutCheckTool,
		sourceSearchTool,
		bibleSearchTool
	] as ToolHandler[]);
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

	const triggers: Array<{ keywords: string[]; toolId: string; args?: Record<string, unknown> }> = [
		{ keywords: ['water', 'spring', 'creek'], toolId: 'next_water' },
		{ keywords: ['shelter', 'camp', 'tent site'], toolId: 'next_shelter' },
		{ keywords: ['town', 'resupply', 'hostel', 'shuttle'], toolId: 'next_town' },
		{ keywords: ['weather', 'wind', 'cold', 'rain', 'storm', 'forecast'], toolId: 'weather_lookup' },
		{ keywords: ['miles', 'push', 'hold', 'pace', 'nero', 'zero', 'next 20'], toolId: 'upcoming_terrain' },
		{ keywords: ['gear', 'pack', 'loadout', 'carry'], toolId: 'loadout_check' },
		{ keywords: ['where am i', 'current mile', 'how far'], toolId: 'current_mile' },
		{
			keywords: [
				'bible', 'scripture', 'verse', 'psalm', 'gospel', 'jesus', 'christ',
				'faith', 'pray', 'prayer', 'lord', 'salvation', 'scriptures', 'god',
				'holy', 'blessing', 'blessed', 'sermon', 'proverb'
			],
			toolId: 'bible_search'
		}
	];

	const fired = new Set<string>();
	for (const trigger of triggers) {
		if (trigger.keywords.some((k) => lower.includes(k)) && !fired.has(trigger.toolId)) {
			const tool = registry.get(trigger.toolId);
			if (tool) {
				// bible_search and source_search need the question itself as their query.
				const args =
					trigger.toolId === 'bible_search'
						? { query: prompt }
						: (trigger.args ?? {});
				const record = await tool.run(args as Record<string, unknown>, ctx);
				invocations.push(record);
				fired.add(trigger.toolId);
			}
		}
	}

	if (!invocations.length) {
		const currentMile = registry.get('current_mile');
		if (currentMile) invocations.push(await currentMile.run({}, ctx));

		const sourceSearch = registry.get('source_search');
		if (sourceSearch) invocations.push(await sourceSearch.run({ query: prompt }, ctx));
	}

	return invocations;
}
