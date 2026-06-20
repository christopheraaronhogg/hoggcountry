<script lang="ts">
	import type { SourceReceipt } from './source-receipts';
	import { sourceConfidenceLabels } from './source-receipts';

	let { source }: { source: SourceReceipt } = $props();
</script>

<span class="source-chip" data-confidence={source.confidence}>
	<span class="source-dot" aria-hidden="true"></span>
	<span class="source-meta">
		<span class="source-label">{source.label}</span>
		<span class="source-detail">{sourceConfidenceLabels[source.confidence]} · {source.freshness}</span>
	</span>
</span>

<style>
	.source-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: 999px;
		background: rgba(95, 128, 144, 0.1);
		border: 1px solid rgba(95, 128, 144, 0.18);
		color: var(--ink);
		min-width: 0;
	}

	.source-chip[data-confidence='medium'] {
		background: rgba(200, 167, 122, 0.18);
		border-color: rgba(200, 167, 122, 0.32);
	}

	.source-chip[data-confidence='low'] {
		background: rgba(170, 104, 67, 0.14);
		border-color: rgba(170, 104, 67, 0.3);
	}

	.source-chip[data-confidence='draft'] {
		background: rgba(154, 59, 47, 0.1);
		border-color: rgba(154, 59, 47, 0.28);
	}

	.source-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--sky);
		flex-shrink: 0;
	}

	.source-chip[data-confidence='medium'] .source-dot {
		background: #b6892c;
	}

	.source-chip[data-confidence='low'] .source-dot {
		background: var(--clay);
	}

	.source-chip[data-confidence='draft'] .source-dot {
		background: var(--danger);
	}

	.source-meta {
		display: grid;
		gap: 1px;
		min-width: 0;
	}

	.source-label {
		font-size: var(--text-floor);
		font-weight: 700;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.source-detail {
		font-size: var(--text-floor);
		font-weight: 600;
		color: var(--muted);
		letter-spacing: 0.02em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
