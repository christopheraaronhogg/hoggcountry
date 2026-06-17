import type {
	ProviderRequest,
	ProviderResponse,
	RequiredConfirmation,
	ScoutConfidence,
	ScoutProvider,
	SourceReceipt,
	ToolInvocationRecord
} from '../types.ts';

const STALE_PACK_HOURS = 72;
const VOLATILE_KEYWORDS = ['weather', 'wind', 'cold', 'rain', 'storm', 'open', 'closed', 'shuttle'];

function rankConfidence(records: ToolInvocationRecord[]): ScoutConfidence {
	if (!records.length) return 'draft';
	const order: ScoutConfidence[] = ['draft', 'low', 'medium', 'high'];
	let best: ScoutConfidence = 'draft';
	for (const record of records) {
		if (order.indexOf(record.confidence) > order.indexOf(best)) {
			best = record.confidence;
		}
	}
	return best;
}

function downgrade(confidence: ScoutConfidence): ScoutConfidence {
	const order: ScoutConfidence[] = ['draft', 'low', 'medium', 'high'];
	const idx = Math.max(0, order.indexOf(confidence) - 1);
	return order[idx]!;
}

function uniqueReceipts(records: ToolInvocationRecord[], extras: SourceReceipt[] = []): SourceReceipt[] {
	const seen = new Map<string, SourceReceipt>();
	for (const record of records) {
		for (const receipt of record.receipts) {
			if (!seen.has(receipt.id)) seen.set(receipt.id, receipt);
		}
	}
	for (const receipt of extras) {
		if (!seen.has(receipt.id)) seen.set(receipt.id, receipt);
	}
	return Array.from(seen.values());
}

function packAgeHours(generatedAt: string, now: Date): number {
	const ts = new Date(generatedAt).getTime();
	if (Number.isNaN(ts)) return Infinity;
	return (now.getTime() - ts) / (60 * 60 * 1000);
}

export class DeterministicFallbackProvider implements ScoutProvider {
	capabilities = {
		id: 'deterministic-fallback' as const,
		mode: 'offline-local' as const,
		requiresNetwork: false,
		supportsToolCalls: true,
		maxContextChars: 32_000
	};

	available(): boolean {
		return true;
	}

	generate(request: ProviderRequest): ProviderResponse {
		const { prompt, pack, toolInvocations, now } = request;
		const lower = prompt.toLowerCase();

		const lines: string[] = [];
		const contextUsed: string[] = [];
		const confirmations: RequiredConfirmation[] = [];

		if (toolInvocations.length) {
			for (const record of toolInvocations) {
				lines.push(`- ${record.summary}`);
				contextUsed.push(record.toolId);
			}
		} else {
			lines.push(
				`Working from the cached Hogg Country pack near mile ${pack.hiker.currentMile.toFixed(1)}. Offline answers are based on stored landmarks and guide excerpts — confirm anything volatile from a current source.`
			);
			contextUsed.push('default-pack');
		}

		if (VOLATILE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
			confirmations.push({
				id: 'volatile-current-source',
				prompt: 'Confirm against a current source (NWS, ATC, FarOut comments) before depending on this.',
				reason: 'volatile'
			});
		}

		const ageHours = packAgeHours(pack.generatedAt, now);
		if (ageHours > STALE_PACK_HOURS) {
			confirmations.push({
				id: 'stale-pack',
				prompt: `The loaded trail pack is ${Math.round(ageHours)}h old — refresh when connectivity allows.`,
				reason: 'stale-cache'
			});
		}

		let confidence = rankConfidence(toolInvocations);
		if (confirmations.length) confidence = downgrade(confidence);

		const answerHeader = buildAnswerHeader(prompt, pack);
		const answer = [answerHeader, ...lines].join('\n');

		return {
			answer,
			confidence,
			mode: 'offline-local',
			provider: 'deterministic-fallback',
			additionalReceipts: uniqueReceipts(toolInvocations, pack.sourceReceipts ?? []),
			additionalConfirmations: confirmations,
			contextUsed
		};
	}
}

function buildAnswerHeader(prompt: string, pack: ProviderRequest['pack']): string {
	const lower = prompt.toLowerCase();
	const mile = pack.hiker.currentMile.toFixed(1);

	if (lower.includes('water')) return `Water plan from mile ${mile}:`;
	if (lower.includes('town') || lower.includes('resupply')) return `Town plan from mile ${mile}:`;
	if (lower.includes('shelter') || lower.includes('camp')) return `Shelter plan from mile ${mile}:`;
	if (lower.includes('weather') || lower.includes('wind') || lower.includes('cold')) return `Weather read from mile ${mile}:`;
	if (lower.includes('push') || lower.includes('miles') || lower.includes('pace')) return `Mileage call from mile ${mile}:`;
	if (lower.includes('pack') || lower.includes('gear')) return `Loadout snapshot:`;
	if (lower.includes('safe') || lower.includes('risk') || lower.includes('bail')) return `Safety read from mile ${mile}:`;
	return `Offline read from mile ${mile}:`;
}
