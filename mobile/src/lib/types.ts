export type Tab = 'Today' | 'Plan' | 'Coach' | 'Town' | 'Safety' | 'Account';

export type ReadinessRecommendation = 'push' | 'steady' | 'hold' | 'nero' | 'zero';
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
	rawLatitude?: number;
	rawLongitude?: number;
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

export interface ReadinessSnapshot {
	score: number;
	recommendation: ReadinessRecommendation;
	targetMiles: number;
	targetVert: number;
	reasons: string[];
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
	coachMessages: ChatMessage[];
	lastCheckIn: CheckInRecord;
	checkInHistory: CheckInRecord[];
	trailPulseReports: TrailConditionReport[];
	seenTrailPulseReportIds: string[];
	privacySettings: PrivacySettings;
	trailSettings: TrailSettings;
	trailLogSettings: TrailLogSettings;
	onlineStatus: boolean;
	syncState: SyncState;
	currentMile: number;
	currentDayMiles: number;
	dayNumber: number;
	nextCheckInDueAt: string;
	readiness: ReadinessSnapshot;
	supportCircle: SupportContact[];
	lastSyncAt: string;
}
