<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import BibleReader from './BibleReader.svelte';

	type Section = 'guide' | 'bible' | 'journal' | 'gear';
	let section = $state<Section>('guide');

	const sections: Array<{ key: Section; label: string }> = [
		{ key: 'guide', label: 'Guide' },
		{ key: 'bible', label: 'Bible' },
		{ key: 'journal', label: 'Journal' },
		{ key: 'gear', label: 'Gear' }
	];

	const guide = $derived(trailAssistant.fieldPack.guideExcerpts);
	const journal = $derived(trailAssistant.checkInHistory);
	const loadout = $derived(trailAssistant.fieldPack.loadout);
	const carried = $derived(loadout.filter((item) => item.carried));
	const totalLb = $derived(
		(carried.reduce((sum, item) => sum + (item.weightOz ?? 0), 0) / 16).toFixed(1)
	);

	function fmtTime(iso: string): string {
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? iso
			: d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}
</script>

<div class="trail">
	<header class="trail-head">
		<h1>Trail</h1>
		<p>Your offline library: the field guide, scripture, your journal, and your pack.</p>
	</header>

	<div class="segmented" role="tablist" aria-label="Trail sections">
		{#each sections as s (s.key)}
			<button
				class="seg"
				class:active={section === s.key}
				type="button"
				role="tab"
				aria-selected={section === s.key}
				onclick={() => (section = s.key)}
			>
				{s.label}
			</button>
		{/each}
	</div>

	{#if section === 'guide'}
		<div class="stack">
			{#if guide.length}
				{#each guide as excerpt (excerpt.id)}
					<article class="card entry">
						<h3>{excerpt.title}</h3>
						<p class="body">{excerpt.body}</p>
						{#if excerpt.tags.length}
							<div class="tags">
								{#each excerpt.tags as tag (tag)}<span class="tag">{tag}</span>{/each}
							</div>
						{/if}
						{#if excerpt.citation}<p class="cite">{excerpt.citation}</p>{/if}
					</article>
				{/each}
			{:else}
				<p class="empty">No field guide entries in the loaded pack yet.</p>
			{/if}
		</div>
	{:else if section === 'bible'}
		<BibleReader />
	{:else if section === 'journal'}
		<div class="stack">
			{#if journal.length}
				{#each journal as entry (entry.id)}
					<article class="card entry">
						<div class="entry-top">
							<strong>{entry.location || `Mile ${entry.mile.toFixed(1)}`}</strong>
							<span class="status status-{entry.status}">{entry.status}</span>
						</div>
						<p class="entry-meta">{fmtTime(entry.timestamp)} · Mile {entry.mile.toFixed(1)}</p>
						{#if entry.note}<p class="body">{entry.note}</p>{/if}
					</article>
				{/each}
			{:else}
				<p class="empty">No check-ins logged yet. They'll appear here as you check in.</p>
			{/if}
		</div>
	{:else}
		<div class="stack">
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
	{/if}
</div>

<style>
	.trail {
		display: grid;
		gap: 14px;
	}

	.trail-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.trail-head p {
		font-size: 0.84rem;
		color: var(--muted);
		margin-top: 2px;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		padding: 4px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.07);
	}

	.seg {
		min-height: 36px;
		border-radius: 9px;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--muted);
	}

	.seg.active {
		background: var(--bg, #fffdf8);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}

	.stack {
		display: grid;
		gap: 10px;
	}

	.entry {
		padding: 12px 14px;
		display: grid;
		gap: 6px;
	}

	.entry h3 {
		font-family: var(--font-display);
		font-size: 1rem;
	}

	.body {
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--ink);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.tag {
		font-size: 0.66rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}

	.cite {
		font-size: 0.72rem;
		color: var(--muted);
	}

	.empty {
		color: var(--muted);
		font-size: 0.86rem;
		padding: 6px 2px;
	}

	.entry-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.entry-meta {
		font-size: 0.74rem;
		color: var(--muted);
	}

	.status {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.status-delayed {
		background: rgba(200, 154, 74, 0.18);
		color: #8c5d1f;
	}

	.status-need-help {
		background: rgba(177, 74, 61, 0.16);
		color: var(--clay, #b14a3d);
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
</style>
