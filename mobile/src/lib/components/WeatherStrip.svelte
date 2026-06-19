<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	const weather = $derived(trailAssistant.fieldPack.weather);
	const updated = $derived(
		weather ? new Date(weather.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
	);
</script>

<div class="weather-strip" role="group" aria-label="Cached field-pack weather">
	{#if weather}
		<div class="weather-cell" data-risk={weather.riskNote ? 'medium' : 'low'}>
			<span class="day">Cached</span>
			<span class="date">{updated}</span>
			<span class="hi">{weather.highF}°</span>
			<span class="lo">{weather.lowF}°</span>
			<span class="wind">{weather.windMph} mph wind</span>
			<span class="precip">Mile {weather.mile.toFixed(1)}</span>
			<span class="summary">{weather.summary}</span>
		</div>
	{:else}
		<div class="weather-cell empty">
			<span class="day">No cache</span>
			<span class="summary">Refresh the field pack before relying on weather.</span>
		</div>
	{/if}
</div>

<style>
	.weather-strip {
		display: block;
	}

	.weather-cell {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 4px 10px;
		padding: 10px;
		border-radius: 12px;
		background: rgba(95, 128, 144, 0.08);
		font-size: 0.74rem;
		color: var(--ink);
	}

	.weather-cell[data-risk='medium'] {
		background: rgba(200, 167, 122, 0.22);
	}

	.day {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink);
	}

	.date {
		font-size: 0.62rem;
		color: var(--muted);
		justify-self: end;
	}

	.hi {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
		grid-row: span 2;
	}

	.lo {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--sky);
		font-variant-numeric: tabular-nums;
		grid-row: span 2;
	}

	.wind,
	.precip {
		font-size: 0.62rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.summary {
		grid-column: 1 / -1;
		color: var(--muted);
		line-height: 1.35;
	}

	.empty {
		grid-template-columns: 1fr;
	}
</style>
