<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { Tab } from '$lib/types';

	const tabs: { name: Tab; icon: string }[] = [
		{ name: 'Today', icon: '📍' },
		{ name: 'Plan', icon: '🗺️' },
		{ name: 'Coach', icon: '💬' },
		{ name: 'Town', icon: '🏠' },
		{ name: 'Safety', icon: '🛡️' },
		{ name: 'Account', icon: '👤' }
	];
</script>

<nav class="nav safe-area-bottom">
	{#each tabs as tab}
		<button 
			class="tab {trailAssistant.activeTab === tab.name ? 'active' : ''}"
			onclick={() => trailAssistant.activeTab = tab.name}
		>
			<span class="icon">{tab.icon}</span>
			<span class="label">{tab.name}</span>
		</button>
	{/each}
</nav>

<style>
	.nav {
		display: flex;
		justify-content: space-around;
		background: var(--color-bg);
		border-top: 1px solid var(--color-border);
		position: fixed;
		bottom: 0;
		width: 100%;
		padding-top: 8px;
		z-index: 100;
	}

	.tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4px 0 12px;
		flex: 1;
		gap: 4px;
		color: var(--color-text-muted);
		transition: color 0.2s;
	}

	.tab.active {
		color: var(--color-primary);
	}

	.icon {
		font-size: 20px;
	}

	.label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.active .label {
		color: var(--color-primary);
	}
</style>
