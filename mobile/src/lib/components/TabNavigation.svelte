<script lang="ts">
	import type { Tab } from '$lib/types';
	import { trailAssistant } from '$lib/trailState.svelte';

	const tabs: Array<{ key: Tab; icon: string }> = [
		{ key: 'Today', icon: 'Sun' },
		{ key: 'Plan', icon: 'Map' },
		{ key: 'Coach', icon: 'Coach' },
		{ key: 'Town', icon: 'Town' },
		{ key: 'Safety', icon: 'Safe' },
		{ key: 'Account', icon: 'Me' }
	];
</script>

<nav class="nav">
	{#each tabs as tab}
		<button
			class:active={trailAssistant.activeTab === tab.key}
			class="nav-item"
			onclick={() => (trailAssistant.activeTab = tab.key)}
			aria-current={trailAssistant.activeTab === tab.key ? 'page' : undefined}
		>
			<span class="nav-icon">{tab.icon}</span>
			<span class="nav-label">{tab.key}</span>
		</button>
	{/each}
</nav>

<style>
	.nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		max-width: var(--app-width);
		margin: 0 auto;
		height: var(--nav-height);
		padding: 8px 10px calc(env(safe-area-inset-bottom) + 10px);
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 6px;
		background: rgba(252, 248, 240, 0.96);
		backdrop-filter: blur(12px);
		border-top: 1px solid rgba(95, 101, 88, 0.12);
	}

	.nav-item {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 3px;
		border-radius: 14px;
		color: var(--muted);
	}

	.nav-item.active {
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.nav-icon {
		font-size: 0.73rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.nav-label {
		font-size: 0.66rem;
		font-weight: 700;
	}
</style>
