import { browser, version as svelteKitVersion } from '$app/environment';

import type {
	ChatMessage,
	CheckInStatus,
	HikeProfile,
	PrivacySettings,
	SupportContact,
	SyncState,
	Tab,
	TrailConditionReport,
	TrailDocument,
	TrailPulseChip,
	TrailPulseSource,
	TrailLogSettings,
	TrailSettings,
	TrailState
} from './types';
import { publishTrailPulseReport } from './trailPulseSpacetime';
import { resolveModelPolicy } from './scout/model-policy.ts';
import { NativeScoutRuntime } from './scout/native-scout-runtime.ts';
import { getCapacitorScoutInstallSource } from './scout/capacitor-gemma-bridge.ts';
import { NoScoutModelAvailableError } from './scout/model-router.ts';
import { createCloudScoutBridge } from './scout/cloud-scout-bridge.ts';
import { scoutUsesCloud, scoutLaneLabel } from './scout/scout-lane.ts';
import {
	SCOUT_AUTH_WALL_MESSAGE,
	createPendingScoutAuthPrompt,
	type PendingScoutAuthPrompt
} from './scout/scout-auth-resume.ts';
import { deriveModelPhase } from './scout/model-download-phase.ts';
import { cloudAuth } from './cloud/auth.svelte';
import {
	createTrailDocument,
	limitTrailDocuments,
	toContextDocuments,
	updateTrailDocument
} from './local-documents';
import {
	createDefaultTrailState,
	resetToUncalibratedStarterState
} from './trail-state-defaults';
import {
	parsePersistedTrailState,
	snapshotTrailState,
	type PersistedTrailState
} from './trail-state-persistence';
import { syncEngine } from './cloud/syncEngine.svelte';
import {
	prepareQueuedReportsForSync,
	settledSyncState,
	settleSyncingReports,
	syncLabel as formatSyncLabel,
	syncStateAfterOffline,
	syncStateForLocalWrite
} from './sync-state';
import {
	buildFieldPackUrl,
	calibrateHikeProfile,
	deriveDayNumber,
	isDadPilotContextPack,
	isSelfTracked,
	resolvePosition,
	sanitizeContextPackForSelfProfile,
	updateHikeProfileMile,
	type HikeCalibrationInput,
	type HikeProfileTransition,
	type HikeMode,
	type MileSource
} from './scout/hike-profile.ts';
import { detectTrailActionIntent } from './scout/action-intents.ts';
import { cloneDefaultContextPack } from './scout/default-pack.ts';
import {
	runScoutLocalAiEval,
	type ScoutLocalAiEvalProgress,
	type ScoutLocalAiEvalRun,
	type ScoutLocalAiEvalSuite
} from './scout/local-ai-eval.ts';
import {
	loadOfflineSourceDocs,
	mergeOfflineSourceDocs
} from './scout/offline-source-docs.ts';
import { loadTrailGeometry, snapToMile, type TrailGeoPoint } from './trail/trail-geometry';
import { createBrowserGeolocation, TrailPositionService } from './trail-position-service';
import { InMemoryContextPackStore } from './scout';
import type { ContextPack, ContextPackStatus, ScoutAnswer } from './scout';
import type { LoadoutItem } from './scout/types';
import {
	createMobilePersistenceAdapter,
	type PersistenceAdapter
} from './mobile-persistence';
import {
	createTrailPulseReport,
	formatTrailPulseDisplayText,
	markTrailPulseReportSeen,
	nearbyTrailPulseReports,
	pendingTrailPulseAlert,
	TRAIL_PULSE_RANGE_MILES,
	updateTrailPulseSyncState
} from './trail-pulse';
import {
	buildHelpSms as buildHelpSmsLink,
	createCheckInRecord,
	isoHoursFromNow,
	missedCheckInRisk,
	nextCheckInHours,
	normalizeSupportContact,
	reachableSupportContacts,
	removeSupportContactByName
} from './safety';
import {
	actionCancelledChatText,
	actionRecordedChatText,
	appendAssistantStreamChunk,
	appendChatMessage,
	buildScoutConversationHistory,
	setChatMessageContent
} from './chat-transcript';

const STORAGE_KEY = 'hoggcountry:trail-assistant:mobile-prototype:v1';
const FIELD_PACK_ENDPOINT =
	(import.meta.env.VITE_SCOUT_FIELD_PACK_URL as string | undefined) ??
	'https://hoggcountry.com/scout/field-pack';
const MODEL_POLICY = resolveModelPolicy(
	import.meta.env.VITE_SCOUT_MODEL_POLICY as string | undefined,
	Boolean(import.meta.env.DEV)
);
const REQUIRE_GEMMA = MODEL_POLICY === 'gemma4-only';

// The PWA (app.hoggcountry.com) can't run on-device Gemma — there's no native
// plugin in a browser — so it routes Scout prompts to the cloud lane instead
// (Laravel /scout/ask → OpenAI). The iOS shell stays pure on-device. The cloud
// endpoint is auth-gated, so this only answers when signed in as an invited
// account (Dad). Single source of truth lives in scout/scout-lane.ts.
const CLOUD_SCOUT_ENABLED = scoutUsesCloud;
const WEATHER_PROMPT_RE = /\b(weather|forecast|storm|rain|snow|ice|wind|thunder|lightning|heat|cold|hypothermia|exposed|ridge)\b/iu;

// Dad's NOBO start date (src/data/gear.json startDate). Used as the day-number
// basis when following the Dad pilot hike; a self-tracked hiker's own start date
// (HikeProfile.startDate) takes over once they calibrate.
const HIKE_START_DATE = '2026-02-01';

const mobilePersistence = browser ? createMobilePersistenceAdapter() : null;

/** A write-action Scout proposes from chat, rendered as a confirm card. */
type ProposedAction = { id: string; title: string; detail: string; confirmLabel: string };

/** A non-null, non-array object — the shape a restored profile/settings/check-in
 *  document must have before we trust and adopt it. */
function isRecordObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class TrailAssistantStore {
	#state = $state<TrailState>(createDefaultTrailState());
	#syncTimer: ReturnType<typeof setTimeout> | null = null;
	#stateStorage: PersistenceAdapter | null = mobilePersistence;
	#stateHydrated = $state(false);
	#fieldPackStore = new InMemoryContextPackStore({
		adapter: mobilePersistence ?? undefined
	});
	#nativeScout = new NativeScoutRuntime({
		browserAvailable: browser,
		store: this.#fieldPackStore,
		createCloudBridge: CLOUD_SCOUT_ENABLED
			? () => createCloudScoutBridge({ getToken: () => cloudAuth.token })
			: undefined
	});
	#fieldPack = $state.raw<ContextPack>(this.#fieldPackStore.get());
	#fieldPackStatus = $state<ContextPackStatus>(this.#fieldPackStore.getStatus());
	#lastScoutAnswer = $state<ScoutAnswer | null>(null);
	#scoutAnswersByMessage = new Map<string, ScoutAnswer>();
	#modelDownloads = this.#nativeScout.downloads;
	// True while a Scout reply is being generated (on-device inference can take
	// many seconds), so the chat can show a "thinking" indicator instead of
	// looking frozen.
	#scoutThinking = $state(false);
	#activeScoutReplies = $state(0);
	// A write-action Scout proposed from chat, awaiting explicit user confirm.
	// Scout NEVER mutates trail state without the user confirming this card —
	// the confirm-before-apply gate for "Do" tools.
	#pendingAction = $state<ProposedAction | null>(null);
	#pendingApply: (() => void) | null = null;
	#pendingScoutAuthPrompt = $state<PendingScoutAuthPrompt | null>(null);
	// Real AT route geometry + USGS elevation (1-mi NOBO samples), fetched once
	// from static/. Powers the elevation profile and GPS→mile snapping. Empty
	// until loaded, so UI renders an honest empty state in the meantime.
	#trailGeo = $state.raw<TrailGeoPoint[]>([]);
	#geoLoadStarted = false; // lazy one-shot guard for trailGeometry (see the getter)
	#autoGpsActive = $state(false);
	// True while the "My hike" calibration sheet is showing. Opened on first run
	// (when the profile isn't calibrated yet) or from Settings to re-edit.
	#hikeSetupOpen = $state(false);
	#position = new TrailPositionService({
		browserAvailable: browser,
		getGeolocation: () => createBrowserGeolocation(browser),
		getPrivacySettings: () => this.#state.privacySettings,
		getTrailSettings: () => this.#state.trailSettings,
		getTrailGeometry: () => this.#trailGeo,
		setTrailGeometry: (points) => {
			this.#trailGeo = points;
		},
		setAutoGpsActive: (active) => {
			this.#autoGpsActive = active;
		},
		getCurrentMile: () => this.#state.currentMile,
		updateCurrentMile: (mile, source) => this.updateCurrentMile(mile, source),
		loadGeometry: loadTrailGeometry,
		snapToMile,
		onGeometryError: (error) => {
			console.error('Failed to load trail geometry', error);
		}
	});

	constructor() {
		if (!browser) return;

		this.#state.onlineStatus = navigator.onLine;
		this.#fieldPackStore.subscribe((pack) => {
			this.#fieldPack = pack;
			this.#applyPackToTrailState(pack);
		});
		this.#fieldPackStore.subscribeStatus((status) => {
			this.#fieldPackStatus = status;
		});
		void this.#bootstrap();
		// Trail geometry (1.9 MB fetch + parse) is NOT kicked here — it loads lazily on
		// the first read of `trailGeometry` (whichever tab needs it), keeping the heavy
		// parse off the boot/hydration frame. See the getter below.
		// Re-observe any model download that kept running in the background service
		// while the app was closed (also refreshes status, which may now be ready).
		void this.reconcileDownload();

		window.addEventListener('online', () => {
			this.#state.onlineStatus = true;
			if (this.#state.syncState === 'queued-offline') {
				const queuedSync = prepareQueuedReportsForSync(this.#state.trailPulseReports);
				this.#state.trailPulseReports = queuedSync.reports;
				for (const report of queuedSync.queuedReports) {
					void this.#syncTrailPulseReport(report);
				}
				this.#finishSync('syncing');
			}
			void this.refreshFieldPack();
		});

		window.addEventListener('offline', () => {
			this.#state.onlineStatus = false;
			this.#state.syncState = syncStateAfterOffline(this.#state.syncState);
		});

		$effect.root(() => {
			$effect(() => {
				const snapshot = snapshotTrailState(this.#state);
				if (!this.#stateHydrated) return;
				void this.#persistState(snapshot);
				this.#backupSnapshot(snapshot);
			});
		});
	}

	/**
	 * Decompose the durable hike state into small per-entity backup documents and
	 * hand them to the cloud sync engine. Each is fingerprinted there, so unchanged
	 * entities are skipped — only what actually moved is queued. Position is its own
	 * document (it changes often) so a settings edit and a mile update never clobber
	 * each other under document-level last-write-wins. The chat transcript and
	 * ephemeral UI flags (online/sync status, "seen" ids) are intentionally not
	 * backed up; Trail Pulse reports already live in the shared SpacetimeDB feed.
	 */
	#backupSnapshot(snapshot: PersistedTrailState): void {
		syncEngine.enqueue('profile', 'me', snapshot.hikeProfile);
		syncEngine.enqueue('position', 'me', {
			currentMile: snapshot.currentMile,
			dayNumber: snapshot.dayNumber
		});
		syncEngine.enqueue('settings', 'me', {
			privacy: snapshot.privacySettings,
			trail: snapshot.trailSettings,
			log: snapshot.trailLogSettings
		});
		syncEngine.enqueue('support-circle', 'me', snapshot.supportCircle);
		syncEngine.enqueue('loadout', 'me', snapshot.personalLoadout);
		syncEngine.enqueue('documents', 'me', snapshot.documents);
		syncEngine.enqueue('checkins', 'me', {
			last: snapshot.lastCheckIn,
			history: snapshot.checkInHistory,
			nextDueAt: snapshot.nextCheckInDueAt
		});
	}

	/** True when local state is just defaults — a fresh / lost-phone install. The
	 *  cloud restore policy reads this once to decide whether the backup outranks
	 *  the on-device defaults. */
	get isFreshInstall(): boolean {
		return !this.#state.hikeProfile.calibrated;
	}

	/**
	 * Apply one restored backup document to local state — the inverse of
	 * #backupSnapshot, called only by the cloud restore orchestrator under the
	 * last-write-wins restore policy. Returns whether it applied; a shape it
	 * doesn't recognize or can't trust is skipped (returns false) so a malformed
	 * document never corrupts the hike. Runs synchronously so the persistence
	 * effect flushes once over fully-restored state.
	 */
	applyRestoredDoc(docType: string, content: unknown): boolean {
		if (content == null || typeof content !== 'object') return false;
		switch (docType) {
			case 'profile': {
				const p = content as Partial<HikeProfile>;
				// Guard the fields the app keys off: a malformed `calibrated`/`mode`
				// would corrupt first-run + restore decisions (isFreshInstall).
				if (typeof p.calibrated !== 'boolean' || typeof p.mode !== 'string') return false;
				this.#state.hikeProfile = content as HikeProfile;
				return true;
			}
			case 'position': {
				const p = content as { currentMile?: unknown; dayNumber?: unknown };
				if (typeof p.currentMile !== 'number' || typeof p.dayNumber !== 'number') return false;
				this.#state.currentMile = p.currentMile;
				this.#state.dayNumber = p.dayNumber;
				return true;
			}
			case 'settings': {
				const s = content as {
					privacy?: PrivacySettings;
					trail?: TrailSettings;
					log?: TrailLogSettings;
				};
				if (!isRecordObject(s.privacy) || !isRecordObject(s.trail) || !isRecordObject(s.log)) {
					return false;
				}
				this.#state.privacySettings = s.privacy;
				this.#state.trailSettings = s.trail;
				this.#state.trailLogSettings = s.log;
				return true;
			}
			case 'support-circle': {
				if (!Array.isArray(content)) return false;
				this.#state.supportCircle = content as SupportContact[];
				return true;
			}
			case 'loadout': {
				if (!Array.isArray(content)) return false;
				this.#state.personalLoadout = content as LoadoutItem[];
				return true;
			}
			case 'documents': {
				if (!Array.isArray(content)) return false;
				this.#state.documents = content as TrailDocument[];
				return true;
			}
			case 'checkins': {
				const c = content as {
					last?: TrailState['lastCheckIn'];
					history?: unknown;
					nextDueAt?: unknown;
				};
				if (!isRecordObject(c.last) || !Array.isArray(c.history)) return false;
				this.#state.lastCheckIn = c.last;
				this.#state.checkInHistory = c.history as TrailState['checkInHistory'];
				if (typeof c.nextDueAt === 'string') {
					this.#state.nextCheckInDueAt = c.nextDueAt;
				}
				return true;
			}
			default:
				return false;
		}
	}

	async #bootstrap() {
		await this.#hydrate();
		await this.#loadFieldPack();
	}

	async #hydrate() {
		const raw = await this.#stateStorage?.get(STORAGE_KEY).catch(() => null);
		if (!raw) {
			this.#stateHydrated = true;
			return;
		}

		try {
			this.#state = parsePersistedTrailState(raw);
		} catch (error) {
			console.error('Failed to restore Trail Assistant state', error);
		} finally {
			this.#stateHydrated = true;
		}
	}

	async #persistState(snapshot: PersistedTrailState) {
		if (!this.#stateStorage) return;
		try {
			await this.#stateStorage.set(STORAGE_KEY, JSON.stringify(snapshot));
		} catch (error) {
			console.error('Failed to persist Trail Assistant state', error);
		}
	}

	async #loadFieldPack() {
		let pack = await this.#fieldPackStore.load();
		if (!this.#state.hikeProfile.calibrated) {
			this.#state = resetToUncalibratedStarterState(this.#state);
			pack = cloneDefaultContextPack();
			await this.#fieldPackStore.replace(pack, 'bundled');
		}
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		await this.#mergeOfflineSourceDocs();
		pack = this.#fieldPack;
		// One-time adoption so the editor starts from real gear: take over gear already
		// in the pack — a self-tracked hiker's personal pack, or, when following Dad, his
		// published loadout. The one thing we must NOT do is hand a self-tracked hiker
		// Dad's pilot gear as their own (sanitize clears it for exactly that reason).
		const wouldInheritPilotGear =
			isSelfTracked(this.#state.hikeProfile) && isDadPilotContextPack(pack);
		if (!this.#state.personalLoadout.length && pack.loadout.length && !wouldInheritPilotGear) {
			this.#state.personalLoadout = pack.loadout.map((item) => ({ ...item }));
		}
		await this.#syncDocumentsToFieldPack();
		await this.#syncLoadoutToFieldPack();
		if (isSelfTracked(this.#state.hikeProfile)) {
			await this.#sanitizeFieldPackForSelfProfile();
			pack = this.#fieldPack;
		}
		this.#applyPackToTrailState(pack);
		if (this.#state.onlineStatus && this.#state.hikeProfile.calibrated) {
			await this.refreshFieldPack();
		}
	}

	#applyPackToTrailState(pack: ContextPack) {
		// A self-tracked hiker OWNS their position — the pack only supplies reference
		// data (water/shelters/towns), so a remote refresh must NOT pull them back to
		// the pack's centered mile. Following the Dad pilot pack still reads position
		// from the pack as before.
		if (!isSelfTracked(this.#state.hikeProfile)) {
			const position = resolvePosition(this.#state.hikeProfile, pack, HIKE_START_DATE, new Date());
			this.#state.currentMile = position.currentMile;
			this.#state.dayNumber = position.dayNumber;
		}
		this.#state.trailSettings = {
			...this.#state.trailSettings,
			offlineRegion: pack.downloadedRegions[0] ?? this.#state.trailSettings.offlineRegion
		};
	}

	async #syncDocumentsToFieldPack() {
		await this.#fieldPackStore.updateDocuments(toContextDocuments(this.#state.documents));
		this.#fieldPack = this.#fieldPackStore.get();
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
	}

	// Gear is user-owned (like documents): the source of truth is #state.personalLoadout,
	// pushed into the pack's loadout so a remote refresh — which spreads a server pack
	// over the local one — can never wipe the hiker's own gear list.
	async #syncLoadoutToFieldPack() {
		await this.#fieldPackStore.updateLoadout(this.#state.personalLoadout.map((item) => ({ ...item })));
		this.#fieldPack = this.#fieldPackStore.get();
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
	}

	async #mergeOfflineSourceDocs() {
		if (!browser) return;
		const docs = await loadOfflineSourceDocs().catch((error) => {
			console.error('Failed to load offline source docs', error);
			return [];
		});
		const merged = mergeOfflineSourceDocs(this.#fieldPackStore.get(), docs);
		if (!merged.changed) return;
		await this.#fieldPackStore.replace(merged.pack, this.#fieldPackStatus.source);
		this.#fieldPack = this.#fieldPackStore.get();
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
	}

	async #sanitizeFieldPackForSelfProfile() {
		if (!isSelfTracked(this.#state.hikeProfile)) return;
		const sanitized = sanitizeContextPackForSelfProfile(
			this.#fieldPackStore.get(),
			this.#state.hikeProfile
		);
		await this.#fieldPackStore.replace(sanitized, 'saved');
		this.#fieldPack = this.#fieldPackStore.get();
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
	}

	#finishSync(nextState: SyncState) {
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#state.syncState = nextState;

		this.#syncTimer = setTimeout(() => {
			this.#state.syncState = settledSyncState(this.#state.onlineStatus);
			this.#state.trailPulseReports = settleSyncingReports(
				this.#state.trailPulseReports,
				this.#state.syncState
			);
			this.#state.lastSyncAt = new Date().toISOString();
		}, nextState === 'syncing' ? 1300 : 0);
	}

	async #syncTrailPulseReport(report: TrailConditionReport) {
		const result = await publishTrailPulseReport(report).catch(() => 'failed' as const);
		const syncState: SyncState = result === 'failed' ? 'queued-offline' : 'synced';

		this.#state.trailPulseReports = updateTrailPulseSyncState(
			this.#state.trailPulseReports,
			report.id,
			syncState
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

	// Which tab to return to when leaving Settings — the gear can be opened from any
	// pillar, so "back" should land where you were, not hardcode Scout.
	#settingsReturnTab: Tab = 'Today';

	/** Open Settings, remembering the tab to return to. */
	openSettings() {
		if (this.#state.activeTab !== 'Settings') this.#settingsReturnTab = this.#state.activeTab;
		this.#state.activeTab = 'Settings';
	}

	/** Leave Settings, returning to whichever pillar opened it. */
	closeSettings() {
		this.#state.activeTab = this.#settingsReturnTab;
	}

	// Which section the Trail pillar opens to (Guide · Bible · Docs · Gear).
	// Shared so the Today "packing up?" glance can deep-link straight to Gear.
	#trailSection = $state<'guide' | 'bible' | 'docs' | 'gear'>('guide');
	get trailSection() {
		return this.#trailSection;
	}
	set trailSection(section: 'guide' | 'bible' | 'docs' | 'gear') {
		this.#trailSection = section;
	}

	/** Open the Trail pillar to a specific section (used by deep links like the
	 *  Today packing glance jumping to Gear). */
	openTrailSection(section: 'guide' | 'bible' | 'docs' | 'gear') {
		this.#trailSection = section;
		this.#state.activeTab = 'Trail';
	}

	get coachMessages() {
		return this.#state.coachMessages;
	}

	/** True while Scout is generating a reply (drives the chat "thinking" indicator). */
	get scoutThinking() {
		return this.#scoutThinking;
	}

	/** True from send through final token/error, including after the first token lands. */
	get scoutReplyInProgress() {
		return this.#activeScoutReplies > 0;
	}

	/** A write-action Scout proposed, awaiting the user's Confirm/Cancel (or null). */
	get pendingAction() {
		return this.#pendingAction;
	}

	get scoutAuthPrompt(): PendingScoutAuthPrompt | null {
		return this.#pendingScoutAuthPrompt;
	}

	openScoutSignIn(): void {
		this.#settingsReturnTab = 'Scout';
		this.#state.activeTab = 'Settings';
	}

	resumePendingScoutPrompt(): boolean {
		const pending = this.#pendingScoutAuthPrompt;
		if (!pending || this.#scoutThinking) return false;

		this.#pendingScoutAuthPrompt = null;
		this.#settingsReturnTab = 'Scout';
		this.#state.activeTab = 'Scout';
		void this.#dispatchScoutReply(pending.prompt, pending.userMessageId);
		return true;
	}

	get lastCheckIn() {
		return this.#state.lastCheckIn;
	}

	get checkInHistory() {
		return this.#state.checkInHistory;
	}

	get documents() {
		return this.#state.documents;
	}

	get trailPulseReports() {
		return this.#state.trailPulseReports;
	}

	get nearbyTrailPulseReports() {
		return nearbyTrailPulseReports(this.#state.trailPulseReports, this.#state.currentMile);
	}

	get pendingTrailPulseAlert() {
		return pendingTrailPulseAlert({
			reports: this.#state.trailPulseReports,
			seenReportIds: this.#state.seenTrailPulseReportIds,
			currentMile: this.#state.currentMile
		});
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

	get autoGpsActive() {
		return this.#autoGpsActive;
	}

	get trailLogSettings() {
		return this.#state.trailLogSettings;
	}

	get onlineStatus() {
		return this.#state.onlineStatus;
	}

	/** True when Scout answers via the cloud lane (the PWA) rather than on-device
	 *  Gemma (iOS). Drives platform-accurate UI copy. */
	get scoutUsesCloud(): boolean {
		return scoutUsesCloud;
	}

	/** "Cloud Scout" on the PWA, "On-device Scout" on iOS. */
	get scoutLaneLabel(): string {
		return scoutLaneLabel;
	}

	get fieldPack() {
		return this.#fieldPack;
	}

	get fieldPackStatus() {
		return this.#fieldPackStatus;
	}

	/** On-device Gemma model file state, or null off-native / before first probe. */
	get modelStatus() {
		return this.#modelDownloads.status;
	}

	/** Live download progress while a model download is in flight, else null. */
	get modelDownload() {
		return this.#modelDownloads.download;
	}

	/** Last model-download error message, cleared when a new download starts. */
	get modelError() {
		return this.#modelDownloads.error;
	}

	/**
	 * Non-null when a download was requested over a metered (cellular/hotspot)
	 * connection and is awaiting the user's okay on the data cost. The UI shows a
	 * "download over cellular?" confirm; downloadModel({ allowMetered: true })
	 * proceeds, dismissMeteredPrompt() backs out.
	 */
	get meteredDownloadPrompt() {
		return this.#modelDownloads.meteredPrompt;
	}

	/** Reader-facing model install phase for inline Scout chat/status UI. */
	get modelPhase() {
		return deriveModelPhase({
			download: this.#modelDownloads.download,
			status: this.#modelDownloads.status,
			error: this.#modelDownloads.error,
			meteredPrompt: this.#modelDownloads.meteredPrompt
		});
	}

	/** True when on-device model management is available (native build w/ plugin). */
	get supportsOnDeviceModel() {
		return this.#modelDownloads.supportsModelManagement;
	}

	get syncState() {
		return this.#state.syncState;
	}

	get currentMile() {
		return this.#state.currentMile;
	}

	get dayNumber() {
		const profile = this.#state.hikeProfile;
		if (!profile.calibrated) return this.#state.dayNumber;
		if (isSelfTracked(profile)) {
			return profile.startDate ? deriveDayNumber(profile.startDate, new Date()) : 1;
		}
		if (isDadPilotContextPack(this.#fieldPack)) {
			return deriveDayNumber(HIKE_START_DATE, new Date());
		}
		return this.#state.dayNumber;
	}

	/** The user's own hike identity + position ("My hike"). */
	get hikeProfile(): HikeProfile {
		return this.#state.hikeProfile;
	}

	/** True until the user has completed (or skipped) first-run calibration. */
	get needsCalibration(): boolean {
		return browser && this.#stateHydrated && !this.#state.hikeProfile.calibrated;
	}

	/** True while the "My hike" setup sheet should be shown (first run or re-edit). */
	get hikeSetupOpen(): boolean {
		return this.#hikeSetupOpen || this.needsCalibration;
	}

	openHikeSetup(): void {
		this.#hikeSetupOpen = true;
	}

	closeHikeSetup(): void {
		this.#hikeSetupOpen = false;
	}

	/** Real AT route geometry + elevation (1-mi samples), or [] before it loads. */
	get trailGeometry() {
		// Lazily fetch+parse the 1.9 MB geometry on first read (whichever tab needs it —
		// Map or Today), instead of eagerly in the constructor on the boot/hydration
		// frame. One-shot; trail-geometry.ts yields around the parse so it can't starve
		// the leaflet import on a cold launch onto the Map. Returns [] until it lands, so
		// the UI renders its honest empty state in the meantime (unchanged behaviour).
		if (browser && !this.#geoLoadStarted) {
			this.#geoLoadStarted = true;
			void this.#position.loadTrailGeometry();
		}
		return this.#trailGeo;
	}

	get nextCheckInDueAt() {
		return this.#state.nextCheckInDueAt;
	}

	get supportCircle() {
		return this.#state.supportCircle;
	}

	get lastSyncAt() {
		return this.#state.lastSyncAt;
	}

	get missedCheckInRisk() {
		return missedCheckInRisk({
			nextCheckInDueAt: this.#state.nextCheckInDueAt,
			onlineStatus: this.#state.onlineStatus
		});
	}

	get syncLabel() {
		return formatSyncLabel(this.#state.syncState);
	}

	#addCoachMessage(role: ChatMessage['role'], content: string): ChatMessage {
		const result = appendChatMessage(this.#state.coachMessages, role, content);
		this.#state.coachMessages = result.messages;
		return result.message;
	}

	#setCoachMessageContent(messageId: string, content: string): void {
		this.#state.coachMessages = setChatMessageContent(
			this.#state.coachMessages,
			messageId,
			content
		);
	}

	#appendCoachStreamChunk(
		streamingMessageId: string | null,
		chunk: string
	): { streamingMessageId: string | null; started: boolean } {
		const stream = appendAssistantStreamChunk(this.#state.coachMessages, streamingMessageId, chunk);
		this.#state.coachMessages = stream.messages;
		return { streamingMessageId: stream.streamingMessageId, started: stream.started };
	}

	sendCoachMessage(content: string): ChatMessage | null {
		const trimmed = content.trim();
		if (!trimmed) return null;

		const userMessage = this.#addCoachMessage('user', trimmed);

		// "Do" tools: if the message is a write-action intent, Scout PROPOSES the
		// action (a confirm card) instead of just chatting. Nothing is written
		// until the user confirms. Falls through to a normal reply otherwise.
		const proposal = this.#detectActionIntent(trimmed);
		if (proposal) {
			this.#pendingAction = proposal.display;
			this.#pendingApply = proposal.apply;
			this.#addCoachMessage('assistant', proposal.prompt);
			return userMessage;
		}

		void this.#dispatchScoutReply(trimmed, userMessage.id);
		return userMessage;
	}

	/**
	 * Detects a write-action intent in a chat message and returns a proposed
	 * action (display + apply closure + a prompt line), or null for plain chat.
	 * The "Do" tools are logging a check-in and updating the current mile (e.g.
	 * "I'm at mile 623.4"); the two can combine ("I'm safe at mile 700"). Apply is
	 * never run here — only on explicit confirm.
	 */
	#detectActionIntent(
		text: string
	): { display: ProposedAction; apply: () => void; prompt: string } | null {
		const intent = detectTrailActionIntent(text, this.#state.currentMile);
		if (!intent) return null;

		const display: ProposedAction = {
			id: crypto.randomUUID(),
			title: intent.title,
			detail: intent.detail,
			confirmLabel: intent.confirmLabel
		};

		if (intent.kind === 'position-update') {
			return {
				display,
				apply: () => void this.updateCurrentMile(intent.mile, 'check-in'),
				prompt: intent.prompt
			};
		}

		return {
			display,
			apply: () => {
				if (intent.movesPosition) void this.updateCurrentMile(intent.mile, 'check-in');
				this.performCheckIn(intent.status, intent.note);
			},
			prompt: intent.prompt
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
		this.#addCoachMessage('assistant', actionRecordedChatText(action.title));
	}

	/** Discard the pending Scout-proposed action without applying it. */
	cancelPendingAction() {
		if (!this.#pendingAction) return;
		this.#pendingAction = null;
		this.#pendingApply = null;
		this.#addCoachMessage('assistant', actionCancelledChatText());
	}

	/**
	 * On the PWA, the cloud answer lane needs a signed-in account (the "only Dad"
	 * gate) and a connection. Returns an honest status message when blocked, or
	 * null when the cloud lane is good to go. Web-only — never called on iOS.
	 */
	#cloudScoutBlock(): { kind: 'signed-out' | 'offline'; message: string } | null {
		if (!cloudAuth.signedIn) {
			return {
				kind: 'signed-out',
				message: SCOUT_AUTH_WALL_MESSAGE
			};
		}
		if (!this.#state.onlineStatus) {
			return {
				kind: 'offline',
				message:
					'Scout needs a connection in the web app — reconnect and ask again. (The installed iOS app answers offline.)'
			};
		}
		return null;
	}

	async #dispatchScoutReply(prompt: string, currentMessageId: string) {
		// Self-heal the native wiring in case Capacitor wasn't ready at construction.
		this.#nativeScout.ensureNativeWiring();
		if (REQUIRE_GEMMA) await this.refreshModelStatus();
		this.#activeScoutReplies += 1;
		this.#scoutThinking = true;

		// Stream tokens into a live-updating assistant bubble. The bubble is only
		// created on the FIRST token, so the "thinking" dots show until words start
		// arriving, then flip straight into the growing answer.
		let streamingId: string | null = null;
		const onToken = (chunk: string) => {
			const stream = this.#appendCoachStreamChunk(streamingId, chunk);
			if (stream.started) this.#scoutThinking = false;
			streamingId = stream.streamingMessageId;
		};

		try {
			await this.#refreshFieldPackForPrompt(prompt);

			if (CLOUD_SCOUT_ENABLED) {
				// PWA: no on-device model. Restore any saved session (idempotent; kept
				// off the boot path per the iOS-freeze rule), then block honestly if
				// signed out / offline, otherwise route to the cloud lane.
				await cloudAuth.init();
				const block = this.#cloudScoutBlock();
				if (block) {
					const message = this.#addCoachMessage('assistant', block.message);
					if (block.kind === 'signed-out') {
						this.#pendingScoutAuthPrompt = createPendingScoutAuthPrompt({
							prompt,
							userMessageId: currentMessageId,
							blockedMessageId: message.id
						});
					}
					return;
				}
			} else if (!(await this.#nativeScout.gemmaReady(REQUIRE_GEMMA))) {
				// Model unavailable: append a PLAIN status message. Deliberately do
				// NOT register it as a ScoutAnswer or set lastScoutAnswer — it isn't a
				// model answer, so the chat shows no confidence badge or source chips.
				const autoStart = await this.#nativeScout.startModelDownloadIfUseful();
				const answer = this.#nativeScout.gemmaUnavailableAnswer(autoStart);
				this.#addCoachMessage('assistant', answer.answer);
				return;
			}

			const answer = await this.#nativeScout.runtime.ask(
				{
					prompt,
					conversationHistory: buildScoutConversationHistory(this.#state.coachMessages, {
						excludeMessageId: currentMessageId
					}),
					onlineStatus: this.#state.onlineStatus,
					batterySaver: this.#state.trailSettings.batterySaver,
					allowCloud: CLOUD_SCOUT_ENABLED,
					preferredMode: CLOUD_SCOUT_ENABLED ? undefined : REQUIRE_GEMMA ? 'on-device' : undefined
				},
				onToken
			);
			this.#lastScoutAnswer = answer;

			if (streamingId !== null) {
				// Finalize the streamed bubble: snap to the provider's full text and
				// attach receipts/confidence so the source chips render.
				const id = streamingId;
				this.#scoutAnswersByMessage.set(id, answer);
				this.#setCoachMessageContent(id, answer.answer);
			} else {
				// Provider returned a complete response without streaming.
				const message = this.#addCoachMessage('assistant', answer.answer);
				this.#scoutAnswersByMessage.set(message.id, answer);
			}
		} catch (error) {
			// PWA cloud lane went unreachable mid-turn (token died / dropped offline):
			// the router throws NoScoutModelAvailableError since there's no on-device
			// fallback in a browser. Surface the same honest block message.
			if (CLOUD_SCOUT_ENABLED && error instanceof NoScoutModelAvailableError) {
				const block = this.#cloudScoutBlock();
				const message =
					block?.message ?? 'Scout needs a connection in the web app — reconnect and ask again.';
				if (streamingId !== null) {
					this.#setCoachMessageContent(streamingId, message);
					if (block?.kind === 'signed-out') {
						this.#pendingScoutAuthPrompt = createPendingScoutAuthPrompt({
							prompt,
							userMessageId: currentMessageId,
							blockedMessageId: streamingId
						});
					}
				} else {
					const assistantMessage = this.#addCoachMessage('assistant', message);
					if (block?.kind === 'signed-out') {
						this.#pendingScoutAuthPrompt = createPendingScoutAuthPrompt({
							prompt,
							userMessageId: currentMessageId,
							blockedMessageId: assistantMessage.id
						});
					}
				}
				return;
			}
			// On-device generation failed this turn. Under the Gemma-only policy the
			// runtime rethrows rather than silently faking an offline answer (the
			// "acted offline" bug), so handle it honestly: reset the availability
			// probe, warm the engine for next time, and tell the hiker plainly with
			// a retry nudge — never a canned offline answer that hides the failure.
			// Log the real error so a genuine bug (store/tool failure) is debuggable
			// from device logs rather than silently swallowed.
			console.error('Scout reply failed', error);
			this.#nativeScout.invalidateAvailability();
			this.#nativeScout.warmUpModel();
			// Keep the wording accurate for any failure here (on-device generation is
			// the dominant case under the Gemma-only policy, but a store/tool error
			// could also land here) while still nudging a retry — the warm-up above
			// means the next attempt usually succeeds.
			const snag =
				'Scout hit a snag answering that just now — give it a few seconds and ask again.';
			if (streamingId !== null) {
				this.#setCoachMessageContent(streamingId, snag);
			} else {
				this.#addCoachMessage('assistant', snag);
			}
		} finally {
			this.#scoutThinking = false;
			this.#activeScoutReplies = Math.max(0, this.#activeScoutReplies - 1);
		}
	}

	/**
	 * On-device scripture generation for the iOS app — Gemma required, like Scout.
	 * Builds nothing of its own; the caller supplies the grounded persona prompt.
	 * Throws (model unavailable) so the Bible reader can fall back to verses-only.
	 */
	async generateScripture(input: { systemContext: string; prompt: string }): Promise<string> {
		if (!(await this.#nativeScout.gemmaReady(REQUIRE_GEMMA))) {
			await this.#nativeScout.startModelDownloadIfUseful();
			throw new Error('on-device-model-unavailable');
		}
		return this.#nativeScout.generateText({ ...input, maxTokens: 512 });
	}

	async runLocalAiEvalSuite(input: {
		suite: ScoutLocalAiEvalSuite;
		limit?: number;
		onProgress?: (progress: ScoutLocalAiEvalProgress) => void;
		onSnapshot?: (run: ScoutLocalAiEvalRun) => void;
		previousRun?: ScoutLocalAiEvalRun | null;
	}): Promise<ScoutLocalAiEvalRun> {
		if (CLOUD_SCOUT_ENABLED) {
			throw new Error('The local-AI eval must run in the installed iOS app, not the web cloud lane.');
		}
		this.#nativeScout.ensureNativeWiring();
		if (!(await this.#nativeScout.gemmaReady(true))) {
			await this.#nativeScout.startModelDownloadIfUseful();
			throw new Error('Scout local AI is not ready on this device yet.');
		}

		return runScoutLocalAiEval({
			suite: input.suite,
			limit: input.limit,
			evidenceLane: 'device-on-device-gemma',
			runContext: await this.#buildLocalAiEvalRunContext(),
			onProgress: input.onProgress,
			onSnapshot: input.onSnapshot,
			previousRun: input.previousRun,
			ask: ({ testCase, pack, conversationHistory }) =>
				this.#nativeScout.askWithContextPack(pack, {
					prompt: testCase.prompt,
					conversationHistory,
					onlineStatus: false,
					batterySaver: this.#state.trailSettings.batterySaver,
					allowCloud: false,
					preferredMode: 'on-device'
				})
		});
	}

	async #buildLocalAiEvalRunContext(): Promise<Record<string, unknown>> {
		const context: Record<string, unknown> = {
			surface: 'mobile-settings-scout-eval-lab',
			scoutLane: scoutLaneLabel,
			modelState: this.#modelDownloads.status?.state ?? null,
			modelId: this.#modelDownloads.status?.modelId ?? null,
			runtimeConfigured: this.#modelDownloads.status?.runtimeConfigured ?? null,
			svelteKitVersion,
			userAgent: browser ? navigator.userAgent : null
		};
		if (!browser) return context;
		try {
			const [{ Capacitor }, { App }] = await Promise.all([
				import('@capacitor/core'),
				import('@capacitor/app')
			]);
			context.native = {
				isNativePlatform: Capacitor.isNativePlatform(),
				platform: Capacitor.getPlatform()
			};
			if (Capacitor.isNativePlatform()) {
				const appInfo = await App.getInfo();
				context.app = {
					id: appInfo.id,
					name: appInfo.name,
					version: appInfo.version,
					build: appInfo.build
				};
				try {
					context.installSource = await getCapacitorScoutInstallSource() ?? {
						type: 'unknown',
						detectedBy: 'scoutgemma-install-source-unavailable'
					};
				} catch (error) {
					context.installSource = {
						type: 'unknown',
						detectedBy: 'scoutgemma-install-source-error',
						error: error instanceof Error ? error.message : String(error)
					};
				}
			}
		} catch (error) {
			context.nativeMetadataError = error instanceof Error ? error.message : String(error);
		}
		return context;
	}

	async #refreshFieldPackForPrompt(prompt: string): Promise<void> {
		if (!this.#state.onlineStatus || !this.#state.hikeProfile.calibrated) return;
		if (!WEATHER_PROMPT_RE.test(prompt)) return;
		await this.refreshFieldPack().catch((error) => {
			console.error('Weather/source refresh before Scout reply failed', error);
		});
	}

	async refreshFieldPack(): Promise<ContextPack> {
		if (!this.#state.hikeProfile.calibrated) {
			return this.#fieldPack;
		}
		// Self-tracked hikers fetch a pack centered on THEIR mile (?mile=&personal=1);
		// explicit Dad-pilot mode fetches the public pilot pack at the bare endpoint.
		const endpoint = buildFieldPackUrl(FIELD_PACK_ENDPOINT, this.#state.hikeProfile);
		await this.#fieldPackStore.refreshFromEndpoint(endpoint);
		await this.#mergeOfflineSourceDocs();
		await this.#syncDocumentsToFieldPack();
		await this.#syncLoadoutToFieldPack();
		const pack = this.#fieldPackStore.get();
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		this.#applyPackToTrailState(pack);
		this.#state.lastSyncAt = new Date().toISOString();
		return pack;
	}

	createDocument(input: { title: string; body: string; source?: TrailDocument['source'] }): TrailDocument | null {
		const document = createTrailDocument(input);
		if (!document) return null;
		this.#state.documents = limitTrailDocuments([document, ...this.#state.documents]);
		void this.#syncDocumentsToFieldPack();
		return document;
	}

	updateDocument(id: string, input: { title: string; body: string }): void {
		this.#state.documents = this.#state.documents.map((document) =>
			document.id === id ? updateTrailDocument(document, input) : document
		);
		void this.#syncDocumentsToFieldPack();
	}

	deleteDocument(id: string): void {
		this.#state.documents = this.#state.documents.filter((document) => document.id !== id);
		void this.#syncDocumentsToFieldPack();
	}

	// --- Gear / loadout editing -------------------------------------------------
	get personalLoadout(): LoadoutItem[] {
		return this.#state.personalLoadout;
	}

	addGearItem(input: {
		name: string;
		category: LoadoutItem['category'];
		weightOz?: number;
		note?: string;
		carried?: boolean;
	}): void {
		const name = input.name.trim();
		if (!name) return;
		const entry: LoadoutItem = {
			name,
			category: input.category,
			carried: input.carried ?? true
		};
		if (typeof input.weightOz === 'number' && Number.isFinite(input.weightOz) && input.weightOz > 0) {
			entry.weightOz = input.weightOz;
		}
		if (input.note?.trim()) entry.note = input.note.trim();
		this.#state.personalLoadout = [...this.#state.personalLoadout, entry];
		void this.#syncLoadoutToFieldPack();
	}

	updateGearItem(index: number, patch: Partial<LoadoutItem>): void {
		if (index < 0 || index >= this.#state.personalLoadout.length) return;
		this.#state.personalLoadout = this.#state.personalLoadout.map((item, i) =>
			i === index ? { ...item, ...patch } : item
		);
		void this.#syncLoadoutToFieldPack();
	}

	toggleGearCarried(index: number): void {
		const item = this.#state.personalLoadout[index];
		if (!item) return;
		this.updateGearItem(index, { carried: !item.carried });
	}

	removeGearItem(index: number): void {
		if (index < 0 || index >= this.#state.personalLoadout.length) return;
		this.#state.personalLoadout = this.#state.personalLoadout.filter((_, i) => i !== index);
		void this.#syncLoadoutToFieldPack();
	}

	saveLastScoutAnswerAsDocument(title = 'Scout field draft'): TrailDocument | null {
		const answer = this.#lastScoutAnswer;
		if (!answer?.answer.trim()) return null;
		return this.createDocument({
			title,
			body: answer.answer,
			source: 'scout-draft'
		});
	}

	draftDocumentWithScout(topic: string): void {
		const trimmed = topic.trim();
		if (!trimmed) return;
		this.#state.activeTab = 'Scout';
		this.sendCoachMessage(
			`Draft an offline field document about "${trimmed}". Use my saved field pack, Bible/source tools when relevant, and any saved docs that match. Structure it with: what I know, what to do next, source-backed details, assumptions to verify later, and a short trail-ready checklist.`
		);
	}

	/**
	 * First-run (or re-edit) calibration. `self` mode makes position the user's own
	 * — owned by the profile, centered field pack, real day number from their start
	 * date. `dad-pilot` mode follows the Hogg family's public 2026 thru-hike.
	 */
	async calibrateHike(input: HikeCalibrationInput): Promise<void> {
		const transition = calibrateHikeProfile(input, this.#fieldPack.hiker.currentMile);
		this.#applyHikeProfileTransition(transition);
		await this.#sanitizeFieldPackForSelfProfile();

		this.#hikeSetupOpen = false;
		if (this.#state.onlineStatus) {
			await this.refreshFieldPack();
		} else {
			this.#applyPackToTrailState(this.#fieldPack);
		}
	}

	#applyHikeProfileTransition(transition: HikeProfileTransition): void {
		this.#state.hikeProfile = transition.profile;
		if (transition.currentMile !== null) this.#state.currentMile = transition.currentMile;
		if (transition.anchorCheckIn) {
			this.#state.lastCheckIn = transition.anchorCheckIn;
			this.#state.checkInHistory = [];
		}
	}

	/**
	 * Move the hiker to a new current mile (from a chat check-in, a GPS snap, or a
	 * manual edit). Always flips the profile into self-tracking — once someone tells
	 * Scout where THEY are, position is theirs, not Dad's — and re-centers the field
	 * pack around the new mile when online.
	 */
	async updateCurrentMile(mile: number, source: MileSource): Promise<void> {
		const transition = updateHikeProfileMile(this.#state.hikeProfile, mile, source);
		this.#applyHikeProfileTransition(transition);
		await this.#sanitizeFieldPackForSelfProfile();
		if (this.#state.onlineStatus) {
			await this.refreshFieldPack();
		}
	}

	/**
	 * Snap the device GPS fix to the nearest real AT mile and adopt it as the
	 * current position. Honors the "precise location" privacy toggle and refuses to
	 * guess when the fix is far off-trail or geometry hasn't loaded — returning a
	 * reason the UI can show, rather than fabricating a mile.
	 */
	async useGpsForMile(): Promise<{ ok: boolean; mile?: number; reason?: string }> {
		return this.#position.useGpsForMile();
	}

	/** Refresh the on-device model file status (cheap; no network). */
	async refreshModelStatus() {
		return this.#modelDownloads.refreshStatus();
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
		await this.#modelDownloads.downloadModel(options);
	}

	/** Back out of the metered-connection download confirm without downloading. */
	dismissMeteredPrompt(): void {
		this.#modelDownloads.dismissMeteredPrompt();
	}

	/**
	 * Re-observe a download that may have kept running in the background service
	 * while the app was closed/backgrounded. Call on app resume / when the model UI
	 * mounts: it re-attaches progress + terminal handling if a transfer is still in
	 * flight, and refreshes status (which may now be ready). No-op otherwise.
	 */
	async reconcileDownload(): Promise<void> {
		await this.#modelDownloads.reconcileDownload();
	}

	/** Cancel an in-flight model download; the partial file is kept for resume. */
	async cancelModelDownload(): Promise<void> {
		await this.#modelDownloads.cancelDownload();
	}

	get lastScoutAnswer(): ScoutAnswer | null {
		return this.#lastScoutAnswer;
	}

	scoutAnswerFor(messageId: string): ScoutAnswer | null {
		return this.#scoutAnswersByMessage.get(messageId) ?? null;
	}

	runQuickPrompt(prompt: string): ChatMessage | null {
		return this.sendCoachMessage(prompt);
	}

	/** True once at least one real check-in has been logged on this device. */
	get hasCheckedIn() {
		return this.#state.checkInHistory.length > 0;
	}

	/** Support contacts that can actually be reached (have a phone number). */
	get reachableSupportContacts() {
		return reachableSupportContacts(this.#state.supportCircle);
	}

	addSupportContact(contact: SupportContact): void {
		const normalized = normalizeSupportContact(contact);
		if (!normalized) return;
		this.#state.supportCircle = [...this.#state.supportCircle, normalized];
	}

	removeSupportContact(name: string): void {
		this.#state.supportCircle = removeSupportContactByName(this.#state.supportCircle, name);
	}

	/**
	 * Build a signal-gated "need help" SMS deep link to the support circle. This is
	 * NOT an SOS/PLB service — it opens the phone's Messages app pre-filled, which
	 * only sends when the hiker has a bar. Returns null when no contact has a phone,
	 * so the UI can prompt to add one instead of pretending help is wired.
	 */
	buildHelpSms(): { href: string; recipients: SupportContact[] } | null {
		return buildHelpSmsLink({
			contacts: this.#state.supportCircle,
			currentMile: this.#state.currentMile,
			trailName: this.#state.hikeProfile.trailName,
			fallbackTrailName: this.#fieldPack.hiker.trailName
		});
	}

	requestHelp(source: 'Today' | 'Safety' = 'Today'): {
		href: string | null;
		message: string;
		recipients: SupportContact[];
	} {
		this.performCheckIn('need-help', `Need help — flagged from ${source}.`);
		const sms = this.buildHelpSms();
		if (!sms) {
			return {
				href: null,
				recipients: [],
				message: 'Logged on this phone. Add a support contact with a phone number so this can text someone.'
			};
		}

		const names = sms.recipients.map((contact) => contact.name).join(', ');
		return {
			href: sms.href,
			recipients: sms.recipients,
			message: this.#state.onlineStatus
				? `Opening a text to ${names}…`
				: `No signal detected — opening a text draft to ${names}. It will not send until your phone has service and you send it.`
		};
	}

	performCheckIn(status: CheckInStatus, note: string) {
		const record = createCheckInRecord({
			status,
			note,
			mile: this.#state.currentMile
		});
		this.#state.lastCheckIn = record;
		this.#state.checkInHistory = [record, ...this.#state.checkInHistory].slice(0, 6);
		this.#state.nextCheckInDueAt = isoHoursFromNow(nextCheckInHours(status));

		if (this.#state.onlineStatus) {
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = syncStateForLocalWrite(false);
		}
	}

	async submitTrailPulseReport(input: {
		source: TrailPulseSource;
		chipText?: TrailPulseChip;
		noteText?: string;
		reporterTrailName?: string;
		photo?: string;
	}): Promise<TrailConditionReport | null> {
		const chipText = input.chipText;
		const noteText = (input.noteText?.trim() || chipText || (input.photo ? 'Photo' : '')).trim();
		if (!noteText) return null;

		const position = await this.#position.getCurrentPosition();
		const report = createTrailPulseReport({
			source: input.source,
			chipText,
			noteText,
			reporterTrailName: input.reporterTrailName,
			snappedMile: this.#position.snapPositionToTrailMile(position),
			syncState: syncStateForLocalWrite(this.#state.onlineStatus),
			photo: input.photo
		});

		this.#state.trailPulseReports = [report, ...this.#state.trailPulseReports];
		this.markTrailPulseAlertSeen(report.id);

		if (this.#state.onlineStatus) {
			void this.#syncTrailPulseReport(report);
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = syncStateForLocalWrite(false);
		}

		return report;
	}

	formatTrailPulseReport(report: TrailConditionReport): string {
		return formatTrailPulseDisplayText(report);
	}

	markTrailPulseAlertSeen(reportId: string) {
		this.#state.seenTrailPulseReportIds = markTrailPulseReportSeen(
			this.#state.seenTrailPulseReportIds,
			reportId
		);
	}

	updatePrivacy(patch: Partial<PrivacySettings>) {
		this.#state.privacySettings = { ...this.#state.privacySettings, ...patch };
		this.#position.reconcileAutoGpsWatch();
	}

	updateTrailSetting<K extends keyof TrailSettings>(key: K, value: TrailSettings[K]) {
		this.#state.trailSettings = { ...this.#state.trailSettings, [key]: value };
		if (key === 'autoLogMileage') this.#position.reconcileAutoGpsWatch();
	}

	updateTrailLogSetting<K extends keyof TrailLogSettings>(key: K, value: TrailLogSettings[K]) {
		this.#state.trailLogSettings = { ...this.#state.trailLogSettings, [key]: value };
	}
}

export const trailAssistant = new TrailAssistantStore();
