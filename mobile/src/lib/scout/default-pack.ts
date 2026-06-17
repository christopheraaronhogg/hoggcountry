import type { ContextPack } from './types.ts';

const DEFAULT_GENERATED_AT = '2026-06-17T05:11:50.239Z';
const DEFAULT_VALID_UNTIL = '2026-06-22T00:00:00.000Z';

export const DEFAULT_CONTEXT_PACK: ContextPack = {
	frame: {
		totalMiles: 2197.4,
		startMile: 0,
		endMile: 2197.4,
		source: 'AWOL 2026 reference length + Hogg Country Dad pilot pack + Scout AT open-reference slice'
	},
	hiker: {
		trailName: 'Hogg',
		currentMile: 1438,
		direction: 'NOBO',
		dayNumber: 42,
		targetMilesToday: 13.8
	},
	water: [
		{
			name: 'Unnamed mapped stream',
			mile: 1438.4,
			reliability: 'thin',
			note: 'NY - intermittent. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1439,
			reliability: 'thin',
			note: 'NY - intermittent. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1441.5,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Stump Pond Stream',
			mile: 1442,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1444.1,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1444.7,
			reliability: 'thin',
			note: 'NY - intermittent. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Whaley Lake Stream',
			mile: 1446.3,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1447.2,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1449.9,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Burton Brook',
			mile: 1452.6,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Swamp River',
			mile: 1454.5,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		},
		{
			name: 'Unnamed mapped stream',
			mile: 1454.5,
			reliability: 'thin',
			note: 'NY - perennial. Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
		}
	],
	shelters: [
		{
			name: 'Morgan Stewart Memorial Shelter',
			mile: 1442.6,
			note: 'NY. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		},
		{
			name: 'Telephone Pioneers Shelter',
			mile: 1451.6,
			note: 'NY. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		},
		{
			name: 'Wiley Shelter',
			mile: 1460.6,
			note: 'CT. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		},
		{
			name: 'Mt. Algo Lean-to',
			mile: 1472.5,
			note: 'CT. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		},
		{
			name: 'Stewart Hollow Brook Lean-to',
			mile: 1480.7,
			note: 'CT. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		},
		{
			name: 'Pine Swamp Brook Lean-to',
			mile: 1490.9,
			note: 'CT. Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
		}
	],
	towns: [
		{
			name: 'Kent Hills',
			mile: 1440,
			access: 'Open-data settlement candidate (NY - 3.8 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		},
		{
			name: 'Lake Carmel',
			mile: 1440,
			access: 'Open-data settlement candidate (NY - 6.1 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		},
		{
			name: 'Patterson',
			mile: 1444.8,
			access: 'Open-data settlement candidate (NY - 5.5 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		},
		{
			name: 'Beekman',
			mile: 1446,
			access: 'Open-data settlement candidate (NY - 3.0 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		},
		{
			name: 'Lagrangeville',
			mile: 1446,
			access: 'Open-data settlement candidate (NY - 6.8 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		},
		{
			name: 'Pawling',
			mile: 1454.5,
			access: 'Open-data settlement candidate (NY - 2.4 mi off trail)',
			servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
		}
	],
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
		mile: 1438,
		summary: 'Cached pilot weather: cold ridge wind with dry afternoon skies',
		highF: 46,
		lowF: 28,
		windMph: 17,
		riskNote: 'Weather in this pack is cached pilot context; refresh before exposed terrain.',
		generatedAt: '2026-06-16T00:00:00.000Z'
	},
	downloadedRegions: ['Dad trail-ahead 1438.0-1474.0', 'AT open-reference candidates (NY/CT)'],
	generatedAt: DEFAULT_GENERATED_AT,
	validUntil: DEFAULT_VALID_UNTIL,
	sourceReceipts: [
		{
			id: 'field-pack:dad-pilot',
			title: 'Dad pilot mobile field pack',
			kind: 'trail-pack',
			citation: 'Bundled Hogg Country Scout mobile fallback from local field-pack generator',
			generatedAt: DEFAULT_GENERATED_AT,
			miles: { from: 1438, to: 1474 }
		},
		{
			id: 'trail-pack:open-reference-slice',
			title: 'Scout AT open-reference trail-ahead slice',
			kind: 'trail-pack',
			citation: 'Scout full-trail open-reference pack, anchor-calibrated to AWOL 2026 frame',
			generatedAt: DEFAULT_GENERATED_AT,
			miles: { from: 1438, to: 1474 }
		},
		{
			id: 'derived:usgs-water-candidates',
			title: 'Mapped water candidates',
			kind: 'derived',
			citation: 'USGS/NHD public hydrography; reliability and potability unknown',
			miles: { from: 1438, to: 1474 }
		},
		{
			id: 'derived:osm-corridor-candidates',
			title: 'Shelter and town candidates',
			kind: 'derived',
			citation: 'OpenStreetMap contributors, ODbL; mapped candidates, not confirmed logistics',
			miles: { from: 1438, to: 1518 }
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
		'Bundled Dad trail-ahead fallback generated from open-reference candidates. Refresh when the endpoint is available; confirm current water, services, rules, and access before relying on this pack.'
};

export function cloneDefaultContextPack(): ContextPack {
	return JSON.parse(JSON.stringify(DEFAULT_CONTEXT_PACK)) as ContextPack;
}
