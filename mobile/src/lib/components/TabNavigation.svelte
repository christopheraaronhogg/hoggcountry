<script lang="ts">
	import type { Tab } from '$lib/types';
	import { trailAssistant } from '$lib/trailState.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	// Four pillars. Today (calm glance dashboard) is home; Settings lives behind the
	// header gear, and Gear behind Today's "packing up?" glance (a morning ritual,
	// not an all-day tab) — neither is a nav tab. Town folded into Map; Plan into Today.
	const tabs: Array<{ key: Tab; label: string; icon: IconName }> = [
		{ key: 'Today', label: 'Today', icon: 'today' },
		{ key: 'Scout', label: 'Scout', icon: 'scout' },
		{ key: 'Map', label: 'Map', icon: 'map' },
		{ key: 'Trail', label: 'Trail', icon: 'trail' }
	];
</script>

<nav class="nav" aria-label="Primary">
	{#each tabs as tab (tab.key)}
		<button
			class:active={trailAssistant.activeTab === tab.key}
			class="nav-item"
			onclick={() => (trailAssistant.activeTab = tab.key)}
			aria-current={trailAssistant.activeTab === tab.key ? 'page' : undefined}
			aria-label={tab.label}
		>
			<span class="nav-glyph" aria-hidden="true"><Icon name={tab.icon} size={23} stroke={1.7} /></span>
			<span class="nav-label">{tab.label}</span>
		</button>
	{/each}
</nav>

<style>
	.nav {
		height: var(--nav-height);
		padding: 6px 8px calc(env(safe-area-inset-bottom) + 8px);
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 4px;
		background: rgba(252, 248, 240, 0.96);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-top: 1px solid rgba(95, 101, 88, 0.14);
		z-index: 10;
	}

	@media (min-width: 431px) {
		.nav {
			border-radius: 0 0 30px 30px;
			border-left: 1px solid rgba(95, 101, 88, 0.06);
			border-right: 1px solid rgba(95, 101, 88, 0.06);
		}
	}

	.nav-item {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 2px;
		border-radius: 12px;
		color: var(--muted);
		transition: background 0.15s ease, color 0.15s ease;
	}

	.nav-item.active {
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.nav-glyph {
		font-size: 1.05rem;
		line-height: 1;
		font-weight: 700;
	}

	.nav-item.active .nav-glyph {
		transform: translateY(-1px);
	}

	.nav-label {
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.04em;
	}
</style>
