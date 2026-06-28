export type ScoutConfidence = 'high' | 'medium' | 'low' | 'draft';

export type ScoutMode = 'on-device' | 'cloud';
export type LegacyScoutMode = 'offline-local';

export type ProviderId = 'on-device-gemma' | 'cloud-scout';

export interface SourceReceipt {
	id: string;
	title: string;
	kind: 'trail-pack' | 'field-guide' | 'official' | 'hiker-input' | 'cached-weather' | 'derived' | 'scripture';
	citation?: string;
	url?: string;
	generatedAt?: string;
	miles?: { from: number; to?: number };
}

export interface ContextPackStatus {
	state: 'fallback' | 'saved' | 'refreshing' | 'ready' | 'stale' | 'error';
	label: string;
	detail: string;
	lastLoadedAt: string | null;
	validUntil: string | null;
	source: 'bundled' | 'saved' | 'remote';
	error?: string;
}

export interface RequiredConfirmation {
	id: string;
	prompt: string;
	reason: 'volatile' | 'stale-cache' | 'safety-critical' | 'low-confidence';
}

export interface SafetyFlag {
	id: string;
	severity: 'info' | 'warn' | 'critical';
	message: string;
}

export interface ToolInvocationRecord {
	toolId: string;
	args: Record<string, unknown>;
	summary: string;
	confidence: ScoutConfidence;
	receipts: SourceReceipt[];
	sourceDocumentIds?: string[];
	confirmations?: RequiredConfirmation[];
	safetyFlags?: SafetyFlag[];
}

export interface ScoutAnswer {
	answer: string;
	confidence: ScoutConfidence;
	mode: ScoutMode;
	provider: ProviderId;
	receipts: SourceReceipt[];
	toolInvocations: ToolInvocationRecord[];
	requiredConfirmations: RequiredConfirmation[];
	safetyFlags: SafetyFlag[];
	contextUsed: string[];
	generatedAt: string;
}

export interface HikerProfile {
	trailName?: string;
	currentMile: number;
	direction: 'NOBO' | 'SOBO';
	dayNumber: number;
	targetMilesToday?: number;
}

export interface WaterReference {
	name: string;
	mile: number;
	reliability: 'reliable' | 'seasonal' | 'thin';
	note?: string;
}

export interface ShelterReference {
	name: string;
	mile: number;
	capacity?: number;
	note?: string;
}

export interface TownReference {
	name: string;
	mile: number;
	access: string;
	servicesNote?: string;
}

export interface FieldGuideExcerpt {
	id: string;
	title: string;
	body: string;
	/** Authored markdown (headings/paragraphs/lists/quotes) for the Trail reader.
	 * `body` stays the flat text Scout grounds on; `prose` is reading-only. */
	prose?: string;
	tags: string[];
	citation?: string;
}

export type LocalDocumentSource = 'manual' | 'scout-draft';

export interface LocalDocumentReference {
	id: string;
	title: string;
	body: string;
	source: LocalDocumentSource;
	createdAt: string;
	updatedAt: string;
}

export interface CachedWeather {
	mile: number;
	summary: string;
	highF: number;
	lowF: number;
	windMph: number;
	riskNote?: string;
	generatedAt: string;
	source?: 'nws' | 'cached-pilot';
	sourceLabel?: string;
	sourceUrl?: string;
	alertsUrl?: string;
	forecastUpdatedAt?: string | null;
}

export interface TerrainClimbReference {
	startMile: number;
	endMile: number;
	direction: 'climb' | 'descent' | 'mixed';
	gradePercent: number;
	verticalFt: number;
	state?: string;
}

export interface TerrainSummaryReference {
	fromMile: number;
	toMile: number;
	lookaheadMiles: number;
	gainFt: number | null;
	lossFt: number | null;
	maxGradePercent: number | null;
	difficultyScore: number | null;
	difficultyLabel: string | null;
	climbs: TerrainClimbReference[];
	sourceLabel: string;
	generatedAt: string;
}

export interface LoadoutItem {
	name: string;
	category: 'shelter' | 'sleep' | 'pack' | 'clothing' | 'kitchen' | 'electronics' | 'safety' | 'consumable';
	weightOz?: number;
	carried: boolean;
	note?: string;
}

export interface CalibratedFrame {
	totalMiles: number;
	startMile: number;
	endMile: number;
	source: string;
}

export interface TrailConditionReference {
	source: 'nps' | 'atc';
	sourceLabel: string;
	category: 'closure' | 'detour' | 'fire' | 'caution' | 'info';
	title: string;
	summary: string;
	url: string | null;
	area: string | null;
	severity: 'high' | 'moderate' | 'low';
	publishedAt: string | null;
}

export interface TrailConditionsContext {
	items: TrailConditionReference[];
	fetchedAt: string;
	note: string;
}

export interface ParkFacilityReference {
	kind: 'visitor-center' | 'campground';
	name: string;
	parkLabel: string;
	summary: string;
	url: string | null;
	reservationUrl: string | null;
	lat: number | null;
	lon: number | null;
}

export interface ParkServicesContext {
	items: ParkFacilityReference[];
	parks: string[];
	fetchedAt: string;
	note: string;
}

export interface ContextPack {
	frame: CalibratedFrame;
	hiker: HikerProfile;
	water: WaterReference[];
	shelters: ShelterReference[];
	towns: TownReference[];
	guideExcerpts: FieldGuideExcerpt[];
	documents?: LocalDocumentReference[];
	loadout: LoadoutItem[];
	weather: CachedWeather | null;
	terrain?: TerrainSummaryReference | null;
	conditions?: TrailConditionsContext | null;
	parkServices?: ParkServicesContext | null;
	downloadedRegions: string[];
	generatedAt: string;
	validUntil?: string;
	sourceReceipts?: SourceReceipt[];
	pilotNotice?: string;
}

export interface ContextPackStore {
	load(): Promise<ContextPack>;
	get(): ContextPack;
	getStatus(): ContextPackStatus;
	refreshFromEndpoint(endpoint: string, fetcher?: typeof fetch): Promise<ContextPack>;
	updateHiker(patch: Partial<HikerProfile>): Promise<void>;
	updateWeather(weather: CachedWeather | null): Promise<void>;
	updateLoadout(items: LoadoutItem[]): Promise<void>;
	updateDocuments(documents: LocalDocumentReference[]): Promise<void>;
	subscribe(listener: (pack: ContextPack) => void): () => void;
	subscribeStatus(listener: (status: ContextPackStatus) => void): () => void;
}

export interface ToolContext {
	pack: ContextPack;
	now: Date;
}

export interface ToolHandler<TArgs = Record<string, unknown>> {
	id: string;
	description: string;
	run(args: TArgs, ctx: ToolContext): ToolInvocationRecord | Promise<ToolInvocationRecord>;
}

export interface ToolRegistry {
	list(): ToolHandler[];
	get(id: string): ToolHandler | undefined;
	register(handler: ToolHandler): void;
}

export interface ProviderCapabilities {
	id: ProviderId;
	mode: ScoutMode;
	requiresNetwork: boolean;
	supportsToolCalls: boolean;
	maxContextChars: number;
}

export interface ScoutConversationMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp?: string;
}

export interface ProviderRequest {
	prompt: string;
	conversationHistory?: readonly ScoutConversationMessage[];
	pack: ContextPack;
	toolInvocations: ToolInvocationRecord[];
	now: Date;
}

export interface ProviderResponse {
	answer: string;
	confidence: ScoutConfidence;
	mode: ScoutMode;
	provider: ProviderId;
	additionalReceipts?: SourceReceipt[];
	additionalConfirmations?: RequiredConfirmation[];
	additionalSafetyFlags?: SafetyFlag[];
	contextUsed: string[];
}

/** Receives incremental text chunks while a provider streams a response. */
export type TokenSink = (chunk: string) => void;

export interface ScoutProvider {
	capabilities: ProviderCapabilities;
	available(): boolean | Promise<boolean>;
	generate(request: ProviderRequest, onToken?: TokenSink): ProviderResponse | Promise<ProviderResponse>;
}

export interface RouterDecisionInput {
	onlineStatus: boolean;
	batterySaver: boolean;
	allowCloud: boolean;
	preferredMode?: ScoutMode | LegacyScoutMode;
}

export interface RouterDecision {
	provider: ScoutProvider;
	reason: string;
}

export interface ModelRouter {
	pick(input: RouterDecisionInput): Promise<RouterDecision>;
	providers(): ScoutProvider[];
}

export interface ScoutRuntimeOptions {
	store: ContextPackStore;
	registry: ToolRegistry;
	router: ModelRouter;
	clock?: () => Date;
}

export interface ScoutAskInput {
	prompt: string;
	conversationHistory?: readonly ScoutConversationMessage[];
	onlineStatus: boolean;
	batterySaver?: boolean;
	allowCloud?: boolean;
	preferredMode?: ScoutMode | LegacyScoutMode;
}

export interface ScoutRuntime {
	ask(input: ScoutAskInput, onToken?: TokenSink): Promise<ScoutAnswer>;
}
