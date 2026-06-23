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
	/* Mode-aware confidence surfaces — the old baked rgba() values were fixed
	   light-mode tints that washed out in dark mode, exactly where offline source
	   attribution (Scout's trust surface) matters most. */
	.source-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: 999px;
		background: var(--sky-soft);
		border: 1px solid color-mix(in srgb, var(--sky) 30%, transparent);
		color: var(--ink);
		min-width: 0;
	}

	.source-chip[data-confidence='medium'] {
		background: var(--warn-soft);
		border-color: color-mix(in srgb, var(--warn) 38%, transparent);
	}

	.source-chip[data-confidence='low'] {
		background: var(--clay-soft);
		border-color: color-mix(in srgb, var(--clay) 36%, transparent);
	}

	.source-chip[data-confidence='draft'] {
		background: var(--danger-soft);
		border-color: color-mix(in srgb, var(--danger) 34%, transparent);
	}

	.source-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--sky);
		flex-shrink: 0;
	}

	.source-chip[data-confidence='medium'] .source-dot {
		background: var(--warn);
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
