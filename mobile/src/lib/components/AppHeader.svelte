<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import Icon from './Icon.svelte';

	// Calibrated AT length per CLAUDE.md (AWOL 2026).
	const trailMiles = 2197.4;
	const percentComplete = $derived(((trailAssistant.currentMile / trailMiles) * 100).toFixed(0));

	// The header is deliberately a single slim strip now — the rich status
	// (progress, sync, check-in, terrain) lives in the Today HUD, and the chat
	// screen stays uncluttered. Tapping the status strip jumps to Today.
</script>

<header class="header">
	<div class="brand">
		<span class="logo-mark" aria-hidden="true">HC</span>
		<button
			class="status-strip"
			type="button"
			onclick={() => (trailAssistant.activeTab = 'Today')}
			aria-label={`Open Today — day ${trailAssistant.dayNumber}, mile ${trailAssistant.currentMile.toFixed(1)}, ${percentComplete}% complete`}
		>
			<span class="day">Day {trailAssistant.dayNumber}</span>
			<span class="dot" aria-hidden="true">·</span>
			<span class="mile tabular">{trailAssistant.currentMile.toFixed(1)}</span>
			<span class="unit">mi</span>
		</button>
	</div>

	<div class="right">
		<!-- Online is the expected state, so it's just a quiet dot; Offline is the
		     one worth surfacing, so it gets a labelled chip. -->
		<span
			class="conn"
			data-online={trailAssistant.onlineStatus}
			title={trailAssistant.onlineStatus
				? 'Online'
				: trailAssistant.scoutUsesCloud
					? 'Offline — Scout needs a connection'
					: 'Offline — Scout still works on-device'}
			aria-label={trailAssistant.onlineStatus
				? 'Online'
				: trailAssistant.scoutUsesCloud
					? 'Offline'
					: 'Offline ready'}
		>
			<span class="conn-dot"></span>
			{#if !trailAssistant.onlineStatus}<span class="conn-label">Offline</span>{/if}
		</span>
		<button
			class="gear"
			type="button"
			onclick={() => trailAssistant.openSettings()}
			aria-label="Settings"
			aria-current={trailAssistant.activeTab === 'Settings' ? 'page' : undefined}
		>
			<Icon name="settings" size={20} stroke={1.7} />
		</button>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 20;
		padding: max(10px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		background: linear-gradient(180deg, rgba(255, 252, 246, 0.92), rgba(248, 242, 230, 0.88));
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(95, 101, 88, 0.14);
		box-shadow: 0 8px 16px -16px rgba(64, 53, 38, 0.4);
	}

	@media (prefers-color-scheme: dark) {
		.header {
			background: linear-gradient(180deg, rgba(27, 33, 25, 0.92), rgba(18, 23, 16, 0.86));
			border-bottom-color: rgba(242, 234, 219, 0.08);
		}

		.gear[aria-current='page'] {
			background: rgba(152, 196, 142, 0.16);
		}
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.logo-mark {
		width: 30px;
		height: 30px;
		border-radius: 9px;
		background: linear-gradient(135deg, var(--forest), #3a5f43);
		color: #f7f2e8;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: var(--text-floor);
		box-shadow: var(--shadow-soft);
		flex: none;
	}

	.status-strip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		min-height: 44px;
		border-radius: 999px;
		background: var(--forest-soft);
		color: var(--ink);
		font-size: 0.84rem;
		font-weight: 700;
		min-width: 0;
		/* One clean line — the strip used to wrap to two on a 375px screen. */
		white-space: nowrap;
	}

	.status-strip .day {
		color: var(--muted);
		font-weight: 800;
		font-size: var(--text-floor);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-strip .mile {
		color: var(--forest);
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.98rem;
	}

	.status-strip .unit {
		color: var(--muted);
		font-size: var(--text-floor);
		font-weight: 700;
		margin-left: -1px;
	}

	.status-strip .dot {
		color: var(--muted);
	}

	.right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: none;
	}

	.conn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	/* Online: a bare glowing dot. Offline: a labelled clay chip. */
	.conn[data-online='false'] {
		padding: 5px 10px;
		border-radius: 999px;
		background: var(--clay-soft);
	}

	.conn-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--success);
		box-shadow: 0 0 0 3px rgba(47, 106, 71, 0.16);
	}

	.conn[data-online='false'] .conn-dot {
		background: var(--clay);
		box-shadow: none;
	}

	.conn-label {
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--clay);
	}

	.gear {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		font-size: 1rem;
		color: var(--muted);
		background: transparent;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.gear[aria-current='page'] {
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}
</style>
