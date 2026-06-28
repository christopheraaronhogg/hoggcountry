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
	const SIM_EVAL_DIAGNOSTIC_KEY = 'hoggcountry:scout-gemma-sim-eval-diagnostic:v1';
	type SimulatorEvalPlugin = {
		getSimulatorEvalRequest?: () => Promise<{
			requested?: boolean;
			limit?: string | number | null;
			source?: string;
		}>;
		setSimulatorEvalResult?: (input: { value: string }) => Promise<{ ok?: boolean }>;
		setSimulatorEvalDiagnostic?: (input: { value: string }) => Promise<{ ok?: boolean }>;
	};
	type SimulatorEvalSelection = {
		limit?: number;
		caseIds?: string[];
	};
	onMount(() => {
		void maybeRunSimulatorGemmaEvalProbe();
	});

	async function maybeRunSimulatorGemmaEvalProbe() {
		try {
			const { Capacitor, registerPlugin } = await import('@capacitor/core');
			const native = Capacitor.isNativePlatform();
			const plugin = native ? registerPlugin<SimulatorEvalPlugin>('ScoutGemma') : null;
			const request = native ? await plugin?.getSimulatorEvalRequest?.() : null;
			const triggerValue = request?.limit === undefined || request?.limit === null ? null : String(request.limit);
			const selection = simulatorEvalSelection(triggerValue);
			await writeSimulatorEvalDiagnostic(plugin, {
				phase: selection === null ? 'ignored' : 'starting',
				native,
				requested: request?.requested === true,
				source: request?.source ?? null,
				triggerKey: SIM_EVAL_PROBE_KEY,
				resultKey: SIM_EVAL_RESULT_KEY,
				diagnosticKey: SIM_EVAL_DIAGNOSTIC_KEY,
				triggerValue,
				parsedLimit: selection?.limit === undefined ? 'all' : selection.limit,
				parsedCaseIds: selection?.caseIds ?? null,
				href: window.location.href,
				userAgent: navigator.userAgent
			});
			if (!native || !plugin || request?.requested !== true) return;
			if (selection === null) return;
			console.info(
				'SCOUT_GEMMA_SIM_EVAL_PROBE requested',
				triggerValue,
				'limit',
				selection.limit ?? 'all',
				'cases',
				selection.caseIds?.join(',') ?? 'default'
			);

			await writeSimulatorEvalDiagnostic(plugin, {
				phase: 'fetching-suite',
				triggerValue,
				parsedLimit: selection.limit ?? 'all',
				parsedCaseIds: selection.caseIds ?? null,
				href: window.location.href
			});
			const response = await fetch('/scout/dad-local-ai-100.json', { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Eval suite fetch failed with HTTP ${response.status}.`);
			}

			const suite = (await response.json()) as ScoutLocalAiEvalSuite;
			await writeSimulatorEvalDiagnostic(plugin, {
				phase: 'running',
				triggerValue,
				parsedLimit: selection.limit ?? 'all',
				parsedCaseIds: selection.caseIds ?? null,
				suiteVersion: suite.version,
				suiteCaseCount: suite.cases?.length ?? null,
				href: window.location.href
			});
			const run = await trailAssistant.runLocalAiEvalSuite({
				suite,
				...(selection.limit === undefined ? {} : { limit: selection.limit }),
				...(selection.caseIds?.length ? { caseIds: selection.caseIds } : {}),
				onProgress: (progress) => {
					console.info(
						`SCOUT_GEMMA_SIM_EVAL_PROBE progress ${progress.completed}/${progress.total} case=${progress.caseId}`
					);
					void writeSimulatorEvalDiagnostic(plugin, {
						phase: 'progress',
						triggerValue,
						parsedLimit: selection.limit ?? 'all',
						parsedCaseIds: selection.caseIds ?? null,
						suiteVersion: suite.version,
						completed: progress.completed,
						total: progress.total,
						caseId: progress.caseId,
						caseIndex: progress.index,
						href: window.location.href
					});
				}
			});
			await writeSimulatorEvalDiagnostic(plugin, {
				phase: 'complete',
				triggerValue,
				parsedLimit: selection.limit ?? 'all',
				parsedCaseIds: selection.caseIds ?? null,
				suiteVersion: suite.version,
				completed: run.results.length,
				total: run.totalSuiteCases,
				runId: run.runId,
				href: window.location.href
			});
			await plugin.setSimulatorEvalResult?.({ value: JSON.stringify(run) });
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
				const { registerPlugin } = await import('@capacitor/core');
				const plugin = registerPlugin<SimulatorEvalPlugin>('ScoutGemma');
				await writeSimulatorEvalDiagnostic(plugin, {
					phase: 'error',
					error: message,
					href: window.location.href
				});
				await plugin?.setSimulatorEvalResult?.({
					value: JSON.stringify({ ok: false, generatedAt: new Date().toISOString(), error: message })
				});
			} catch {
				// Keep the original probe error visible even if persistence fails.
			}
			console.error('SCOUT_GEMMA_SIM_EVAL_PROBE failed', message, error);
		}
	}

	async function writeSimulatorEvalDiagnostic(
		plugin: SimulatorEvalPlugin | null | undefined,
		diagnostic: Record<string, unknown>
	) {
		await plugin?.setSimulatorEvalDiagnostic?.({
			value: JSON.stringify({ generatedAt: new Date().toISOString(), ...diagnostic })
		});
	}

	function simulatorEvalSelection(value: string | null): SimulatorEvalSelection | null {
		const normalized = value?.trim().toLowerCase();
		if (!normalized) return null;
		if (normalized.startsWith('cases:')) {
			const caseIds = normalized
				.slice('cases:'.length)
				.split(',')
				.map((id) => id.trim().toUpperCase())
				.filter(Boolean);
			return caseIds.length ? { caseIds } : null;
		}
		if (normalized === '1' || normalized === 'run3') return { limit: 3 };
		if (normalized === 'all' || normalized === 'runall') return {};
		const runMatch = /^run(\d+)$/u.exec(normalized);
		const limitMatch = /^limit:(\d+)$/u.exec(normalized);
		const numericText = runMatch?.[1] ?? limitMatch?.[1] ?? (/^\d+$/u.test(normalized) ? normalized : '');
		if (!numericText) return null;
		const parsed = Number.parseInt(numericText, 10);
		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return null;
		return { limit: parsed };
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
