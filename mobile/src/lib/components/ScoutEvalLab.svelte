<script lang="ts">
	import { onMount } from 'svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type {
		ScoutLocalAiEvalProgress,
		ScoutLocalAiEvalRun,
		ScoutLocalAiEvalSuite
	} from '$lib/scout/local-ai-eval';

	const SUITE_URL = '/scout/dad-local-ai-100.json';

	let suite = $state<ScoutLocalAiEvalSuite | null>(null);
	let run = $state<ScoutLocalAiEvalRun | null>(null);
	let progress = $state<ScoutLocalAiEvalProgress | null>(null);
	let loading = $state(false);
	let running = $state(false);
	let error = $state<string | null>(null);

	const modelReady = $derived(
		trailAssistant.modelStatus?.state === 'ready' &&
			trailAssistant.modelStatus.runtimeConfigured !== false
	);
	const canRun = $derived(Boolean(suite && modelReady && !running && !trailAssistant.scoutUsesCloud));
	const exportText = $derived(run ? JSON.stringify(run, null, 2) : '');
	const progressLabel = $derived(
		progress ? `${progress.completed}/${progress.total} · ${progress.caseId}` : suite ? `${suite.cases.length} cases` : 'loading'
	);
	const summaryLabel = $derived(
		run
			? `${run.summary.toolExpectationComplete}/${run.caseCount} routed · ${run.summary.missingToolCases} misses`
			: 'No device run yet'
	);

	onMount(() => {
		void loadSuite();
	});

	async function loadSuite() {
		loading = true;
		error = null;
		try {
			const response = await fetch(SUITE_URL, { cache: 'no-store' });
			if (!response.ok) throw new Error(`Eval suite failed to load (${response.status}).`);
			suite = (await response.json()) as ScoutLocalAiEvalSuite;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Eval suite failed to load.';
		} finally {
			loading = false;
		}
	}

	async function runEval(limit?: number) {
		if (!suite || running) return;
		running = true;
		error = null;
		progress = null;
		try {
			run = await trailAssistant.runLocalAiEvalSuite({
				suite,
				limit,
				onProgress: (next) => {
					progress = next;
				}
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Scout eval failed.';
		} finally {
			running = false;
		}
	}

	function downloadRun() {
		if (!run) return;
		const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${run.runId}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<section class="card eval-card">
	<div class="section-heading">
		<p class="eyebrow">Scout Eval · local AI</p>
		<div class="heading-row">
			<h2>Device run</h2>
			<span class="status-pill" data-ready={canRun}>{trailAssistant.scoutUsesCloud ? 'iOS only' : modelReady ? 'Ready' : 'Needs model'}</span>
		</div>
		<p class="eval-copy">100 hiker questions, isolated field packs, on-device Scout answers.</p>
	</div>

	<div class="eval-metrics">
		<div>
			<span>{loading ? 'Loading' : progressLabel}</span>
			<strong>{suite?.suiteId ?? 'dad-local-ai-100'}</strong>
		</div>
		<div>
			<span>{run?.evidenceLane ?? 'device-on-device-gemma'}</span>
			<strong>{summaryLabel}</strong>
		</div>
	</div>

	{#if error}
		<p class="eval-error" role="alert">{error}</p>
	{/if}

	<div class="eval-actions">
		<button class="outline-button compact" type="button" onclick={() => runEval(3)} disabled={!canRun}>
			Run 3
		</button>
		<button class="cta-button compact" type="button" onclick={() => runEval()} disabled={!canRun}>
			{running ? 'Running…' : 'Run 100'}
		</button>
		<button class="outline-button compact" type="button" onclick={downloadRun} disabled={!run}>
			Export
		</button>
	</div>

	{#if run}
		<textarea readonly value={exportText} aria-label="Scout eval run JSON"></textarea>
	{/if}
</section>

<style>
	.eval-card {
		display: grid;
		gap: 12px;
		padding: 16px;
	}

	.section-heading {
		display: grid;
		gap: 4px;
	}

	.eyebrow {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--moss);
	}

	.heading-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.heading-row h2 {
		font-family: var(--font-display);
		font-size: 1.16rem;
	}

	.eval-copy {
		font-size: 0.86rem;
		line-height: 1.35;
		color: var(--muted);
	}

	.status-pill {
		flex: 0 0 auto;
		border-radius: var(--radius-pill);
		padding: 5px 9px;
		background: var(--ink-soft);
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.status-pill[data-ready='true'] {
		background: var(--forest-soft);
		color: var(--forest);
	}

	.eval-metrics {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.eval-metrics div {
		min-width: 0;
		border-radius: 12px;
		background: var(--surface);
		border: 1px solid var(--line);
		padding: 10px;
		display: grid;
		gap: 3px;
	}

	.eval-metrics span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--muted);
	}

	.eval-metrics strong {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.82rem;
		line-height: 1.25;
	}

	.eval-error {
		border-radius: 12px;
		padding: 10px 12px;
		background: color-mix(in srgb, var(--danger) 10%, var(--surface));
		color: var(--danger);
		font-size: 0.82rem;
		font-weight: 800;
		line-height: 1.35;
	}

	.eval-actions {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.eval-actions button {
		justify-content: center;
		min-width: 0;
	}

	.eval-actions button:disabled {
		opacity: 0.5;
	}

	textarea {
		width: 100%;
		min-height: 160px;
		resize: vertical;
		border: 1px solid var(--line);
		border-radius: var(--radius-control);
		padding: 10px;
		background: var(--surface);
		color: var(--ink);
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.74rem;
		line-height: 1.35;
	}

	@media (max-width: 390px) {
		.eval-metrics,
		.eval-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
