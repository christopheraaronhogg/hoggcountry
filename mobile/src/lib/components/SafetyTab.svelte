<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	
	function doCheckIn(status: 'safe' | 'tired' | 'emergency') {
		trailAssistant.checkIn('Chestnut Knob Area', 582.4, status);
	}

	const lastCheckInTime = $derived(trailAssistant.lastCheckIn?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'No check-in today');
</script>

<div class="tab-content">
	<header class="section-header">
		<h2>Safety & Check-in</h2>
		<p>Keep your loved ones informed, even when offline.</p>
	</header>

	<section class="checkin-card card gradient-bg">
		<div class="last-checkin">
			<span class="label">Last Status Update</span>
			<span class="value">{lastCheckInTime}</span>
		</div>
		
		<div class="checkin-actions">
			<button class="checkin-btn safe" onclick={() => doCheckIn('safe')}>
				<span class="icon">✅</span>
				<span>I'm Safe</span>
			</button>
			<button class="checkin-btn tired" onclick={() => doCheckIn('tired')}>
				<span class="icon">⛺</span>
				<span>Camping Early</span>
			</button>
			<button class="checkin-btn danger" onclick={() => doCheckIn('emergency')}>
				<span class="icon">⚠️</span>
				<span>Need Assist</span>
			</button>
		</div>
	</section>

	<section class="privacy card">
		<h3>Privacy & Visibility</h3>
		<div class="toggle-row">
			<div class="toggle-info">
				<span class="name">Stealth Mode</span>
				<span class="desc">Hide your exact mile from public logs.</span>
			</div>
			<button 
				class="toggle {trailAssistant.privacySettings.stealthMode ? 'on' : 'off'}"
				aria-label="Toggle Stealth Mode"
				onclick={() => trailAssistant.updatePrivacy({ stealthMode: !trailAssistant.privacySettings.stealthMode })}
			></button>
		</div>
		<div class="toggle-row">
			<div class="toggle-info">
				<span class="name">Share with Coach</span>
				<span class="desc">Allow AI to analyze location for safety.</span>
			</div>
			<button 
				class="toggle {trailAssistant.privacySettings.allowCoachInsights ? 'on' : 'off'}"
				aria-label="Toggle Share with Coach"
				onclick={() => trailAssistant.updatePrivacy({ allowCoachInsights: !trailAssistant.privacySettings.allowCoachInsights })}
			></button>
		</div>
	</section>

	<div class="risk-card card danger-border">
		<span class="icon">🕒</span>
		<div class="risk-info">
			<span class="name">Missed Check-in Risk</span>
			<span class="desc">Your "Safe" window closes in 4 hours. Automated alert will fire at 8:00 PM.</span>
		</div>
	</div>
</div>

<style>
	.tab-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-bottom: 100px;
	}

	.section-header h2 {
		font-size: 20px;
		margin-bottom: 4px;
	}

	.section-header p {
		font-size: 13px;
		color: var(--color-text-muted);
		margin: 0;
	}

	.checkin-card {
		padding: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.last-checkin {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.last-checkin .label {
		font-size: 10px;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.last-checkin .value {
		font-size: 20px;
		font-weight: 800;
		color: var(--color-text);
	}

	.checkin-actions {
		display: grid;
		grid-template-columns: 1fr;
		width: 100%;
		gap: 10px;
	}

	.checkin-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		border-radius: 12px;
		font-weight: 700;
		font-size: 15px;
		background: white;
		border: 1px solid var(--color-border);
		transition: transform 0.1s;
	}

	.checkin-btn:active { transform: scale(0.98); }

	.checkin-btn.safe { color: var(--color-secondary); border-color: var(--color-secondary-soft); }
	.checkin-btn.tired { color: var(--color-accent); border-color: #ebf5fb; }
	.checkin-btn.danger { color: var(--color-danger); border-color: #fdedec; }

	.toggle-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 0;
	}

	.toggle-row:not(:last-child) { border-bottom: 1px solid var(--color-border); }

	.toggle-info { display: flex; flex-direction: column; gap: 2px; flex: 1; padding-right: 16px; }

	.toggle-info .name { font-size: 14px; font-weight: 700; }
	.toggle-info .desc { font-size: 11px; color: var(--color-text-muted); }

	.toggle {
		width: 44px;
		height: 24px;
		border-radius: 12px;
		background: var(--color-border);
		position: relative;
		transition: background 0.3s;
	}

	.toggle::after {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		top: 2px;
		left: 2px;
		transition: left 0.3s;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.toggle.on { background: var(--color-secondary); }
	.toggle.on::after { left: 22px; }

	.risk-card {
		display: flex;
		gap: 12px;
		padding: 12px;
		align-items: flex-start;
		border: 1px solid var(--color-danger);
		background: #fff8f7;
	}

	.risk-card .icon { font-size: 20px; }
	.risk-info { display: flex; flex-direction: column; gap: 2px; }
	.risk-info .name { font-size: 13px; font-weight: 800; color: var(--color-danger); }
	.risk-info .desc { font-size: 11px; color: var(--color-text-muted); }
</style>
