<script lang="ts">
	import { upcomingStops, waterSources, weatherSnapshot } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';
	import TrailPulsePanel from './TrailPulsePanel.svelte';

	function recommendationLabel() {
		const labels = {
			push: 'Push window',
			steady: 'Steady day',
			hold: 'Hold discipline',
			nero: 'Nero recommended',
			zero: 'Zero recommended'
		};

		return labels[trailAssistant.readiness.recommendation];
	}

	const remaining = $derived(trailAssistant.milesRemainingToday.toFixed(1));
	const progress = $derived(`${trailAssistant.progressPercent.toFixed(0)}%`);
</script>

<div class="section-stack">
	<section class="hero card">
		<div class="hero-top">
			<div>
				<p class="eyebrow">Today</p>
				<h2>{recommendationLabel()}</h2>
			</div>

			<span class="pill pill-forest">{trailAssistant.readiness.score} readiness</span>
		</div>

		<div class="hero-number">
			<strong>{trailAssistant.currentDayMiles.toFixed(1)}</strong>
			<span>/ {trailAssistant.readiness.targetMiles.toFixed(1)} mi</span>
		</div>

		<div class="progress-bar" aria-hidden="true">
			<div class="progress-fill" style={`width:${trailAssistant.progressPercent}%`}></div>
		</div>

		<p class="hero-copy">
			{remaining} miles left if you keep this day controlled. The target is not ambitious on purpose.
		</p>

		<div class="hero-actions">
			<button class="cta-button" onclick={() => (trailAssistant.activeTab = 'Coach')}>
				Ask coach about today
			</button>
			<button class="secondary-button" onclick={() => trailAssistant.performCheckIn('safe', 'Quick safe check-in from Today.')}>
				Send quick check-in
			</button>
		</div>
	</section>

	<section class="metric-grid">
		<div class="metric-card card">
			<span class="metric-label">Next water</span>
			<strong class="metric-value">{waterSources[0].distanceMiles.toFixed(1)} mi</strong>
			<span class="metric-note">{waterSources[0].name}</span>
		</div>

		<div class="metric-card card">
			<span class="metric-label">Check-in due</span>
			<strong class="metric-value">
				{new Date(trailAssistant.nextCheckInDueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
			</strong>
			<span class="metric-note">{trailAssistant.onlineStatus ? 'Signal looks usable' : 'Will queue offline'}</span>
		</div>

		<div class="metric-card card">
			<span class="metric-label">Target vert</span>
			<strong class="metric-value">{trailAssistant.readiness.targetVert.toLocaleString()} ft</strong>
			<span class="metric-note">Cap the day, do not make it up late</span>
		</div>

		<div class="metric-card card">
			<span class="metric-label">Sync health</span>
			<strong class="metric-value">{trailAssistant.syncLabel}</strong>
			<span class="metric-note">{progress} of the day logged</span>
		</div>
	</section>

	<TrailPulsePanel />

	<section class="card section-card">
		<div class="section-heading">
			<p class="eyebrow">Why</p>
			<h2>Readiness drivers</h2>
			<p>{weatherSnapshot.summary}</p>
		</div>

		<ul class="reason-list">
			{#each trailAssistant.readiness.reasons as reason}
				<li>{reason}</li>
			{/each}
		</ul>
	</section>

	<section class="card section-card">
		<div class="section-heading">
			<p class="eyebrow">Up next</p>
			<h2>Route cues</h2>
			<p>{weatherSnapshot.riskNote}</p>
		</div>

		<div class="stack-tight">
			{#each upcomingStops as stop}
				<div class="stop-row">
					<div class={`stop-marker ${stop.kind}`}></div>
					<div class="stop-copy">
						<strong>{stop.title}</strong>
						<span>{stop.distanceMiles.toFixed(1)} mi · {stop.detail}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.hero,
	.section-card {
		padding: 18px;
	}

	.hero {
		display: grid;
		gap: 16px;
		background:
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.12), transparent 36%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(247, 240, 228, 0.96));
	}

	.hero-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.hero-top h2 {
		font-family: var(--font-display);
		font-size: 1.6rem;
		line-height: 1.02;
	}

	.hero-number {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.hero-number strong {
		font-size: 3rem;
		line-height: 1;
		font-family: var(--font-display);
		color: var(--forest);
	}

	.hero-number span,
	.hero-copy {
		color: var(--muted);
	}

	.progress-bar {
		height: 10px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.12);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--forest), var(--moss));
	}

	.hero-actions {
		display: grid;
		gap: 10px;
	}

	.reason-list {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 10px;
		color: var(--ink);
	}

	.reason-list li {
		color: var(--muted);
	}

	.stop-row {
		display: grid;
		grid-template-columns: 14px 1fr;
		gap: 12px;
		align-items: start;
	}

	.stop-marker {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		margin-top: 3px;
	}

	.stop-marker.view {
		background: var(--sky);
	}

	.stop-marker.water {
		background: var(--moss);
	}

	.stop-marker.shelter {
		background: var(--clay);
	}

	.stop-marker.town {
		background: var(--forest);
	}

	.stop-copy {
		display: grid;
		gap: 3px;
	}

	.stop-copy strong {
		font-size: 0.96rem;
	}

	.stop-copy span {
		font-size: 0.84rem;
		color: var(--muted);
	}
</style>
