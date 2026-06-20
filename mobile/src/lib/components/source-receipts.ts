import type {
	ScoutConfidence,
	SourceReceipt as RuntimeSourceReceipt
} from '$lib/scout';

export type SourceConfidence = ScoutConfidence;

export interface SourceReceipt {
	id: string;
	label: string;
	provider: string;
	confidence: SourceConfidence;
	freshness: string;
	verify?: string;
}

export const sourceConfidenceLabels: Record<SourceConfidence, string> = {
	high: 'Verified',
	medium: 'Likely',
	low: 'Soft',
	draft: 'Unverified'
};

export function defaultReceiptConfidence(kind: RuntimeSourceReceipt['kind']): SourceConfidence {
	if (kind === 'official' || kind === 'hiker-input') return 'high';
	if (kind === 'trail-pack' || kind === 'field-guide' || kind === 'cached-weather') return 'medium';
	return 'low';
}

export function receiptProvider(kind: RuntimeSourceReceipt['kind']): string {
	if (kind === 'official') return 'Official source';
	if (kind === 'field-guide') return 'Field guide';
	if (kind === 'cached-weather') return 'Cached weather';
	if (kind === 'hiker-input') return 'Your log';
	if (kind === 'trail-pack') return 'On-device trail pack';
	if (kind === 'scripture') return 'KJV PCE corpus';
	return 'Derived';
}

export function receiptFreshness(receipt: RuntimeSourceReceipt): string {
	if (receipt.generatedAt) {
		return `Generated ${new Date(receipt.generatedAt).toLocaleDateString([], {
			month: 'short',
			day: 'numeric'
		})}`;
	}
	if (receipt.miles) {
		const to = receipt.miles.to ?? receipt.miles.from;
		return `Miles ${receipt.miles.from.toFixed(1)}-${to.toFixed(1)}`;
	}
	return 'Local context';
}

export function toUiSourceReceipt(
	receipt: RuntimeSourceReceipt,
	confidence: SourceConfidence = defaultReceiptConfidence(receipt.kind)
): SourceReceipt {
	return {
		id: receipt.id,
		label: receipt.title,
		provider: receipt.citation ?? receiptProvider(receipt.kind),
		confidence,
		freshness: receiptFreshness(receipt),
		verify: receipt.url
	};
}
