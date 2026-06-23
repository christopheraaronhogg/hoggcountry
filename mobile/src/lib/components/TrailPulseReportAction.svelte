<script lang="ts">
	import { browser } from '$app/environment';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { TrailPulseChip, TrailPulseSource } from '$lib/types';

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
	type Variant = 'card' | 'map' | 'fab';

	let { label = 'Report conditions', variant = 'card' }: { label?: string; variant?: Variant } = $props();

	let sheetOpen = $state(false);
	let selectedChip = $state<TrailPulseChip | undefined>();
	let noteText = $state('');
	let reporterTrailName = $state('');
	let inputSource = $state<TrailPulseSource>('chip');
	let submitState = $state<'idle' | 'saving' | 'saved'>('idle');
	let voiceState = $state<'idle' | 'listening' | 'unsupported'>('idle');

	const submitDisabled = $derived(submitState === 'saving' || (!selectedChip && !noteText.trim()));
	const locationNote = $derived(
		trailAssistant.privacySettings.sharePreciseLocation
			? 'GPS can snap this to an approximate trail mile. Raw coordinates are not stored or sent.'
			: 'GPS snapping is off, so this uses your current app mile. Raw coordinates are not stored or sent.'
	);
	const actionLabel = $derived.by(() => {
		if (submitState === 'saving') return trailAssistant.onlineStatus ? 'Publishing...' : 'Saving offline...';
		if (submitState === 'saved') return trailAssistant.onlineStatus ? 'Published' : 'Saved offline';
		return trailAssistant.onlineStatus ? 'Publish now' : 'Save offline';
	});

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
</script>

<button
	class="report-action {variant}"
	onclick={openSheet}
	aria-label={variant === 'fab' ? 'Drop a note here' : undefined}
>
	{#if variant === 'fab'}
		<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M12 5v14M5 12h14"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				fill="none"
			/>
		</svg>
	{:else}
		{label}
	{/if}
</button>

{#if sheetOpen}
	<div class="sheet-backdrop" role="presentation" onclick={closeSheet}></div>
	<div class="report-sheet card" role="dialog" aria-modal="true" aria-label="Report trail condition">
		<div class="sheet-grip" aria-hidden="true"></div>
		<div class="section-heading">
			<p class="eyebrow">Report trail</p>
			<h2>Mile {trailAssistant.currentMile.toFixed(1)}</h2>
			<p>Public condition report</p>
		</div>
		<p class="report-privacy">
			Shares your chip or note, optional trail name, timestamp, and approximate trail mile.
			{locationNote}
			{trailAssistant.onlineStatus ? '' : ' This stays queued on this phone until service returns.'}
		</p>

		<div class="chip-grid">
			{#each chips as chip (chip)}
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
				{actionLabel}
			</button>
		</div>
	</div>
{/if}

<style>
	.report-action {
		min-height: 44px;
		padding: 0 13px;
		border-radius: 14px;
		background: var(--forest);
		color: #fff8e8;
		font-size: 0.82rem;
		font-weight: 800;
	}

	.report-action.card {
		flex: 0 0 auto;
	}

	.report-action.map {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border: 1px solid rgba(255, 253, 248, 0.9);
		background: var(--forest);
		box-shadow: var(--shadow);
	}

	/* Compact circular FAB — "drop a note here" on the map. */
	.report-action.fab {
		width: 52px;
		height: 52px;
		min-height: 52px;
		padding: 0;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--on-accent);
		border: 1px solid rgba(255, 253, 248, 0.4);
		box-shadow: var(--shadow);
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
		min-height: 44px;
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

	.report-privacy {
		margin-top: -3px;
		padding: 10px 11px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--ink);
		font-size: 0.82rem;
		line-height: 1.45;
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

		.report-action.card {
			width: 100%;
		}
	}
</style>
