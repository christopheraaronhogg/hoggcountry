import { browser } from '$app/environment';

import { migrateTab } from './types';
import type {
	ChatMessage,
	CheckInRecord,
	CheckInStatus,
	PrivacySettings,
	ReadinessRecommendation,
	SyncState,
	Tab,
	TrailConditionReport,
	TrailPulseChip,
	TrailPulseSource,
	TrailLogSettings,
	TrailSettings,
	TrailState
} from './types';
import { publishTrailPulseReport } from './trailPulseSpacetime';
import { createCapacitorPreferencesAdapter, createScoutRuntime, InMemoryContextPackStore } from './scout';
import type { OnDeviceGemmaProvider } from './scout';
import {
	createCapacitorGemmaBridge,
	createCapacitorModelManager,
	type ModelDownloadProgress,
	type NetworkStatus,
	type ScoutGemmaModelStatus,
	type ScoutModelManager
} from './scout/capacitor-gemma-bridge.ts';
import type { ContextPack, ContextPackStatus, ScoutAnswer, ScoutRuntime } from './scout';
import type { PersistenceAdapter } from './scout/context-pack-store.ts';
import type { OnDeviceGemmaBridge } from './scout/providers/on-device-gemma.ts';

const STORAGE_KEY = 'hoggcountry:trail-assistant:mobile-prototype:v1';
const TRAIL_PULSE_RANGE_MILES = 0.1;
const TRAIL_ID = 'appalachian-trail';
const FIELD_PACK_ENDPOINT =
	(import.meta.env.VITE_SCOUT_FIELD_PACK_URL as string | undefined) ??
	'https://hoggcountry.com/scout/field-pack';
const MODEL_POLICY = (import.meta.env.VITE_SCOUT_MODEL_POLICY as string | undefined) ?? 'offline-tools';
const REQUIRE_GEMMA = MODEL_POLICY === 'gemma4-only';

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
		location: 'NY/CT pilot corridor',
		mile: 1438,
		status,
		note
	};
}

function makeTrailPulseReport(input: {
	source: TrailPulseSource;
	chipText?: TrailPulseChip;
	noteText: string;
	reporterTrailName?: string;
	snappedMile: number;
	rawLatitude?: number;
	rawLongitude?: number;
	observedAt?: string;
	syncState?: SyncState;
}): TrailConditionReport {
	const observedAt = input.observedAt ?? new Date().toISOString();

	return {
		id: crypto.randomUUID(),
		trailId: TRAIL_ID,
		source: input.source,
		chipText: input.chipText,
		noteText: input.noteText,
		reporterTrailName: input.reporterTrailName?.trim() || undefined,
		rawLatitude: input.rawLatitude,
		rawLongitude: input.rawLongitude,
		snappedMile: Number(input.snappedMile.toFixed(1)),
		observedAt,
		status: 'active',
		createdAt: observedAt,
		syncState: input.syncState ?? 'synced'
	};
}

let nativePreferencesAdapterPromise: Promise<PersistenceAdapter | null> | null = null;

function isNativeCapacitor(): boolean {
	const capacitorWindow = window as Window & {
		Capacitor?: { isNativePlatform?: () => boolean };
	};

	return capacitorWindow.Capacitor?.isNativePlatform?.() ?? false;
}

async function nativePreferencesAdapter(): Promise<PersistenceAdapter | null> {
	if (!isNativeCapacitor()) return null;
	nativePreferencesAdapterPromise ??= import('@capacitor/preferences')
		.then(({ Preferences }) => createCapacitorPreferencesAdapter(Preferences))
		.catch(() => null);
	return nativePreferencesAdapterPromise;
}

function browserStorageAdapter(): PersistenceAdapter {
	return {
		async get(key: string) {
			const nativeAdapter = await nativePreferencesAdapter();
			if (nativeAdapter) return nativeAdapter.get(key);
			return localStorage.getItem(key);
		},
		async set(key: string, value: string) {
			const nativeAdapter = await nativePreferencesAdapter();
			if (nativeAdapter) return nativeAdapter.set(key, value);
			localStorage.setItem(key, value);
		}
	};
}

function trailPulseDisplayText(report: TrailConditionReport): string {
	const base = report.noteText.trim() || report.chipText || 'Trail note';
	const trailName = report.reporterTrailName?.trim();

	return trailName ? `${base} -${trailName}` : base;
}

const defaultState: TrailState = {
	activeTab: 'Scout',
	coachMessages: [
		makeMessage(
			'assistant',
			'Good morning. Trail readiness is holding steady today. Keep mapped water marked low-confidence until it is confirmed from a current source or in the field.'
		)
	],
	lastCheckIn: {
		id: crypto.randomUUID(),
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		location: 'NY/CT pilot corridor',
		mile: 1438,
		status: 'safe',
		note: 'Using the bundled Dad trail-ahead fallback until a refreshed field pack is saved on this phone.'
	},
	checkInHistory: [],
	trailPulseReports: [
		makeTrailPulseReport({
			source: 'chip',
			chipText: 'Rocks',
			noteText: 'Rocks',
			reporterTrailName: 'Backtrack',
			snappedMile: 1438.4,
			observedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString()
		}),
		makeTrailPulseReport({
			source: 'text',
			chipText: 'Water',
			noteText: 'mapped stream candidate needs field confirmation',
			snappedMile: 1441.5,
			observedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
		})
	],
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
		offlineRegion: 'AT NY/CT pilot window'
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
	currentMile: 1438,
	currentDayMiles: 8.2,
	dayNumber: 42,
	nextCheckInDueAt: isoHoursFromNow(4),
	readiness: {
		score: 84,
		recommendation: 'hold',
		targetMiles: 10.8,
		targetVert: 1700,
		reasons: [
			'Your last two days were above plan and recovery is slightly lagging.',
			'Mapped water in the loaded NY/CT window is candidate-grade and needs current confirmation.',
			'Keep the mileage conservative until the refreshed field pack and real conditions agree.'
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

/** A write-action Scout proposes from chat, rendered as a confirm card. */
type ProposedAction = { id: string; title: string; detail: string; confirmLabel: string };

class TrailAssistantStore {
	#state = $state<TrailState>(defaultState);
	#syncTimer: ReturnType<typeof setTimeout> | null = null;
	#fieldPackStore = new InMemoryContextPackStore({
		adapter: browser ? browserStorageAdapter() : undefined
	});
	#gemmaBridge: OnDeviceGemmaBridge | null = browser ? createCapacitorGemmaBridge() : null;
	#modelManager: ScoutModelManager | null = browser ? createCapacitorModelManager() : null;
	#scout: { runtime: ScoutRuntime; onDeviceProvider: OnDeviceGemmaProvider | undefined } = createScoutRuntime({
		store: this.#fieldPackStore,
		onDeviceBridge: this.#gemmaBridge ?? undefined,
		onDeviceTier: 'balanced'
	});
	#fieldPack = $state.raw<ContextPack>(this.#fieldPackStore.get());
	#fieldPackStatus = $state<ContextPackStatus>(this.#fieldPackStore.getStatus());
	#lastScoutAnswer = $state<ScoutAnswer | null>(null);
	#scoutAnswersByMessage = new Map<string, ScoutAnswer>();
	#modelStatus = $state<ScoutGemmaModelStatus | null>(null);
	#modelDownload = $state<{ bytesDownloaded: number; totalBytes: number } | null>(null);
	#modelError = $state<string | null>(null);
	// Set when a download was requested on a metered (cellular/hotspot) connection
	// and the user has not yet okayed the data cost. The UI shows a confirm; calling
	// downloadModel({ allowMetered: true }) clears it and proceeds.
	#meteredDownloadPrompt = $state<NetworkStatus | null>(null);
	// True while a Scout reply is being generated (on-device inference can take
	// many seconds), so the chat can show a "thinking" indicator instead of
	// looking frozen.
	#scoutThinking = $state(false);
	// A write-action Scout proposed from chat, awaiting explicit user confirm.
	// Scout NEVER mutates trail state without the user confirming this card —
	// the confirm-before-apply gate for "Do" tools.
	#pendingAction = $state<ProposedAction | null>(null);
	#pendingApply: (() => void) | null = null;

	constructor() {
		if (!browser) return;

		this.#hydrate();
		this.#state.onlineStatus = navigator.onLine;
		this.#fieldPackStore.subscribe((pack) => {
			this.#fieldPack = pack;
			this.#applyPackToTrailState(pack);
		});
		this.#fieldPackStore.subscribeStatus((status) => {
			this.#fieldPackStatus = status;
		});
		void this.#loadFieldPack();
		// Re-observe any model download that kept running in the background service
		// while the app was closed (also refreshes status, which may now be ready).
		void this.reconcileDownload();

		window.addEventListener('online', () => {
			this.#state.onlineStatus = true;
			if (this.#state.syncState === 'queued-offline') {
				const queuedReports = this.#state.trailPulseReports.filter((report) => report.syncState === 'queued-offline');
				this.#state.trailPulseReports = this.#state.trailPulseReports.map((report) =>
					report.syncState === 'queued-offline' ? { ...report, syncState: 'syncing' } : report
				);
				for (const report of queuedReports) {
					void this.#syncTrailPulseReport(report);
				}
				this.#finishSync('syncing');
			}
			void this.refreshFieldPack();
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
			// Persisted activeTab may reference a tab that no longer exists after the
			// IA change (Plan/Town/Safety/You) — map it onto the new pillars.
			this.#state.activeTab = migrateTab(this.#state.activeTab);
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
			trailPulseReports: [...this.#state.trailPulseReports],
			seenTrailPulseReportIds: [...this.#state.seenTrailPulseReportIds],
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

	async #loadFieldPack() {
		const pack = await this.#fieldPackStore.load();
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		this.#applyPackToTrailState(pack);
		if (this.#state.onlineStatus) {
			await this.refreshFieldPack();
		}
	}

	#applyPackToTrailState(pack: ContextPack) {
		this.#state.currentMile = pack.hiker.currentMile;
		this.#state.dayNumber = pack.hiker.dayNumber;
		if (pack.hiker.targetMilesToday) {
			this.#state.readiness = {
				...this.#state.readiness,
				targetMiles: pack.hiker.targetMilesToday
			};
		}
		this.#state.trailSettings = {
			...this.#state.trailSettings,
			offlineRegion: pack.downloadedRegions[0] ?? this.#state.trailSettings.offlineRegion
		};
	}

	#finishSync(nextState: SyncState) {
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#state.syncState = nextState;

		this.#syncTimer = setTimeout(() => {
			this.#state.syncState = this.#state.onlineStatus ? 'synced' : 'queued-offline';
			this.#state.trailPulseReports = this.#state.trailPulseReports.map((report) =>
				report.syncState === 'syncing' ? { ...report, syncState: this.#state.syncState } : report
			);
			this.#state.lastSyncAt = new Date().toISOString();
		}, nextState === 'syncing' ? 1300 : 0);
	}

	#coachReplyFor(text: string): string {
		if (REQUIRE_GEMMA) {
			return 'Gemma 4 is required for this Play build, but the on-device model runtime is not available yet. Scout can still show the cached field pack, but chat answers are blocked until the native Gemma 4 bridge is installed.';
		}

		const lower = text.toLowerCase();
		const recommendation = this.#state.readiness.recommendation;

		if (lower.includes('water')) {
			return 'The bundled pack has mapped water candidates ahead, but they are not confirmed reliable or potable. Treat them as low-confidence until refreshed or checked in the field.';
		}

		if (lower.includes('town') || lower.includes('shuttle') || lower.includes('hostel')) {
			return 'The bundled pack has open-data town candidates ahead. Verify services, hours, and access before planning around a stop.';
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

	async #gemmaReady(): Promise<boolean> {
		if (!REQUIRE_GEMMA) return true;
		if (!this.#gemmaBridge) return false;
		return this.#gemmaBridge.isAvailable().catch(() => false);
	}

	#gemmaUnavailableAnswer(): ScoutAnswer {
		return {
			answer: this.#coachReplyFor('gemma unavailable'),
			confidence: 'draft',
			mode: 'on-device',
			provider: 'on-device-gemma',
			receipts: this.#fieldPack.sourceReceipts ?? [],
			toolInvocations: [],
			requiredConfirmations: [
				{
					id: 'gemma4-runtime-required',
					prompt: 'Install and verify the native Gemma 4 LiteRT-LM runtime before submitting this build.',
					reason: 'low-confidence'
				}
			],
			safetyFlags: [
				{
					id: 'chat-blocked-no-local-model',
					severity: 'warn',
					message: 'Scout chat is blocked because this build is configured for Gemma 4 only and no on-device model is available.'
				}
			],
			contextUsed: ['gemma4-only-policy'],
			generatedAt: new Date().toISOString()
		};
	}

	#getCurrentPosition(): Promise<GeolocationPosition | null> {
		if (!browser || !navigator.geolocation) return Promise.resolve(null);

		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => resolve(position),
				() => resolve(null),
				{ enableHighAccuracy: true, maximumAge: 60_000, timeout: 4_000 }
			);
		});
	}

	#snapPositionToTrailMile(_position: GeolocationPosition | null): number {
		return this.#state.currentMile;
	}

	async #syncTrailPulseReport(report: TrailConditionReport) {
		const result = await publishTrailPulseReport(report).catch(() => 'failed' as const);
		const syncState: SyncState = result === 'failed' ? 'queued-offline' : 'synced';

		this.#state.trailPulseReports = this.#state.trailPulseReports.map((candidate) =>
			candidate.id === report.id ? { ...candidate, syncState } : candidate
		);

		if (result !== 'failed') {
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}
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

	/** True while Scout is generating a reply (drives the chat "thinking" indicator). */
	get scoutThinking() {
		return this.#scoutThinking;
	}

	/** A write-action Scout proposed, awaiting the user's Confirm/Cancel (or null). */
	get pendingAction() {
		return this.#pendingAction;
	}

	get lastCheckIn() {
		return this.#state.lastCheckIn;
	}

	get checkInHistory() {
		return this.#state.checkInHistory;
	}

	get trailPulseReports() {
		return this.#state.trailPulseReports;
	}

	get nearbyTrailPulseReports() {
		return this.#state.trailPulseReports
			.filter((report) => report.status === 'active' && Math.abs(this.#state.currentMile - report.snappedMile) <= TRAIL_PULSE_RANGE_MILES)
			.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
	}

	get pendingTrailPulseAlert() {
		return (
			this.nearbyTrailPulseReports.find((report) => !this.#state.seenTrailPulseReportIds.includes(report.id)) ??
			null
		);
	}

	get trailPulseRangeMiles() {
		return TRAIL_PULSE_RANGE_MILES;
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

	get fieldPack() {
		return this.#fieldPack;
	}

	get fieldPackStatus() {
		return this.#fieldPackStatus;
	}

	/** On-device Gemma model file state, or null off-native / before first probe. */
	get modelStatus() {
		return this.#modelStatus;
	}

	/** Live download progress while a model download is in flight, else null. */
	get modelDownload() {
		return this.#modelDownload;
	}

	/** Last model-download error message, cleared when a new download starts. */
	get modelError() {
		return this.#modelError;
	}

	/**
	 * Non-null when a download was requested over a metered (cellular/hotspot)
	 * connection and is awaiting the user's okay on the data cost. The UI shows a
	 * "download over cellular?" confirm; downloadModel({ allowMetered: true })
	 * proceeds, dismissMeteredPrompt() backs out.
	 */
	get meteredDownloadPrompt() {
		return this.#meteredDownloadPrompt;
	}

	/** True when on-device model management is available (native build w/ plugin). */
	get supportsOnDeviceModel() {
		return this.#modelManager !== null;
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

		// "Do" tools: if the message is a write-action intent, Scout PROPOSES the
		// action (a confirm card) instead of just chatting. Nothing is written
		// until the user confirms. Falls through to a normal reply otherwise.
		const proposal = this.#detectActionIntent(trimmed);
		if (proposal) {
			this.#pendingAction = proposal.display;
			this.#pendingApply = proposal.apply;
			this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', proposal.prompt)];
			return;
		}

		void this.#dispatchScoutReply(trimmed);
	}

	/**
	 * Detects a write-action intent in a chat message and returns a proposed
	 * action (display + apply closure + a prompt line), or null for plain chat.
	 * The first "Do" tool is logging a check-in; loadout edits follow the same
	 * shape. Apply is never run here — only on explicit confirm.
	 */
	#detectActionIntent(
		text: string
	): { display: ProposedAction; apply: () => void; prompt: string } | null {
		const lower = text.toLowerCase();
		let status: CheckInStatus | null = null;
		if (/\b(need help|need-help|emergency|injured|hurt|sos|rescue|bailing)\b/.test(lower)) {
			status = 'need-help';
		} else if (/\b(delayed|behind schedule|running late|short day|taking it slow|slowing down|resting up)\b/.test(lower)) {
			status = 'delayed';
		} else if (/\b(check ?in|checking in|i'?m safe|im safe|log me safe|all good|made camp|safe and sound)\b/.test(lower)) {
			status = 'safe';
		}
		if (!status) return null;

		const labels: Record<CheckInStatus, string> = {
			safe: 'Safe',
			delayed: 'Delayed',
			'need-help': 'Need help'
		};
		const confirmed = status;
		const mile = this.#state.currentMile;
		return {
			display: {
				id: crypto.randomUUID(),
				title: `Log a "${labels[confirmed]}" check-in`,
				detail: `Mile ${mile.toFixed(1)} · "${text}"`,
				confirmLabel: 'Log check-in'
			},
			apply: () => this.performCheckIn(confirmed, text),
			prompt: `Want me to log a "${labels[confirmed]}" check-in at mile ${mile.toFixed(1)}? I won't record anything until you confirm below.`
		};
	}

	/** Apply the pending Scout-proposed action (called from the confirm card). */
	confirmPendingAction() {
		const action = this.#pendingAction;
		const apply = this.#pendingApply;
		this.#pendingAction = null;
		this.#pendingApply = null;
		if (!action || !apply) return;
		apply();
		this.#state.coachMessages = [
			...this.#state.coachMessages,
			makeMessage('assistant', `Done — ${action.title.toLowerCase()} recorded. ✓`)
		];
	}

	/** Discard the pending Scout-proposed action without applying it. */
	cancelPendingAction() {
		if (!this.#pendingAction) return;
		this.#pendingAction = null;
		this.#pendingApply = null;
		this.#state.coachMessages = [
			...this.#state.coachMessages,
			makeMessage('assistant', `No problem — I didn't record anything.`)
		];
	}

	async #dispatchScoutReply(prompt: string) {
		const fallbackText = this.#coachReplyFor(prompt);
		this.#scoutThinking = true;

		// Stream tokens into a live-updating assistant bubble. The bubble is only
		// created on the FIRST token, so the "thinking" dots show until words start
		// arriving, then flip straight into the growing answer.
		let streamingId: string | null = null;
		const onToken = (chunk: string) => {
			if (!chunk) return;
			if (streamingId === null) {
				const message = makeMessage('assistant', chunk);
				streamingId = message.id;
				this.#scoutThinking = false;
				this.#state.coachMessages = [...this.#state.coachMessages, message];
			} else {
				const id = streamingId;
				this.#state.coachMessages = this.#state.coachMessages.map((m) =>
					m.id === id ? { ...m, content: m.content + chunk } : m
				);
			}
		};

		try {
			if (!(await this.#gemmaReady())) {
				const answer = this.#gemmaUnavailableAnswer();
				this.#lastScoutAnswer = answer;
				const message = makeMessage('assistant', answer.answer);
				this.#scoutAnswersByMessage.set(message.id, answer);
				this.#state.coachMessages = [...this.#state.coachMessages, message];
				return;
			}

			const answer = await this.#scout.runtime.ask(
				{
					prompt,
					onlineStatus: this.#state.onlineStatus,
					batterySaver: this.#state.trailSettings.batterySaver,
					allowCloud: false,
					preferredMode: REQUIRE_GEMMA ? 'on-device' : undefined
				},
				onToken
			);
			this.#lastScoutAnswer = answer;

			if (streamingId !== null) {
				// Finalize the streamed bubble: snap to the provider's full text and
				// attach receipts/confidence so the source chips render.
				const id = streamingId;
				this.#scoutAnswersByMessage.set(id, answer);
				this.#state.coachMessages = this.#state.coachMessages.map((m) =>
					m.id === id ? { ...m, content: answer.answer } : m
				);
			} else {
				// Provider didn't stream (e.g. deterministic fallback) — append result.
				const message = makeMessage('assistant', answer.answer);
				this.#scoutAnswersByMessage.set(message.id, answer);
				this.#state.coachMessages = [...this.#state.coachMessages, message];
			}
		} catch {
			this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', fallbackText)];
		} finally {
			this.#scoutThinking = false;
		}
	}

	async askScout(prompt: string): Promise<ScoutAnswer> {
		if (!(await this.#gemmaReady())) {
			const answer = this.#gemmaUnavailableAnswer();
			this.#lastScoutAnswer = answer;
			return answer;
		}

		const answer = await this.#scout.runtime.ask({
			prompt,
			onlineStatus: this.#state.onlineStatus,
			batterySaver: this.#state.trailSettings.batterySaver,
			allowCloud: false,
			preferredMode: REQUIRE_GEMMA ? 'on-device' : undefined
		});
		this.#lastScoutAnswer = answer;
		return answer;
	}

	async refreshFieldPack(): Promise<ContextPack> {
		const pack = await this.#fieldPackStore.refreshFromEndpoint(FIELD_PACK_ENDPOINT);
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		this.#applyPackToTrailState(pack);
		this.#state.lastSyncAt = new Date().toISOString();
		return pack;
	}

	/** Refresh the on-device model file status (cheap; no network). */
	async refreshModelStatus(): Promise<ScoutGemmaModelStatus | null> {
		if (!this.#modelManager) return null;
		try {
			this.#modelStatus = await this.#modelManager.getStatus();
		} catch {
			this.#modelStatus = null;
		}
		return this.#modelStatus;
	}

	/**
	 * Download + verify the on-device Gemma model, tracking live progress. The
	 * native side runs the transfer in a foreground service so it survives the app
	 * being backgrounded; this method tracks it while the UI is open and reconciles
	 * on completion.
	 *
	 * Wi-Fi-aware: on a metered (cellular/hotspot) connection it stops and sets
	 * {@link meteredDownloadPrompt} so the UI can warn about the ~2.5GB cost; pass
	 * {@code allowMetered: true} to proceed anyway.
	 */
	async downloadModel(options: { allowMetered?: boolean } = {}): Promise<void> {
		if (!this.#modelManager || this.#modelDownload) return;
		this.#modelError = null;

		// Best-effort: ask for notification permission so the OS shows background
		// progress. Denial is non-fatal — the foreground service still runs.
		await this.#modelManager.requestNotificationsPermission().catch(() => false);

		// Wi-Fi-aware gate. Skip the download (don't burn cellular data) until the
		// user explicitly okays a metered connection.
		const network = await this.#modelManager.getNetworkStatus().catch(() => null);
		if (network && !network.connected) {
			this.#modelError = 'No internet connection. Connect to Wi-Fi to download the model.';
			return;
		}
		if (network?.metered && !options.allowMetered) {
			this.#meteredDownloadPrompt = network;
			return;
		}
		this.#meteredDownloadPrompt = null;

		this.#modelDownload = { bytesDownloaded: 0, totalBytes: this.#modelStatus?.expectedBytes ?? -1 };
		try {
			const status = await this.#modelManager.startDownload((progress: ModelDownloadProgress) => {
				this.#modelDownload = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			this.#modelStatus = status;
			// When the model is now ready, invalidate the cached availability so
			// the router re-probes the native engine on the next Scout turn —
			// without this the on-device path stays dead until the app restarts.
			if (status.state === 'ready') {
				this.#scout.onDeviceProvider?.invalidateAvailability();
			}
		} catch (error) {
			this.#modelError = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshModelStatus();
		} finally {
			this.#modelDownload = null;
		}
	}

	/** Back out of the metered-connection download confirm without downloading. */
	dismissMeteredPrompt(): void {
		this.#meteredDownloadPrompt = null;
	}

	/**
	 * Re-observe a download that may have kept running in the background service
	 * while the app was closed/backgrounded. Call on app resume / when the model UI
	 * mounts: it re-attaches progress + terminal handling if a transfer is still in
	 * flight, and refreshes status (which may now be ready). No-op otherwise.
	 */
	async reconcileDownload(): Promise<void> {
		if (!this.#modelManager) return;
		await this.refreshModelStatus();
		if (this.#modelStatus?.state === 'ready') {
			this.#scout.onDeviceProvider?.invalidateAvailability();
			return;
		}
		if (this.#modelDownload) return; // Already tracking in this session.

		const state = await this.#modelManager.getDownloadState().catch(() => null);
		if (!state?.active) return; // No background download to re-observe.

		// Seed the progress bar from the last known bytes before awaiting terminal.
		this.#modelDownload = { bytesDownloaded: state.bytesDownloaded, totalBytes: state.totalBytes };
		try {
			const status = await this.#modelManager.reattachDownload((progress: ModelDownloadProgress) => {
				this.#modelDownload = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			if (status) {
				this.#modelStatus = status;
				if (status.state === 'ready') {
					this.#scout.onDeviceProvider?.invalidateAvailability();
				}
			} else {
				// Finished between the state check and the re-attach — reconcile.
				await this.refreshModelStatus();
			}
		} catch (error) {
			this.#modelError = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshModelStatus();
		} finally {
			this.#modelDownload = null;
		}
	}

	/** Cancel an in-flight model download; the partial file is kept for resume. */
	async cancelModelDownload(): Promise<void> {
		if (!this.#modelManager) return;
		this.#meteredDownloadPrompt = null;
		await this.#modelManager.cancelDownload();
	}

	get lastScoutAnswer(): ScoutAnswer | null {
		return this.#lastScoutAnswer;
	}

	scoutAnswerFor(messageId: string): ScoutAnswer | null {
		return this.#scoutAnswersByMessage.get(messageId) ?? null;
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

	async submitTrailPulseReport(input: {
		source: TrailPulseSource;
		chipText?: TrailPulseChip;
		noteText?: string;
		reporterTrailName?: string;
	}): Promise<TrailConditionReport | null> {
		const chipText = input.chipText;
		const noteText = (input.noteText?.trim() || chipText || '').trim();
		if (!noteText) return null;

		const position = await this.#getCurrentPosition();
		const report = makeTrailPulseReport({
			source: input.source,
			chipText,
			noteText,
			reporterTrailName: input.reporterTrailName,
			rawLatitude: position?.coords.latitude,
			rawLongitude: position?.coords.longitude,
			snappedMile: this.#snapPositionToTrailMile(position),
			syncState: this.#state.onlineStatus ? 'syncing' : 'queued-offline'
		});

		this.#state.trailPulseReports = [report, ...this.#state.trailPulseReports];

		if (this.#state.onlineStatus) {
			void this.#syncTrailPulseReport(report);
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}

		return report;
	}

	formatTrailPulseReport(report: TrailConditionReport): string {
		return trailPulseDisplayText(report);
	}

	markTrailPulseAlertSeen(reportId: string) {
		if (this.#state.seenTrailPulseReportIds.includes(reportId)) return;
		this.#state.seenTrailPulseReportIds = [reportId, ...this.#state.seenTrailPulseReportIds].slice(0, 120);
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
