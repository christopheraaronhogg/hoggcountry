// View-model fixtures owned by Lane 2 (mobile field UX). Lane 3 will
// eventually feed these from ScoutRuntime/ContextPackStore. Keep them inside
// the components folder so the polish layer can iterate without touching
// runtime services.

export type SourceConfidence = 'high' | 'medium' | 'low' | 'draft';

export interface SourceReceipt {
	id: string;
	label: string;
	provider: string;
	confidence: SourceConfidence;
	freshness: string;
	verify?: string;
}

export type TerrainKind = 'climb' | 'descent' | 'ridge' | 'gap' | 'bald' | 'creek';

export interface ElevationPoint {
	mile: number;
	elevation: number;
	terrain?: TerrainKind;
	label?: string;
}

export type ServiceKind =
	| 'water'
	| 'shelter'
	| 'town'
	| 'view'
	| 'road'
	| 'gap'
	| 'campsite'
	| 'summit';

export interface NextServiceMarker {
	id: string;
	kind: ServiceKind;
	title: string;
	mile: number;
	distanceMiles: number;
	detail: string;
	confidence: SourceConfidence;
	verify?: string;
}

export type OfflineModelStatus = 'ready' | 'updating' | 'partial' | 'cloud-only';

export interface OfflineModelInfo {
	tier: string;
	status: OfflineModelStatus;
	sizeMb: number;
	contextTokens: number;
	lastVerified: string;
	regions: string[];
	note: string;
}

export type PackItemStatus = 'carried' | 'missing' | 'replace' | 'shipped';

export interface PackItem {
	name: string;
	category: 'shelter' | 'sleep' | 'pack' | 'kitchen' | 'water' | 'safety' | 'electronics' | 'worn';
	weightOz: number;
	status: PackItemStatus;
	note?: string;
}

export interface WeatherForecastDay {
	dayLabel: string;
	dateLabel: string;
	highF: number;
	lowF: number;
	windMph: number;
	precipPct: number;
	risk: 'low' | 'medium' | 'high';
	note: string;
}

// Source receipts — every "claim" in the UI should be able to point at one.
export const sourceReceipts: Record<string, SourceReceipt> = {
	awol2026: {
		id: 'awol2026',
		label: 'AT Guide (NOBO 2026 ed.)',
		provider: 'AWOL · The A.T. Guide',
		confidence: 'high',
		freshness: 'Edition pulled 2026-01',
		verify: 'Confirm at last shelter logbook'
	},
	atc: {
		id: 'atc',
		label: 'ATC trail updates',
		provider: 'Appalachian Trail Conservancy',
		confidence: 'high',
		freshness: 'Synced 4h ago',
		verify: 'atctrailupdates.org'
	},
	nws: {
		id: 'nws',
		label: 'NWS forecast',
		provider: 'National Weather Service',
		confidence: 'high',
		freshness: 'Forecast 38m ago'
	},
	farout: {
		id: 'farout',
		label: 'Recent hiker reports',
		provider: 'Trail reports (FarOut user notes)',
		confidence: 'medium',
		freshness: 'Latest 2h ago',
		verify: 'Cross-check at next shelter log'
	},
	awol2025: {
		id: 'awol2025',
		label: 'AT Guide (2025)',
		provider: 'AWOL — superseded edition',
		confidence: 'medium',
		freshness: 'Older edition; mileposts re-calibrated',
		verify: 'Treat as backup only'
	},
	scoutLocal: {
		id: 'scoutLocal',
		label: 'On-device Scout',
		provider: 'Gemma 4 · local field pack',
		confidence: 'medium',
		freshness: 'Field pack rev 2026-06-14'
	},
	hikerProfile: {
		id: 'hikerProfile',
		label: 'Your own log',
		provider: 'Personal pace + recovery history',
		confidence: 'medium',
		freshness: 'Logged 2h ago'
	}
};

// Elevation profile for the next ~20 miles. Hand-shaped to match Southern
// Virginia ridge work above Bland. Numbers are illustrative, not surveyed.
export const elevationNext20: ElevationPoint[] = [
	{ mile: 582.4, elevation: 3120, terrain: 'gap', label: 'You' },
	{ mile: 583.7, elevation: 3360, terrain: 'climb', label: 'High Ledge' },
	{ mile: 584.6, elevation: 3490, terrain: 'ridge' },
	{ mile: 585.4, elevation: 3270, terrain: 'descent' },
	{ mile: 586.6, elevation: 3050, terrain: 'creek', label: 'Lick Creek' },
	{ mile: 587.5, elevation: 3380, terrain: 'climb' },
	{ mile: 588.6, elevation: 3970, terrain: 'climb' },
	{ mile: 589.7, elevation: 4030, terrain: 'bald', label: 'Chestnut Knob' },
	{ mile: 590.8, elevation: 3640, terrain: 'descent' },
	{ mile: 592.0, elevation: 3110, terrain: 'gap' },
	{ mile: 593.4, elevation: 3320, terrain: 'climb' },
	{ mile: 594.6, elevation: 3050, terrain: 'descent' },
	{ mile: 596.0, elevation: 2620, terrain: 'gap', label: 'Bland / US-52' },
	{ mile: 597.3, elevation: 2860, terrain: 'climb' },
	{ mile: 598.8, elevation: 3140, terrain: 'ridge' },
	{ mile: 600.2, elevation: 3380, terrain: 'climb' },
	{ mile: 601.6, elevation: 3220, terrain: 'descent' },
	{ mile: 602.4, elevation: 2940, terrain: 'gap', label: 'Jenny Knob' }
];

export const nextServices: NextServiceMarker[] = [
	{
		id: 'view-high-ledge',
		kind: 'view',
		title: 'High Ledge',
		mile: 583.7,
		distanceMiles: 1.3,
		detail: 'Morale stop. Wind exposed — chill risk if you linger.',
		confidence: 'high'
	},
	{
		id: 'water-lick-creek',
		kind: 'water',
		title: 'Lick Creek',
		mile: 586.6,
		distanceMiles: 4.2,
		detail: 'Last reliable fill before the Chestnut Knob ridge.',
		confidence: 'high',
		verify: 'Confirm flow with passing NOBOs'
	},
	{
		id: 'shelter-chestnut-knob',
		kind: 'shelter',
		title: 'Chestnut Knob Shelter',
		mile: 589.7,
		distanceMiles: 7.3,
		detail: 'Stone hut on the bald. Exposed in wind — bring fuel headroom.',
		confidence: 'high'
	},
	{
		id: 'road-us52',
		kind: 'road',
		title: 'US-52 crossing',
		mile: 596.0,
		distanceMiles: 13.6,
		detail: 'Hitch lane into Bland. Best 11a–3p.',
		confidence: 'high',
		verify: 'Check shuttle board day-of'
	},
	{
		id: 'town-bland',
		kind: 'town',
		title: 'Bland, VA',
		mile: 596.0,
		distanceMiles: 13.6,
		detail: 'Clean resupply + reset. PO closes 16:30.',
		confidence: 'high',
		verify: 'Hours change in shoulder season'
	},
	{
		id: 'campsite-jenny-knob',
		kind: 'campsite',
		title: 'Jenny Knob Shelter',
		mile: 602.4,
		distanceMiles: 20.0,
		detail: 'Backup site if Bland turns into a late bailout.',
		confidence: 'medium',
		verify: 'Latest report 9d ago'
	}
];

export const offlineModel: OfflineModelInfo = {
	tier: 'Scout · Gemma 4 (compact)',
	status: 'ready',
	sizeMb: 1840,
	contextTokens: 8000,
	lastVerified: '2026-06-15T14:08:00Z',
	regions: ['VA — Southern Highlands', 'VA — Pearisburg → Catawba'],
	note: 'Answers compose locally. Cloud Scout refines with live weather + ATC alerts when you have signal.'
};

export const packInventory: PackItem[] = [
	{ name: 'Hyperlite 2400 Southwest', category: 'pack', weightOz: 34, status: 'carried' },
	{ name: 'Zpacks Plex Solo', category: 'shelter', weightOz: 14.2, status: 'carried' },
	{ name: 'EE Revelation 20°F', category: 'sleep', weightOz: 22, status: 'carried' },
	{ name: 'NeoAir XLite', category: 'sleep', weightOz: 13, status: 'carried' },
	{ name: 'BRS-3000T stove', category: 'kitchen', weightOz: 0.9, status: 'carried' },
	{
		name: 'IsoPro canister (110g)',
		category: 'kitchen',
		weightOz: 7.8,
		status: 'replace',
		note: 'Half empty — swap in Bland'
	},
	{
		name: 'Sawyer Squeeze',
		category: 'water',
		weightOz: 3,
		status: 'carried',
		note: 'Backflush before the dry ridge'
	},
	{ name: 'CNOC 2L dirty bag', category: 'water', weightOz: 2.6, status: 'carried' },
	{
		name: 'Garmin inReach Mini 2',
		category: 'safety',
		weightOz: 3.5,
		status: 'carried',
		note: 'Battery 68% — top up in Bland'
	},
	{ name: 'Headlamp NU25', category: 'electronics', weightOz: 1.6, status: 'carried' },
	{
		name: 'Spare warm beanie',
		category: 'worn',
		weightOz: 1.4,
		status: 'missing',
		note: 'Lost at Helveys Mill — ship to Pearisburg PO'
	},
	{
		name: 'Trail runner refresh',
		category: 'worn',
		weightOz: 22,
		status: 'shipped',
		note: 'Box waiting at Big Walker Motel'
	}
];

export const weatherForecast: WeatherForecastDay[] = [
	{
		dayLabel: 'Today',
		dateLabel: 'Wed 11',
		highF: 46,
		lowF: 28,
		windMph: 17,
		precipPct: 10,
		risk: 'medium',
		note: 'Cold ridge wind. Layer for High Ledge stop.'
	},
	{
		dayLabel: 'Thu',
		dateLabel: 'Mar 12',
		highF: 52,
		lowF: 34,
		windMph: 9,
		precipPct: 20,
		risk: 'low',
		note: 'Clearing. Good Bland day.'
	},
	{
		dayLabel: 'Fri',
		dateLabel: 'Mar 13',
		highF: 58,
		lowF: 36,
		windMph: 6,
		precipPct: 5,
		risk: 'low',
		note: 'Mild. Nero out of town.'
	},
	{
		dayLabel: 'Sat',
		dateLabel: 'Mar 14',
		highF: 61,
		lowF: 42,
		windMph: 8,
		precipPct: 30,
		risk: 'medium',
		note: 'Afternoon showers possible. Push earlier.'
	},
	{
		dayLabel: 'Sun',
		dateLabel: 'Mar 15',
		highF: 64,
		lowF: 44,
		windMph: 11,
		precipPct: 55,
		risk: 'medium',
		note: 'Wet day. Mind footing on rocks.'
	}
];

export const packTotalCarriedLb = Number(
	(
		packInventory
			.filter((item) => item.status === 'carried' || item.status === 'replace')
			.reduce((total, item) => total + item.weightOz, 0) / 16
	).toFixed(1)
);

export const packMissingCount = packInventory.filter((item) => item.status === 'missing').length;

export const itineraryConfidence: Record<string, { confidence: SourceConfidence; verify?: string }> = {
	Wed: { confidence: 'high' },
	Thu: { confidence: 'high', verify: 'Confirm motel availability' },
	Fri: { confidence: 'medium' },
	Sat: { confidence: 'medium', verify: 'Recovery + weather pivot point' },
	Sun: { confidence: 'medium', verify: 'Storm window risk' },
	Mon: { confidence: 'low', verify: 'Driven by Sun weather outcome' },
	Tue: { confidence: 'draft', verify: 'Re-plan from Pearisburg' }
};

export const sourceConfidenceLabels: Record<SourceConfidence, string> = {
	high: 'Verified',
	medium: 'Likely',
	low: 'Soft',
	draft: 'Unverified'
};
