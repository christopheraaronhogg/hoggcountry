import { loadBibleIndex } from '../bible/bible-index.ts';
import type {
	CachedWeather,
	LocalDocumentReference,
	ShelterReference,
	SourceReceipt,
	ToolHandler,
	ToolInvocationRecord,
	TownReference,
	WaterReference
} from './types.ts';

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
	return Boolean(
		text?.toLowerCase().includes('open-data') ||
			text?.toLowerCase().includes('mapped candidate')
	);
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

function hikerDocumentReceipt(document: LocalDocumentReference): SourceReceipt {
	return {
		id: `hiker-doc:${document.id}`,
		title: document.title,
		kind: 'hiker-input',
		citation:
			document.source === 'scout-draft'
				? 'Saved Scout document on this phone'
				: 'Saved hiker document on this phone',
		generatedAt: document.updatedAt
	};
}

function excerptText(text: string, max = 420): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
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

function toolArgs(args: object): Record<string, unknown> {
	return { ...args };
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

interface SourceSearchArgs extends Record<string, unknown> {
	query: string;
}

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
			args: toolArgs(args),
			summary: `Currently at mile ${mile.toFixed(1)} of ${total.toFixed(1)} (${percent.toFixed(1)}% complete, ${remaining.toFixed(1)} mi remaining).`,
			confidence: 'high',
			receipts: [trailPackReceipt('Calibrated AT mile frame', { from: mile })]
		};
	}
};

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
				args: toolArgs(args),
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
			args: toolArgs(args),
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
		const next = nextOnTrail(ctx.pack.shelters, fromMile);

		if (!next) {
			return {
				toolId: 'next_shelter',
				args: toolArgs(args),
				summary: 'No shelter found ahead in the loaded pack.',
				confidence: 'low',
				receipts: [trailPackReceipt('Shelter reference')]
			};
		}

		const distance = next.mile - fromMile;
		const openCandidate = isOpenDataCandidate(next.note);
		return {
			toolId: 'next_shelter',
			args: toolArgs(args),
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
		const next = nextOnTrail(ctx.pack.towns, fromMile);

		if (!next) {
			return {
				toolId: 'next_town',
				args: toolArgs(args),
				summary: 'No town found ahead in the loaded pack.',
				confidence: 'low',
				receipts: [trailPackReceipt('Town reference')]
			};
		}

		const distance = next.mile - fromMile;
		const openCandidate = isOpenDataCandidate(next.access) || isOpenDataCandidate(next.servicesNote);
		return {
			toolId: 'next_town',
			args: toolArgs(args),
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

		const waters = withinMiles(ctx.pack.water, fromMile, span);
		const shelters = withinMiles(ctx.pack.shelters, fromMile, span);
		const towns = withinMiles(ctx.pack.towns, fromMile, span);

		const parts: string[] = [];
		if (waters.length) {
			parts.push(`Water: ${waters.map((w) => `${w.name} (mi ${w.mile.toFixed(1)})`).join(', ')}`);
		}
		if (shelters.length) {
			parts.push(`Shelter: ${shelters.map((s) => `${s.name} (mi ${s.mile.toFixed(1)})`).join(', ')}`);
		}
		if (towns.length) {
			parts.push(`Town: ${towns.map((t) => `${t.name} (mi ${t.mile.toFixed(1)})`).join(', ')}`);
		}

		const summary = parts.length
			? `Next ${span} mi from ${fromMile.toFixed(1)}: ${parts.join(' | ')}`
			: `No landmarks loaded for the next ${span} mi from ${fromMile.toFixed(1)}. Verify from a current source.`;

		return {
			toolId: 'upcoming_terrain',
			args: toolArgs(args),
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
				args: toolArgs(args),
				summary: 'No cached weather available; ask the hiker to refresh from a current source when online.',
				confidence: 'low',
				receipts: [],
				safetyFlags: [
					{
						id: 'weather-missing',
						severity: 'warn',
						message: 'No weather data — confirm before exposed terrain.'
					}
				]
			};
		}

		const ageHours = hoursSince(weather.generatedAt, ctx.now);
		const stale = ageHours > STALE_WEATHER_HOURS;
		const summary = `Cached weather near mile ${weather.mile.toFixed(1)}: ${weather.summary} (high ${weather.highF}F / low ${weather.lowF}F, wind ${weather.windMph} mph).${weather.riskNote ? ' ' + weather.riskNote : ''}`;

		return {
			toolId: 'weather_lookup',
			args: { ...toolArgs(args), fromMile },
			summary,
			confidence: stale ? 'low' : 'medium',
			receipts: [weatherReceipt(weather)],
			safetyFlags:
				weather.windMph >= 20 || weather.lowF <= 25
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
			args: toolArgs(args),
			summary,
			confidence: 'medium',
			receipts: [trailPackReceipt('Loadout reference')]
		};
	}
};

const sourceSearchTool: ToolHandler<SourceSearchArgs> = {
	id: 'source_search',
	description: 'Search the loaded field guide excerpts and saved hiker documents for relevant guidance.',
	run(args, ctx) {
		const query = String(args.query ?? '').trim().toLowerCase();
		if (!query) {
			return {
				toolId: 'source_search',
				args: toolArgs(args),
				summary: 'Empty query.',
				confidence: 'draft',
				receipts: []
			};
		}

		const tokens = query.split(/\s+/).filter((token) => token.length > 2);
		const matches = ctx.pack.guideExcerpts.filter((excerpt) => {
			const haystack = `${excerpt.title} ${excerpt.body} ${excerpt.tags.join(' ')}`.toLowerCase();
			return tokens.some((token) => haystack.includes(token));
		});
		const documentMatches = (ctx.pack.documents ?? []).filter((document) => {
			const haystack = `${document.title} ${document.body}`.toLowerCase();
			return tokens.some((token) => haystack.includes(token));
		});

		if (!matches.length && !documentMatches.length) {
			return {
				toolId: 'source_search',
				args: toolArgs(args),
				summary: 'No field guide excerpts or saved hiker documents match this query in the loaded pack.',
				confidence: 'low',
				receipts: []
			};
		}

		const guideSummary = matches.map((m) => `${m.title}: ${m.body}`);
		const documentSummary = documentMatches.map(
			(document) => `Saved doc - ${document.title}: ${excerptText(document.body)}`
		);
		const summary = [...guideSummary, ...documentSummary].join('\n\n');
		return {
			toolId: 'source_search',
			args: toolArgs(args),
			summary,
			confidence: 'medium',
			receipts: [
				...matches.map((m) => fieldGuideReceipt(m.id, m.title, m.citation)),
				...documentMatches.map((document) => hikerDocumentReceipt(document))
			]
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

interface BibleSearchArgs extends Record<string, unknown> {
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
				args: toolArgs(args),
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
					args: toolArgs(args),
					summary: 'No King James Bible verses matched this query.',
					confidence: 'low',
					receipts: []
				};
			}
			const summary = hits.map((hit) => `${hit.reference} — "${hit.text}"`).join('\n');
			return {
				toolId: 'bible_search',
				args: toolArgs(args),
				summary: `Relevant King James Bible verses (quote with their reference):\n${summary}`,
				confidence: 'high',
				receipts: hits.map((hit) => scriptureReceipt(hit.reference))
			};
		} catch {
			// Asset not loadable (e.g. not yet packaged) — fail soft, never fabricate.
			return {
				toolId: 'bible_search',
				args: toolArgs(args),
				summary: 'The on-device Bible text is not available right now.',
				confidence: 'low',
				receipts: []
			};
		}
	}
};

export const defaultScoutTools: ToolHandler[] = [
	currentMileTool,
	nextWaterTool,
	nextShelterTool,
	nextTownTool,
	upcomingTerrainTool,
	weatherLookupTool,
	loadoutCheckTool,
	sourceSearchTool,
	bibleSearchTool
];
