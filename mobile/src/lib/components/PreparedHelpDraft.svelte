<script lang="ts">
	import { copyHandoffText } from '$lib/text-handoff';

	let {
		text,
		newRequestBusy = false,
		onStartNew
	}: {
		text: string;
		newRequestBusy?: boolean;
		onStartNew: () => void;
	} = $props();
	let copyBusy = $state(false);
	let copyNote = $state('');

	async function copyHelpDetails() {
		if (copyBusy || !text) return;
		copyBusy = true;
		try {
			const outcome = await copyHandoffText({ title: 'Need help', text });
			copyNote =
				outcome === 'copied'
					? 'Help details copied. Paste them into a message and send it yourself.'
					: 'Copy is unavailable. Select the prepared text and use call, text, 911, or your emergency device directly.';
		} finally {
			copyBusy = false;
		}
	}
</script>

<div class="help-draft">
	<strong>Prepared help details — not confirmed sent</strong>
	<pre>{text}</pre>
	<div class="draft-actions">
		<button class="copy-button" type="button" disabled={copyBusy || newRequestBusy} onclick={() => void copyHelpDetails()}>
			{copyBusy ? 'Copying…' : 'Copy help details'}
		</button>
		<button class="new-button" type="button" disabled={copyBusy || newRequestBusy} onclick={onStartNew}>
			{newRequestBusy ? 'Starting…' : 'Start new help request'}
		</button>
	</div>
	<small>Starting a new request logs another local need-help check-in and uses your current saved mile.</small>
	{#if copyNote}<p role="status">{copyNote}</p>{/if}
</div>

<style>
	.help-draft {
		display: grid;
		gap: 7px;
		min-width: 0;
		padding: 10px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}
	strong {
		font-size: var(--text-floor);
		color: var(--danger);
	}
	pre {
		max-width: 100%;
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font: inherit;
		font-size: var(--text-floor);
		line-height: 1.45;
		color: var(--text);
		user-select: text;
	}
	.draft-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 7px;
	}
	.copy-button,
	.new-button {
		min-height: 40px;
		padding: 0 12px;
		border-radius: var(--radius-control);
		font-size: var(--text-floor);
		font-weight: 800;
	}
	.copy-button {
		border: 1px solid var(--danger);
		color: var(--danger);
	}
	.new-button {
		border: 1px solid var(--line);
		color: var(--forest);
	}
	small {
		font-size: var(--text-floor);
		line-height: 1.35;
		color: var(--muted);
	}
	p {
		margin: 0;
		font-size: var(--text-floor);
		font-weight: 700;
		line-height: 1.4;
		color: var(--forest);
	}
</style>
