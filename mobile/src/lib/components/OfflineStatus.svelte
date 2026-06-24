<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	const scoutTier = 'Scout Gemma 4 (compact)';

	const statusLabel = {
		ready: 'Offline ready',
		updating: 'Updating',
		partial: 'Partial pack',
		'cloud-only': 'Cloud only',
		fallback: 'Bundled pack',
		saved: 'Saved pack',
		refreshing: 'Refreshing',
		stale: 'Stale pack',
		error: 'Cached pack'
	} as const;

	function formatRelative(iso: string | null): string {
		if (!iso) return 'Bundled';
		const minutes = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (60 * 1000)));
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	const status = $derived(trailAssistant.fieldPackStatus);
	const packRegions = $derived(trailAssistant.fieldPack.downloadedRegions);
	const receiptCount = $derived(trailAssistant.fieldPack.sourceReceipts?.length ?? 0);
</script>

<section class="offline-card">
	<header>
		<div>
			<p class="eyebrow">{trailAssistant.scoutLaneLabel}</p>
			<strong>{scoutTier}</strong>
		</div>
		<span class="status-pill" data-status={status.state}>
			<span class="dot" aria-hidden="true"></span>
			{statusLabel[status.state]}
		</span>
	</header>

	<dl class="offline-grid">
		<div>
			<dt>Pack source</dt>
			<dd>{status.source}</dd>
		</div>
		<div>
			<dt>Receipts</dt>
			<dd>{receiptCount}</dd>
		</div>
		<div>
			<dt>Loaded</dt>
			<dd>{formatRelative(status.lastLoadedAt)}</dd>
		</div>
		<div>
			<dt>Live signal</dt>
			<dd>{trailAssistant.onlineStatus ? 'Online' : 'Offline'}</dd>
		</div>
	</dl>

	<p class="regions">
		Field packs:
		{#each packRegions as region, index (region)}
			<span>{region}{index < packRegions.length - 1 ? ' · ' : ''}</span>
		{/each}
	</p>

	<p class="note">{status.detail}</p>

	<button
		class="outline-button compact"
		type="button"
		onclick={() => void trailAssistant.refreshFieldPack()}
		disabled={!trailAssistant.onlineStatus || status.state === 'refreshing'}
	>
		{status.state === 'refreshing' ? 'Refreshing...' : 'Refresh field pack'}
	</button>
</section>

<style>
	.offline-card {
		display: grid;
		gap: 12px;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	header strong {
		display: block;
		font-size: 0.98rem;
		margin-top: 4px;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.status-pill[data-status='ready'] .dot {
		background: var(--success);
		box-shadow: 0 0 0 3px rgba(47, 106, 71, 0.18);
	}

	.status-pill[data-status='updating'] {
		background: rgba(95, 128, 144, 0.16);
		color: var(--sky);
	}
	.status-pill[data-status='refreshing'] {
		background: rgba(95, 128, 144, 0.16);
		color: var(--sky);
	}
	.status-pill[data-status='updating'] .dot {
		background: var(--sky);
	}
	.status-pill[data-status='refreshing'] .dot {
		background: var(--sky);
	}

	.status-pill[data-status='partial'] {
		background: rgba(200, 167, 122, 0.22);
		color: #8c5d1f;
	}
	.status-pill[data-status='fallback'],
	.status-pill[data-status='saved'],
	.status-pill[data-status='stale'],
	.status-pill[data-status='error'] {
		background: rgba(200, 167, 122, 0.22);
		color: #8c5d1f;
	}
	.status-pill[data-status='partial'] .dot {
		background: #b6892c;
	}
	.status-pill[data-status='fallback'] .dot,
	.status-pill[data-status='saved'] .dot,
	.status-pill[data-status='stale'] .dot,
	.status-pill[data-status='error'] .dot {
		background: #b6892c;
	}

	.status-pill[data-status='cloud-only'] {
		background: rgba(154, 59, 47, 0.12);
		color: var(--danger);
	}
	.status-pill[data-status='cloud-only'] .dot {
		background: var(--danger);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--success);
	}

	.offline-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
	}

	.offline-grid div {
		display: grid;
		gap: 3px;
		padding: 10px 8px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.06);
	}

	.offline-grid dt {
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		margin: 0;
	}

	.offline-grid dd {
		font-size: 0.86rem;
		font-weight: 800;
		color: var(--ink);
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	.regions {
		font-size: var(--text-floor);
		color: var(--muted);
		margin: 0;
	}

	.note {
		font-size: var(--text-floor);
		color: var(--ink);
		margin: 0;
	}
</style>
