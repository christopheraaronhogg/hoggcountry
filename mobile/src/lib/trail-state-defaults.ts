import { DEFAULT_HIKE_PROFILE, type HikeProfile } from './scout/hike-profile.ts';
import { isoHoursFromNow } from './safety.ts';
import type { ChatMessage, CheckInRecord, TrailState } from './types.ts';

export const STARTER_MILE = 0;
export const STARTER_DAY_NUMBER = 1;
export const STARTER_OFFLINE_REGION = 'Starter pack - set your AT mile';
export const STARTER_CHECK_IN_NOTE =
	'Starter position only. Set your AT mile before relying on trail-ahead context.';
// Engine-neutral wording on purpose: the iOS shell answers on-device (Gemma),
// the PWA answers via the cloud lane — both answer from the saved field pack, so
// the greeting shouldn't claim one engine. (This module is imported by node:test,
// so it can't pull in the platform check from scout-lane.ts.)
export const SCOUT_STARTER_MESSAGE =
	"I'm Scout — your trail assistant. Ask me about water, shelters, town, or safety and I'll answer from your saved field pack. Mapped water stays low-confidence until you confirm it from a current source or in the field.";

type IdFactory = () => string;

interface TrailStateDefaultsOptions {
	now?: Date;
	id?: IdFactory;
}

function defaultId(): string {
	return crypto.randomUUID();
}

function createDefaultHikeProfile(): HikeProfile {
	return { ...DEFAULT_HIKE_PROFILE };
}

function createStarterMessage(now: Date, id: IdFactory): ChatMessage {
	return {
		id: id(),
		role: 'assistant',
		content: SCOUT_STARTER_MESSAGE,
		timestamp: now.toISOString()
	};
}

function createStarterCheckIn(now: Date, id: IdFactory, ageHours: number): CheckInRecord {
	return {
		id: id(),
		timestamp: new Date(now.getTime() - ageHours * 60 * 60 * 1000).toISOString(),
		location: `Mile ${STARTER_MILE.toFixed(1)}`,
		mile: STARTER_MILE,
		status: 'safe',
		note: STARTER_CHECK_IN_NOTE
	};
}

export function createDefaultTrailState(options: TrailStateDefaultsOptions = {}): TrailState {
	const now = options.now ?? new Date();
	const id = options.id ?? defaultId;

	return {
		activeTab: 'Today',
		hikeProfile: createDefaultHikeProfile(),
		coachMessages: [createStarterMessage(now, id)],
		lastCheckIn: createStarterCheckIn(now, id, 2),
		checkInHistory: [],
		documents: [],
		personalLoadout: [],
		trailPulseReports: [],
		seenTrailPulseReportIds: [],
		privacySettings: {
			stealthMode: true,
			sharePreciseLocation: false,
			allowCoachInsights: false,
			visibleToSupportCircle: true
		},
		trailSettings: {
			autoLogMileage: true,
			waterAlerts: true,
			batterySaver: false,
			lowSignalMode: true,
			offlineRegion: STARTER_OFFLINE_REGION
		},
		trailLogSettings: {
			autoPublish: false,
			footCareLogged: true,
			caloriesLogged: true,
			waterCarryChecked: true,
			stretchingDone: false
		},
		onlineStatus: true,
		syncState: 'synced',
		currentMile: STARTER_MILE,
		dayNumber: STARTER_DAY_NUMBER,
		nextCheckInDueAt: isoHoursFromNow(4, now),
		supportCircle: [],
		lastSyncAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString()
	};
}

export function resetToUncalibratedStarterState(
	state: TrailState,
	options: TrailStateDefaultsOptions = {}
): TrailState {
	const now = options.now ?? new Date();
	const id = options.id ?? defaultId;

	return {
		...state,
		hikeProfile: createDefaultHikeProfile(),
		currentMile: STARTER_MILE,
		dayNumber: STARTER_DAY_NUMBER,
		trailSettings: {
			...state.trailSettings,
			offlineRegion: STARTER_OFFLINE_REGION
		},
		lastCheckIn: createStarterCheckIn(now, id, 0),
		checkInHistory: []
	};
}
