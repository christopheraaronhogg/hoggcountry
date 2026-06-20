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
			aria-label="Open Today"
		>
			<span class="day">Day {trailAssistant.dayNumber}</span>
			<span class="dot" aria-hidden="true">·</span>
			<span class="mile tabular">Mi {trailAssistant.currentMile.toFixed(1)}</span>
			<span class="pct">{percentComplete}%</span>
		</button>
	</div>

	<div class="right">
		<span
			class="conn"
			data-online={trailAssistant.onlineStatus}
			title={trailAssistant.onlineStatus ? 'Online' : 'Offline ready'}
		>
			<span class="conn-dot"></span>
			{trailAssistant.onlineStatus ? 'Online' : 'Offline'}
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
		background: linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(248, 242, 230, 0.95));
		border-bottom: 1px solid rgba(95, 101, 88, 0.14);
		box-shadow: 0 8px 16px -16px rgba(64, 53, 38, 0.4);
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
		font-size: 0.74rem;
		box-shadow: var(--shadow-soft);
		flex: none;
	}

	.status-strip {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.07);
		color: var(--ink);
		font-size: 0.82rem;
		font-weight: 700;
		min-width: 0;
	}

	.status-strip .day {
		color: var(--muted);
		font-weight: 800;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-strip .mile {
		color: var(--forest);
		font-family: var(--font-display);
		font-weight: 800;
	}

	.status-strip .pct {
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 700;
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
		gap: 5px;
		padding: 4px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.03em;
		color: var(--ink);
	}

	.conn[data-online='false'] {
		background: rgba(170, 104, 67, 0.14);
		color: var(--clay);
	}

	.conn-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--success, #4a7a52);
	}

	.conn[data-online='false'] .conn-dot {
		background: var(--warn, #c89a4a);
	}

	.gear {
		width: 34px;
		height: 34px;
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
