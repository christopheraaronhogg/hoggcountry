<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import TodayTab from '$lib/components/TodayTab.svelte';
	import PlanTab from '$lib/components/PlanTab.svelte';
	import CoachTab from '$lib/components/CoachTab.svelte';
	import TownTab from '$lib/components/TownTab.svelte';
	import SafetyTab from '$lib/components/SafetyTab.svelte';
	import AccountTab from '$lib/components/AccountTab.svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
</script>

<div class="app-shell">
	<AppHeader />

	<main class="content">
		{#if trailAssistant.activeTab === 'Today'}
			<TodayTab />
		{:else if trailAssistant.activeTab === 'Plan'}
			<PlanTab />
		{:else if trailAssistant.activeTab === 'Coach'}
			<CoachTab />
		{:else if trailAssistant.activeTab === 'Town'}
			<TownTab />
		{:else if trailAssistant.activeTab === 'Safety'}
			<SafetyTab />
		{:else if trailAssistant.activeTab === 'Account'}
			<AccountTab />
		{/if}
	</main>

	<TabNavigation />
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--color-bg);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.content::-webkit-scrollbar {
		display: none;
	}
</style>
