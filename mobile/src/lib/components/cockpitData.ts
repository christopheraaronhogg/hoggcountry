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

// Elevation profile for the Dad pilot window near the NY/CT line. Numbers are
// illustrative UI terrain, not surveyed or routing-grade.
export const elevationNext20: ElevationPoint[] = [
	{ mile: 1438.0, elevation: 1220, terrain: 'ridge', label: 'You' },
	{ mile: 1438.4, elevation: 1180, terrain: 'creek' },
	{ mile: 1439.2, elevation: 1320, terrain: 'climb' },
	{ mile: 1440.0, elevation: 1080, terrain: 'gap' },
	{ mile: 1441.5, elevation: 1360, terrain: 'creek' },
	{ mile: 1442.6, elevation: 1610, terrain: 'ridge', label: 'Morgan St.' },
	{ mile: 1444.1, elevation: 1420, terrain: 'creek' },
	{ mile: 1446.8, elevation: 1700, terrain: 'ridge' },
	{ mile: 1449.0, elevation: 1340, terrain: 'gap' },
	{ mile: 1452.2, elevation: 1520, terrain: 'ridge' },
	{ mile: 1454.5, elevation: 980, terrain: 'creek', label: 'Swamp River' },
	{ mile: 1458.0, elevation: 1260, terrain: 'ridge' }
];

export const nextServices: NextServiceMarker[] = [
	{
		id: 'water-1438-4',
		kind: 'water',
		title: 'Mapped stream',
		mile: 1438.4,
		distanceMiles: 0.4,
		detail: 'Open-reference water candidate. Confirm flow and potability before relying on it.',
		confidence: 'low',
		verify: 'Needs field/current-source check'
	},
	{
		id: 'shelter-morgan-stewart',
		kind: 'shelter',
		title: 'Morgan Stewart Memorial Shelter',
		mile: 1442.6,
		distanceMiles: 4.6,
		detail: 'Open-data shelter candidate in the forward window.',
		confidence: 'medium',
		verify: 'Confirm current access/rules'
	},
	{
		id: 'town-kent-hills',
		kind: 'town',
		title: 'Kent Hills',
		mile: 1440.0,
		distanceMiles: 2.0,
		detail: 'Mapped town candidate near trail. Services/hours are not confirmed.',
		confidence: 'low',
		verify: 'Verify services before planning around it'
	},
	{
		id: 'town-pawling',
		kind: 'town',
		title: 'Pawling',
		mile: 1457.9,
		distanceMiles: 19.9,
		detail: 'Known town corridor, but this pack still treats services as candidate-only.',
		confidence: 'low',
		verify: 'Confirm resupply and transit'
	},
	{
		id: 'shelter-wiley',
		kind: 'shelter',
		title: 'Wiley Shelter',
		mile: 1452.2,
		distanceMiles: 14.2,
		detail: 'Later shelter candidate if the day stays controlled.',
		confidence: 'medium',
		verify: 'Confirm current shelter status'
	}
];

export const offlineModel: OfflineModelInfo = {
	tier: 'Scout · Gemma 4 (compact)',
	status: 'partial',
	sizeMb: 1840,
	contextTokens: 8000,
	lastVerified: '2026-06-15T14:08:00Z',
	regions: ['AT NY/CT pilot window', 'Open-reference trail-ahead candidates'],
	note: 'Gemma 4 is the only planned model lane for this Play build. Chat is blocked until the native runtime is installed.'
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
		note: 'Half empty - verify next confirmed fuel option'
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
		note: 'Battery 68% - top up at the next confirmed outlet'
	},
	{ name: 'Headlamp NU25', category: 'electronics', weightOz: 1.6, status: 'carried' },
	{
		name: 'Spare warm beanie',
		category: 'worn',
		weightOz: 1.4,
		status: 'missing',
		note: 'Missing - do not assume the next town can replace it'
	},
	{
		name: 'Trail runner refresh',
		category: 'worn',
		weightOz: 22,
		status: 'shipped',
		note: 'Shipment details need current confirmation'
	}
];

export const weatherForecast: WeatherForecastDay[] = [
	{
		dayLabel: 'Today',
		dateLabel: 'Jun 17',
		highF: 82,
		lowF: 63,
		windMph: 9,
		precipPct: 35,
		risk: 'medium',
		note: 'Humid. Scattered showers possible.'
	},
	{
		dayLabel: 'Thu',
		dateLabel: 'Jun 18',
		highF: 80,
		lowF: 61,
		windMph: 8,
		precipPct: 25,
		risk: 'medium',
		note: 'Warm. Verify water before committing.'
	},
	{
		dayLabel: 'Fri',
		dateLabel: 'Jun 19',
		highF: 78,
		lowF: 59,
		windMph: 7,
		precipPct: 20,
		risk: 'low',
		note: 'Lower precip risk. Still confirm sources.'
	},
	{
		dayLabel: 'Sat',
		dateLabel: 'Jun 20',
		highF: 81,
		lowF: 64,
		windMph: 10,
		precipPct: 40,
		risk: 'medium',
		note: 'Storm chance. Keep bailout margin.'
	},
	{
		dayLabel: 'Sun',
		dateLabel: 'Jun 21',
		highF: 83,
		lowF: 65,
		windMph: 11,
		precipPct: 55,
		risk: 'medium',
		note: 'Wet day. Mind footing on rocks.'
	}
];

// Richer "today" weather for the Today HUD — current conditions + the day's arc.
// Cached/illustrative (NWS-cached shape), same provenance posture as weatherForecast:
// shown as a glance, with a plain-language "what it means" line for safety.
export interface HourlyPrecip {
	label: string; // '11a'
	pct: number; // chance of precip
	peak?: boolean; // the afternoon peak the hiker should plan around
}

export interface TodayWeather {
	nowF: number;
	summary: string; // 'Partly sunny'
	highF: number;
	lowF: number;
	windMph: number;
	windNote?: string; // 'calm'
	precipPeakPct: number;
	precipPeakLabel: string; // '~3p'
	sunsetLabel: string; // '8:30p'
	daylightLeftLabel: string; // '13h 16m left'
	daylightFrac: number; // 0..1 of daylight remaining (for the bar)
	meaning: string; // the plain-language "what it means" line
	hourly: HourlyPrecip[];
	source: string; // 'NWS · cached'
}

export const todayWeather: TodayWeather = {
	nowF: 71,
	summary: 'Partly sunny',
	highF: 82,
	lowF: 63,
	windMph: 9,
	windNote: 'calm',
	precipPeakPct: 60,
	precipPeakLabel: '~3p',
	sunsetLabel: '8:30p',
	daylightLeftLabel: '13h 16m left',
	daylightFrac: 0.88,
	meaning: 'Warm, dry morning — get the climb in before showers build after 2p, then 60% by mid-afternoon. Reach the shelter before the cells.',
	hourly: [
		{ label: '9a', pct: 5 },
		{ label: '11a', pct: 10 },
		{ label: '1p', pct: 30 },
		{ label: '2p', pct: 45 },
		{ label: '3p', pct: 60, peak: true },
		{ label: '5p', pct: 55 },
		{ label: '7p', pct: 20 }
	],
	source: 'NWS · cached'
};

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
	Tue: { confidence: 'draft', verify: 'Re-plan from current field intel' }
};

export const sourceConfidenceLabels: Record<SourceConfidence, string> = {
	high: 'Verified',
	medium: 'Likely',
	low: 'Soft',
	draft: 'Unverified'
};
