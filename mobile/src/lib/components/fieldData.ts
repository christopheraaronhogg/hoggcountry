// View-model fixtures owned by Lane 2 (mobile field UX). Lane 3 will
// eventually feed these from ScoutRuntime/ContextPackStore. Keep them inside
// the components folder so the polish layer can iterate without touching
// runtime services.

import type { SourceConfidence, SourceReceipt } from './source-receipts';
export type { SourceConfidence, SourceReceipt } from './source-receipts';
export { sourceConfidenceLabels } from './source-receipts';

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

// Static design fixtures only. Runtime source chips must come from
// ContextPack.sourceReceipts so the UI cites the pack actually loaded.
export const sourceReceipts: Record<string, SourceReceipt> = {
	awol2026: {
		id: 'awol2026',
		label: 'Demo guide receipt',
		provider: 'Static UI fixture - not a live guidebook lookup',
		confidence: 'draft',
		freshness: 'Fixture copy',
		verify: 'Use loaded field-pack receipts in production views'
	},
	atc: {
		id: 'atc',
		label: 'Demo trail update receipt',
		provider: 'Static UI fixture - verify current updates online',
		confidence: 'draft',
		freshness: 'Fixture copy',
		verify: 'Use loaded field-pack receipts in production views'
	},
	nws: {
		id: 'nws',
		label: 'Demo NWS receipt',
		provider: 'National Weather Service',
		confidence: 'draft',
		freshness: 'Fixture copy; live forecasts come from field packs'
	},
	farout: {
		id: 'farout',
		label: 'Demo hiker report receipt',
		provider: 'Static hiker-report placeholder',
		confidence: 'draft',
		freshness: 'Fixture copy - verify in field',
		verify: 'Cross-check at next shelter log'
	},
	awol2025: {
		id: 'awol2025',
		label: 'Demo older guide receipt',
		provider: 'Static UI fixture - not a live guidebook lookup',
		confidence: 'draft',
		freshness: 'Fixture copy',
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
		freshness: 'Your own entries'
	}
};

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
