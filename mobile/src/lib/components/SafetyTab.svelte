<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';

	function send(status: 'safe' | 'delayed' | 'need-help') {
		const notes = {
			safe: 'Safe and still inside the current plan.',
			delayed: 'Delaying pace and protecting recovery.',
			'need-help': 'Please flag for human review.'
		};

		trailAssistant.performCheckIn(status, notes[status]);
	}
</script>

<div class="section-stack">
	<section class="card safety-hero">
		<div class="section-heading">
			<p class="eyebrow">Safety</p>
			<h2>Check-ins and visibility</h2>
			<p>Last check-in {new Date(trailAssistant.lastCheckIn.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
		</div>

		<div class="risk-strip {trailAssistant.missedCheckInRisk}">
			<strong>Missed check-in risk</strong>
			<span class={`risk-${trailAssistant.missedCheckInRisk}`}>
				{trailAssistant.missedCheckInRisk === 'high'
					? 'High'
					: trailAssistant.missedCheckInRisk === 'medium'
						? 'Medium'
						: 'Low'}
			</span>
		</div>

		<div class="checkin-actions">
			<button class="secondary-button" onclick={() => send('safe')}>I am safe</button>
			<button class="outline-button" onclick={() => send('delayed')}>Running late</button>
			<button class="danger-button" onclick={() => send('need-help')}>Need help</button>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Privacy</p>
			<h2>Sharing controls</h2>
			<p>Keep your support circle informed without exposing more than necessary.</p>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Stealth mode</strong>
				<span>Hide exact movement from public views.</span>
			</div>
			<button
				class:off={!trailAssistant.privacySettings.stealthMode}
				class:on={trailAssistant.privacySettings.stealthMode}
				class="toggle"
				aria-label="Toggle stealth mode"
				onclick={() => trailAssistant.updatePrivacy({ stealthMode: !trailAssistant.privacySettings.stealthMode })}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Precise location</strong>
				<span>Share exact position with approved contacts only.</span>
			</div>
			<button
				class:off={!trailAssistant.privacySettings.sharePreciseLocation}
				class:on={trailAssistant.privacySettings.sharePreciseLocation}
				class="toggle"
				aria-label="Toggle precise location sharing"
				onclick={() =>
					trailAssistant.updatePrivacy({
						sharePreciseLocation: !trailAssistant.privacySettings.sharePreciseLocation
					})}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Coach insights</strong>
				<span>Let coach factor route position into recommendations.</span>
			</div>
			<button
				class:off={!trailAssistant.privacySettings.allowCoachInsights}
				class:on={trailAssistant.privacySettings.allowCoachInsights}
				class="toggle"
				aria-label="Toggle coach insights"
				onclick={() =>
					trailAssistant.updatePrivacy({
						allowCoachInsights: !trailAssistant.privacySettings.allowCoachInsights
					})}
			></button>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Support circle</p>
			<h2>Who gets the signal</h2>
			<p>This is the first group contacted if a check-in window is missed.</p>
		</div>

		<div class="stack-tight">
			{#each trailAssistant.supportCircle as contact}
				<div class="support-row">
					<div>
						<strong>{contact.name}</strong>
						<span>{contact.role}</span>
					</div>
					<span>{contact.method}</span>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.safety-hero {
		padding: 18px;
		display: grid;
		gap: 14px;
		background:
			radial-gradient(circle at top right, rgba(154, 59, 47, 0.08), transparent 38%),
			linear-gradient(180deg, rgba(255, 251, 248, 0.98), rgba(247, 239, 235, 0.96));
	}

	.risk-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		border-radius: 14px;
		background: rgba(47, 75, 53, 0.08);
	}

	.risk-strip.medium {
		background: rgba(200, 167, 122, 0.22);
	}

	.risk-strip.high {
		background: var(--danger-soft);
	}

	.checkin-actions {
		display: grid;
		gap: 10px;
	}

	.danger-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 46px;
		padding: 12px 16px;
		border-radius: 14px;
		font-weight: 700;
		background: linear-gradient(135deg, var(--danger), #b14a3d);
		color: #fff7f3;
	}

	.support-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
	}

	.support-row + .support-row {
		border-top: 1px solid rgba(95, 101, 88, 0.12);
	}

	.support-row div {
		display: grid;
		gap: 4px;
	}

	.support-row div span,
	.support-row > span {
		font-size: 0.82rem;
		color: var(--muted);
	}
</style>
