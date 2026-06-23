<script lang="ts">
	import { browser } from '$app/environment';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { TrailConditionReport } from '$lib/types';
	import TrailPulseReportAction from './TrailPulseReportAction.svelte';

	let activeAlert = $state<TrailConditionReport | null>(null);

	const nearbyReports = $derived(trailAssistant.nearbyTrailPulseReports);
	const rangeLabel = $derived(trailAssistant.trailPulseRangeMiles.toFixed(1));

	function formatAge(iso: string): string {
		const deltaSeconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
		if (deltaSeconds < 60) return 'just now';

		const deltaMinutes = Math.floor(deltaSeconds / 60);
		if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

		const deltaHours = Math.floor(deltaMinutes / 60);
		if (deltaHours < 24) return `${deltaHours}h ago`;

		const deltaDays = Math.floor(deltaHours / 24);
		return `${deltaDays}d ago`;
	}

	async function pulseHaptic() {
		if (!browser) return;

		const capacitorWindow = window as Window & {
			Capacitor?: { isNativePlatform?: () => boolean };
		};
		const isNative = capacitorWindow.Capacitor?.isNativePlatform?.() ?? false;
		if (!isNative && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;

		try {
			const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
			await Haptics.impact({ style: ImpactStyle.Medium });
		} catch {
			// Haptics are best-effort in browser preview and unsupported devices.
		}
	}

	function maybeNotify(report: TrailConditionReport) {
		if (!browser || !('Notification' in window) || Notification.permission !== 'granted') return;

		new Notification('Trail Pulse nearby', {
			body: `Mile ${report.snappedMile.toFixed(1)}: ${trailAssistant.formatTrailPulseReport(report)}`
		});
	}

	$effect(() => {
		const report = trailAssistant.pendingTrailPulseAlert;
		if (!report) return;

		activeAlert = report;
		trailAssistant.markTrailPulseAlertSeen(report.id);
		void pulseHaptic();
		maybeNotify(report);
	});
</script>

<section class="card trail-pulse">
	{#if activeAlert}
		<div class="pulse-alert">
			<div>
				<p class="eyebrow">Trail Pulse</p>
				<strong>Mile {activeAlert.snappedMile.toFixed(1)} nearby</strong>
				<span>{trailAssistant.formatTrailPulseReport(activeAlert)}</span>
			</div>

			<button class="dismiss-alert" aria-label="Dismiss Trail Pulse alert" onclick={() => (activeAlert = null)}>OK</button>
		</div>
	{/if}

	<div class="pulse-heading">
		<div>
			<p class="eyebrow">Trail Pulse</p>
			<h2>Nearby trail notes</h2>
			<p>{nearbyReports.length} active within {rangeLabel} mi · approximate trail mile only</p>
		</div>

		<TrailPulseReportAction />
	</div>

	{#if nearbyReports.length}
		<div class="pulse-list">
			{#each nearbyReports as report (report.id)}
				<article class="pulse-row" class:has-photo={report.photo}>
					<div class="mile-chip">Mile {report.snappedMile.toFixed(1)}</div>
					<div class="pulse-copy">
						<strong>{trailAssistant.formatTrailPulseReport(report)}</strong>
						<span>{formatAge(report.observedAt)} {report.syncState === 'queued-offline' ? '| queued offline' : ''}</span>
					</div>
					{#if report.photo}
						<img class="pulse-photo" src={report.photo} alt="Trail photo at mile {report.snappedMile.toFixed(1)}" />
					{/if}
				</article>
			{/each}
		</div>
	{:else}
		<p class="empty-pulse">No nearby Trail Pulse reports yet.</p>
	{/if}
</section>

<style>
	/* Clay-soft wash over the surface — a topo-paper trail note. Mirrors the
	   SafetyTab hero grammar (radial accent-soft over --surface-strong), so it
	   adapts to dark on its own. */
	.trail-pulse {
		padding: 18px;
		display: grid;
		gap: 14px;
		background:
			radial-gradient(circle at top left, var(--clay-soft), transparent 42%),
			var(--surface-strong);
	}

	/* A nearby report just landed — an attention banner, not an alarm. Clay accent
	   on a soft clay surface stays legible in both themes (the old near-black chip
	   sank into the dark card). */
	.pulse-alert {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border-radius: 14px;
		background: var(--clay-soft);
		border: 1px solid var(--clay);
		color: var(--ink);
	}

	.pulse-alert div {
		display: grid;
		gap: 3px;
	}

	.pulse-alert .eyebrow {
		color: var(--clay);
	}

	.pulse-alert span {
		color: var(--muted);
	}

	.dismiss-alert {
		min-width: 44px;
		min-height: 44px;
		border-radius: 12px;
		background: var(--surface-strong);
		color: var(--ink);
		font-weight: 800;
	}

	.pulse-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.pulse-heading h2 {
		margin-top: 2px;
		font-family: var(--font-display);
		font-size: 1.32rem;
		line-height: 1.08;
	}

	.pulse-heading p:last-child,
	.empty-pulse {
		font-size: 0.86rem;
		color: var(--muted);
	}

	.pulse-list {
		display: grid;
		gap: 10px;
	}

	.pulse-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px;
		align-items: center;
		padding: 11px;
		border-radius: 14px;
		background: var(--forest-soft);
	}
	.pulse-row.has-photo {
		grid-template-columns: auto 1fr auto;
	}
	.pulse-photo {
		width: 52px;
		height: 52px;
		object-fit: cover;
		border-radius: 10px;
		border: 1px solid var(--line);
	}

	.mile-chip {
		padding: 7px 9px;
		border-radius: 999px;
		background: var(--surface-strong);
		color: var(--forest);
		font-size: var(--text-floor);
		font-weight: 800;
		white-space: nowrap;
	}

	.pulse-copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.pulse-copy strong {
		font-size: 0.92rem;
	}

	.pulse-copy span {
		font-size: var(--text-floor);
		color: var(--muted);
	}

	@media (max-width: 360px) {
		.pulse-heading,
		.pulse-alert,
		.pulse-row {
			grid-template-columns: 1fr;
		}
	}
</style>
