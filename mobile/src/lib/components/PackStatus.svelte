<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	// Real loadout from the field pack — the same source the Today glance and the
	// Gear screen use, so the three never disagree.
	const loadout = $derived(trailAssistant.fieldPack.loadout);
	const carried = $derived(loadout.filter((item) => item.carried));
	const notPacked = $derived(loadout.filter((item) => !item.carried));
	const totalLb = $derived(
		Math.round((carried.reduce((sum, item) => sum + (item.weightOz ?? 0), 0) / 16) * 10) / 10
	);
</script>

<section class="pack-status">
	<header>
		<div>
			<p class="eyebrow">Pack</p>
			<h3>What's on your back</h3>
		</div>
		<div class="pack-totals">
			<div>
				<span class="num">{totalLb}</span>
				<span class="unit">lb</span>
				<small>carried</small>
			</div>
			<div>
				<span class="num" data-flag={notPacked.length > 0 || undefined}>{notPacked.length}</span>
				<small>not packed</small>
			</div>
		</div>
	</header>

	<div class="pack-grid">
		{#if carried.length}
			<ul class="carried-list">
				<p class="list-label">Confirmed on you ({carried.length})</p>
				{#each carried as item (item.name)}
					<li>
						<span>{item.name}</span>
						{#if item.weightOz}<strong>{item.weightOz.toFixed(1)} oz</strong>{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if notPacked.length}
			<ul class="flagged-list">
				<p class="list-label flagged-label">Not packed</p>
				{#each notPacked as item (item.name)}
					<li>
						<div class="flag-top">
							<strong>{item.name}</strong>
							<span class="flag-pill">Not packed</span>
						</div>
						{#if item.note}
							<p>{item.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if !carried.length && !notPacked.length}
			<p class="list-label">No gear loadout in the saved pack yet.</p>
		{/if}
	</div>
</section>

<style>
	.pack-status {
		display: grid;
		gap: 12px;
	}

	header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	header h3 {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.pack-totals {
		display: flex;
		gap: 12px;
		align-items: stretch;
	}

	.pack-totals > div {
		text-align: right;
		display: grid;
		gap: 0;
	}

	.num {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
	}

	.num[data-flag] {
		color: var(--clay);
	}

	.unit {
		font-size: 0.74rem;
		color: var(--muted);
		margin-left: 2px;
	}

	.pack-totals small {
		display: block;
		font-size: 0.62rem;
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.pack-grid {
		display: grid;
		gap: 10px;
	}

	.carried-list,
	.flagged-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}

	.list-label {
		grid-column: 1 / -1;
		margin: 0 0 2px;
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.flagged-label {
		color: var(--clay);
	}

	.carried-list li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
		padding: 6px 10px;
		border-radius: 10px;
		background: rgba(47, 75, 53, 0.06);
		font-size: 0.82rem;
	}

	.carried-list li strong {
		font-size: 0.74rem;
		color: var(--muted);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.flagged-list li {
		display: grid;
		gap: 4px;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px dashed rgba(170, 104, 67, 0.35);
		background: rgba(255, 245, 233, 0.7);
	}

	.flag-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.flag-top strong {
		font-size: 0.88rem;
	}

	.flag-pill {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--clay);
		padding: 4px 8px;
		border-radius: 999px;
		background: rgba(170, 104, 67, 0.16);
	}

	.flagged-list li p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
</style>
