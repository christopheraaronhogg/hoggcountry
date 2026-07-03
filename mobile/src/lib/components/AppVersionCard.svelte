<script lang="ts">
	import { onMount } from 'svelte';
	import { appVersion } from '$lib/app-version.svelte';

	const lastChecked = $derived(
		appVersion.lastCheckedAt
			? new Date(appVersion.lastCheckedAt).toLocaleTimeString([], {
					hour: 'numeric',
					minute: '2-digit'
				})
			: null
	);

	onMount(() => {
		void appVersion.init();
	});

	function openTestFlight() {
		window.open(appVersion.testFlightUrl, '_blank', 'noopener,noreferrer');
	}
</script>

<section class="card version-card">
	<div class="version-head">
		<div>
			<p class="eyebrow">App version</p>
			<h2>{appVersion.installedLabel}</h2>
		</div>
		<span class="pill version-pill {appVersion.statusTone}">{appVersion.statusLabel}</span>
	</div>

	<div class="version-grid">
		<div>
			<span>Installed</span>
			<strong>{appVersion.installedLabel}</strong>
		</div>
		<div>
			<span>Latest</span>
			<strong>{appVersion.latest ? appVersion.latestLabel : 'Checking…'}</strong>
		</div>
	</div>

	{#if appVersion.updateAvailable}
		<p class="version-copy">
			There is a newer TestFlight build. Open TestFlight and tap Update.
		</p>
		<button class="cta-button compact" type="button" onclick={openTestFlight}>
			Open TestFlight
		</button>
	{:else if appVersion.latest}
		<p class="version-copy">
			This phone is on the latest build I know about. Tell Chris this exact number if anything looks off.
		</p>
	{:else if appVersion.error}
		<p class="version-copy warn">
			Showing the installed build only. The latest-build check will work again when the phone has signal.
		</p>
	{/if}

	<div class="version-actions">
		<button
			class="outline-button compact"
			type="button"
			disabled={appVersion.loading}
			onclick={() => appVersion.refreshLatest()}
		>
			{appVersion.loading ? 'Checking…' : 'Check again'}
		</button>
		{#if lastChecked}
			<span>Checked {lastChecked}</span>
		{/if}
	</div>
</section>

<style>
	.version-card {
		display: grid;
		gap: 12px;
		padding: 14px;
	}

	.version-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 12px;
	}

	.version-head h2 {
		font-family: var(--font-display);
		font-size: 1.45rem;
		line-height: 1.05;
	}

	.version-pill {
		flex: none;
	}

	.version-pill.ok {
		background: var(--success-soft);
		color: var(--success);
	}

	.version-pill.warn {
		background: var(--warn-soft);
		color: #8c5d1f;
	}

	.version-pill.muted {
		background: var(--ink-soft);
		color: var(--muted);
	}

	.version-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.version-grid div {
		display: grid;
		gap: 2px;
		padding: 10px;
		border-radius: var(--radius-sm);
		background: var(--ink-soft);
		min-width: 0;
	}

	.version-grid span,
	.version-actions span {
		font-size: var(--text-floor);
		color: var(--muted);
	}

	.version-grid strong {
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
	}

	.version-copy {
		font-size: 0.86rem;
		color: var(--muted);
	}

	.version-copy.warn {
		color: var(--clay);
		font-weight: 700;
	}

	.version-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.version-actions .outline-button.compact:disabled {
		opacity: 0.55;
	}

	@media (prefers-color-scheme: dark) {
		.version-pill.warn {
			color: var(--warn);
		}
	}
</style>
