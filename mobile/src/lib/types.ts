// Bottom-nav pillars: Today (calm glance dashboard, home) · Scout (chat) · Map ·
// Trail. Settings is a reachable view but NOT a bottom-nav tab (header gear). Gear
// lives as the 4th section inside Trail (Guide · Bible · Docs · Gear) and is
// deep-linked from the Today "packing up?" glance. Old tabs (Plan/Town/Safety/You)
// folded in — see migrateTab().
export type Tab = 'Today' | 'Scout' | 'Map' | 'Trail' | 'Settings';

/** The four bottom-nav pillars, in order. Settings is intentionally absent. */
export const NAV_TABS: readonly Tab[] = ['Today', 'Scout', 'Map', 'Trail'];

/** Maps any previously-persisted tab id onto the new IA so a returning user
 *  doesn't land on a tab that no longer exists. */
export function migrateTab(value: unknown): Tab {
	switch (value) {
		case 'Scout':
		case 'Today':
		case 'Map':
		case 'Trail':
		case 'Settings':
			return value;
		case 'Gear':
			return 'Trail'; // Gear is now a section inside Trail, not its own tab
		case 'Coach':
			return 'Scout';
		case 'Plan':
			return 'Today'; // forward-looking content folded into Today's look-ahead
		case 'Town':
			return 'Map'; // town logistics now live on the map
		case 'Safety':
		case 'Account':
			return 'Settings';
		default:
			return 'Today';
	}
}

import type { HikeProfile } from './scout/hike-profile';
export type { HikeProfile } from './scout/hike-profile';
import type { LoadoutItem } from './scout/types';

export type SyncState = 'synced' | 'syncing' | 'queued-offline';
export type CheckInStatus = 'safe' | 'delayed' | 'need-help';
export type ServiceCategory = 'hostel' | 'shuttle' | 'resupply' | 'gear' | 'food' | 'laundry';
export type TrailPulseChip = 'Rocks' | 'Mud' | 'Blowdown' | 'Water' | 'Crowded' | 'Sketchy' | 'View' | 'Other';
export type TrailPulseSource = 'chip' | 'text' | 'voice';
export type TrailPulseStatus = 'active';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
}

export interface TrailDocument {
	id: string;
	title: string;
	body: string;
	source: 'manual' | 'scout-draft';
	createdAt: string;
	updatedAt: string;
}

export interface CheckInRecord {
	id: string;
	timestamp: string;
	location: string;
	mile: number;
	status: CheckInStatus;
	note: string;
}

export interface TrailConditionReport {
	id: string;
	trailId: string;
	source: TrailPulseSource;
	chipText?: TrailPulseChip;
	noteText: string;
	reporterTrailName?: string;
	snappedMile: number;
	observedAt: string;
	status: TrailPulseStatus;
	createdAt: string;
	syncState: SyncState;
}

export interface PrivacySettings {
	stealthMode: boolean;
	sharePreciseLocation: boolean;
	allowCoachInsights: boolean;
	visibleToSupportCircle: boolean;
}

export interface TrailSettings {
	autoLogMileage: boolean;
	waterAlerts: boolean;
	batterySaver: boolean;
	lowSignalMode: boolean;
	offlineRegion: string;
}

export interface TrailLogSettings {
	autoPublish: boolean;
	footCareLogged: boolean;
	caloriesLogged: boolean;
	waterCarryChecked: boolean;
	stretchingDone: boolean;
}

export interface SupportContact {
	name: string;
	role: string;
	method: string;
	/** Phone number used to build the signal-gated "need help" SMS/call deep links.
	 *  Optional so legacy reference-only contacts still validate. */
	phone?: string;
	email?: string;
}

export interface WaterSource {
	name: string;
	mile: number;
	distanceMiles: number;
	reliability: 'reliable' | 'seasonal' | 'thin';
	note: string;
}

export interface UpcomingStop {
	kind: 'view' | 'water' | 'shelter' | 'town';
	title: string;
	mile: number;
	distanceMiles: number;
	detail: string;
}

export interface ItineraryDay {
	dayLabel: string;
	dateLabel: string;
	status: 'today' | 'planned' | 'town' | 'recovery';
	destination: string;
	mileage: number;
	elevationGain: number;
	weather: string;
	note: string;
}

export interface TownService {
	name: string;
	category: ServiceCategory;
	status: string;
	detail: string;
}

export interface TownSnapshot {
	name: string;
	mile: number;
	eta: string;
	hitchNote: string;
	services: TownService[];
}

export interface WeatherSnapshot {
	highF: number;
	lowF: number;
	windMph: number;
	summary: string;
	riskNote: string;
}

export interface TrailState {
	activeTab: Tab;
	/** The user's own identity + position ("My hike"); never clobbered by a refresh. */
	hikeProfile: HikeProfile;
	coachMessages: ChatMessage[];
	lastCheckIn: CheckInRecord;
	checkInHistory: CheckInRecord[];
	documents: TrailDocument[];
	/** The hiker's personal gear list. User-owned like documents — kept here so a
	 * field-pack refresh never clobbers it; synced into the pack's loadout for Scout. */
	personalLoadout: LoadoutItem[];
	trailPulseReports: TrailConditionReport[];
	seenTrailPulseReportIds: string[];
	privacySettings: PrivacySettings;
	trailSettings: TrailSettings;
	trailLogSettings: TrailLogSettings;
	onlineStatus: boolean;
	syncState: SyncState;
	currentMile: number;
	dayNumber: number;
	nextCheckInDueAt: string;
	supportCircle: SupportContact[];
	lastSyncAt: string;
}
