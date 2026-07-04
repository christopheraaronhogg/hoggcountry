<script lang="ts">
	import { onMount } from 'svelte';
	import {
		flushScoutDiagnostics,
		getScoutDiagnosticsSnapshot,
		type ScoutDiagnosticsSnapshot
	} from '$lib/scout/scout-diagnostics';

	let snapshot = $state<ScoutDiagnosticsSnapshot | null>(null);
	let busy = $state(false);
	let status = $state<string | null>(null);
	let exportTextarea = $state<HTMLTextAreaElement | null>(null);

	const savedLabel = $derived(snapshot ? `${snapshot.event_count} saved` : 'Checking');
	const queuedLabel = $derived(snapshot ? `${snapshot.queued_count} waiting` : 'Checking');
	const latestLabel = $derived.by(() => {
		const latest = snapshot?.events.at(-1);
		if (!latest) return 'No Scout events saved yet';
		const time = new Date(latest.occurred_at).toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit'
		});
		return `${latest.name} · ${time}`;
	});
	const exportText = $derived(snapshot ? JSON.stringify(snapshot, null, 2) : '');

	onMount(() => {
		refresh();
	});

	function refresh() {
		snapshot = getScoutDiagnosticsSnapshot();
	}

	async function sendNow() {
		if (busy) return;
		busy = true;
		status = null;
		try {
			await flushScoutDiagnostics();
			refresh();
			status = snapshot?.queued_count
				? `${snapshot.queued_count} Scout event${snapshot.queued_count === 1 ? '' : 's'} waiting for signal.`
				: 'Scout diagnostics sent, or the queue is already clear.';
		} catch {
			status = 'Scout diagnostics could not send yet.';
		} finally {
			busy = false;
		}
	}

	async function shareDiagnostics() {
		refresh();
		if (!snapshot || !exportText) return;
		const fileName = `scout-diagnostics-${snapshot.generated_at.replace(/[:.]/g, '-')}.json`;
		const title = 'Scout diagnostics';
		const text = `Scout diagnostics from build ${snapshot.events.at(-1)?.app_build ?? 'unknown'} (${snapshot.event_count} events).`;

		try {
			if (navigator.share) {
				const file = new File([exportText], fileName, { type: 'application/json' });
				const fileShare: ShareData = { title, text, files: [file] };
				if (!navigator.canShare || navigator.canShare(fileShare)) {
					await navigator.share(fileShare);
				} else {
					await navigator.share({ title, text: exportText });
				}
				status = 'Scout diagnostics ready to send.';
				return;
			}
			await copyDiagnostics();
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			await copyDiagnostics();
		}
	}

	async function copyDiagnostics() {
		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(exportText);
			} else if (exportTextarea) {
				exportTextarea.focus();
				exportTextarea.select();
				const copied = document.execCommand('copy');
				if (!copied) throw new Error('Fallback copy failed.');
			} else {
				throw new Error('Clipboard unavailable.');
			}
			status = 'Scout diagnostics copied.';
		} catch {
			status = 'Copy failed. Select the JSON below.';
		}
	}
</script>

<section class="card diagnostics-card">
	<div class="diagnostics-head">
		<div>
			<p class="eyebrow">Scout diagnostics</p>
			<h2>Last Scout events</h2>
		</div>
		<span class="pill diagnostics-pill">{savedLabel}</span>
	</div>

	<div class="diagnostics-grid">
		<div>
			<span>Queued</span>
			<strong>{queuedLabel}</strong>
		</div>
		<div>
			<span>Latest</span>
			<strong>{latestLabel}</strong>
		</div>
	</div>

	<div class="diagnostics-actions">
		<button class="outline-button compact" type="button" onclick={refresh}>Refresh</button>
		<button class="outline-button compact" type="button" onclick={sendNow} disabled={busy}>
			{busy ? 'Sending…' : 'Send now'}
		</button>
		<button class="cta-button compact" type="button" onclick={shareDiagnostics} disabled={!snapshot}>
			Share log
		</button>
	</div>

	{#if status}
		<p class="diagnostics-status" role="status">{status}</p>
	{/if}

	{#if snapshot?.event_count}
		<textarea bind:this={exportTextarea} readonly value={exportText} aria-label="Scout diagnostics JSON"></textarea>
	{/if}
</section>

<style>
	.diagnostics-card {
		display: grid;
		gap: 12px;
		padding: 14px;
	}

	.diagnostics-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 12px;
	}

	.eyebrow {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--moss);
	}

	.diagnostics-head h2 {
		font-family: var(--font-display);
		font-size: 1.16rem;
		line-height: 1.1;
	}

	.diagnostics-pill {
		flex: none;
		background: var(--forest-soft);
		color: var(--forest);
	}

	.diagnostics-grid {
		display: grid;
		grid-template-columns: minmax(94px, 0.85fr) minmax(0, 1.35fr);
		gap: 8px;
	}

	.diagnostics-grid div {
		display: grid;
		gap: 2px;
		min-width: 0;
		padding: 10px;
		border-radius: var(--radius-sm);
		background: var(--ink-soft);
	}

	.diagnostics-grid span {
		font-size: var(--text-floor);
		color: var(--muted);
	}

	.diagnostics-grid strong {
		min-width: 0;
		font-size: 0.86rem;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.diagnostics-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.diagnostics-actions .outline-button.compact,
	.diagnostics-actions .cta-button.compact {
		width: auto;
		min-height: 44px;
		padding: 9px 14px;
		font-size: 0.84rem;
	}

	.diagnostics-actions button:disabled {
		opacity: 0.55;
	}

	.diagnostics-status {
		font-size: 0.84rem;
		color: var(--muted);
	}

	textarea {
		width: 100%;
		min-height: 80px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 10px;
		background: var(--surface);
		color: var(--ink);
		font: 0.72rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	}

	@media (max-width: 390px) {
		.diagnostics-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
