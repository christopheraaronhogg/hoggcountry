<script lang="ts">
	import AccountTab from '$lib/components/AccountTab.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CoachTab from '$lib/components/CoachTab.svelte';
	import PlanTab from '$lib/components/PlanTab.svelte';
	import SafetyTab from '$lib/components/SafetyTab.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import TodayTab from '$lib/components/TodayTab.svelte';
	import TownTab from '$lib/components/TownTab.svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
</script>

<div class="phone-frame">
	<AppHeader />

	<main class="screen-scroll">
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
		{:else}
			<AccountTab />
		{/if}
	</main>

	<TabNavigation />
</div>
