import { loadBibleIndex } from '../bible/bible-index.ts';
import type {
	CachedWeather,
	LocalDocumentReference,
	ShelterReference,
	SourceReceipt,
	ParkServicesContext,
	ToolHandler,
	ToolInvocationRecord,
	TownReference,
	TrailConditionsContext,
	WaterReference
} from './types.ts';

const STALE_WEATHER_HOURS = 6;
// Closures/detours change less often than weather, but a day-old alert still
// warrants a "re-check" nudge before a hiker commits to a section.
const STALE_CONDITIONS_HOURS = 24;
const SOURCE_SEARCH_LIMIT = 6;
const SOURCE_STOPWORDS = new Set([
	'about', 'after', 'again', 'also', 'and', 'are', 'before', 'but', 'can', 'for',
	'from', 'has', 'have', 'how', 'into', 'near', 'need', 'not', 'now', 'should',
	'tell', 'that', 'the', 'this', 'trail', 'what', 'when', 'where', 'with', 'you'
]);

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
	if (source.reliability === 'seasonal') {
		return [
			{
				id: 'water-seasonal-confirm-flow',
				severity: 'warn',
				message: 'This water source is seasonal; confirm current flow before relying on it, and treat/filter before drinking.'
			}
		];
	}
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

function sourceTokens(query: string): string[] {
	return [...new Set(
		query
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((token) => token.length > 2 && !SOURCE_STOPWORDS.has(token))
	)];
}

function scoreSource(text: string, tokens: string[]): number {
	const haystack = text.toLowerCase();
	let score = 0;
	for (const token of tokens) {
		const index = haystack.indexOf(token);
		if (index === -1) continue;
		score += 2;
		if (index < 160) score += 1;
		const matches = haystack.match(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gu'));
		score += Math.min(matches?.length ?? 0, 4) * 0.25;
	}
	return score;
}

function weatherReceipt(weather: CachedWeather): SourceReceipt {
	return {
		id: 'cached-weather:current',
		title: `Cached weather near mile ${weather.mile.toFixed(1)}`,
		kind: 'cached-weather',
		generatedAt: weather.generatedAt
	};
}

function conditionsReceipt(conditions: TrailConditionsContext): SourceReceipt {
	return {
		id: 'official:trail-conditions',
		title: 'Official trail conditions (NPS + ATC)',
		kind: 'official',
		citation: 'Live NPS park alerts + ATC Trail Updates ingested into the field pack',
		generatedAt: conditions.fetchedAt
	};
}

function parkServicesReceipt(parkServices: ParkServicesContext): SourceReceipt {
	return {
		id: 'official:nps-park-facilities',
		title: 'NPS park facilities',
		kind: 'official',
		citation: `National Park Service visitor centers + campgrounds for ${parkServices.parks.join(', ')}`,
		generatedAt: parkServices.fetchedAt
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

function sourceSkillLabel(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const label = value.trim().replace(/\s+/g, ' ');
	return label ? `${label[0].toUpperCase()}${label.slice(1)} source skill` : null;
}

function describeWaterSource(source: WaterReference, fromMile: number): string {
	const distance = source.mile - fromMile;
	return `${source.name} at mile ${source.mile.toFixed(1)} (${distance.toFixed(1)} mi ahead, ${source.reliability}).${source.note ? ' ' + source.note : ''}`;
}

interface NextWaterArgs {
	fromMile?: number;
	includeSeasonal?: boolean;
	reliabilityPreference?: 'any' | 'reliable';
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

interface TrailConditionsArgs {
	category?: 'closure' | 'detour' | 'fire' | 'caution' | 'info';
}

interface ParkServicesArgs {
	kind?: 'visitor-center' | 'campground';
}

interface LoadoutArgs {
	category?: string;
}

interface SourceSearchArgs extends Record<string, unknown> {
	query: string;
	sourceSkill?: string;
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
		const wantsReliable = args.reliabilityPreference === 'reliable';
		const includeSeasonal = args.includeSeasonal ?? false;
		const nextAny = nextOnTrail(ctx.pack.water, fromMile);
		const nextReliable = nextOnTrail(
			ctx.pack.water.filter((source) => source.reliability === 'reliable'),
			fromMile
		);
		const nextSeasonal = nextOnTrail(
			ctx.pack.water.filter((source) => source.reliability === 'seasonal'),
			fromMile
		);
		const nextPreferred = wantsReliable
			? nextReliable ?? nextSeasonal ?? nextAny
			: includeSeasonal
				? nextOnTrail(
						ctx.pack.water.filter((source) => source.reliability !== 'thin'),
						fromMile
					) ?? nextAny
				: nextAny;

		if (!nextPreferred) {
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

		const parts: string[] = [];
		if (wantsReliable && nextReliable) {
			parts.push(`Next reliable water loaded: ${describeWaterSource(nextReliable, fromMile)}`);
			if (nextAny && nextAny.mile < nextReliable.mile && nextAny.reliability !== 'reliable') {
				parts.push(`Closer unconfirmed water before that: ${describeWaterSource(nextAny, fromMile)}`);
			}
		} else if (wantsReliable && !nextReliable) {
			if (nextSeasonal) {
				parts.push(`Best loaded water source: ${describeWaterSource(nextSeasonal, fromMile)}`);
				if (nextAny && nextAny.mile < nextSeasonal.mile) {
					parts.push(`Closer mapped candidate before that: ${describeWaterSource(nextAny, fromMile)}`);
				}
				parts.push('No reliable water source is loaded ahead in the current field pack.');
			} else {
				parts.push(`Nearest mapped candidate: ${describeWaterSource(nextPreferred, fromMile)}`);
				parts.push('No reliable or seasonal water source is loaded ahead in the current field pack.');
			}
		} else {
			parts.push(`Next loaded water: ${describeWaterSource(nextPreferred, fromMile)}`);
			if (
				nextPreferred.reliability === 'thin' &&
				nextSeasonal &&
				nextSeasonal.mile > nextPreferred.mile
			) {
				parts.push(`Next better-known source after that: ${describeWaterSource(nextSeasonal, fromMile)}`);
			}
		}

		const candidateOnly = nextPreferred.reliability !== 'reliable';
		return {
			toolId: 'next_water',
			args: toolArgs(args),
			summary: parts.join(' '),
			confidence: nextPreferred.reliability === 'reliable' ? 'high' : candidateOnly ? 'low' : 'medium',
			receipts: [trailPackReceipt(`Water: ${nextPreferred.name}`, { from: nextPreferred.mile })],
			safetyFlags: openWaterSafetyFlag(nextPreferred)
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
				confirmations: [
					{
						id: 'weather-missing-confirm-current',
						prompt: 'Refresh or check an official weather source before using this for exposed terrain.',
						reason: 'volatile'
					}
				],
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
			confirmations: stale
				? [
						{
							id: 'weather-stale-confirm-current',
							prompt: 'Cached weather is stale; refresh or check an official weather source before relying on it.',
							reason: 'stale-cache'
						}
					]
				: undefined,
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

const trailConditionsTool: ToolHandler<TrailConditionsArgs> = {
	id: 'trail_conditions',
	description:
		'Return active official closures, detours, fire bans, and hazard alerts near the hiker (from NPS park alerts + ATC Trail Updates). Use for any "is anything closed / detoured / on fire / safe ahead" question.',
	run(args, ctx) {
		const conditions = ctx.pack.conditions ?? null;

		// No live conditions loaded, or checked but none active — return the honest
		// note and a verify-live confirmation; never imply the section is clear.
		if (!conditions || !conditions.items.length) {
			return {
				toolId: 'trail_conditions',
				args: toolArgs(args),
				summary:
					conditions?.note ??
					'No official closure/alert data is loaded in this pack; verify current closures, detours, and fire orders from NPS, USFS, and ATC before remote or exposed sections.',
				confidence: conditions ? 'medium' : 'low',
				receipts: conditions ? [conditionsReceipt(conditions)] : [],
				confirmations: [
					{
						id: 'conditions-verify-live',
						prompt: 'Closures and detours change fast; verify with the managing agency before relying on this.',
						reason: 'volatile'
					}
				]
			};
		}

		const filtered = args.category
			? conditions.items.filter((item) => item.category === args.category)
			: conditions.items;
		const items = (filtered.length ? filtered : conditions.items).slice(0, 6);
		const stale = hoursSince(conditions.fetchedAt, ctx.now) > STALE_CONDITIONS_HOURS;
		const high = items.filter((item) => item.severity === 'high');

		const lines = items.map((item) => {
			const tag = item.severity === 'high' ? '[HIGH] ' : item.severity === 'moderate' ? '[caution] ' : '';
			const where = item.area ? `, ${item.area}` : '';
			const link = item.url ? ` ${item.url}` : '';
			return `${tag}${item.category.toUpperCase()} — ${item.title} (${item.sourceLabel}${where}): ${excerptText(item.summary, 240)}${link}`;
		});

		return {
			toolId: 'trail_conditions',
			args: toolArgs(args),
			summary: `Active official trail conditions (fetched ${conditions.fetchedAt}). Treat as current-but-unconfirmed:\n${lines.join('\n')}`,
			confidence: stale ? 'low' : 'medium',
			receipts: [conditionsReceipt(conditions)],
			confirmations: [
				{
					id: stale ? 'conditions-stale-verify' : 'conditions-verify-live',
					prompt: stale
						? 'This conditions data may be stale; re-check NPS/ATC before relying on a closure or detour.'
						: 'Verify a closure or detour with the managing agency before relying on it.',
					reason: stale ? 'stale-cache' : 'volatile'
				}
			],
			safetyFlags: high.length
				? [
						{
							id: 'trail-closure-active',
							severity: 'warn',
							message: `${high.length} active high-severity closure or fire alert${high.length === 1 ? '' : 's'} near you — confirm an alternate before committing to this section.`
						}
					]
				: undefined
		};
	}
};

const parkServicesTool: ToolHandler<ParkServicesArgs> = {
	id: 'park_services',
	description:
		'Return NPS visitor centers and developed campgrounds for the regulated park sections the AT crosses (info, permits, resupply, legal bail-out/overnight options — NOT the thru-hiker shelter system). Use for "is there a visitor center / ranger station / legal campground in this park" questions.',
	run(args, ctx) {
		const parkServices = ctx.pack.parkServices ?? null;
		if (!parkServices || !parkServices.items.length) {
			return {
				toolId: 'park_services',
				args: toolArgs(args),
				summary:
					parkServices?.note ??
					"No NPS park-facility data is loaded for this section. If you're in a National Park (Smokies, Shenandoah, Harpers Ferry), check the park's site for visitor-center hours and campground reservations.",
				confidence: parkServices ? 'medium' : 'low',
				receipts: parkServices ? [parkServicesReceipt(parkServices)] : []
			};
		}

		const items = (args.kind ? parkServices.items.filter((item) => item.kind === args.kind) : parkServices.items).slice(0, 8);
		const lines = items.map((item) => {
			const label = item.kind === 'visitor-center' ? 'Visitor center' : 'Campground';
			const link = item.reservationUrl ?? item.url;
			return `${label} — ${item.name} (${item.parkLabel}): ${excerptText(item.summary, 200)}${link ? ` ${link}` : ''}`;
		});

		return {
			toolId: 'park_services',
			args: toolArgs(args),
			summary: `NPS facilities for ${parkServices.parks.join(', ')} (info/permits/resupply + legal overnight options, NOT thru-hiker shelters — confirm hours & reservations):\n${lines.join('\n')}`,
			confidence: 'medium',
			receipts: [parkServicesReceipt(parkServices)],
			confirmations: [
				{
					id: 'park-services-verify',
					prompt: 'Confirm current visitor-center hours and campground reservations with the park before relying on them.',
					reason: 'volatile'
				}
			]
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
	description: 'Search the loaded field guide excerpts and saved hiker documents for relevant source-skill guidance.',
	run(args, ctx) {
		const query = String(args.query ?? '').trim().toLowerCase();
		const skillLabel = sourceSkillLabel(args.sourceSkill);
		if (!query) {
			return {
				toolId: 'source_search',
				args: toolArgs(args),
				summary: `${skillLabel ? `${skillLabel}: ` : ''}Empty query.`,
				confidence: 'draft',
				receipts: []
			};
		}

		const tokens = sourceTokens(query);
		if (!tokens.length) {
			return {
				toolId: 'source_search',
				args: toolArgs(args),
				summary: `${skillLabel ? `${skillLabel}: ` : ''}Search query did not include enough specific terms.`,
				confidence: 'draft',
				receipts: []
			};
		}

		const matches = ctx.pack.guideExcerpts
			.map((excerpt) => ({
				excerpt,
				score: scoreSource(`${excerpt.title} ${excerpt.body} ${excerpt.tags.join(' ')}`, tokens)
			}))
			.filter((match) => match.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, SOURCE_SEARCH_LIMIT)
			.map((match) => match.excerpt);
		const documentMatches = (ctx.pack.documents ?? [])
			.map((document) => ({
				document,
				score: scoreSource(`${document.title} ${document.body}`, tokens)
			}))
			.filter((match) => match.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, SOURCE_SEARCH_LIMIT)
			.map((match) => match.document);

		if (!matches.length && !documentMatches.length) {
			return {
				toolId: 'source_search',
				args: toolArgs(args),
				summary: `${skillLabel ? `${skillLabel}: ` : ''}No field guide excerpts or saved hiker documents match this query in the loaded pack.`,
				confidence: 'low',
				receipts: []
			};
		}

		const guideSummary = matches.map((m) => `${m.title}: ${excerptText(m.body)}`);
		const documentSummary = documentMatches.map(
			(document) => `Saved doc - ${document.title}: ${excerptText(document.body)}`
		);
		const summaryBody = [...guideSummary, ...documentSummary].slice(0, SOURCE_SEARCH_LIMIT).join('\n\n');
		const summary = skillLabel ? `${skillLabel}:\n${summaryBody}` : summaryBody;
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
	trailConditionsTool,
	parkServicesTool,
	loadoutCheckTool,
	sourceSearchTool,
	bibleSearchTool
];
