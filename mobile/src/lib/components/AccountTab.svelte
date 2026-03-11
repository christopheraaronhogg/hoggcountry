<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
</script>

<div class="section-stack">
	<section class="card profile-card">
		<div class="profile-top">
			<div class="avatar">HC</div>
			<div>
				<p class="eyebrow">Account</p>
				<h2>Chris "Hogg"</h2>
				<p>NOBO 2026 · Trail Assistant pilot member</p>
			</div>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Trail log</p>
			<h2>Automation and discipline</h2>
			<p>These toggles keep the prototype feeling like a real hiking ops app instead of a static mock.</p>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Auto-log mileage</strong>
				<span>Update your day summary from check-ins and route state.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.autoLogMileage}
				class:off={!trailAssistant.trailSettings.autoLogMileage}
				class="toggle"
				aria-label="Toggle auto-log mileage"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'autoLogMileage',
						!trailAssistant.trailSettings.autoLogMileage
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Water alerts</strong>
				<span>Highlight reliable sources before dry ridges.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.waterAlerts}
				class:off={!trailAssistant.trailSettings.waterAlerts}
				class="toggle"
				aria-label="Toggle water alerts"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'waterAlerts',
						!trailAssistant.trailSettings.waterAlerts
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Battery saver</strong>
				<span>Reduce sync behavior to protect charge on long days.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.batterySaver}
				class:off={!trailAssistant.trailSettings.batterySaver}
				class="toggle"
				aria-label="Toggle battery saver"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'batterySaver',
						!trailAssistant.trailSettings.batterySaver
					)}
			></button>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Daily habits</p>
			<h2>Readiness inputs</h2>
			<p>These are the behaviors the prototype treats as meaningful readiness signals.</p>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Foot care logged</strong>
				<span>Use this to keep pain from hiding inside the mileage target.</span>
			</div>
			<button
				class:on={trailAssistant.trailLogSettings.footCareLogged}
				class:off={!trailAssistant.trailLogSettings.footCareLogged}
				class="toggle"
				aria-label="Toggle foot care logged"
				onclick={() =>
					trailAssistant.updateTrailLogSetting(
						'footCareLogged',
						!trailAssistant.trailLogSettings.footCareLogged
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Calories logged</strong>
				<span>Fuel debt is one of the easiest ways to misread a hard day.</span>
			</div>
			<button
				class:on={trailAssistant.trailLogSettings.caloriesLogged}
				class:off={!trailAssistant.trailLogSettings.caloriesLogged}
				class="toggle"
				aria-label="Toggle calories logged"
				onclick={() =>
					trailAssistant.updateTrailLogSetting(
						'caloriesLogged',
						!trailAssistant.trailLogSettings.caloriesLogged
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Stretching done</strong>
				<span>Simple, but enough to change tomorrow if you skip it for days.</span>
			</div>
			<button
				class:on={trailAssistant.trailLogSettings.stretchingDone}
				class:off={!trailAssistant.trailLogSettings.stretchingDone}
				class="toggle"
				aria-label="Toggle stretching done"
				onclick={() =>
					trailAssistant.updateTrailLogSetting(
						'stretchingDone',
						!trailAssistant.trailLogSettings.stretchingDone
					)}
			></button>
		</div>
	</section>

	<section class="card region-card">
		<p class="eyebrow">Offline readiness</p>
		<h3>{trailAssistant.trailSettings.offlineRegion}</h3>
		<p>Primary downloaded region for this prototype. Good enough for weak-signal hiking and queued check-ins.</p>
		<button class="outline-button">Manage offline region</button>
	</section>
</div>

<style>
	.profile-card,
	.region-card {
		padding: 18px;
	}

	.profile-top {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--forest), #466852);
		color: #f9f3e8;
		font-weight: 800;
		box-shadow: var(--shadow-soft);
	}

	.profile-top h2 {
		font-family: var(--font-display);
		font-size: 1.35rem;
		margin: 2px 0 4px;
	}

	.profile-top p:last-child,
	.region-card p:last-of-type {
		font-size: 0.88rem;
		color: var(--muted);
	}

	.region-card h3 {
		margin: 6px 0;
	}
</style>
