import { NoScoutModelAvailableError } from './model-router.ts';
import { runToolsFor } from './tool-registry.ts';
import type {
	RequiredConfirmation,
	SafetyFlag,
	ScoutAnswer,
	ScoutAskInput,
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
		await this.options.store.load();
		const pack = this.options.store.get();

		const toolInvocations = await runToolsFor(input.prompt, pack, this.options.registry, now);

		const decision = await this.options.router.pick({
			onlineStatus: input.onlineStatus,
			batterySaver: input.batterySaver ?? false,
			allowCloud: input.allowCloud ?? false,
			preferredMode: input.preferredMode
		});

		let providerResponse;
		try {
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
		} catch (error) {
			const failedOnDevice = decision.provider.capabilities.id === 'on-device-gemma';
			if (failedOnDevice) {
				// The native engine reported available but generate() threw (e.g. a
				// cold/flaky LiteRT init). Reset the cached positive so the next turn
				// re-probes instead of re-selecting an engine that just failed.
				const onDevice = this.options.router
					.providers()
					.find((p) => p.capabilities.id === 'on-device-gemma') as InvalidatableProvider | undefined;
				onDevice?.invalidateAvailability?.();
			}

			throw error;
		}

		const receipts = mergeReceipts(toolInvocations, providerResponse.additionalReceipts ?? []);
		const confirmations = mergeConfirmations(toolInvocations, providerResponse.additionalConfirmations ?? []);
		const safetyFlags = mergeSafetyFlags(toolInvocations, providerResponse.additionalSafetyFlags ?? []);

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
