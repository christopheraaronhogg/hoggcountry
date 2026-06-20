<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import AccountTab from './AccountTab.svelte';
	import SafetyTab from './SafetyTab.svelte';

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
		<h2 class="group-title">Account &amp; on-device AI</h2>
		<AccountTab />
	</section>

	<section class="group">
		<h2 class="group-title">Safety &amp; privacy</h2>
		<SafetyTab />
	</section>
</div>

<style>
	.settings-screen {
		display: grid;
		gap: 18px;
	}

	.settings-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.settings-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.back {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		font-size: 1.4rem;
		line-height: 1;
		color: var(--forest);
		background: rgba(47, 75, 53, 0.08);
	}

	.group {
		display: grid;
		gap: 10px;
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
