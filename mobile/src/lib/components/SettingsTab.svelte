<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import AccountTab from './AccountTab.svelte';
	import AppVersionCard from './AppVersionCard.svelte';
	import SafetyTab from './SafetyTab.svelte';
	import ScoutDiagnosticsCard from './ScoutDiagnosticsCard.svelte';
	import ScoutEvalLab from './ScoutEvalLab.svelte';

	// Settings is reached from the header gear, not the bottom nav. It gathers the
	// infrequent surfaces that used to be their own tabs: account + the on-device
	// model + automation/habits (AccountTab) and privacy/sharing + low-signal
	// status (SafetyTab). The content is reused as-is in this IA pass; a later
	// pass can tighten each card.
</script>

<div class="settings-screen">
	<header class="settings-head">
		<button
			class="back"
			type="button"
			onclick={() => trailAssistant.closeSettings()}
			aria-label="Back"
		>
			‹
		</button>
		<h1>Settings</h1>
	</header>

	<section class="group">
		<AppVersionCard />
	</section>

	<section class="group">
		<h2 class="group-title">Account &amp; on-device AI</h2>
		<AccountTab />
		<ScoutDiagnosticsCard />
		<ScoutEvalLab />
	</section>

	<section class="group">
		<h2 class="group-title">Safety &amp; privacy</h2>
		<SafetyTab />
	</section>
</div>

<style>
	.settings-screen {
		display: grid;
		gap: 20px;
		padding-bottom: 8px;
	}

	.settings-head {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.settings-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.back {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-control);
		display: grid;
		place-items: center;
		font-size: 1.55rem;
		line-height: 1;
		color: var(--forest);
		background: var(--forest-soft);
	}

	.group {
		display: grid;
		gap: 12px;
	}

	.group + .group {
		margin-top: 6px;
	}

	.group-title {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		padding-left: 2px;
	}
</style>
