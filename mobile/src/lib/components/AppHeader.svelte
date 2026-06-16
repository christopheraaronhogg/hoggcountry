<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { offlineModel } from './cockpitData';

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	// Calibrated AT length per CLAUDE.md (AWOL 2026).
	const trailMiles = 2197.4;
	const percentComplete = $derived(((trailAssistant.currentMile / trailMiles) * 100).toFixed(1));
	const offlineReady = offlineModel.status === 'ready';
</script>

<header class="header">
	<div class="header-top">
		<div class="brand">
			<span class="logo-mark" aria-hidden="true">HC</span>
			<div class="brand-copy">
				<p class="eyebrow">Hogg Country · Scout</p>
				<strong>NOBO Day {trailAssistant.dayNumber}</strong>
			</div>
		</div>

		<div class="status-cluster">
			<span
				class="connection"
				data-online={trailAssistant.onlineStatus}
				title={trailAssistant.onlineStatus ? 'Online' : 'Offline ready'}
			>
				<span class:status-online={trailAssistant.onlineStatus} class:status-offline={!trailAssistant.onlineStatus} class="status-dot"></span>
				{trailAssistant.onlineStatus ? 'Online' : 'Offline'}
			</span>
			<span class="connection" data-offline-ready={offlineReady}>
				<span class="status-dot" style:background={offlineReady ? 'var(--success)' : 'var(--warn)'}></span>
				Scout local
			</span>
		</div>
	</div>

	<div class="mile-row">
		<div class="mile-now">
			<span class="eyebrow">Mile</span>
			<strong class="tabular">{trailAssistant.currentMile.toFixed(1)}</strong>
			<span class="of">/ 2,197.4</span>
		</div>
		<div class="progress-shell" aria-hidden="true">
			<div class="progress-fill" style:width={`${percentComplete}%`}></div>
		</div>
		<div class="mile-meta">
			<span>{percentComplete}% done</span>
			<span>VA · Southern Highlands</span>
		</div>
	</div>

	<div class="meta-row">
		<span>Last sync {formatTime(trailAssistant.lastSyncAt)}</span>
		<span>Check-in {formatTime(trailAssistant.nextCheckInDueAt)}</span>
		<span class="sync-tag" data-state={trailAssistant.syncState}>{trailAssistant.syncLabel}</span>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 20;
		padding: 12px 14px 14px;
		display: grid;
		gap: 10px;
		background:
			linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(245, 238, 224, 0.96)),
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.16), transparent 42%);
		border-bottom: 1px solid rgba(95, 101, 88, 0.14);
		box-shadow: 0 10px 18px -16px rgba(64, 53, 38, 0.45);
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.logo-mark {
		width: 36px;
		height: 36px;
		border-radius: 11px;
		background: linear-gradient(135deg, var(--forest), #3a5f43);
		color: #f7f2e8;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.86rem;
		box-shadow: var(--shadow-soft);
	}

	.brand-copy {
		display: grid;
		gap: 1px;
	}

	.brand-copy strong {
		font-family: var(--font-display);
		font-size: 1rem;
		line-height: 1;
	}

	.status-cluster {
		display: grid;
		gap: 4px;
		justify-items: end;
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--ink);
	}

	.connection {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		letter-spacing: 0.04em;
	}

	.connection[data-online='false'] {
		background: rgba(170, 104, 67, 0.14);
	}

	.connection[data-offline-ready='false'] {
		background: rgba(200, 167, 122, 0.22);
		color: #8c5d1f;
	}

	.mile-row {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		column-gap: 12px;
		row-gap: 6px;
		align-items: center;
	}

	.mile-now {
		grid-row: 1 / span 2;
		display: grid;
		gap: 2px;
		align-items: end;
	}

	.mile-now strong {
		font-family: var(--font-display);
		font-size: 2.1rem;
		font-weight: 800;
		line-height: 0.9;
		color: var(--forest);
	}

	.mile-now .of {
		font-size: 0.74rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.progress-shell {
		grid-column: 2;
		height: 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--forest), var(--moss));
	}

	.mile-meta {
		grid-column: 2;
		display: flex;
		justify-content: space-between;
		font-size: 0.74rem;
		color: var(--muted);
		font-weight: 700;
	}

	.meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.72rem;
		color: var(--muted);
	}

	.sync-tag {
		font-weight: 800;
		padding: 3px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
		letter-spacing: 0.04em;
	}

	.sync-tag[data-state='queued-offline'] {
		background: rgba(170, 104, 67, 0.16);
		color: var(--clay);
	}

	.sync-tag[data-state='syncing'] {
		background: rgba(95, 128, 144, 0.18);
		color: var(--sky);
	}
</style>
