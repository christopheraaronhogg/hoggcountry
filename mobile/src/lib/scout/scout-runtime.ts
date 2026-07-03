import { NoScoutModelAvailableError } from './model-router.ts';
import { runToolsFor } from './tool-registry.ts';
import type {
	RequiredConfirmation,
	SafetyFlag,
	ScoutAnswer,
	ScoutAskInput,
	ScoutDiagnosticEvent,
	ScoutProvider,
	ScoutRuntime,
	ScoutRuntimeOptions,
	SourceReceipt,
	TokenSink,
	ToolInvocationRecord
} from './types.ts';

/** A provider that can reset a cached availability probe (the on-device one). */
type InvalidatableProvider = ScoutProvider & { invalidateAvailability?: () => void };

export class DefaultScoutRuntime implements ScoutRuntime {
	private readonly clock: () => Date;

	constructor(private readonly options: ScoutRuntimeOptions) {
		this.clock = options.clock ?? (() => new Date());
	}

	async ask(input: ScoutAskInput, onToken?: TokenSink): Promise<ScoutAnswer> {
		const now = this.clock();
		const startedAt = Date.now();
		let phase = 'load_pack';
		let decision: { provider: ScoutProvider; reason: string } | null = null;

		this.emit('ask_started', 'info', {
			prompt_chars: input.prompt.length,
			conversation_turns: input.conversationHistory?.length ?? 0,
			online_status: input.onlineStatus,
			battery_saver: input.batterySaver ?? false,
			allow_cloud: input.allowCloud ?? false,
			preferred_mode: input.preferredMode ?? null
		});

		try {
			await this.options.store.load();
			const pack = this.options.store.get();

			phase = 'tools';
			const toolInvocations = await runToolsFor(input.prompt, pack, this.options.registry, now);
			this.emit('tools_ready', 'debug', {
				tool_ids: toolInvocations.map((tool) => tool.toolId),
				tool_count: toolInvocations.length,
				receipt_count: toolInvocations.reduce((sum, tool) => sum + tool.receipts.length, 0),
				confirmation_count: toolInvocations.reduce((sum, tool) => sum + (tool.confirmations?.length ?? 0), 0),
				safety_flag_count: toolInvocations.reduce((sum, tool) => sum + (tool.safetyFlags?.length ?? 0), 0),
				hiker_mile_bucket_10: Math.round(pack.hiker.currentMile / 10) * 10,
				field_pack_source: pack.frame.source,
				downloaded_region_count: pack.downloadedRegions.length
			});

			phase = 'router';
			decision = await this.options.router.pick({
				onlineStatus: input.onlineStatus,
				batterySaver: input.batterySaver ?? false,
				allowCloud: input.allowCloud ?? false,
				preferredMode: input.preferredMode
			});
			this.emit('provider_selected', 'info', {
				provider: decision.provider.capabilities.id,
				mode: decision.provider.capabilities.mode,
				requires_network: decision.provider.capabilities.requiresNetwork,
				router_reason: decision.reason
			});

			phase = 'provider_generate';
			let providerResponse;
			providerResponse = await decision.provider.generate(
				{
					prompt: input.prompt,
					conversationHistory: [...(input.conversationHistory ?? [])],
					pack,
					toolInvocations,
					now
				},
				onToken
			);

			const receipts = mergeReceipts(toolInvocations, providerResponse.additionalReceipts ?? []);
			const confirmations = mergeConfirmations(toolInvocations, providerResponse.additionalConfirmations ?? []);
			const safetyFlags = mergeSafetyFlags(toolInvocations, providerResponse.additionalSafetyFlags ?? []);

			this.emit('ask_succeeded', 'info', {
				provider: providerResponse.provider,
				mode: providerResponse.mode,
				confidence: providerResponse.confidence,
				receipt_count: receipts.length,
				confirmation_count: confirmations.length,
				safety_flag_count: safetyFlags.length,
				context_used: providerResponse.contextUsed,
				duration_ms: Date.now() - startedAt
			});

			return {
				answer: providerResponse.answer,
				confidence: providerResponse.confidence,
				mode: providerResponse.mode,
				provider: providerResponse.provider,
				receipts,
				toolInvocations,
				requiredConfirmations: confirmations,
				safetyFlags,
				contextUsed: providerResponse.contextUsed,
				generatedAt: now.toISOString()
			};
		} catch (error) {
			if (phase === 'provider_generate' && decision?.provider.capabilities.id === 'on-device-gemma') {
				// The native engine reported available but generate() threw (e.g. a
				// cold/flaky LiteRT init). Reset the cached positive so the next turn
				// re-probes instead of re-selecting an engine that just failed.
				const onDevice = this.options.router
					.providers()
					.find((p) => p.capabilities.id === 'on-device-gemma') as InvalidatableProvider | undefined;
				onDevice?.invalidateAvailability?.();
			}

			this.emit('ask_failed', 'error', {
				phase,
				provider: decision?.provider.capabilities.id ?? null,
				mode: decision?.provider.capabilities.mode ?? null,
				duration_ms: Date.now() - startedAt,
				...describeError(error)
			});

			throw error;
		}
	}

	private emit(name: string, severity: ScoutDiagnosticEvent['severity'], context: Record<string, unknown>): void {
		const sink = this.options.diagnostics;
		if (!sink) return;
		try {
			void Promise.resolve(sink({ name, severity, context })).catch(() => {
				// Telemetry must never affect the answer path.
			});
		} catch {
			// Telemetry must never affect the answer path.
		}
	}
}

export { NoScoutModelAvailableError };

function mergeReceipts(records: ToolInvocationRecord[], extras: SourceReceipt[]): SourceReceipt[] {
	const map = new Map<string, SourceReceipt>();
	for (const record of records) {
		for (const receipt of record.receipts) {
			if (!map.has(receipt.id)) map.set(receipt.id, receipt);
		}
	}
	for (const receipt of extras) {
		if (!map.has(receipt.id)) map.set(receipt.id, receipt);
	}
	return Array.from(map.values());
}

function mergeConfirmations(
	records: ToolInvocationRecord[],
	extras: RequiredConfirmation[]
): RequiredConfirmation[] {
	const map = new Map<string, RequiredConfirmation>();
	for (const record of records) {
		const recordConfirmations = (record as ToolInvocationRecord & { confirmations?: RequiredConfirmation[] }).confirmations;
		if (recordConfirmations) {
			for (const confirmation of recordConfirmations) {
				if (!map.has(confirmation.id)) map.set(confirmation.id, confirmation);
			}
		}
	}
	for (const confirmation of extras) {
		if (!map.has(confirmation.id)) map.set(confirmation.id, confirmation);
	}
	return Array.from(map.values());
}

function mergeSafetyFlags(records: ToolInvocationRecord[], extras: SafetyFlag[]): SafetyFlag[] {
	const map = new Map<string, SafetyFlag>();
	for (const record of records) {
		for (const flag of record.safetyFlags ?? []) {
			if (!map.has(flag.id)) map.set(flag.id, flag);
		}
	}
	for (const flag of extras) {
		if (!map.has(flag.id)) map.set(flag.id, flag);
	}
	return Array.from(map.values());
}

function describeError(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			error_name: error.name,
			error_summary: error.message.slice(0, 240)
		};
	}

	return {
		error_name: typeof error,
		error_summary: String(error).slice(0, 240)
	};
}
