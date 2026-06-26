<script lang="ts">
	import { onMount } from 'svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type {
		ScoutLocalAiEvalProgress,
		ScoutLocalAiEvalRun,
		ScoutLocalAiEvalSuite
	} from '$lib/scout/local-ai-eval';

	const SUITE_URL = '/scout/dad-local-ai-100.json';
	const SAVED_RUN_KEY = 'hoggcountry:scout-local-ai-eval:last-run:v1';

	let suite = $state.raw<ScoutLocalAiEvalSuite | null>(null);
	let run = $state.raw<ScoutLocalAiEvalRun | null>(null);
	let savedRun = $state.raw<ScoutLocalAiEvalRun | null>(null);
	let progress = $state<ScoutLocalAiEvalProgress | null>(null);
	let loading = $state(false);
	let running = $state(false);
	let error = $state<string | null>(null);
	let saveWarning = $state<string | null>(null);

	const modelReady = $derived(
		trailAssistant.modelStatus?.state === 'ready' &&
			trailAssistant.modelStatus.runtimeConfigured !== false
	);
	const activeRun = $derived(run ?? savedRun);
	const savedRunTarget = $derived(savedRun ? (savedRun.filters?.limit ?? savedRun.totalSuiteCases) : 0);
	const canRun = $derived(Boolean(suite && modelReady && !running && !trailAssistant.scoutUsesCloud));
	const canResume = $derived(
		Boolean(
			canRun &&
				suite &&
				savedRun &&
				savedRun.suiteId === suite.suiteId &&
				savedRun.evidenceLane === 'device-on-device-gemma' &&
				savedRun.caseCount < savedRunTarget
		)
	);
	const exportText = $derived(activeRun ? JSON.stringify(activeRun, null, 2) : '');
	const progressLabel = $derived(
		progress
				? `${progress.completed}/${progress.total} · ${progress.caseId}`
			: activeRun
				? `${activeRun.caseCount}/${activeRun.filters?.limit ?? activeRun.totalSuiteCases} done`
				: suite
					? `${suite.cases.length} cases`
					: 'loading'
	);
	const summaryLabel = $derived(
		activeRun
			? `${activeRun.summary.toolExpectationComplete}/${activeRun.caseCount} routed · ${activeRun.summary.missingToolCases} misses`
			: 'No device run yet'
	);
	const savedRunLabel = $derived(
		savedRun ? `${savedRun.caseCount}/${savedRunTarget} saved · ${savedRun.runId}` : 'No saved run'
	);

	onMount(() => {
		loadSavedRun();
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

	async function runEval(limit?: number, resume = false) {
		if (!suite || running) return;
		const previousRun = resume ? savedRun : null;
		const runLimit = resume ? (previousRun?.filters?.limit ?? undefined) : limit;
		running = true;
		error = null;
		saveWarning = null;
		progress = null;
		if (!resume) run = null;
		try {
			run = await trailAssistant.runLocalAiEvalSuite({
				suite,
				limit: runLimit,
				previousRun,
				onProgress: (next) => {
					progress = next;
				},
				onSnapshot: (snapshot) => {
					saveRunSnapshot(snapshot);
				}
			});
			saveRunSnapshot(run);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Scout eval failed.';
		} finally {
			running = false;
		}
	}

	function downloadRun() {
		const currentRun = activeRun;
		if (!currentRun) return;
		const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${currentRun.runId}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function loadSavedRun() {
		try {
			const text = localStorage.getItem(SAVED_RUN_KEY);
			const parsed = text ? parseSavedRun(text) : null;
			if (!parsed) return;
			savedRun = parsed;
			run = parsed;
		} catch {
			saveWarning = 'Saved eval run could not be loaded on this device.';
		}
	}

	function saveRunSnapshot(snapshot: ScoutLocalAiEvalRun) {
		run = snapshot;
		savedRun = snapshot;
		try {
			localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(snapshot));
		} catch {
			saveWarning = 'Eval autosave failed. Export before leaving this screen.';
		}
	}

	function clearSavedRun() {
		try {
			localStorage.removeItem(SAVED_RUN_KEY);
		} catch {
			saveWarning = 'Saved eval run could not be cleared on this device.';
		}
		savedRun = null;
		if (!running) {
			run = null;
			progress = null;
		}
	}

	function parseSavedRun(text: string): ScoutLocalAiEvalRun | null {
		const parsed = JSON.parse(text) as Partial<ScoutLocalAiEvalRun>;
		if (parsed.schemaVersion !== 1) return null;
		if (typeof parsed.runId !== 'string') return null;
		if (parsed.evidenceLane !== 'device-on-device-gemma') return null;
		if (!Array.isArray(parsed.results)) return null;
		return parsed as ScoutLocalAiEvalRun;
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

	{#if saveWarning}
		<p class="eval-warning" role="status">{saveWarning}</p>
	{/if}

	<div class="eval-actions">
		<button class="outline-button compact" type="button" onclick={() => runEval(3)} disabled={!canRun}>
			Run 3
		</button>
		<button class="cta-button compact" type="button" onclick={() => runEval()} disabled={!canRun}>
			{running ? 'Running…' : 'Run 100'}
		</button>
		<button class="outline-button compact" type="button" onclick={() => runEval(undefined, true)} disabled={!canResume}>
			Resume
		</button>
		<button class="outline-button compact" type="button" onclick={downloadRun} disabled={!activeRun}>
			Export
		</button>
		<button class="outline-button compact" type="button" onclick={clearSavedRun} disabled={!savedRun || running}>
			Clear
		</button>
	</div>

	<p class="eval-save">{savedRunLabel}</p>

	{#if activeRun}
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

	.eval-error,
	.eval-warning {
		border-radius: 12px;
		padding: 10px 12px;
		background: color-mix(in srgb, var(--danger) 10%, var(--surface));
		color: var(--danger);
		font-size: 0.82rem;
		font-weight: 800;
		line-height: 1.35;
	}

	.eval-warning {
		background: var(--warn-soft);
		color: var(--ink);
	}

	.eval-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
		gap: 8px;
	}

	.eval-actions button {
		justify-content: center;
		min-width: 0;
	}

	.eval-actions button:disabled {
		opacity: 0.5;
	}

	.eval-save {
		min-width: 0;
		overflow-wrap: anywhere;
		color: var(--muted);
		font-size: 0.76rem;
		font-weight: 700;
		line-height: 1.3;
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
		.eval-metrics {
			grid-template-columns: 1fr;
		}
	}
</style>
