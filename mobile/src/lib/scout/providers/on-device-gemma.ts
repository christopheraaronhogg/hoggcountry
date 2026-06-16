import type {
	ProviderCapabilities,
	ProviderRequest,
	ProviderResponse,
	ScoutProvider
} from '../types.ts';

export type GemmaTier = 'fast' | 'balanced' | 'small';

export interface GemmaModelDescriptor {
	tier: GemmaTier;
	modelId: string;
	maxContextTokens: number;
}

export interface OnDeviceGemmaBridge {
	isAvailable(): Promise<boolean>;
	describeModel(): Promise<GemmaModelDescriptor | null>;
	generate(input: {
		prompt: string;
		systemContext: string;
		maxTokens: number;
	}): Promise<{ text: string; truncated: boolean }>;
}

export interface OnDeviceGemmaProviderOptions {
	bridge?: OnDeviceGemmaBridge;
	tier?: GemmaTier;
}

const TIER_TO_CHARS: Record<GemmaTier, number> = {
	fast: 24_000,
	balanced: 16_000,
	small: 8_000
};

export class OnDeviceGemmaProvider implements ScoutProvider {
	private bridge?: OnDeviceGemmaBridge;
	private cachedDescriptor: GemmaModelDescriptor | null = null;
	private availability: boolean | null = null;

	capabilities: ProviderCapabilities;

	constructor(options: OnDeviceGemmaProviderOptions = {}) {
		this.bridge = options.bridge;
		const tier = options.tier ?? 'balanced';
		this.capabilities = {
			id: 'on-device-gemma',
			mode: 'on-device',
			requiresNetwork: false,
			supportsToolCalls: false,
			maxContextChars: TIER_TO_CHARS[tier]
		};
	}

	async available(): Promise<boolean> {
		if (!this.bridge) {
			this.availability = false;
			return false;
		}
		if (this.availability !== null) return this.availability;

		try {
			this.availability = await this.bridge.isAvailable();
		} catch {
			this.availability = false;
		}
		return this.availability;
	}

	async describe(): Promise<GemmaModelDescriptor | null> {
		if (this.cachedDescriptor) return this.cachedDescriptor;
		if (!this.bridge) return null;
		try {
			this.cachedDescriptor = await this.bridge.describeModel();
		} catch {
			this.cachedDescriptor = null;
		}
		return this.cachedDescriptor;
	}

	async generate(request: ProviderRequest): Promise<ProviderResponse> {
		const ready = await this.available();
		if (!ready || !this.bridge) {
			throw new OnDeviceModelUnavailableError(
				'OnDeviceGemmaProvider invoked but no native bridge is wired. Wire a LiteRT-LM adapter, or let the router fall back to deterministic-fallback.'
			);
		}

		const systemContext = renderSystemContext(request);
		const result = await this.bridge.generate({
			prompt: request.prompt,
			systemContext,
			maxTokens: 512
		});

		return {
			answer: result.text,
			confidence: 'medium',
			mode: 'on-device',
			provider: 'on-device-gemma',
			additionalReceipts: [],
			additionalConfirmations: result.truncated
				? [
					{
						id: 'on-device-truncated',
						prompt: 'On-device context was truncated — verify the answer matches the cached trail pack.',
						reason: 'low-confidence'
					}
				]
				: [],
			contextUsed: ['on-device-gemma']
		};
	}
}

export class OnDeviceModelUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'OnDeviceModelUnavailableError';
	}
}

function renderSystemContext(request: ProviderRequest): string {
	const { pack, toolInvocations } = request;
	const toolLines = toolInvocations.map((tool) => `- [${tool.toolId}] ${tool.summary}`);
	return [
		`You are Scout, an Appalachian Trail field assistant.`,
		`Hiker mile: ${pack.hiker.currentMile.toFixed(1)} of ${pack.frame.totalMiles.toFixed(1)} (${pack.hiker.direction}).`,
		`Day ${pack.hiker.dayNumber}. Target miles today: ${pack.hiker.targetMilesToday ?? 'unset'}.`,
		toolLines.length ? `Trail tool findings:\n${toolLines.join('\n')}` : '',
		`Cite sources from these findings. Do not invent landmarks. If a fact is volatile, ask the hiker to confirm it.`
	]
		.filter(Boolean)
		.join('\n\n');
}
