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
		scoutLocalAiEvalRunContextProblems,
		type ScoutLocalAiEvalNativePreflight
	} from '$lib/scout/local-ai-eval-proof';
	import {
		getCapacitorScoutInstallSource,
		setCapacitorScoutEvalKeepAwake,
		type ScoutInstallSource
	} from '$lib/scout/capacitor-gemma-bridge';
	import {
		createScoutEvalWakeLock,
		type ScoutEvalWakeLockController
	} from '$lib/scout/eval-wake-lock';

	const SUITE_URL = '/scout/dad-local-ai-100.json';
	const SAVED_RUN_KEY = 'hoggcountry:scout-local-ai-eval:last-run:v1';
	const REVIEW_INBOX_PATH = 'data/scout-local-ai/inbox/';
	const REVIEW_PREP_COMMAND = 'npm run prepare-review:scout-local-ai-device-run -- --run inbox';

	type EvalRunHealth = {
		state: 'final' | 'partial' | 'smoke' | 'stale' | 'pending';
		stateLabel: string;
		detail: string;
		savedAt: string;
		suiteLabel: string;
		appLabel: string;
		installLabel: string;
		completedLabel: string;
		errorLabel: string;
		toolsLabel: string;
		sourceLabel: string;
		runIdLabel: string;
		executionIdLabel: string;
	};
	type EvalRunFreshness = {
		state: 'current' | 'stale' | 'pending';
		stateLabel: string;
		detail: string;
		canExport: boolean;
	};
	type EvalExportHandoff = {
		state: 'final' | 'diagnostic';
		label: string;
		detail: string;
		command: string;
		fileName: string;
		shareTitle: string;
		shareText: string;
		successMessage: string;
	};

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
	let evalWakeLock: ScoutEvalWakeLockController | null = null;

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
			native: nativePreflight,
			finalProof: suite?.finalProof ?? null
		})
	);
	const savedRunIsFullTarget = $derived(Boolean(suite && savedRunTarget >= suite.cases.length));
	const activeRunFreshness = $derived(activeRun ? summarizeRunFreshness(activeRun, suite) : null);
	const savedRunFreshness = $derived(savedRun ? summarizeRunFreshness(savedRun, suite) : null);
	const activeRunCanExport = $derived(Boolean(activeRun && activeRunFreshness?.canExport));
	const exportHandoff = $derived(activeRun ? summarizeExportHandoff(activeRun, suite) : null);
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
			? `${activeRun.summary.toolExpectationComplete}/${activeRun.caseCount} routed · ${activeRun.summary.missingSourceEvidenceCases ?? 0} source gaps`
			: 'No device run yet'
	);
	const savedRunLabel = $derived(
		savedRun
			? `${savedRun.caseCount}/${savedRunTarget} saved · ${savedRun.runId} · ${savedRunFreshness?.stateLabel ?? 'Checking suite'}`
			: 'No saved run'
	);
	const runHealth = $derived(activeRun ? summarizeRunHealth(activeRun, suite) : null);

	onMount(() => {
		evalWakeLock = createScoutEvalWakeLock({
			nativeKeepAwake: {
				async setActive(active) {
					const result = await setCapacitorScoutEvalKeepAwake(active);
					return result?.active === true;
				}
			},
			onError: (err) => console.warn('Scout Eval Lab screen wake lock unavailable', err)
		});
		loadSavedRun();
		void loadSuite();
		void loadNativePreflight();
		return () => {
			evalWakeLock?.dispose();
			evalWakeLock = null;
		};
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
			error = 'Run 100 final proof needs the required TestFlight iPhone build. Run 3 is available for smoke.';
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
			await evalWakeLock?.request();
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
			await evalWakeLock?.release();
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
		if (!currentRun || !canExportCurrentRun()) return;
		const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' });
		const handoff = summarizeExportHandoff(currentRun, suite);
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = handoff.fileName;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		setExportStatus('downloaded', handoff.successMessage);
	}

	async function copyRun() {
		const currentRun = activeRun;
		if (!currentRun || !exportText || !canExportCurrentRun()) return;
		const handoff = summarizeExportHandoff(currentRun, suite);
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
			setExportStatus('copied', handoff.successMessage);
		} catch {
			setExportStatus('failed', 'Copy failed. Select the JSON below.');
		}
	}

	async function shareRun() {
		const currentRun = activeRun;
		if (!currentRun || !exportText || !canExportCurrentRun()) return;
		if (!navigator.share) {
			await copyRun();
			return;
		}
		const handoff = summarizeExportHandoff(currentRun, suite);
		const file = new File([exportText], handoff.fileName, { type: 'application/json' });
		const fileShare: ShareData = {
			title: handoff.shareTitle,
			text: handoff.shareText,
			files: [file]
		};
		const textShare: ShareData = {
			title: handoff.shareTitle,
			text: exportText
		};
		try {
			if (!navigator.canShare || navigator.canShare(fileShare)) {
				await navigator.share(fileShare);
			} else {
				await navigator.share(textShare);
			}
			setExportStatus('shared', handoff.successMessage);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			await copyRun();
		}
	}

	function canExportCurrentRun(): boolean {
		const freshness = activeRunFreshness;
		if (freshness?.canExport) return true;
		setExportStatus('failed', freshness?.detail ?? 'Load the current eval suite before sharing.');
		return false;
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

	function summarizeRunHealth(
		currentRun: ScoutLocalAiEvalRun,
		currentSuite: ScoutLocalAiEvalSuite | null
	): EvalRunHealth {
		const freshness = summarizeRunFreshness(currentRun, currentSuite);
		const target = currentRun.filters?.limit ?? currentRun.totalSuiteCases;
		const finalTarget = currentSuite?.cases.length ?? currentRun.totalSuiteCases;
		const isFullRun = currentRun.caseCount >= finalTarget && target >= finalTarget;
		const state =
			freshness.state === 'stale'
				? 'stale'
				: freshness.state === 'pending'
					? 'pending'
					: isFullRun
						? 'final'
						: target < finalTarget
							? 'smoke'
							: 'partial';
		const errorCount = currentRun.results.filter((result) => Boolean(result.error)).length;
		const missingTools = currentRun.summary?.missingToolCases ?? 0;
		const sourceGaps = currentRun.summary?.missingSourceEvidenceCases ?? 0;
		return {
			state,
			stateLabel:
				state === 'final'
					? 'Full export'
					: state === 'smoke'
						? 'Smoke export'
						: state === 'stale'
							? 'Stale export'
							: state === 'pending'
								? 'Checking export'
								: 'Partial export',
			detail:
				state === 'stale' || state === 'pending'
					? freshness.detail
					: state === 'final'
					? 'Ready for import and review'
					: state === 'smoke'
						? 'Useful for setup checks'
						: 'Resume or share for recovery',
			savedAt: formatEvalTimestamp(lastResultTimestamp(currentRun) ?? currentRun.generatedAt),
			suiteLabel: freshness.stateLabel,
			appLabel: appContextLabel(currentRun),
			installLabel: installContextLabel(currentRun),
			completedLabel: `${currentRun.caseCount}/${target}`,
			errorLabel: String(errorCount),
			toolsLabel: `${missingTools} missing`,
			sourceLabel: `${sourceGaps} ${sourceGaps === 1 ? 'gap' : 'gaps'}`,
			runIdLabel: currentRun.runId,
			executionIdLabel: executionIdLabel(currentRun)
		};
	}

	function summarizeRunFreshness(
		currentRun: ScoutLocalAiEvalRun,
		currentSuite: ScoutLocalAiEvalSuite | null
	): EvalRunFreshness {
		if (!currentSuite) {
			return {
				state: 'pending',
				stateLabel: 'Checking suite',
				detail: 'Load the current 100-question suite before sharing.',
				canExport: false
			};
		}
		if (currentRun.suiteId !== currentSuite.suiteId) {
			return {
				state: 'stale',
				stateLabel: 'Different suite',
				detail: `Saved export is for suite ${currentRun.suiteId ?? 'unknown'}; current suite is ${currentSuite.suiteId}. Clear it and run again before sharing for review.`,
				canExport: false
			};
		}
		if (currentRun.suiteVersion !== currentSuite.version) {
			return {
				state: 'stale',
				stateLabel: 'Old suite',
				detail: `Saved export uses suite version ${currentRun.suiteVersion ?? 'unknown'}; current suite is ${currentSuite.version}. Clear it and run again before sharing for review.`,
				canExport: false
			};
		}
		if (currentRun.suiteHash !== scoutLocalAiSuiteHash(currentSuite)) {
			return {
				state: 'stale',
				stateLabel: 'Changed suite',
				detail: 'Saved export does not match the current 100-question set. Clear it and run again before sharing for review.',
				canExport: false
			};
		}
		if (currentRun.evidenceLane !== 'device-on-device-gemma') {
			return {
				state: 'stale',
				stateLabel: 'Wrong lane',
				detail: 'Saved export is not from the on-device Gemma lane. Clear it and run again before sharing for review.',
				canExport: false
			};
		}
		if (isFullFinalRun(currentRun, currentSuite)) {
			const contextProblems = scoutLocalAiEvalRunContextProblems({
				runContext: currentRun.runContext,
				finalProof: currentSuite.finalProof
			});
			if (contextProblems.length) {
				return {
					state: 'stale',
					stateLabel: 'Proof mismatch',
					detail: `Saved full export is not valid final Dad proof: ${contextProblems.slice(0, 3).join(', ')}. Clear it and run again from the current TestFlight iPhone build.`,
					canExport: false
				};
			}
		}
		return {
			state: 'current',
			stateLabel: 'Current suite',
			detail: 'Matches the current 100-question suite.',
			canExport: true
		};
	}

	function summarizeExportHandoff(
		currentRun: ScoutLocalAiEvalRun,
		currentSuite: ScoutLocalAiEvalSuite | null
	): EvalExportHandoff {
		const fileName = `${currentRun.runId}.json`;
		const executionLabel = executionIdLabel(currentRun);
		const fullRun = currentSuite ? isFullFinalRun(currentRun, currentSuite) : false;
		if (fullRun) {
			const shareText = `Final Scout Run 100 export ${currentRun.runId}. Execution ID ${executionLabel}. Save the shared JSON into ${REVIEW_INBOX_PATH}, then run: ${REVIEW_PREP_COMMAND}`;
			return {
				state: 'final',
				label: 'Final Run 100',
				detail: `Save the shared JSON into ${REVIEW_INBOX_PATH}`,
				command: REVIEW_PREP_COMMAND,
				fileName,
				shareTitle: 'Scout final Run 100 export',
				shareText,
				successMessage: 'Final Run 100 JSON ready for inbox review.'
			};
		}
		const shareText = `Scout diagnostic export ${currentRun.runId}. Execution ID ${executionLabel}. This smoke or partial JSON is diagnostic only, not final Dad proof. Use it to rescue an interrupted run.`;
		return {
			state: 'diagnostic',
			label: 'Diagnostic export',
			detail: 'Smoke or partial JSON is diagnostic only, not final Dad proof.',
			command: 'Finish Run 100 on the TestFlight iPhone for final proof.',
			fileName,
			shareTitle: 'Scout diagnostic eval export',
			shareText,
			successMessage: 'Diagnostic JSON ready; not final Dad proof.'
		};
	}

	function isFullFinalRun(
		currentRun: ScoutLocalAiEvalRun,
		currentSuite: ScoutLocalAiEvalSuite
	): boolean {
		const target = currentRun.filters?.limit ?? currentRun.totalSuiteCases;
		return currentRun.caseCount >= currentSuite.cases.length && target >= currentSuite.cases.length;
	}

	function lastResultTimestamp(currentRun: ScoutLocalAiEvalRun): string | null {
		const last = currentRun.results.at(-1);
		return typeof last?.generatedAt === 'string' ? last.generatedAt : null;
	}

	function formatEvalTimestamp(value: string | null | undefined): string {
		if (!value) return 'Unknown';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Unknown';
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(date);
	}

	function appContextLabel(currentRun: ScoutLocalAiEvalRun): string {
		const app = recordAt(currentRun.runContext, 'app');
		const version = stringAt(app, 'version') ?? '?';
		const build = stringAt(app, 'build') ?? '?';
		return `${version} (${build})`;
	}

	function installContextLabel(currentRun: ScoutLocalAiEvalRun): string {
		const installSource = recordAt(currentRun.runContext, 'installSource');
		const type = stringAt(installSource, 'type');
		if (type === 'testflight') return 'TestFlight';
		if (type === 'debug') return 'Debug';
		if (type === 'app-store') return 'App Store';
		if (type === 'google-play') return 'Google Play';
		if (type === 'android-installer') return 'Android installer';
		return type ? type : 'Unknown';
	}

	function executionIdLabel(currentRun: ScoutLocalAiEvalRun): string {
		const execution = recordAt(currentRun.runContext, 'execution');
		return stringAt(execution, 'id') ?? 'Missing';
	}

	function recordAt(value: unknown, key: string): Record<string, unknown> | null {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
		const child = (value as Record<string, unknown>)[key];
		return child && typeof child === 'object' && !Array.isArray(child) ? child as Record<string, unknown> : null;
	}

	function stringAt(value: Record<string, unknown> | null, key: string): string | null {
		const child = value?.[key];
		return typeof child === 'string' && child ? child : null;
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
		<p class="eval-warning" role="status">Run 3 is available for smoke. Run 100 final proof needs the required TestFlight build.</p>
	{/if}

	{#if error}
		<p class="eval-error" role="alert">{error}</p>
	{/if}

	{#if saveWarning}
		<p class="eval-warning" role="status">{saveWarning}</p>
	{/if}

	{#if activeRunFreshness?.state === 'stale'}
		<p class="eval-warning" role="status">Stale export: {activeRunFreshness.detail}</p>
	{:else if activeRun && activeRunFreshness?.state === 'pending'}
		<p class="eval-warning" role="status">{activeRunFreshness.detail}</p>
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
		<button class="outline-button compact" type="button" onclick={shareRun} disabled={!activeRunCanExport}>
			Share
		</button>
		<button class="outline-button compact" type="button" onclick={copyRun} disabled={!activeRunCanExport}>
			Copy
		</button>
		<button class="outline-button compact" type="button" onclick={downloadRun} disabled={!activeRunCanExport}>
			Download
		</button>
		<button class="outline-button compact" type="button" onclick={clearSavedRun} disabled={!savedRun || running}>
			Clear
		</button>
	</div>

	{#if exportMessage}
		<p class="eval-export-status" data-state={exportStatus} role="status">{exportMessage}</p>
	{/if}

	{#if runHealth}
		<div class="eval-rescue" data-state={runHealth.state} aria-label="Saved Scout eval export status">
			<div class="eval-rescue-heading">
				<span>Saved export</span>
				<strong>{runHealth.stateLabel}</strong>
				<em>{runHealth.detail}</em>
			</div>
			<div class="eval-rescue-grid">
				<div>
					<span>Run ID</span>
					<strong>{runHealth.runIdLabel}</strong>
				</div>
				<div>
					<span>Execution ID</span>
					<strong>{runHealth.executionIdLabel}</strong>
				</div>
				<div>
					<span>Last saved</span>
					<strong>{runHealth.savedAt}</strong>
				</div>
				<div>
					<span>Suite</span>
					<strong>{runHealth.suiteLabel}</strong>
				</div>
				<div>
					<span>Completed</span>
					<strong>{runHealth.completedLabel}</strong>
				</div>
				<div>
					<span>Errors</span>
					<strong>{runHealth.errorLabel}</strong>
				</div>
				<div>
					<span>Required tools</span>
					<strong>{runHealth.toolsLabel}</strong>
				</div>
				<div>
					<span>Source evidence</span>
					<strong>{runHealth.sourceLabel}</strong>
				</div>
				<div>
					<span>Install</span>
					<strong>{runHealth.installLabel}</strong>
				</div>
				<div>
					<span>App build</span>
					<strong>{runHealth.appLabel}</strong>
				</div>
			</div>
		</div>
	{/if}

	{#if exportHandoff && activeRunCanExport}
		<div class="eval-handoff" data-state={exportHandoff.state} aria-label="Scout eval export handoff">
			<span>{exportHandoff.label}</span>
			<strong>{exportHandoff.detail}</strong>
			<em>{exportHandoff.command}</em>
		</div>
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

	.eval-rescue {
		display: grid;
		gap: 8px;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface);
		padding: 10px;
	}

	.eval-rescue[data-state='final'] {
		border-color: color-mix(in srgb, var(--forest) 35%, var(--line));
		background: var(--forest-soft);
	}

	.eval-rescue[data-state='partial'] {
		border-color: color-mix(in srgb, var(--moss) 32%, var(--line));
	}

	.eval-rescue[data-state='stale'],
	.eval-rescue[data-state='pending'] {
		border-color: color-mix(in srgb, var(--danger) 30%, var(--line));
		background: color-mix(in srgb, var(--danger) 8%, var(--surface));
	}

	.eval-handoff {
		display: grid;
		gap: 3px;
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 10px;
		background: var(--surface);
	}

	.eval-handoff[data-state='final'] {
		border-color: color-mix(in srgb, var(--forest) 35%, var(--line));
		background: var(--forest-soft);
	}

	.eval-handoff[data-state='diagnostic'] {
		border-color: color-mix(in srgb, var(--moss) 32%, var(--line));
	}

	.eval-handoff span {
		font-size: 0.64rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.eval-handoff strong,
	.eval-handoff em {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.eval-handoff strong {
		font-weight: 900;
	}

	.eval-handoff em {
		font-style: normal;
		font-weight: 800;
		color: var(--muted);
	}

	.eval-rescue-heading {
		min-width: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2px 8px;
		align-items: baseline;
	}

	.eval-rescue-heading span,
	.eval-rescue-grid span {
		font-size: 0.64rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	.eval-rescue-heading strong,
	.eval-rescue-grid strong {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.eval-rescue-heading em {
		grid-column: 1 / -1;
		font-size: 0.74rem;
		font-style: normal;
		font-weight: 800;
		color: var(--muted);
	}

	.eval-rescue-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
		gap: 7px;
	}

	.eval-rescue-grid div {
		min-width: 0;
		display: grid;
		gap: 2px;
		border: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
		border-radius: 9px;
		padding: 7px;
		background: color-mix(in srgb, var(--surface) 86%, white);
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
