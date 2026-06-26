<script lang="ts">
	import { onMount } from 'svelte';
	import { trailAssistant } from '$lib/trailState.svelte';
	import {
		scoutLocalAiSuiteHash,
		type ScoutLocalAiEvalProgress,
		type ScoutLocalAiEvalRun,
		type ScoutLocalAiEvalSuite
	} from '$lib/scout/local-ai-eval';
	import {
		scoutLocalAiEvalProofStatus,
		type ScoutLocalAiEvalNativePreflight
	} from '$lib/scout/local-ai-eval-proof';
	import {
		getCapacitorScoutInstallSource,
		type ScoutInstallSource
	} from '$lib/scout/capacitor-gemma-bridge';

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
	let exportStatus = $state<'idle' | 'copied' | 'shared' | 'downloaded' | 'failed'>('idle');
	let exportMessage = $state<string | null>(null);
	let exportTextarea = $state<HTMLTextAreaElement | null>(null);
	let exportStatusTimer: ReturnType<typeof setTimeout> | null = null;
	let nativePreflight = $state.raw<ScoutLocalAiEvalNativePreflight>({
		metadataLoaded: false,
		isNativePlatform: null,
		platform: null,
		installSourceType: null,
		installSourceLabel: 'Checking'
	});

	const modelReady = $derived(
		trailAssistant.modelStatus?.state === 'ready' &&
			trailAssistant.modelStatus.runtimeConfigured !== false
	);
	const activeRun = $derived(run ?? savedRun);
	const savedRunTarget = $derived(savedRun ? (savedRun.filters?.limit ?? savedRun.totalSuiteCases) : 0);
	const proofStatus = $derived(
		scoutLocalAiEvalProofStatus({
			suiteLoaded: Boolean(suite),
			modelReady,
			scoutUsesCloud: trailAssistant.scoutUsesCloud,
			running,
			native: nativePreflight
		})
	);
	const savedRunIsFullTarget = $derived(Boolean(suite && savedRunTarget >= suite.cases.length));
	const canResume = $derived(
		Boolean(
			proofStatus.canRunSmoke &&
				suite &&
				savedRun &&
				savedRun.suiteId === suite.suiteId &&
				savedRun.suiteVersion === suite.version &&
				savedRun.suiteHash === scoutLocalAiSuiteHash(suite) &&
				savedRun.evidenceLane === 'device-on-device-gemma' &&
				savedRun.caseCount < savedRunTarget &&
				(!savedRunIsFullTarget || proofStatus.canRunFinal)
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
		void loadNativePreflight();
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
		const fullRun = !limit || (resume && savedRunIsFullTarget);
		if (!proofStatus.canRunSmoke) {
			error = 'Scout local AI is not ready for an iOS Eval Lab run yet.';
			return;
		}
		if (fullRun && !proofStatus.canRunFinal) {
			error = 'Run 100 final proof needs the TestFlight iPhone install. Run 3 is available for smoke.';
			return;
		}
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
			void loadNativePreflight();
		} finally {
			running = false;
		}
	}

	async function loadNativePreflight() {
		nativePreflight = {
			...nativePreflight,
			metadataLoaded: false,
			metadataError: null,
			installSourceLabel: 'Checking'
		};
		try {
			const [{ Capacitor }, { App }] = await Promise.all([
				import('@capacitor/core'),
				import('@capacitor/app')
			]);
			const isNativePlatform = Capacitor.isNativePlatform();
			const platform = Capacitor.getPlatform();
			let installSource: ScoutInstallSource | null = null;
			let appVersion: string | null = null;
			let appBuild: string | null = null;

			if (isNativePlatform) {
				const [source, appInfo] = await Promise.all([
					getCapacitorScoutInstallSource().catch((err) => ({
						type: 'unknown',
						detectedBy: 'scoutgemma-install-source-error',
						error: err instanceof Error ? err.message : String(err)
					})),
					App.getInfo()
				]);
				installSource = source;
				appVersion = appInfo.version;
				appBuild = appInfo.build;
			}

			nativePreflight = {
				metadataLoaded: true,
				isNativePlatform,
				platform,
				installSourceType: installSource?.type ?? null,
				installSourceLabel: installSourceLabel(installSource),
				appVersion,
				appBuild
			};
		} catch (err) {
			nativePreflight = {
				metadataLoaded: true,
				metadataError: err instanceof Error ? err.message : String(err),
				isNativePlatform: null,
				platform: null,
				installSourceType: null,
				installSourceLabel: 'Unknown'
			};
		}
	}

	function installSourceLabel(source: ScoutInstallSource | null): string {
		const type = source?.type ?? 'unknown';
		if (type === 'testflight') return 'TestFlight';
		if (type === 'debug') return 'Debug';
		if (type === 'app-store') return 'App Store';
		if (type === 'google-play') return 'Google Play';
		if (type === 'android-installer') return 'Android installer';
		return 'Unknown';
	}

	function downloadRun() {
		const currentRun = activeRun;
		if (!currentRun) return;
		const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${currentRun.runId}.json`;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		setExportStatus('downloaded', 'Download started.');
	}

	async function copyRun() {
		if (!activeRun || !exportText) return;
		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(exportText);
			} else if (exportTextarea) {
				exportTextarea.focus();
				exportTextarea.select();
				const copied = document.execCommand('copy');
				if (!copied) throw new Error('Fallback copy failed.');
			} else {
				throw new Error('Copy is not available.');
			}
			setExportStatus('copied', 'Run copied.');
		} catch {
			setExportStatus('failed', 'Copy failed. Select the JSON below.');
		}
	}

	async function shareRun() {
		const currentRun = activeRun;
		if (!currentRun || !exportText) return;
		if (!navigator.share) {
			await copyRun();
			return;
		}
		const file = new File([exportText], `${currentRun.runId}.json`, { type: 'application/json' });
		const fileShare: ShareData = {
			title: 'Scout local AI eval run',
			text: currentRun.runId,
			files: [file]
		};
		const textShare: ShareData = {
			title: 'Scout local AI eval run',
			text: exportText
		};
		try {
			if (!navigator.canShare || navigator.canShare(fileShare)) {
				await navigator.share(fileShare);
			} else {
				await navigator.share(textShare);
			}
			setExportStatus('shared', 'Share sheet opened.');
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			await copyRun();
		}
	}

	function setExportStatus(
		nextStatus: 'idle' | 'copied' | 'shared' | 'downloaded' | 'failed',
		nextMessage: string | null
	) {
		exportStatus = nextStatus;
		exportMessage = nextMessage;
		if (exportStatusTimer) clearTimeout(exportStatusTimer);
		if (!nextMessage) return;
		exportStatusTimer = setTimeout(() => {
			exportStatus = 'idle';
			exportMessage = null;
			exportStatusTimer = null;
		}, 2400);
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
			<span class="status-pill" data-ready={proofStatus.canRunFinal}>{proofStatus.statusLabel}</span>
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

	<div class="proof-checks" aria-label="Scout Eval Lab final proof readiness">
		{#each proofStatus.checks as check (check.id)}
			<div class="proof-check" data-ready={check.ok}>
				<span>{check.ok ? 'OK' : 'Wait'}</span>
				<strong>{check.label}</strong>
				<em>{check.value}</em>
			</div>
		{/each}
	</div>

	{#if nativePreflight.metadataError}
		<p class="eval-warning" role="status">Native proof check failed: {nativePreflight.metadataError}</p>
	{:else if proofStatus.canRunSmoke && !proofStatus.canRunFinal}
		<p class="eval-warning" role="status">Run 3 is available for smoke. Run 100 final proof needs TestFlight.</p>
	{/if}

	{#if error}
		<p class="eval-error" role="alert">{error}</p>
	{/if}

	{#if saveWarning}
		<p class="eval-warning" role="status">{saveWarning}</p>
	{/if}

	<div class="eval-actions">
		<button class="outline-button compact" type="button" onclick={() => runEval(3)} disabled={!proofStatus.canRunSmoke}>
			Run 3
		</button>
		<button class="cta-button compact" type="button" onclick={() => runEval()} disabled={!proofStatus.canRunFinal}>
			{running ? 'Running…' : 'Run 100'}
		</button>
		<button class="outline-button compact" type="button" onclick={() => runEval(undefined, true)} disabled={!canResume}>
			Resume
		</button>
		<button class="outline-button compact" type="button" onclick={shareRun} disabled={!activeRun}>
			Share
		</button>
		<button class="outline-button compact" type="button" onclick={copyRun} disabled={!activeRun}>
			Copy
		</button>
		<button class="outline-button compact" type="button" onclick={downloadRun} disabled={!activeRun}>
			Download
		</button>
		<button class="outline-button compact" type="button" onclick={clearSavedRun} disabled={!savedRun || running}>
			Clear
		</button>
	</div>

	{#if exportMessage}
		<p class="eval-export-status" data-state={exportStatus} role="status">{exportMessage}</p>
	{/if}

	<p class="eval-save">{savedRunLabel}</p>

	{#if activeRun}
		<textarea bind:this={exportTextarea} readonly value={exportText} aria-label="Scout eval run JSON"></textarea>
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

	.proof-checks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
		gap: 7px;
	}

	.proof-check {
		min-width: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2px 6px;
		align-items: baseline;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--surface);
		padding: 8px;
	}

	.proof-check[data-ready='true'] {
		border-color: color-mix(in srgb, var(--forest) 35%, var(--line));
		background: var(--forest-soft);
	}

	.proof-check span {
		font-size: 0.62rem;
		font-weight: 900;
		text-transform: uppercase;
		color: var(--muted);
	}

	.proof-check[data-ready='true'] span {
		color: var(--forest);
	}

	.proof-check strong,
	.proof-check em {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.72rem;
		line-height: 1.2;
	}

	.proof-check strong {
		font-weight: 900;
	}

	.proof-check em {
		grid-column: 1 / -1;
		font-style: normal;
		color: var(--muted);
	}

	.eval-error,
	.eval-warning,
	.eval-export-status {
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

	.eval-export-status {
		background: var(--forest-soft);
		color: var(--forest);
	}

	.eval-export-status[data-state='failed'] {
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
