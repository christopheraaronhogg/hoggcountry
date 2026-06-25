import type {
	ProviderCapabilities,
	ProviderRequest,
	ProviderResponse,
	ScoutProvider
} from '../types.ts';

export interface CloudScoutBridge {
	isReachable(): Promise<boolean>;
	ask(input: { prompt: string; payload: Record<string, unknown> }): Promise<{
		answer: string;
		confidence: 'high' | 'medium' | 'low' | 'draft';
		contextUsed: string[];
	}>;
}

export interface CloudScoutProviderOptions {
	bridge?: CloudScoutBridge;
}

export class CloudScoutProvider implements ScoutProvider {
	private bridge?: CloudScoutBridge;

	capabilities: ProviderCapabilities = {
		id: 'cloud-scout',
		mode: 'cloud',
		requiresNetwork: true,
		supportsToolCalls: true,
		maxContextChars: 128_000
	};

	constructor(options: CloudScoutProviderOptions = {}) {
		this.bridge = options.bridge;
	}

	async available(): Promise<boolean> {
		if (!this.bridge) return false;
		try {
			return await this.bridge.isReachable();
		} catch {
			return false;
		}
	}

	async generate(request: ProviderRequest): Promise<ProviderResponse> {
		if (!this.bridge) {
			throw new Error('CloudScoutProvider has no bridge configured.');
		}

		const payload = {
			hiker: request.pack.hiker,
			frame: request.pack.frame,
			toolInvocations: request.toolInvocations.map((invocation) => ({
				toolId: invocation.toolId,
				summary: invocation.summary,
				confidence: invocation.confidence
			})),
			conversationHistory: [...(request.conversationHistory ?? [])],
			weather: request.pack.weather
		};

		const result = await this.bridge.ask({ prompt: request.prompt, payload });

		return {
			answer: result.answer,
			confidence: result.confidence,
			mode: 'cloud',
			provider: 'cloud-scout',
			additionalReceipts: [],
			additionalConfirmations: [],
			contextUsed: result.contextUsed
		};
	}
}
