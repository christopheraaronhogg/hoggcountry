<script lang="ts">
	import type { SourceConfidence } from './fieldData';
	import { sourceConfidenceLabels } from './fieldData';

	let {
		confidence,
		short = false
	}: { confidence: SourceConfidence; short?: boolean } = $props();
</script>

<span class="confidence-badge" data-confidence={confidence} title={sourceConfidenceLabels[confidence]}>
	<span class="bar"></span>
	<span class="bar"></span>
	<span class="bar"></span>
	{#if !short}
		<span class="label">{sourceConfidenceLabels[confidence]}</span>
	{/if}
</span>

<style>
	.confidence-badge {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 4px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--forest);
		white-space: nowrap;
	}

	.bar {
		width: 3px;
		height: 9px;
		border-radius: 2px;
		background: rgba(47, 75, 53, 0.18);
	}

	.confidence-badge[data-confidence='high'] .bar {
		background: var(--success);
	}

	.confidence-badge[data-confidence='medium'] {
		background: rgba(200, 167, 122, 0.2);
		color: #8c5d1f;
	}
	.confidence-badge[data-confidence='medium'] .bar:nth-child(1),
	.confidence-badge[data-confidence='medium'] .bar:nth-child(2) {
		background: #b6892c;
	}

	.confidence-badge[data-confidence='low'] {
		background: rgba(170, 104, 67, 0.14);
		color: var(--clay);
	}
	.confidence-badge[data-confidence='low'] .bar:nth-child(1) {
		background: var(--clay);
	}

	.confidence-badge[data-confidence='draft'] {
		background: rgba(154, 59, 47, 0.12);
		color: var(--danger);
	}

	.label {
		margin-left: 4px;
	}
</style>
