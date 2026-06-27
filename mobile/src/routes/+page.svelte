<script lang="ts">
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CoachTab from '$lib/components/CoachTab.svelte';
	import TodayTab from '$lib/components/TodayTab.svelte';
	import MapTab from '$lib/components/MapTab.svelte';
	import TrailTab from '$lib/components/TrailTab.svelte';
	import SettingsTab from '$lib/components/SettingsTab.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import HikeSetupSheet from '$lib/components/HikeSetupSheet.svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { ScoutLocalAiEvalSuite } from '$lib/scout/local-ai-eval';

	// Scout chat stays pure: no shared header chrome, no surrounding cards — just
	// the conversation. Every other pillar scrolls inside the standard shell.
	const tab = $derived(trailAssistant.activeTab);
	const SIM_EVAL_PROBE_KEY = 'hoggcountry:scout-gemma-sim-eval-probe:v1';
	const SIM_EVAL_RESULT_KEY = 'hoggcountry:scout-gemma-sim-eval-result:v1';

	onMount(() => {
		void maybeRunSimulatorGemmaEvalProbe();
	});

	async function maybeRunSimulatorGemmaEvalProbe() {
		try {
			const [{ Capacitor }, { Preferences }] = await Promise.all([
				import('@capacitor/core'),
				import('@capacitor/preferences')
			]);
			if (!Capacitor.isNativePlatform()) return;

			const trigger = await Preferences.get({ key: SIM_EVAL_PROBE_KEY });
			const limit = simulatorEvalLimit(trigger.value);
			if (limit === null) return;
			await Preferences.remove({ key: SIM_EVAL_PROBE_KEY });
			console.info('SCOUT_GEMMA_SIM_EVAL_PROBE requested', trigger.value, 'limit', limit ?? 'all');

			const response = await fetch('/scout/dad-local-ai-100.json', { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Eval suite fetch failed with HTTP ${response.status}.`);
			}

			const suite = (await response.json()) as ScoutLocalAiEvalSuite;
			const run = await trailAssistant.runLocalAiEvalSuite({
				suite,
				...(limit === undefined ? {} : { limit }),
				onProgress: (progress) => {
					console.info(
						`SCOUT_GEMMA_SIM_EVAL_PROBE progress ${progress.completed}/${progress.total} case=${progress.caseId}`
					);
				}
			});
			await Preferences.set({ key: SIM_EVAL_RESULT_KEY, value: JSON.stringify(run) });
			console.info(
				'SCOUT_GEMMA_SIM_EVAL_PROBE complete',
				JSON.stringify({
					runId: run.runId,
					evidenceLane: run.evidenceLane,
					caseCount: run.caseCount,
					toolExpectationComplete: run.summary.toolExpectationComplete,
					missingToolCases: run.summary.missingToolCases,
					sourceEvidenceComplete: run.summary.sourceEvidenceComplete,
					firstCase: run.results[0]?.caseId,
					firstAnswerChars: run.results[0]?.answer.length ?? 0
				})
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			try {
				const { Preferences } = await import('@capacitor/preferences');
				await Preferences.set({
					key: SIM_EVAL_RESULT_KEY,
					value: JSON.stringify({ ok: false, generatedAt: new Date().toISOString(), error: message })
				});
			} catch {
				// Keep the original probe error visible even if persistence fails.
			}
			console.error('SCOUT_GEMMA_SIM_EVAL_PROBE failed', message, error);
		}
	}

	function simulatorEvalLimit(value: string | null): number | undefined | null {
		const normalized = value?.trim().toLowerCase();
		if (!normalized) return null;
		if (normalized === '1' || normalized === 'run3') return 3;
		if (normalized === 'all' || normalized === 'runall') return undefined;
		const runMatch = /^run(\d+)$/u.exec(normalized);
		const limitMatch = /^limit:(\d+)$/u.exec(normalized);
		const numericText = runMatch?.[1] ?? limitMatch?.[1] ?? (/^\d+$/u.test(normalized) ? normalized : '');
		if (!numericText) return null;
		const parsed = Number.parseInt(numericText, 10);
		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return null;
		return parsed;
	}
</script>

<div class="phone-frame">
	<AppHeader />

	<main class="screen-scroll" class:chat-screen={tab === 'Scout'} class:flush-screen={tab === 'Map'}>
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

	{#if trailAssistant.hikeSetupOpen}
		<HikeSetupSheet />
	{/if}
</div>

<style>
	/* The chat screen manages its own scrolling (message list + sticky input),
	   so the outer scroll container yields to it. */
	.chat-screen {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	/* The map is full-bleed chrome — it fills the whole middle row edge-to-edge,
	   so it drops the standard card padding (which otherwise left a dead strip
	   above the nav). MapTab paints flush to header and nav itself. */
	.flush-screen {
		padding: 0;
		overflow: hidden;
	}
</style>
