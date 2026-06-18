<script lang="ts">
	import type { Tab } from '$lib/types';
	import { trailAssistant } from '$lib/trailState.svelte';

	// Four pillars. Scout (chat) is the hub/home; Settings lives behind the header
	// gear and the Today HUD behind the header status strip — neither is a nav tab.
	// Town logistics moved into Map; Plan folded into Today; Gear is its own pillar.
	const tabs: Array<{ key: Tab; label: string; glyph: string }> = [
		{ key: 'Scout', label: 'Scout', glyph: '✦' },
		{ key: 'Map', label: 'Map', glyph: '◎' },
		{ key: 'Gear', label: 'Gear', glyph: '▣' },
		{ key: 'Trail', label: 'Trail', glyph: '☷' }
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
			<span class="nav-glyph" aria-hidden="true">{tab.glyph}</span>
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
		font-size: 0.64rem;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
</style>
