import { browser } from '$app/environment';

import type {
	ChatMessage,
	CheckInRecord,
	CheckInStatus,
	PrivacySettings,
	ReadinessRecommendation,
	SyncState,
	Tab,
	TrailLogSettings,
	TrailSettings,
	TrailState
} from './types';

const STORAGE_KEY = 'hoggcountry:trail-assistant:mobile-prototype:v1';

function isoHoursFromNow(hours: number): string {
	return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function makeMessage(role: ChatMessage['role'], content: string): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role,
		content,
		timestamp: new Date().toISOString()
	};
}

function makeCheckIn(status: CheckInStatus, note: string): CheckInRecord {
	return {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		location: 'Chestnut Knob Shelter',
		mile: 582.4,
		status,
		note
	};
}

const defaultState: TrailState = {
	activeTab: 'Today',
	coachMessages: [
		makeMessage(
			'assistant',
			'Good morning. Trail readiness is holding steady today. If you stay disciplined on water and keep the mileage below 14, you should arrive at Bland with enough recovery margin for a clean town stop.'
		)
	],
	lastCheckIn: {
		id: crypto.randomUUID(),
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		location: 'Lick Creek',
		mile: 578.2,
		status: 'safe',
		note: 'Left camp on time and moving well.'
	},
	checkInHistory: [],
	privacySettings: {
		stealthMode: true,
		sharePreciseLocation: false,
		allowCoachInsights: true,
		visibleToSupportCircle: true
	},
	trailSettings: {
		autoLogMileage: true,
		waterAlerts: true,
		batterySaver: false,
		lowSignalMode: true,
		offlineRegion: 'VA - Southern Highlands'
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
	currentMile: 582.4,
	currentDayMiles: 8.2,
	dayNumber: 42,
	nextCheckInDueAt: isoHoursFromNow(4),
	readiness: {
		score: 84,
		recommendation: 'hold',
		targetMiles: 13.8,
		targetVert: 2600,
		reasons: [
			'Your last two days were above plan and recovery is slightly lagging.',
			'Crosswinds on the ridge will slow you more than the mileage chart suggests.',
			'You still have enough margin to hit Bland on schedule without forcing a big day.'
		]
	},
	supportCircle: [
		{ name: 'Sarah Hogg', role: 'Primary contact', method: 'SMS' },
		{ name: 'Trail Concierge', role: 'Priority support', method: 'In app' },
		{ name: 'Dad', role: 'Family backup', method: 'Call' }
	],
	lastSyncAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
};

type PersistedState = TrailState;

class TrailAssistantStore {
	#state = $state<TrailState>(defaultState);
	#syncTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		if (!browser) return;

		this.#hydrate();
		this.#state.onlineStatus = navigator.onLine;

		window.addEventListener('online', () => {
			this.#state.onlineStatus = true;
			if (this.#state.syncState === 'queued-offline') {
				this.#finishSync('syncing');
			}
		});

		window.addEventListener('offline', () => {
			this.#state.onlineStatus = false;
			if (this.#state.syncState === 'syncing') {
				this.#state.syncState = 'queued-offline';
			}
		});

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#snapshot()));
			});
		});
	}

	#hydrate() {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;

		try {
			const parsed = JSON.parse(raw) as PersistedState;
			this.#state = { ...defaultState, ...parsed };
		} catch (error) {
			console.error('Failed to restore Trail Assistant state', error);
		}
	}

	#snapshot(): PersistedState {
		return {
			activeTab: this.#state.activeTab,
			coachMessages: [...this.#state.coachMessages],
			lastCheckIn: { ...this.#state.lastCheckIn },
			checkInHistory: [...this.#state.checkInHistory],
			privacySettings: { ...this.#state.privacySettings },
			trailSettings: { ...this.#state.trailSettings },
			trailLogSettings: { ...this.#state.trailLogSettings },
			onlineStatus: this.#state.onlineStatus,
			syncState: this.#state.syncState,
			currentMile: this.#state.currentMile,
			currentDayMiles: this.#state.currentDayMiles,
			dayNumber: this.#state.dayNumber,
			nextCheckInDueAt: this.#state.nextCheckInDueAt,
			readiness: { ...this.#state.readiness },
			supportCircle: [...this.#state.supportCircle],
			lastSyncAt: this.#state.lastSyncAt
		};
	}

	#finishSync(nextState: SyncState) {
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#state.syncState = nextState;

		this.#syncTimer = setTimeout(() => {
			this.#state.syncState = this.#state.onlineStatus ? 'synced' : 'queued-offline';
			this.#state.lastSyncAt = new Date().toISOString();
		}, nextState === 'syncing' ? 1300 : 0);
	}

	#coachReplyFor(text: string): string {
		const lower = text.toLowerCase();
		const recommendation = this.#state.readiness.recommendation;

		if (lower.includes('water')) {
			return 'Next reliable water is 4.2 miles ahead at Lick Creek. I would top off there because the ridge after it can dry out by late afternoon.';
		}

		if (lower.includes('town') || lower.includes('shuttle') || lower.includes('hostel')) {
			return 'Bland is still the cleanest town stop. Big Walker Motel and the post office both fit your arrival window if you keep today under 14 miles.';
		}

		if (lower.includes('miles') || lower.includes('push') || lower.includes('hold') || lower.includes('nero')) {
			return `Today is a ${recommendation} day. I would cap this at ${this.#state.readiness.targetMiles.toFixed(1)} miles and avoid turning it into a make-up push.`;
		}

		if (lower.includes('safety') || lower.includes('check-in') || lower.includes('risk')) {
			return 'Your missed check-in risk is still manageable, but the safe window closes in about four hours. Send a quick check-in before the next long ridge section.';
		}

		if (lower.includes('gear') || lower.includes('feet') || lower.includes('blister')) {
			return 'Because your recovery is a little soft today, I would treat foot care like a hard requirement at the next water stop instead of waiting for camp.';
		}

		return 'I can help with mileage, water, town timing, resupply, gear triage, or safety. Give me the hard constraint and I will turn it into the next best move.';
	}

	get activeTab() {
		return this.#state.activeTab;
	}

	set activeTab(tab: Tab) {
		this.#state.activeTab = tab;
	}

	get coachMessages() {
		return this.#state.coachMessages;
	}

	get lastCheckIn() {
		return this.#state.lastCheckIn;
	}

	get checkInHistory() {
		return this.#state.checkInHistory;
	}

	get privacySettings() {
		return this.#state.privacySettings;
	}

	get trailSettings() {
		return this.#state.trailSettings;
	}

	get trailLogSettings() {
		return this.#state.trailLogSettings;
	}

	get onlineStatus() {
		return this.#state.onlineStatus;
	}

	get syncState() {
		return this.#state.syncState;
	}

	get currentMile() {
		return this.#state.currentMile;
	}

	get currentDayMiles() {
		return this.#state.currentDayMiles;
	}

	get dayNumber() {
		return this.#state.dayNumber;
	}

	get nextCheckInDueAt() {
		return this.#state.nextCheckInDueAt;
	}

	get readiness() {
		return this.#state.readiness;
	}

	get supportCircle() {
		return this.#state.supportCircle;
	}

	get lastSyncAt() {
		return this.#state.lastSyncAt;
	}

	get milesRemainingToday() {
		return Math.max(0, this.#state.readiness.targetMiles - this.#state.currentDayMiles);
	}

	get progressPercent() {
		return Math.min(100, (this.#state.currentDayMiles / this.#state.readiness.targetMiles) * 100);
	}

	get missedCheckInRisk() {
		const hoursUntilDue =
			(new Date(this.#state.nextCheckInDueAt).getTime() - Date.now()) / (60 * 60 * 1000);

		if (!this.#state.onlineStatus && hoursUntilDue < 1.5) return 'high';
		if (hoursUntilDue < 2) return 'medium';
		return 'low';
	}

	get readinessTone() {
		const tones: Record<ReadinessRecommendation, string> = {
			push: 'push',
			steady: 'steady',
			hold: 'hold',
			nero: 'nero',
			zero: 'zero'
		};

		return tones[this.#state.readiness.recommendation];
	}

	get syncLabel() {
		if (this.#state.syncState === 'queued-offline') return 'Queued offline';
		if (this.#state.syncState === 'syncing') return 'Syncing now';
		return 'Synced';
	}

	sendCoachMessage(content: string) {
		const trimmed = content.trim();
		if (!trimmed) return;

		this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('user', trimmed)];

		const reply = this.#coachReplyFor(trimmed);
		const delay = this.#state.onlineStatus ? 650 : 180;

		setTimeout(() => {
			this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', reply)];
		}, delay);
	}

	runQuickPrompt(prompt: string) {
		this.sendCoachMessage(prompt);
	}

	performCheckIn(status: CheckInStatus, note: string) {
		const label: Record<CheckInStatus, string> = {
			safe: note || 'Still on plan and moving well.',
			delayed: note || 'Taking a lighter day and protecting recovery.',
			'need-help': note || 'Need human review on the next move.'
		};

		const record = makeCheckIn(status, label[status]);
		this.#state.lastCheckIn = record;
		this.#state.checkInHistory = [record, ...this.#state.checkInHistory].slice(0, 6);
		this.#state.nextCheckInDueAt = isoHoursFromNow(status === 'need-help' ? 1 : 4);

		if (this.#state.onlineStatus) {
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}
	}

	updatePrivacy(patch: Partial<PrivacySettings>) {
		this.#state.privacySettings = { ...this.#state.privacySettings, ...patch };
	}

	updateTrailSetting<K extends keyof TrailSettings>(key: K, value: TrailSettings[K]) {
		this.#state.trailSettings = { ...this.#state.trailSettings, [key]: value };
	}

	updateTrailLogSetting<K extends keyof TrailLogSettings>(key: K, value: TrailLogSettings[K]) {
		this.#state.trailLogSettings = { ...this.#state.trailLogSettings, [key]: value };
	}
}

export const trailAssistant = new TrailAssistantStore();
