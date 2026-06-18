<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	const loadout = $derived(trailAssistant.fieldPack.loadout);
	const carried = $derived(loadout.filter((item) => item.carried));
	const totalLb = $derived(
		(carried.reduce((sum, item) => sum + (item.weightOz ?? 0), 0) / 16).toFixed(1)
	);
</script>

<div class="gear">
	<header class="gear-head">
		<button class="back" type="button" onclick={() => (trailAssistant.activeTab = 'Today')} aria-label="Back to Today">‹</button>
		<div class="gear-title">
			<h1>Gear</h1>
			<p>What's on your back. Ask Scout to add, drop, or swap an item — it confirms before changing anything.</p>
		</div>
	</header>

	<div class="gear-summary card">
		<div>
			<p class="eyebrow">Carried</p>
			<strong>{totalLb} lb</strong>
		</div>
		<span class="gear-count">{carried.length} of {loadout.length} items</span>
	</div>

	{#if loadout.length}
		<div class="gear-list">
			{#each loadout as item (item.name)}
				<div class="gear-row" class:dropped={!item.carried}>
					<div class="gear-name">
						<strong>{item.name}</strong>
						<span class="gear-cat">{item.category}</span>
						{#if item.note}<span class="gear-note">{item.note}</span>{/if}
					</div>
					<span class="gear-weight tabular">
						{item.weightOz ? `${(item.weightOz / 16).toFixed(1)} lb` : '—'}
					</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty">No loadout in the loaded pack yet.</p>
	{/if}
</div>

<style>
	.gear {
		display: grid;
		gap: 14px;
	}

	.gear-head {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.gear-head .back {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		font-size: 1.4rem;
		line-height: 1;
		color: var(--forest);
		background: rgba(47, 75, 53, 0.08);
		flex: none;
	}

	.gear-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.gear-head p {
		font-size: 0.84rem;
		color: var(--muted);
		margin-top: 2px;
	}

	.gear-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
	}

	.gear-summary .eyebrow {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.gear-summary strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		color: var(--forest);
	}

	.gear-count {
		font-size: 0.78rem;
		color: var(--muted);
		font-weight: 700;
	}

	.gear-list {
		display: grid;
		gap: 1px;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(95, 101, 88, 0.12);
	}

	.gear-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 14px;
		background: var(--bg, #fffdf8);
	}

	.gear-row.dropped {
		opacity: 0.5;
	}

	.gear-name {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.gear-name strong {
		font-size: 0.88rem;
	}

	.gear-cat {
		font-size: 0.68rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 700;
	}

	.gear-note {
		font-size: 0.74rem;
		color: var(--muted);
	}

	.gear-weight {
		font-size: 0.84rem;
		font-weight: 700;
		color: var(--ink);
	}

	.empty {
		color: var(--muted);
		font-size: 0.86rem;
		padding: 6px 2px;
	}
</style>
