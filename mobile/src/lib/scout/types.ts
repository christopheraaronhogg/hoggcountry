export type ScoutConfidence = 'high' | 'medium' | 'low' | 'draft';

export type ScoutMode = 'offline-local' | 'on-device' | 'cloud';

export type ProviderId = 'deterministic-fallback' | 'on-device-gemma' | 'cloud-scout';

export interface SourceReceipt {
	id: string;
	title: string;
	kind: 'trail-pack' | 'field-guide' | 'official' | 'hiker-input' | 'cached-weather' | 'derived';
	citation?: string;
	url?: string;
	generatedAt?: string;
	miles?: { from: number; to?: number };
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
	tags: string[];
	citation?: string;
}

export interface CachedWeather {
	mile: number;
	summary: string;
	highF: number;
	lowF: number;
	windMph: number;
	riskNote?: string;
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

export interface ContextPack {
	frame: CalibratedFrame;
	hiker: HikerProfile;
	water: WaterReference[];
	shelters: ShelterReference[];
	towns: TownReference[];
	guideExcerpts: FieldGuideExcerpt[];
	loadout: LoadoutItem[];
	weather: CachedWeather | null;
	downloadedRegions: string[];
	generatedAt: string;
}

export interface ContextPackStore {
	load(): Promise<ContextPack>;
	get(): ContextPack;
	updateHiker(patch: Partial<HikerProfile>): Promise<void>;
	updateWeather(weather: CachedWeather | null): Promise<void>;
	updateLoadout(items: LoadoutItem[]): Promise<void>;
	subscribe(listener: (pack: ContextPack) => void): () => void;
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

export interface ProviderRequest {
	prompt: string;
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

export interface ScoutProvider {
	capabilities: ProviderCapabilities;
	available(): boolean | Promise<boolean>;
	generate(request: ProviderRequest): ProviderResponse | Promise<ProviderResponse>;
}

export interface RouterDecisionInput {
	onlineStatus: boolean;
	batterySaver: boolean;
	allowCloud: boolean;
	preferredMode?: ScoutMode;
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
	onlineStatus: boolean;
	batterySaver?: boolean;
	allowCloud?: boolean;
	preferredMode?: ScoutMode;
}

export interface ScoutRuntime {
	ask(input: ScoutAskInput): Promise<ScoutAnswer>;
}
