<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CoachTab from '$lib/components/CoachTab.svelte';
	import TodayTab from '$lib/components/TodayTab.svelte';
	import MapTab from '$lib/components/MapTab.svelte';
	import TrailTab from '$lib/components/TrailTab.svelte';
	import SettingsTab from '$lib/components/SettingsTab.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import { trailAssistant } from '$lib/trailState.svelte';

	// Scout chat stays pure: no shared header chrome, no surrounding cards — just
	// the conversation. Every other pillar scrolls inside the standard shell.
	const tab = $derived(trailAssistant.activeTab);
</script>

<div class="phone-frame">
	<AppHeader />

	<main class="screen-scroll" class:chat-screen={tab === 'Scout'}>
		{#if tab === 'Scout'}
			<CoachTab />
		{:else if tab === 'Today'}
			<TodayTab />
		{:else if tab === 'Map'}
			<MapTab />
		{:else if tab === 'Trail'}
			<TrailTab />
		{:else if tab === 'Settings'}
			<SettingsTab />
		{:else}
			<CoachTab />
		{/if}
	</main>

	<TabNavigation />
</div>

<style>
	/* The chat screen manages its own scrolling (message list + sticky input),
	   so the outer scroll container yields to it. */
	.chat-screen {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
</style>
