<script lang="ts">
	import type { ScoutModelPhase } from '$lib/scout/model-download-phase';
	import Icon from './Icon.svelte';

	interface Props {
		phase: ScoutModelPhase;
		onRetry: () => void;
		onAllowMetered: () => void;
		onDismissMetered: () => void;
		onCancel: () => void;
	}

	let { phase, onRetry, onAllowMetered, onDismissMetered, onCancel }: Props = $props();
</script>

{#if phase.kind === 'downloading' || phase.kind === 'metered' || phase.kind === 'error'}
	<div class="message assistant model-status" role="status" aria-live="polite">
		<div class="message-head">
			<span class="bot-mark" aria-hidden="true"><Icon name="scout" size={14} stroke={2} /></span>
			<strong>Scout</strong>
			<span class="status-chip">Model</span>
		</div>

		{#if phase.kind === 'downloading'}
			<p>
				Downloading my on-device model{phase.percent !== null ? ` — ${phase.percent}%` : '…'}
			</p>
			<div class="download-bar" aria-hidden="true">
				<div class="fill" style:width={phase.percent !== null ? `${phase.percent}%` : '38%'}></div>
			</div>
			<div class="download-meta">
				<span>{phase.bytesLabel}</span>
				<button type="button" onclick={onCancel}>Cancel</button>
			</div>
		{:else if phase.kind === 'metered'}
			<p>
				I can download my on-device model over
				{phase.connectionType === 'cellular' ? 'cellular' : 'this metered connection'}.
				It is about {phase.modelSize}.
			</p>
			<div class="status-actions">
				<button type="button" class="secondary" onclick={onDismissMetered}>Wait for Wi-Fi</button>
				<button type="button" onclick={onAllowMetered}>Download anyway</button>
			</div>
		{:else}
			<p>Model download hit a snag.</p>
			<small>{phase.detail}</small>
			<div class="status-actions">
				<button type="button" onclick={onRetry}>Retry download</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.message {
		max-width: 88%;
		padding: 11px 13px;
		border-radius: 16px;
		display: grid;
		gap: 6px;
		box-shadow: var(--shadow-soft);
	}

	.assistant {
		background: var(--surface);
		border: 1px solid var(--line);
	}

	.model-status {
		border-color: color-mix(in srgb, var(--forest) 26%, var(--line));
		background: color-mix(in srgb, var(--forest) 5%, var(--surface));
	}

	.message-head {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.bot-mark {
		width: 20px;
		height: 20px;
		border-radius: 999px;
		background: linear-gradient(135deg, var(--forest), var(--moss));
		color: #f7f2e8;
		display: grid;
		place-items: center;
	}

	.message-head strong {
		font-size: 0.82rem;
		color: var(--forest);
	}

	.model-status p {
		font-size: 0.92rem;
		line-height: 1.4;
	}

	.status-chip {
		margin-left: auto;
		padding: 3px 7px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
		font-size: 0.62rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.download-bar {
		height: 8px;
		border-radius: 999px;
		overflow: hidden;
		background: var(--line);
	}

	.download-bar .fill {
		height: 100%;
		min-width: 18%;
		border-radius: inherit;
		background: var(--forest);
		transition: width 0.2s ease;
	}

	.download-meta,
	.status-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.download-meta span,
	.model-status small {
		color: var(--muted);
		font-size: 0.76rem;
	}

	.model-status button {
		min-height: 44px;
		padding: 7px 11px;
		border-radius: 10px;
		background: var(--forest);
		color: #fffaf0;
		font-size: 0.78rem;
		font-weight: 800;
	}

	.model-status button.secondary {
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}
</style>
