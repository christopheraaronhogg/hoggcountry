<script lang="ts">
	import type { NextServiceMarker } from './fieldData';
	import { nextServices } from './fieldData';
	import ConfidenceBadge from './ConfidenceBadge.svelte';

	let {
		services = nextServices,
		title = 'Next 20 miles',
		eyebrow = 'Up next'
	}: { services?: NextServiceMarker[]; title?: string; eyebrow?: string } = $props();

	const symbols: Record<NextServiceMarker['kind'], string> = {
		view: '◇',
		water: '~',
		shelter: '▲',
		town: '◉',
		road: '=',
		gap: '∨',
		campsite: '∆',
		summit: '▲'
	};
</script>

<section class="service-strip">
	<header class="strip-head">
		<div>
			<p class="eyebrow">{eyebrow}</p>
			<h3>{title}</h3>
		</div>
		<span class="strip-count">{services.length} stops</span>
	</header>

	<ol class="strip-list">
		{#each services as service (service.id)}
			<li class="strip-row" data-kind={service.kind}>
				<span class="strip-marker" aria-hidden="true">{symbols[service.kind]}</span>
				<div class="strip-body">
					<div class="strip-top">
						<strong>{service.title}</strong>
						<span class="strip-distance">{service.distanceMiles.toFixed(1)} mi</span>
					</div>
					<p class="strip-detail">{service.detail}</p>
					<div class="strip-meta">
						<span class="strip-mile">Mile {service.mile.toFixed(1)}</span>
						<ConfidenceBadge confidence={service.confidence} short />
						{#if service.verify}
							<span class="strip-verify">↻ {service.verify}</span>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ol>
</section>

<style>
	.service-strip {
		display: grid;
		gap: 12px;
	}

	.strip-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.strip-head h3 {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.strip-count {
		font-size: 0.74rem;
		font-weight: 800;
		color: var(--muted);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.strip-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}

	.strip-row {
		display: grid;
		grid-template-columns: 32px 1fr;
		gap: 10px;
		padding: 10px;
		border-radius: 14px;
		background: rgba(255, 253, 248, 0.7);
		border: 1px solid rgba(95, 101, 88, 0.12);
		position: relative;
	}

	.strip-row::before {
		content: '';
		position: absolute;
		left: 22px;
		top: -10px;
		width: 2px;
		height: 12px;
		background: rgba(47, 75, 53, 0.18);
	}

	.strip-row:first-child::before {
		display: none;
	}

	.strip-marker {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 0.92rem;
		font-weight: 800;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.strip-row[data-kind='water'] .strip-marker {
		background: rgba(95, 128, 144, 0.18);
		color: var(--sky);
	}
	.strip-row[data-kind='view'] .strip-marker {
		background: rgba(200, 167, 122, 0.22);
		color: var(--clay);
	}
	.strip-row[data-kind='shelter'] .strip-marker,
	.strip-row[data-kind='campsite'] .strip-marker {
		background: rgba(170, 104, 67, 0.18);
		color: var(--clay);
	}
	.strip-row[data-kind='town'] .strip-marker,
	.strip-row[data-kind='road'] .strip-marker {
		background: rgba(47, 75, 53, 0.16);
		color: var(--forest);
	}

	.strip-body {
		display: grid;
		gap: 4px;
		min-width: 0;
	}

	.strip-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}

	.strip-top strong {
		font-size: 0.96rem;
	}

	.strip-distance {
		font-size: 0.84rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
	}

	.strip-detail {
		margin: 0;
		font-size: 0.84rem;
		color: var(--muted);
	}

	.strip-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		margin-top: 2px;
	}

	.strip-mile,
	.strip-verify {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--muted);
		padding: 3px 6px;
		border-radius: 999px;
		background: rgba(95, 101, 88, 0.1);
	}

	.strip-verify {
		background: rgba(200, 167, 122, 0.18);
		color: #8c5d1f;
	}
</style>
