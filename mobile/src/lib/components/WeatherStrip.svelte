<script lang="ts">
	import { weatherForecast } from './cockpitData';
</script>

<div class="weather-strip" role="list" aria-label="5-day forecast">
	{#each weatherForecast as day, index (day.dayLabel + day.dateLabel)}
		<div class="weather-cell" role="listitem" data-risk={day.risk} data-today={index === 0}>
			<span class="day">{day.dayLabel}</span>
			<span class="date">{day.dateLabel}</span>
			<span class="hi">{day.highF}°</span>
			<span class="lo">{day.lowF}°</span>
			<span class="wind">{day.windMph} mph</span>
			<span class="precip">{day.precipPct}%</span>
		</div>
	{/each}
</div>

<style>
	.weather-strip {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
	}

	.weather-cell {
		display: grid;
		gap: 3px;
		padding: 9px 6px 10px;
		border-radius: 12px;
		background: rgba(95, 128, 144, 0.08);
		text-align: center;
		font-size: 0.74rem;
		color: var(--ink);
	}

	.weather-cell[data-today='true'] {
		background: rgba(47, 75, 53, 0.14);
		outline: 1px solid rgba(47, 75, 53, 0.2);
	}

	.weather-cell[data-risk='medium'] {
		background: rgba(200, 167, 122, 0.22);
	}

	.weather-cell[data-risk='high'] {
		background: rgba(154, 59, 47, 0.16);
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
	}

	.hi {
		font-size: 1rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
	}

	.lo {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--sky);
		font-variant-numeric: tabular-nums;
	}

	.wind,
	.precip {
		font-size: 0.62rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
</style>
