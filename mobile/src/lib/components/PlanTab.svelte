<script lang="ts">
	import { itinerary } from '$lib/mockTrailData';
	import TrailPulsePanel from './TrailPulsePanel.svelte';
	import ElevationStrip from './ElevationStrip.svelte';
	import WeatherStrip from './WeatherStrip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';
	import SourceChip from './SourceChip.svelte';
	import { itineraryConfidence, sourceReceipts } from './fieldData';

	const totalMiles = itinerary.reduce((total, day) => total + day.mileage, 0);
	const totalVert = itinerary.reduce((total, day) => total + day.elevationGain, 0);
</script>

<div class="section-stack">
	<section class="plan-hero card">
		<div class="plan-head">
			<div>
				<p class="eyebrow">Plan · Rolling 7-day</p>
				<h2>NY/CT pilot window</h2>
			</div>
			<ConfidenceBadge confidence="medium" />
		</div>

		<div class="plan-totals">
			<div>
				<span class="num">{totalMiles.toFixed(1)}</span>
				<small>miles</small>
			</div>
			<div>
				<span class="num">{(totalVert / 1000).toFixed(1)}k</span>
				<small>vert ft</small>
			</div>
			<div>
				<span class="num">7</span>
				<small>days planned</small>
			</div>
		</div>

		<p class="plan-note">
			The plan protects recovery now while mapped water and town services stay unconfirmed.
			Confidence falls off after day 3 - re-plan from current field intel.
		</p>

		<div class="plan-sources">
			<SourceChip source={sourceReceipts.awol2026} />
			<SourceChip source={sourceReceipts.nws} />
			<SourceChip source={sourceReceipts.hikerProfile} />
		</div>
	</section>

	<section class="card forecast-card">
		<div class="card-header">
			<div>
				<p class="eyebrow">Window weather</p>
				<h3>What's coming</h3>
			</div>
			<SourceChip source={sourceReceipts.nws} />
		</div>
		<WeatherStrip />
	</section>

	<section class="card terrain-card">
		<ElevationStrip currentMile={1438} />
		<p class="terrain-note">
			This is a candidate NY/CT trail-ahead slice. Treat water and service points as prompts to
			verify, not confirmed logistics.
		</p>
	</section>

	<TrailPulsePanel />

	<section class="section-heading">
		<p class="eyebrow">Day-by-day</p>
		<h2>What we're protecting</h2>
		<p>Each day shows the plan, the confidence in it, and what needs verifying before we commit.</p>
	</section>

	<section class="stack-tight">
		{#each itinerary as day (day.dayLabel + day.dateLabel)}
			{@const meta = itineraryConfidence[day.dayLabel] ?? { confidence: 'medium' }}
			<article class={`card day-card ${day.status}`}>
				<div class="day-rail">
					<div class="day-rail-day">{day.dayLabel}</div>
					<div class="day-rail-date">{day.dateLabel}</div>
				</div>

				<div class="day-body">
					<div class="day-top">
						<h3>{day.destination}</h3>
						<div class="day-tags">
							<span class={`pill ${day.status === 'today' ? 'pill-forest' : day.status === 'town' ? 'pill-clay' : 'badge-soft'}`}>
								{day.status}
							</span>
							<ConfidenceBadge confidence={meta.confidence} short />
						</div>
					</div>

					<div class="day-numbers">
						<span class="num-cell">
							<strong>{day.mileage.toFixed(1)}</strong>
							<small>mi</small>
						</span>
						<span class="num-cell">
							<strong>{(day.elevationGain / 1000).toFixed(1)}k</strong>
							<small>ft</small>
						</span>
						<span class="weather-cell">{day.weather}</span>
					</div>

					<p class="day-note">{day.note}</p>

					{#if meta.verify}
						<p class="verify-row">
							<span class="verify-tag">Verify</span>
							{meta.verify}
						</p>
					{/if}
				</div>
			</article>
		{/each}
	</section>

	<section class="caution-card card">
		<p class="eyebrow">Planning honesty</p>
		<h3>Don't spend tomorrow's town calories tonight</h3>
		<p>
			The plan only works if today stays disciplined. The classic failure is treating mapped
			candidate water and town signals as confirmed, then losing margin late in the day.
		</p>
		<div class="caution-sources">
			<SourceChip source={sourceReceipts.hikerProfile} />
		</div>
	</section>
</div>

<style>
	.plan-hero,
	.forecast-card,
	.terrain-card,
	.caution-card,
	.day-card {
		padding: 14px;
	}

	.plan-hero {
		display: grid;
		gap: 10px;
		background:
			radial-gradient(circle at top right, rgba(106, 132, 95, 0.18), transparent 40%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(245, 240, 226, 0.96));
	}

	.plan-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.plan-head h2 {
		font-family: var(--font-display);
		font-size: 1.32rem;
	}

	.plan-totals {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.plan-totals div {
		display: grid;
		gap: 2px;
		padding: 10px 8px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.08);
		text-align: center;
	}

	.plan-totals .num {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--forest);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.plan-totals small {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.plan-note {
		font-size: 0.86rem;
		color: var(--muted);
	}

	.plan-sources {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.forecast-card {
		display: grid;
		gap: 10px;
	}

	.card-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.card-header h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
	}

	.terrain-card {
		display: grid;
		gap: 10px;
	}

	.terrain-note {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.day-card {
		display: grid;
		grid-template-columns: 56px 1fr;
		gap: 12px;
	}

	.day-card.today {
		border-color: rgba(47, 75, 53, 0.3);
		background: linear-gradient(180deg, rgba(239, 247, 240, 0.85), rgba(255, 253, 248, 1));
	}

	.day-card.town {
		border-color: rgba(170, 104, 67, 0.28);
		background: linear-gradient(180deg, rgba(248, 236, 226, 0.7), rgba(255, 253, 248, 1));
	}

	.day-card.recovery {
		background: linear-gradient(180deg, rgba(246, 244, 237, 0.9), rgba(255, 253, 248, 1));
	}

	.day-rail {
		display: grid;
		gap: 2px;
		justify-items: center;
		padding: 8px 4px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.08);
		text-align: center;
		align-self: start;
	}

	.day-rail-day {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--forest);
		line-height: 1;
	}

	.day-rail-date {
		font-size: 0.66rem;
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.04em;
	}

	.day-body {
		display: grid;
		gap: 8px;
		min-width: 0;
	}

	.day-top {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: flex-start;
	}

	.day-top h3 {
		font-family: var(--font-display);
		font-size: 1.06rem;
	}

	.day-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		align-items: center;
	}

	.day-numbers {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: baseline;
	}

	.num-cell strong {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
	}

	.num-cell small {
		font-size: 0.7rem;
		color: var(--muted);
		font-weight: 700;
		margin-left: 2px;
		letter-spacing: 0.04em;
	}

	.weather-cell {
		font-size: 0.78rem;
		color: var(--muted);
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 999px;
		background: rgba(95, 128, 144, 0.12);
	}

	.day-note {
		font-size: 0.86rem;
		color: var(--ink);
	}

	.verify-row {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 0.78rem;
		color: #8c5d1f;
	}

	.verify-tag {
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8c5d1f;
		padding: 3px 7px;
		border-radius: 999px;
		background: rgba(200, 167, 122, 0.22);
	}

	.caution-card {
		display: grid;
		gap: 8px;
		background: linear-gradient(180deg, rgba(247, 230, 224, 0.6), rgba(255, 251, 246, 1));
	}

	.caution-card h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
	}

	.caution-card p:last-of-type {
		font-size: 0.88rem;
		color: var(--muted);
	}

	.caution-sources {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		padding-top: 4px;
	}
</style>
