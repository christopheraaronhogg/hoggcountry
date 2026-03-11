<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
</script>

<header class="header card">
	<div class="header-top">
		<div class="network-pill">
			<span class:status-online={trailAssistant.onlineStatus} class:status-offline={!trailAssistant.onlineStatus} class="status-dot"></span>
			<span>{trailAssistant.onlineStatus ? 'Online' : 'Offline ready'}</span>
		</div>

		<div class="sync-pill">{trailAssistant.syncLabel}</div>
	</div>

	<div class="brand-row">
		<div class="brand-copy">
			<p class="eyebrow">Hogg Country</p>
			<h1>Trail Assistant</h1>
			<p>Mile {trailAssistant.currentMile.toFixed(1)} · Day {trailAssistant.dayNumber}</p>
		</div>

		<div class="avatar">HC</div>
	</div>

	<div class="meta-row">
		<span>Last sync {formatTime(trailAssistant.lastSyncAt)}</span>
		<span>Check-in due {formatTime(trailAssistant.nextCheckInDueAt)}</span>
	</div>
</header>

<style>
	.header {
		border-radius: 0 0 22px 22px;
		border-top: 0;
		border-left: 0;
		border-right: 0;
		padding: 14px 18px 16px;
		background:
			linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(248, 243, 233, 0.96)),
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.12), transparent 42%);
		box-shadow: 0 10px 18px rgba(64, 53, 38, 0.06);
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.header-top,
	.brand-row,
	.meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-top {
		margin-bottom: 14px;
	}

	.network-pill,
	.sync-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 11px;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 700;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}

	.sync-pill {
		background: rgba(95, 128, 144, 0.1);
		color: var(--sky);
	}

	.brand-row {
		gap: 12px;
	}

	.brand-copy {
		display: grid;
		gap: 4px;
	}

	.brand-copy h1 {
		font-family: var(--font-display);
		font-size: 1.55rem;
		line-height: 1;
	}

	.brand-copy p:last-child {
		font-size: 0.88rem;
		color: var(--muted);
	}

	.avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--sand), #b88457);
		color: #fffaf0;
		display: grid;
		place-items: center;
		font-size: 0.82rem;
		font-weight: 800;
		box-shadow: var(--shadow-soft);
	}

	.meta-row {
		margin-top: 14px;
		font-size: 0.76rem;
		color: var(--muted);
	}
</style>
