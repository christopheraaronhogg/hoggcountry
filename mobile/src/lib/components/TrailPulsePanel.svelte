<script lang="ts">
	import { browser } from '$app/environment';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { TrailConditionReport, TrailPulseChip, TrailPulseSource } from '$lib/types';

	const chips: TrailPulseChip[] = ['Rocks', 'Mud', 'Blowdown', 'Water', 'Crowded', 'Sketchy', 'View', 'Other'];

	type SpeechResultEvent = {
		results: ArrayLike<ArrayLike<{ transcript: string }>>;
	};

	type SpeechRecognitionLike = {
		continuous: boolean;
		interimResults: boolean;
		lang: string;
		onend: (() => void) | null;
		onerror: (() => void) | null;
		onresult: ((event: SpeechResultEvent) => void) | null;
		start: () => void;
		stop: () => void;
	};

	type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

	let sheetOpen = $state(false);
	let selectedChip = $state<TrailPulseChip | undefined>();
	let noteText = $state('');
	let reporterTrailName = $state('');
	let inputSource = $state<TrailPulseSource>('chip');
	let submitState = $state<'idle' | 'saving' | 'saved'>('idle');
	let voiceState = $state<'idle' | 'listening' | 'unsupported'>('idle');
	let activeAlert = $state<TrailConditionReport | null>(null);

	const nearbyReports = $derived(trailAssistant.nearbyTrailPulseReports);
	const submitDisabled = $derived(submitState === 'saving' || (!selectedChip && !noteText.trim()));

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

	function getSpeechRecognition(): SpeechRecognitionConstructor | null {
		if (!browser) return null;
		const speechWindow = window as Window & {
			SpeechRecognition?: SpeechRecognitionConstructor;
			webkitSpeechRecognition?: SpeechRecognitionConstructor;
		};

		return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
	}

	function openSheet() {
		sheetOpen = true;
		submitState = 'idle';
	}

	function closeSheet() {
		sheetOpen = false;
		submitState = 'idle';
		voiceState = 'idle';
	}

	function chooseChip(chip: TrailPulseChip) {
		selectedChip = chip;
		inputSource = 'chip';
		submitState = 'idle';
	}

	function updateNote(value: string) {
		noteText = value;
		inputSource = value.trim() ? 'text' : selectedChip ? 'chip' : 'text';
		submitState = 'idle';
	}

	function startVoice() {
		const SpeechRecognition = getSpeechRecognition();
		if (!SpeechRecognition) {
			voiceState = 'unsupported';
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.lang = 'en-US';
		recognition.onresult = (event) => {
			const transcript = event.results[0]?.[0]?.transcript?.trim();
			if (transcript) {
				noteText = transcript;
				inputSource = 'voice';
				submitState = 'idle';
			}
		};
		recognition.onerror = () => {
			voiceState = 'idle';
		};
		recognition.onend = () => {
			voiceState = 'idle';
		};

		voiceState = 'listening';
		recognition.start();
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

	async function submit() {
		if (submitDisabled) return;

		submitState = 'saving';
		const report = await trailAssistant.submitTrailPulseReport({
			source: inputSource,
			chipText: selectedChip,
			noteText,
			reporterTrailName
		});

		if (!report) {
			submitState = 'idle';
			return;
		}

		selectedChip = undefined;
		noteText = '';
		reporterTrailName = '';
		inputSource = 'chip';
		submitState = 'saved';

		setTimeout(() => {
			closeSheet();
		}, 450);
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
			<p>{nearbyReports.length} active in this 0.1 mi window</p>
		</div>

		<button class="report-button" onclick={openSheet}>Report trail</button>
	</div>

	{#if nearbyReports.length}
		<div class="pulse-list">
			{#each nearbyReports as report}
				<article class="pulse-row">
					<div class="mile-chip">Mile {report.snappedMile.toFixed(1)}</div>
					<div class="pulse-copy">
						<strong>{trailAssistant.formatTrailPulseReport(report)}</strong>
						<span>{formatAge(report.observedAt)} {report.syncState === 'queued-offline' ? '| queued offline' : ''}</span>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<p class="empty-pulse">No one has reported this 0.1-mile window yet.</p>
	{/if}
</section>

{#if sheetOpen}
	<div class="sheet-backdrop" role="presentation" onclick={closeSheet}></div>
	<section class="report-sheet card" aria-label="Report trail condition">
		<div class="sheet-grip" aria-hidden="true"></div>
		<div class="section-heading">
			<p class="eyebrow">Report trail</p>
			<h2>Mile {trailAssistant.currentMile.toFixed(1)}</h2>
			<p>Public trail note</p>
		</div>

		<div class="chip-grid">
			{#each chips as chip}
				<button class:active={selectedChip === chip} class="condition-chip" onclick={() => chooseChip(chip)}>
					{chip}
				</button>
			{/each}
		</div>

		<div class="voice-row">
			<button class="voice-button" onclick={startVoice}>
				{voiceState === 'listening' ? 'Listening...' : 'Voice'}
			</button>
			<span>
				{voiceState === 'unsupported'
					? 'Voice dictation is not available in this browser.'
					: voiceState === 'listening'
						? 'Listening now'
						: 'Watch-ready voice note'}
			</span>
		</div>

		<label class="field-label" for="pulse-note">Text note</label>
		<textarea
			id="pulse-note"
			rows="3"
			value={noteText}
			placeholder="lots of rocks"
			oninput={(event) => updateNote(event.currentTarget.value)}
		></textarea>

		<label class="field-label" for="pulse-trail-name">Trail name</label>
		<input
			id="pulse-trail-name"
			value={reporterTrailName}
			placeholder="Optional"
			oninput={(event) => (reporterTrailName = event.currentTarget.value)}
		/>

		<div class="sheet-actions">
			<button class="secondary-button" onclick={closeSheet}>Cancel</button>
			<button class="cta-button" disabled={submitDisabled} onclick={submit}>
				{submitState === 'saving' ? 'Publishing...' : submitState === 'saved' ? 'Published' : 'Publish now'}
			</button>
		</div>
	</section>
{/if}

<style>
	.trail-pulse {
		padding: 18px;
		display: grid;
		gap: 14px;
		background:
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(246, 242, 232, 0.98)),
			radial-gradient(circle at top left, rgba(170, 104, 67, 0.12), transparent 38%);
	}

	.pulse-alert {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px;
		border-radius: 14px;
		background: #241f19;
		color: #fff8e8;
	}

	.pulse-alert div {
		display: grid;
		gap: 3px;
	}

	.pulse-alert .eyebrow,
	.pulse-alert span {
		color: rgba(255, 248, 232, 0.76);
	}

	.dismiss-alert {
		min-width: 44px;
		height: 38px;
		border-radius: 12px;
		background: rgba(255, 248, 232, 0.14);
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

	.report-button {
		flex: 0 0 auto;
		min-height: 42px;
		padding: 0 13px;
		border-radius: 14px;
		background: var(--forest);
		color: #fff8e8;
		font-size: 0.82rem;
		font-weight: 800;
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
		background: rgba(47, 75, 53, 0.07);
	}

	.mile-chip {
		padding: 7px 9px;
		border-radius: 999px;
		background: rgba(255, 253, 248, 0.86);
		color: var(--forest);
		font-size: 0.72rem;
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
		font-size: 0.76rem;
		color: var(--muted);
	}

	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(31, 36, 29, 0.4);
	}

	.report-sheet {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 8px);
		z-index: 50;
		max-width: calc(var(--app-width) - 24px);
		margin: 0 auto;
		padding: 12px 16px 16px;
		display: grid;
		gap: 12px;
		box-shadow: 0 20px 60px rgba(31, 36, 29, 0.28);
	}

	.sheet-grip {
		width: 44px;
		height: 4px;
		border-radius: 999px;
		background: rgba(95, 101, 88, 0.25);
		justify-self: center;
	}

	.chip-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}

	.condition-chip,
	.voice-button {
		min-height: 40px;
		border-radius: 13px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.condition-chip.active {
		background: var(--forest);
		color: #fff8e8;
	}

	.voice-row {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 10px;
		align-items: center;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.field-label {
		margin-bottom: -6px;
		font-size: 0.74rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	textarea,
	input {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: #fffdf8;
		color: var(--ink);
		padding: 12px;
	}

	textarea {
		resize: none;
	}

	.sheet-actions {
		display: grid;
		grid-template-columns: 0.82fr 1.18fr;
		gap: 10px;
	}

	.cta-button:disabled {
		opacity: 0.5;
	}

	@media (max-width: 360px) {
		.chip-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.pulse-heading,
		.pulse-alert,
		.pulse-row {
			grid-template-columns: 1fr;
		}

		.report-button {
			width: 100%;
		}
	}
</style>
