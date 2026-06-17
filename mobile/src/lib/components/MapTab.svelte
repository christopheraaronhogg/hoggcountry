<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import ElevationStrip from './ElevationStrip.svelte';

	// v1 "map" = the linear trail-ahead view (elevation + what's coming, in order).
	// A full interactive tile map with the AT polyline + live position is a
	// follow-up; this gives the spatial picture from the loaded pack today.
	const SPAN = 30;

	type Landmark = {
		kind: 'water' | 'shelter' | 'town';
		name: string;
		mile: number;
		detail: string;
	};

	const glyph: Record<Landmark['kind'], string> = { water: '💧', shelter: '⛺', town: '⌂' };

	const ahead = $derived.by<Landmark[]>(() => {
		const from = trailAssistant.currentMile;
		const pack = trailAssistant.fieldPack;
		const within = <T extends { mile: number }>(items: T[]) =>
			items.filter((i) => i.mile >= from - 0.01 && i.mile <= from + SPAN);

		const items: Landmark[] = [
			...within(pack.water).map((w) => ({
				kind: 'water' as const,
				name: w.name,
				mile: w.mile,
				detail: w.reliability
			})),
			...within(pack.shelters).map((s) => ({
				kind: 'shelter' as const,
				name: s.name,
				mile: s.mile,
				detail: s.note ?? 'Shelter'
			})),
			...within(pack.towns).map((t) => ({
				kind: 'town' as const,
				name: t.name,
				mile: t.mile,
				detail: t.servicesNote ?? t.access
			}))
		];
		return items.sort((a, b) => a.mile - b.mile);
	});

	const nextTown = $derived.by(() => {
		const from = trailAssistant.currentMile;
		return (
			trailAssistant.fieldPack.towns
				.filter((t) => t.mile >= from - 0.01)
				.sort((a, b) => a.mile - b.mile)[0] ?? null
		);
	});

	function dist(mile: number): string {
		return Math.max(0, mile - trailAssistant.currentMile).toFixed(1);
	}

	function askAboutTown() {
		if (!nextTown) return;
		trailAssistant.activeTab = 'Scout';
		trailAssistant.runQuickPrompt(
			`What should I know about ${nextTown.name} for resupply, lodging, and a shuttle?`
		);
	}
</script>

<div class="map">
	<header class="map-head">
		<h1>Map</h1>
		<p>Mile {trailAssistant.currentMile.toFixed(1)} · next {SPAN} mi ahead</p>
	</header>

	<section class="card profile-card">
		<ElevationStrip currentMile={trailAssistant.currentMile} />
		<p class="profile-note">Elevation profile for the trail ahead.</p>
	</section>

	{#if nextTown}
		<section class="card town-card">
			<div class="town-top">
				<div>
					<p class="eyebrow">Next town</p>
					<h2>{nextTown.name}</h2>
					<p class="town-meta">
						Mile {nextTown.mile.toFixed(1)} · {dist(nextTown.mile)} mi ahead · via {nextTown.access}
					</p>
				</div>
			</div>
			{#if nextTown.servicesNote}<p class="town-services">{nextTown.servicesNote}</p>{/if}
			<button class="cta-button compact" type="button" onclick={askAboutTown}>
				Ask Scout about {nextTown.name}
			</button>
		</section>
	{/if}

	<section class="ahead">
		<p class="list-label">Coming up</p>
		<div class="ahead-list">
			{#if ahead.length}
				{#each ahead as item (item.kind + item.name + item.mile)}
					<div class="ahead-row">
						<span class="ahead-glyph" aria-hidden="true">{glyph[item.kind]}</span>
						<div class="ahead-body">
							<strong>{item.name}</strong>
							<span class="ahead-detail">{item.detail}</span>
						</div>
						<span class="ahead-dist tabular">{dist(item.mile)} mi</span>
					</div>
				{/each}
			{:else}
				<p class="empty">No landmarks loaded for the next {SPAN} miles.</p>
			{/if}
		</div>
	</section>
</div>

<style>
	.map {
		display: grid;
		gap: 14px;
	}

	.map-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.map-head p {
		font-size: 0.82rem;
		color: var(--muted);
		margin-top: 2px;
	}

	.profile-card {
		padding: 12px 12px 8px;
		display: grid;
		gap: 6px;
	}

	.profile-note {
		font-size: 0.74rem;
		color: var(--muted);
	}

	.town-card {
		padding: 14px;
		display: grid;
		gap: 10px;
		background:
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.14), transparent 40%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(247, 240, 228, 0.96));
	}

	.town-card .eyebrow {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.town-card h2 {
		font-family: var(--font-display);
		font-size: 1.3rem;
	}

	.town-meta {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.town-services {
		font-size: 0.86rem;
		color: var(--ink);
		line-height: 1.45;
	}

	.cta-button.compact {
		width: auto;
		min-height: 40px;
		padding: 8px 14px;
		font-size: 0.85rem;
		justify-self: start;
	}

	.ahead {
		display: grid;
		gap: 6px;
	}

	.ahead-list {
		display: grid;
		gap: 1px;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(95, 101, 88, 0.12);
	}

	.list-label {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		padding: 0 2px 4px;
	}

	.ahead-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 14px;
		background: var(--bg, #fffdf8);
	}

	.ahead-glyph {
		font-size: 1.05rem;
		width: 22px;
		text-align: center;
	}

	.ahead-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.ahead-body strong {
		font-size: 0.88rem;
	}

	.ahead-detail {
		font-size: 0.72rem;
		color: var(--muted);
	}

	.ahead-dist {
		font-size: 0.84rem;
		font-weight: 800;
		color: var(--forest);
	}

	.empty {
		background: var(--bg, #fffdf8);
		padding: 12px 14px;
		color: var(--muted);
		font-size: 0.86rem;
	}
</style>
