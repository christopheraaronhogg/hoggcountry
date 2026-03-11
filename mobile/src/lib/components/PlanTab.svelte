<script lang="ts">
	import { itinerary } from '$lib/mockTrailData';
</script>

<div class="section-stack">
	<section class="card intro-card">
		<div class="section-heading">
			<p class="eyebrow">Plan</p>
			<h2>Rolling 7-day itinerary</h2>
			<p>The plan is designed to protect recovery now so you can spend the next push window instead of borrowing against it.</p>
		</div>
	</section>

	<section class="stack-tight">
		{#each itinerary as day}
			<article class={`card day-card ${day.status}`}>
				<div class="day-meta">
					<div>
						<p class="day-label">{day.dayLabel}</p>
						<span>{day.dateLabel}</span>
					</div>

					<span class={`pill ${day.status === 'today' ? 'pill-forest' : day.status === 'town' ? 'pill-clay' : 'badge-soft'}`}>
						{day.status}
					</span>
				</div>

				<div class="day-main">
					<h3>{day.destination}</h3>
					<div class="numbers">
						<strong>{day.mileage.toFixed(1)} mi</strong>
						<span>{day.elevationGain.toLocaleString()} ft</span>
						<span>{day.weather}</span>
					</div>
				</div>

				<p>{day.note}</p>
			</article>
		{/each}
	</section>

	<section class="card caution-card">
		<p class="eyebrow">Planning note</p>
		<h3>Do not spend tomorrow's town calories tonight</h3>
		<p>
			The plan only works if today stays disciplined. The mistake would be turning a hold day into a late push, then arriving in Bland cooked and needing two recovery days instead of one.
		</p>
	</section>
</div>

<style>
	.intro-card,
	.caution-card,
	.day-card {
		padding: 18px;
	}

	.day-card {
		display: grid;
		gap: 12px;
	}

	.day-card.today {
		border-color: rgba(47, 75, 53, 0.3);
		background: linear-gradient(180deg, rgba(239, 247, 240, 0.86), rgba(255, 253, 248, 1));
	}

	.day-card.town {
		border-color: rgba(170, 104, 67, 0.28);
		background: linear-gradient(180deg, rgba(248, 236, 226, 0.7), rgba(255, 253, 248, 1));
	}

	.day-card.recovery {
		background: linear-gradient(180deg, rgba(246, 244, 237, 0.92), rgba(255, 253, 248, 1));
	}

	.day-meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.day-label {
		font-size: 0.9rem;
		font-weight: 800;
	}

	.day-meta span:not(.pill) {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.day-main {
		display: grid;
		gap: 8px;
	}

	.day-main h3 {
		font-family: var(--font-display);
		font-size: 1.2rem;
	}

	.numbers {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 0.82rem;
		color: var(--muted);
	}

	.numbers strong {
		color: var(--forest);
		font-size: 0.92rem;
	}

	.day-card p,
	.caution-card p:last-child {
		font-size: 0.9rem;
		color: var(--muted);
	}

	.caution-card {
		background: linear-gradient(180deg, rgba(247, 230, 224, 0.6), rgba(255, 251, 246, 1));
	}

	.caution-card h3 {
		margin: 6px 0;
		font-size: 1rem;
	}
</style>
