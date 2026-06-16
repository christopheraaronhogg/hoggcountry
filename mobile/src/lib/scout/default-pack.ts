import type { ContextPack } from './types.ts';

const DEFAULT_GENERATED_AT = '2026-06-16T00:00:00.000Z';

export const DEFAULT_CONTEXT_PACK: ContextPack = {
	frame: {
		totalMiles: 2197.4,
		startMile: 0,
		endMile: 2197.4,
		source: 'AWOL 2026 + anchor-calibrated mileposts'
	},
	hiker: {
		trailName: 'Hogg',
		currentMile: 582.4,
		direction: 'NOBO',
		dayNumber: 42,
		targetMilesToday: 13.8
	},
	water: [
		{
			name: 'Lick Creek',
			mile: 586.6,
			reliability: 'reliable',
			note: 'Best fill before the exposed Chestnut Knob ridge.'
		},
		{
			name: 'Spring below Chestnut Knob',
			mile: 589.9,
			reliability: 'seasonal',
			note: 'Usable when present; do not gamble the day on it.'
		}
	],
	shelters: [
		{
			name: 'Chestnut Knob Shelter',
			mile: 589.7,
			capacity: 8,
			note: 'Enclosed structure, exposed to wind on the ridge.'
		},
		{
			name: 'Jenny Knob Shelter',
			mile: 605.7,
			capacity: 6
		}
	],
	towns: [
		{
			name: 'Bland, VA',
			mile: 596.0,
			access: 'US-52 crossing, ~2.5 miles hitch',
			servicesNote: 'Post office, motel, laundry, and resupply.'
		},
		{
			name: 'Pearisburg, VA',
			mile: 632.4,
			access: 'VA-634 crossing, easy hitch',
			servicesNote: 'Walmart resupply, multiple hostels.'
		}
	],
	guideExcerpts: [
		{
			id: 'pack-water-on-ridges',
			title: 'Pack water before ridge sections',
			body: 'Ridge sections in southern VA frequently lose water sources. Top off at the last reliable source before climbing onto a long ridge.',
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
			id: 'cold-wind-risk',
			title: 'Cold wind multiplies fatigue',
			body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
			tags: ['weather', 'safety', 'cold'],
			citation: 'Hogg Country Field Guide, Section: Cold Weather'
		}
	],
	loadout: [
		{ name: 'Durston X-Mid Pro 2', category: 'shelter', weightOz: 19.6, carried: true },
		{ name: 'Enlightened Equipment Revelation 20F', category: 'sleep', weightOz: 22.1, carried: true },
		{ name: 'Hyperlite Southwest 55', category: 'pack', weightOz: 31.5, carried: true },
		{ name: 'Patagonia R1 Hoody', category: 'clothing', weightOz: 13.4, carried: true },
		{ name: 'BRS 3000T stove', category: 'kitchen', weightOz: 0.9, carried: true },
		{ name: 'InReach Mini 2', category: 'safety', weightOz: 3.5, carried: true },
		{ name: 'Anker 10k power bank', category: 'electronics', weightOz: 6.9, carried: true }
	],
	weather: {
		mile: 582.4,
		summary: 'Cold ridge wind with dry afternoon skies',
		highF: 46,
		lowF: 28,
		windMph: 17,
		riskNote: 'Crosswinds plus a soft recovery day make this a poor time to chase lost miles.',
		generatedAt: DEFAULT_GENERATED_AT
	},
	downloadedRegions: ['VA - Southern Highlands', 'TN/NC - Smokies'],
	generatedAt: DEFAULT_GENERATED_AT
};

export function cloneDefaultContextPack(): ContextPack {
	return JSON.parse(JSON.stringify(DEFAULT_CONTEXT_PACK)) as ContextPack;
}
