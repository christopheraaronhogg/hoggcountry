<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	
	const progress = $derived((trailAssistant.completedMiles / trailAssistant.dailyGoal) * 100);
	const remaining = $derived(Math.max(0, trailAssistant.dailyGoal - trailAssistant.completedMiles).toFixed(1));
	const waterDist = $derived((trailAssistant.nextWaterMile - trailAssistant.completedMiles).toFixed(1));
</script>

<div class="tab-content">
	<section class="hero-card card gradient-bg">
		<div class="mileage-header">
			<span class="badge badge-orange">Day 42</span>
			<span class="date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
		</div>
		<div class="progress-circle">
			<div class="stats">
				<span class="completed">{trailAssistant.completedMiles.toFixed(1)}</span>
				<span class="target">/ {trailAssistant.dailyGoal.toFixed(1)} mi</span>
			</div>
			<div class="label">Progress to Target</div>
		</div>
		<div class="progress-bar">
			<div class="fill" style="width: {progress}%"></div>
		</div>
		<p class="summary">{remaining} miles to go before your planned camp at Chestnut Knob.</p>
	</section>

	<div class="quick-stats">
		<div class="stat-card card">
			<span class="stat-icon">💧</span>
			<div class="stat-info">
				<span class="stat-label">Next Water</span>
				<span class="stat-value">{waterDist} mi</span>
			</div>
		</div>
		<div class="stat-card card">
			<span class="stat-icon">⛰️</span>
			<div class="stat-info">
				<span class="stat-label">Elevation</span>
				<span class="stat-value">+1,240 ft</span>
			</div>
		</div>
	</div>

	<section class="itinerary card">
		<h3>Coming Up</h3>
		<div class="timeline">
			<div class="item">
				<span class="time">1.2 mi</span>
				<div class="details">
					<span class="name">High Ledge Lookout</span>
					<span class="desc">Panoramic views, 360°</span>
				</div>
			</div>
			<div class="item water">
				<span class="time">4.2 mi</span>
				<div class="details">
					<span class="name">Lick Creek</span>
					<span class="desc">Last reliable water for 8 miles</span>
				</div>
			</div>
			<div class="item camp">
				<span class="time">7.3 mi</span>
				<div class="details">
					<span class="name">Chestnut Knob Shelter</span>
					<span class="desc">Plan: Overnight</span>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.tab-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding-bottom: 100px;
	}

	.hero-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
	}

	.mileage-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.date {
		font-size: 12px;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.progress-circle {
		margin: 8px 0;
	}

	.completed {
		font-size: 42px;
		font-weight: 900;
		color: var(--color-text);
		font-family: var(--font-serif);
	}

	.target {
		font-size: 16px;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 700;
		color: var(--color-text-muted);
		margin-top: -4px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.5s ease-out;
	}

	.summary {
		font-size: 14px;
		color: var(--color-text-muted);
		margin: 0;
	}

	.quick-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
	}

	.stat-icon {
		font-size: 24px;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 10px;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.stat-value {
		font-size: 16px;
		font-weight: 800;
		color: var(--color-text);
	}

	.itinerary h3 {
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 16px;
		color: var(--color-text-muted);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.item {
		display: flex;
		gap: 16px;
		position: relative;
	}

	.item:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 14px;
		top: 24px;
		bottom: -24px;
		width: 2px;
		background: var(--color-border);
	}

	.time {
		font-size: 11px;
		font-weight: 800;
		color: var(--color-primary);
		min-width: 45px;
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-size: 14px;
		font-weight: 700;
	}

	.desc {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.item.water .time { color: var(--color-accent); }
	.item.camp .time { color: var(--color-secondary); }
</style>
