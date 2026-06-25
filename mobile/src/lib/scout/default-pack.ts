import type { ContextPack } from './types.ts';

const DEFAULT_GENERATED_AT = '2026-06-17T05:11:50.239Z';
const DEFAULT_VALID_UNTIL = '2026-06-22T00:00:00.000Z';

export const DEFAULT_CONTEXT_PACK: ContextPack = {
	frame: {
		totalMiles: 2197.4,
		startMile: 0,
		endMile: 2197.4,
		source: 'AWOL 2026 reference length + neutral Scout starter pack'
	},
	hiker: {
		currentMile: 0,
		direction: 'NOBO',
		dayNumber: 1
	},
	water: [],
	shelters: [],
	towns: [],
	guideExcerpts: [
		{
			id: 'pack-water-on-ridges',
			title: 'Confirm mapped water before committing',
			body: 'Mapped water candidates are planning prompts, not promises. Top off at the last confirmed source before committing to a longer warm-weather push.',
			tags: ['water', 'planning', 'ridge'],
			citation: 'Hogg Country Field Guide, Section: Water Discipline'
		},
		{
			id: 'town-stop-readiness',
			title: 'Town stops are recovery first, logistics second',
			body: 'Treat town as a recovery interval. Calories, foot care, sleep, then logistics. Logistics-first town stops cost mileage two days later.',
			tags: ['town', 'recovery'],
			citation: 'Hogg Country Field Guide, Section: Town Discipline'
		},
		{
			id: 'shelter-camping-discipline',
			title: 'Shelter and camping entries need rule checks',
			body: 'Shelters, campsites, huts, and tent sites are planning candidates until current rules, availability, water, fees, and crowding are checked. In regulated areas, verify the land-manager rule before committing to an overnight plan.',
			tags: ['shelter', 'camping', 'campsite', 'rules'],
			citation: 'Hogg Country Field Guide, Section: Shelter Discipline'
		},
		{
			id: 'loadout-contents-discipline',
			title: 'Read the pack contents before gear advice',
			body: 'Loadout advice starts with what is actually carried, then compares that gear against weather, terrain, water carry, shelter choice, body condition, and next town timing. If pack contents are missing or stale, ask for the specific item or category instead of guessing.',
			tags: ['loadout', 'gear', 'pack', 'safety'],
			citation: 'Hogg Country Field Guide, Section: Gear System'
		},
		{
			id: 'safety-risk-discipline',
			title: 'Safety decisions prefer current checks and safer stops',
			body: 'Closures, fires, high water, injury, bear activity, heat, cold, and bailout decisions need current source checks when online. If Scout cannot verify a live risk, choose the lower-mileage or safer-stop option and name what still needs confirmation.',
			tags: ['safety', 'risk', 'closure', 'bailout'],
			citation: 'Hogg Country Field Guide, Section: Safety and Emergency'
		},
		{
			id: 'cold-wind-risk',
			title: 'Cold wind multiplies fatigue',
			body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
			tags: ['weather', 'safety', 'cold'],
			citation: 'Hogg Country Field Guide, Section: Cold Weather'
		}
	],
	loadout: [],
	weather: null,
	downloadedRegions: ['Starter pack - set your AT mile to fetch trail-ahead data'],
	generatedAt: DEFAULT_GENERATED_AT,
	validUntil: DEFAULT_VALID_UNTIL,
	sourceReceipts: [
		{
			id: 'field-pack:starter',
			title: 'Scout starter offline pack',
			kind: 'trail-pack',
			citation: 'Bundled neutral starter pack; fetch a field pack after setting your mile.',
			generatedAt: DEFAULT_GENERATED_AT,
			miles: { from: 0, to: 0 }
		},
		{
			id: 'field-guide:water-discipline',
			title: 'Water discipline field-guide excerpt',
			kind: 'field-guide',
			citation: 'Hogg Country Field Guide'
		},
		{
			id: 'derived:awol-length',
			title: 'AT reference length',
			kind: 'derived',
			citation: 'AWOL 2026 calibrated reference length',
			miles: { from: 0, to: 2197.4 }
		},
		{
			id: 'derived:generated-mile-caveat',
			title: 'Generated mile caveat',
			kind: 'derived',
			citation: 'Open-reference landmark miles are anchor-calibrated estimates; confirm exact guidebook mileage before safety-critical decisions.'
		}
	],
	pilotNotice:
		'Bundled starter pack only. Set your trail mile or follow the Hogg pilot to download current trail-ahead context; confirm water, weather, services, rules, and access before relying on any pack.'
};

export function cloneDefaultContextPack(): ContextPack {
	return JSON.parse(JSON.stringify(DEFAULT_CONTEXT_PACK)) as ContextPack;
}
