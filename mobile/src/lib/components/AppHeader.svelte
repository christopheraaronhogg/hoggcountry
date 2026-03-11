<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
</script>

<header class="header">
	<div class="status-bar">
		<span class="status-indicator {trailAssistant.onlineStatus ? 'online' : 'offline'}"></span>
		<span class="status-text">{trailAssistant.onlineStatus ? 'Online' : 'Offline Mode'}</span>
		{#if trailAssistant.syncPending}
			<span class="syncing">Syncing...</span>
		{/if}
	</div>
	<div class="logo">HOGG COUNTRY</div>
</header>

<style>
	.header {
		padding: 12px 20px;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 10px;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.online { background: var(--color-secondary); }
	.offline { background: var(--color-danger); }

	.syncing {
		color: var(--color-accent);
		margin-left: 8px;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.logo {
		font-family: var(--font-serif);
		font-weight: 800;
		font-size: 14px;
		letter-spacing: 0.1em;
		color: var(--color-text);
	}
</style>
