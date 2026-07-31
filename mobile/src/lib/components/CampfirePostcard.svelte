<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		CAMPFIRE_MOODS,
		CAMPFIRE_NOTE_MAX_CHARS,
		buildCampfirePostcard,
		shareCampfirePostcard,
		type CampfireMood
	} from '$lib/campfire-postcard';
	import {
		createCampfirePostcardDraft,
		isTodaysCampfireDraft,
		loadCampfirePostcardDraft,
		saveCampfirePostcardDraft,
		type CampfirePostcardDraft
	} from '$lib/campfire-postcard-draft';
	import { createMobilePersistenceAdapter } from '$lib/mobile-persistence';
	import { trailAssistant } from '$lib/trailState.svelte';
	import Icon from './Icon.svelte';

	type ActionTone = 'success' | 'neutral' | 'error';

	let composerOpen = $state(false);
	let draftBase = $state<CampfirePostcardDraft | null>(null);
	let mood = $state<CampfireMood>('grateful');
	let note = $state('');
	let includeWeather = $state(true);
	let actionStatus = $state<{ message: string; tone: ActionTone } | null>(null);
	let sharing = $state(false);
	let closeButton = $state<HTMLButtonElement | null>(null);
	let sheetElement = $state<HTMLDivElement | null>(null);
	let restoreFocus = $state<HTMLElement | null>(null);
	let scrollContainer: HTMLElement | null = null;
	let previousScrollOverflow = '';
	let draftSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let restorePromise: Promise<void> | null = null;
	let draftWriteChain = Promise.resolve();
	let fixedPositionContainingBlock: HTMLElement | null = null;
	let previousContainingBlockAnimation = '';
	let previousContainingBlockTransform = '';
	let isolatedElements: Array<{
		element: HTMLElement;
		inert: boolean;
		ariaHidden: string | null;
	}> = [];
	const draftPersistence = createMobilePersistenceAdapter();

	const availableWeather = $derived(trailAssistant.fieldPack.weather);
	const liveTrailName = $derived(
		trailAssistant.hikeProfile.trailName?.trim() ||
			(trailAssistant.hikeProfile.mode === 'dad-pilot' ? 'Hogg Country' : undefined)
	);
	const postcardSource = $derived.by(() => ({
		dayNumber: draftBase?.dayNumber ?? trailAssistant.dayNumber,
		currentMile: draftBase?.currentMile ?? trailAssistant.currentMile,
		direction: draftBase?.direction ?? trailAssistant.hikeProfile.direction,
		dateLabel: draftBase?.dateLabel ?? 'Tonight',
		trailName: draftBase?.trailName ?? liveTrailName
	}));
	const postcard = $derived(
		buildCampfirePostcard({
			...postcardSource,
			mood,
			note,
			weather: includeWeather ? availableWeather : null
		})
	);
	const matchingDocument = $derived(
		trailAssistant.documents.find((document) => document.title === postcard.title) ?? null
	);
	const alreadySaved = $derived(matchingDocument?.body === postcard.shareText);

	onMount(() => {
		restorePromise = restoreDraft();
		return () => {
			if (draftSaveTimer) clearTimeout(draftSaveTimer);
			void persistDraft();
			unlockBackgroundScroll();
			restoreBackgroundAccessibility();
			restoreFixedPositionContainingBlock();
		};
	});

	async function openComposer(event: MouseEvent) {
		restoreFocus = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
		await restorePromise;
		if (!draftBase || !isTodaysCampfireDraft(draftBase)) beginFreshDraft();
		actionStatus = null;
		neutralizeFixedPositionContainingBlock(restoreFocus);
		composerOpen = true;
		lockBackgroundScroll(restoreFocus);
		await tick();
		isolateBackgroundForAssistiveTech();
		closeButton?.focus();
	}

	function closeComposer(shouldRestoreFocus = true) {
		void persistDraft();
		composerOpen = false;
		unlockBackgroundScroll();
		restoreBackgroundAccessibility();
		void tick().then(() => {
			if (shouldRestoreFocus) restoreFocus?.focus();
		});
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!composerOpen) return;
		if (event.key === 'Escape') {
			closeComposer();
			return;
		}
		if (event.key !== 'Tab' || !sheetElement) return;

		const focusable = Array.from(
			sheetElement.querySelectorAll<HTMLElement>(
				'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
			)
		);
		const first = focusable[0];
		const last = focusable.at(-1);
		if (!first || !last) return;
		if (!sheetElement.contains(document.activeElement)) {
			event.preventDefault();
			first.focus();
			return;
		}
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function chooseMood(nextMood: CampfireMood) {
		mood = nextMood;
		actionStatus = null;
		scheduleDraftSave();
	}

	function updateNote(event: Event) {
		note = (event.currentTarget as HTMLTextAreaElement).value;
		actionStatus = null;
		scheduleDraftSave();
	}

	function toggleWeather(event: Event) {
		includeWeather = (event.currentTarget as HTMLInputElement).checked;
		actionStatus = null;
		scheduleDraftSave();
	}

	function saveToJournal() {
		if (matchingDocument) {
			trailAssistant.updateDocument(matchingDocument.id, {
				title: postcard.title,
				body: postcard.shareText
			});
		} else {
			const document = trailAssistant.createDocument({
				title: postcard.title,
				body: postcard.shareText
			});
			if (!document) {
				setStatus('Couldn’t add this postcard to Trail Docs. Try again.', 'error');
				return;
			}
		}
		void persistDraft();
		setStatus('Added to Trail Docs on this phone.', 'success');
	}

	async function sharePostcard() {
		if (sharing) return;
		sharing = true;
		actionStatus = null;
		try {
			const outcome = await shareCampfirePostcard(
				{
					share: navigator.share?.bind(navigator),
					clipboard: navigator.clipboard
				},
				postcard
			);
			if (outcome === 'share-sheet-closed') {
				setStatus('Share sheet closed. Your postcard is still here.', 'neutral');
			} else if (outcome === 'copied') {
				setStatus('Copied. Paste it into a message.', 'success');
			} else if (outcome === 'unavailable') {
				setStatus('This device can’t share or copy the postcard.', 'error');
			} else if (outcome === 'failed') {
				setStatus('The share sheet didn’t open. Your postcard is still here.', 'error');
			} else if (outcome === 'cancelled') {
				setStatus('Sharing canceled. Your postcard is still here.', 'neutral');
			}
		} finally {
			sharing = false;
		}
	}

	function viewInTrailDocs() {
		closeComposer(false);
		trailAssistant.openTrailSection('docs');
	}

	function beginFreshDraft() {
		draftBase = createCampfirePostcardDraft({
			dayNumber: trailAssistant.dayNumber,
			currentMile: trailAssistant.currentMile,
			direction: trailAssistant.hikeProfile.direction,
			trailName: liveTrailName,
			includeWeather: Boolean(availableWeather)
		});
		mood = draftBase.mood;
		note = draftBase.note;
		includeWeather = draftBase.includeWeather;
		void persistDraft();
	}

	async function restoreDraft() {
		const restored = await loadCampfirePostcardDraft(draftPersistence).catch(() => null);
		if (!restored || !isTodaysCampfireDraft(restored)) return;
		draftBase = restored;
		mood = restored.mood;
		note = restored.note;
		includeWeather = restored.includeWeather;
	}

	function scheduleDraftSave() {
		if (!draftBase) return;
		if (draftSaveTimer) clearTimeout(draftSaveTimer);
		draftSaveTimer = setTimeout(() => {
			draftSaveTimer = null;
			void persistDraft();
		}, 250);
	}

	async function persistDraft() {
		if (!draftBase) return;
		const draft: CampfirePostcardDraft = {
			...draftBase,
			mood,
			note: note.trim().slice(0, CAMPFIRE_NOTE_MAX_CHARS),
			includeWeather,
			updatedAt: new Date().toISOString()
		};
		draftBase = draft;
		draftWriteChain = draftWriteChain
			.catch(() => undefined)
			.then(() => saveCampfirePostcardDraft(draftPersistence, draft))
			.catch(() => undefined);
		await draftWriteChain;
	}

	function lockBackgroundScroll(trigger: HTMLElement | null) {
		scrollContainer = trigger?.closest<HTMLElement>('.screen-scroll') ?? null;
		if (!scrollContainer) return;
		previousScrollOverflow = scrollContainer.style.overflow;
		scrollContainer.style.overflow = 'hidden';
	}

	function unlockBackgroundScroll() {
		if (!scrollContainer) return;
		scrollContainer.style.overflow = previousScrollOverflow;
		scrollContainer = null;
		previousScrollOverflow = '';
	}

	function neutralizeFixedPositionContainingBlock(trigger: HTMLElement | null) {
		if (fixedPositionContainingBlock) return;
		fixedPositionContainingBlock = trigger?.closest<HTMLElement>('.today') ?? null;
		if (!fixedPositionContainingBlock) return;
		// app.css keeps the tab-entry transform filled after its animation. Even an identity
		// transform becomes the containing block for fixed descendants, so release it while
		// this component is mounted after its first open.
		previousContainingBlockAnimation = fixedPositionContainingBlock.style.animation;
		previousContainingBlockTransform = fixedPositionContainingBlock.style.transform;
		fixedPositionContainingBlock.style.animation = 'none';
		fixedPositionContainingBlock.style.transform = 'none';
	}

	function restoreFixedPositionContainingBlock() {
		if (!fixedPositionContainingBlock) return;
		fixedPositionContainingBlock.style.animation = previousContainingBlockAnimation;
		fixedPositionContainingBlock.style.transform = previousContainingBlockTransform;
		fixedPositionContainingBlock = null;
		previousContainingBlockAnimation = '';
		previousContainingBlockTransform = '';
	}

	function isolateBackgroundForAssistiveTech() {
		if (!sheetElement || isolatedElements.length) return;
		let activeBranch: HTMLElement = sheetElement;
		let parent = activeBranch.parentElement;

		while (parent && parent !== document.body) {
			for (const sibling of Array.from(parent.children)) {
				if (!(sibling instanceof HTMLElement) || sibling === activeBranch) continue;
				if (sibling.classList.contains('postcard-backdrop')) continue;
				isolatedElements.push({
					element: sibling,
					inert: sibling.inert,
					ariaHidden: sibling.getAttribute('aria-hidden')
				});
				sibling.inert = true;
				sibling.setAttribute('aria-hidden', 'true');
			}
			activeBranch = parent;
			parent = parent.parentElement;
		}
	}

	function restoreBackgroundAccessibility() {
		for (const { element, inert, ariaHidden } of isolatedElements) {
			element.inert = inert;
			if (ariaHidden === null) {
				element.removeAttribute('aria-hidden');
			} else {
				element.setAttribute('aria-hidden', ariaHidden);
			}
		}
		isolatedElements = [];
	}

	function setStatus(message: string, tone: ActionTone) {
		actionStatus = { message, tone };
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<button class="postcard-invite card" type="button" onclick={openComposer}>
	<span class="invite-icon" aria-hidden="true">
		<Icon name="campfire" size={25} stroke={1.7} />
	</span>
	<span class="invite-copy">
		<span class="eyebrow">Tonight</span>
		<strong>Write tonight’s postcard</strong>
		<small>Keep one line from today, then save or share it.</small>
	</span>
	<span class="invite-arrow" aria-hidden="true">›</span>
</button>

{#if composerOpen}
	<div class="postcard-backdrop" role="presentation" onclick={() => closeComposer()}></div>
	<div
		bind:this={sheetElement}
		class="postcard-sheet"
		role="dialog"
		aria-modal="true"
		aria-labelledby="campfire-postcard-title"
	>
		<div class="sheet-grip" aria-hidden="true"></div>
		<header class="sheet-head">
			<div>
				<p class="eyebrow">Tonight on the trail</p>
				<h2 id="campfire-postcard-title">Campfire Postcard</h2>
				<p>Review it before you save or share.</p>
			</div>
			<button
				bind:this={closeButton}
				class="close-button"
				type="button"
				aria-label="Close postcard editor"
				onclick={() => closeComposer()}>×</button
			>
		</header>

		<article class="postcard-preview" aria-label="Campfire Postcard preview">
			<div class="postcard-night">
				<span class="postcard-mark" aria-hidden="true">
					<Icon name="campfire" size={31} stroke={1.65} />
				</span>
				<div>
					<p>Tonight from Hogg Country</p>
					<strong>{postcard.trailLine}</strong>
					<small>{postcard.directionLabel} · {postcardSource.dateLabel}</small>
				</div>
			</div>
			<div class="postcard-paper">
				<p class="mood-line">{postcard.moodLine}</p>
				{#if postcard.note}
					<p class="postcard-note">{postcard.note}</p>
				{:else}
					<p class="postcard-placeholder">Add one line about today.</p>
				{/if}
				{#if postcard.weatherLine}
					<p class="weather-line">{postcard.weatherLine}</p>
				{/if}
				<p class="signature">{postcard.signature}</p>
				<p class="postcard-truth">Approximate trail mile · not live GPS tracking</p>
			</div>
		</article>

		<fieldset class="mood-field">
			<legend>How did today feel?</legend>
			<div class="mood-grid">
				{#each CAMPFIRE_MOODS as option (option.value)}
					<label class:active={mood === option.value}>
						<input
							type="radio"
							name="campfire-mood"
							value={option.value}
							checked={mood === option.value}
							onchange={() => chooseMood(option.value)}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		<label class="note-field">
			<span>
				<strong>One thing worth remembering</strong>
				<output id="campfire-note-counter" for="campfire-note">
					{note.length}/{CAMPFIRE_NOTE_MAX_CHARS}
				</output>
			</span>
			<textarea
				id="campfire-note"
				value={note}
				oninput={updateNote}
				maxlength={CAMPFIRE_NOTE_MAX_CHARS}
				aria-describedby="campfire-note-counter"
				rows="4"
				placeholder="The view, the hard part, the person who helped, or what made you laugh…"
			></textarea>
		</label>

		<label class="weather-choice" class:unavailable={!availableWeather}>
			<input
				type="checkbox"
				checked={includeWeather}
				disabled={!availableWeather}
				onchange={toggleWeather}
			/>
			<span>
				<strong>Include saved forecast</strong>
				<small>
					{availableWeather
						? 'Adds its saved date and a reminder to verify before relying on it.'
						: 'No saved forecast is available in this field pack.'}
				</small>
			</span>
		</label>

		<p class="privacy-note">
			This stays yours until you choose to save or share it. Sharing includes the approximate trail
			mile shown above, never live GPS tracking.
		</p>
		<div class="sheet-footer">
			<div class="postcard-actions">
				{#if alreadySaved}
					<button class="outline-button" type="button" onclick={viewInTrailDocs}>View in Trail Docs</button>
				{:else}
					<button class="outline-button" type="button" onclick={saveToJournal}>Save to Trail Docs</button>
				{/if}
				<button class="cta-button" type="button" disabled={sharing} onclick={sharePostcard}>
					{sharing ? 'Opening…' : 'Share postcard'}
				</button>
			</div>
			<p class="action-status" data-tone={actionStatus?.tone ?? 'neutral'} aria-live="polite">
				{actionStatus?.message ?? ''}
			</p>
		</div>
	</div>
{/if}

<style>
	.postcard-invite {
		width: 100%;
		padding: 15px 14px;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		text-align: left;
		background:
			radial-gradient(circle at 88% 20%, var(--sand-soft), transparent 34%),
			var(--surface-strong);
		transition:
			transform var(--dur-fast) var(--ease-spring),
			border-color var(--dur-base) var(--ease-out);
	}

	.postcard-invite:active {
		transform: scale(0.985);
	}

	.invite-icon {
		width: 46px;
		height: 46px;
		display: grid;
		place-items: center;
		border-radius: 15px;
		background: linear-gradient(145deg, #aa6843, #7f432c);
		color: #fff4df;
		box-shadow: var(--shadow-soft);
	}

	.invite-copy {
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.invite-copy .eyebrow {
		margin: 0;
		color: var(--clay);
	}

	.invite-copy strong {
		font-family: var(--font-display);
		font-size: 1.08rem;
		line-height: 1.12;
	}

	.invite-copy small {
		color: var(--muted);
		font-size: var(--text-floor);
		line-height: 1.35;
	}

	.invite-arrow {
		color: var(--clay);
		font-size: 1.8rem;
		line-height: 1;
	}

	.postcard-backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(18, 21, 17, 0.62);
		backdrop-filter: blur(3px);
	}

	.postcard-sheet {
		position: fixed;
		z-index: 61;
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
		width: min(100%, var(--app-width));
		max-height: 94dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 8px 16px calc(16px + env(safe-area-inset-bottom, 0px));
		display: grid;
		gap: 14px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-bottom: 0;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: 0 -22px 55px rgba(18, 21, 17, 0.28);
		animation: postcard-rise var(--dur-slow) var(--ease-out);
	}

	@keyframes postcard-rise {
		from {
			transform: translate(-50%, 18px);
			opacity: 0.5;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}

	.sheet-grip {
		width: 42px;
		height: 4px;
		border-radius: 999px;
		background: var(--line);
		justify-self: center;
	}

	.sheet-head {
		position: sticky;
		top: -8px;
		z-index: 2;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0 10px;
		background: var(--surface);
	}

	.sheet-head .eyebrow {
		margin: 0 0 3px;
		color: var(--clay);
	}

	.sheet-head h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		line-height: 1.05;
	}

	.sheet-head p:last-child {
		margin-top: 4px;
		color: var(--muted);
		font-size: 0.82rem;
	}

	.close-button {
		width: 44px;
		height: 44px;
		flex: none;
		display: grid;
		place-items: center;
		border-radius: 999px;
		background: var(--ink-soft);
		color: var(--muted);
		font-size: 1.45rem;
		line-height: 1;
	}

	.postcard-preview {
		overflow: hidden;
		border: 1px solid rgba(170, 104, 67, 0.28);
		border-radius: 18px;
		background: #fffaf0;
		color: #26251f;
		box-shadow: var(--shadow-ridge);
	}

	.postcard-night {
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		background:
			radial-gradient(circle at 78% 20%, rgba(231, 177, 99, 0.2), transparent 34%),
			linear-gradient(145deg, #213429, #18271f);
		color: #fff4df;
	}

	.postcard-mark {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		color: #ffd28e;
		background: rgba(255, 244, 223, 0.08);
		border: 1px solid rgba(255, 210, 142, 0.24);
	}

	.postcard-night div {
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.postcard-night p {
		color: #ffd28e;
		font-size: var(--text-floor);
		font-weight: 900;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.postcard-night strong {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.postcard-night small {
		color: rgba(255, 244, 223, 0.7);
		font-size: var(--text-floor);
	}

	.postcard-paper {
		padding: 16px;
		display: grid;
		gap: 10px;
		background:
			linear-gradient(rgba(170, 104, 67, 0.035) 1px, transparent 1px),
			#fffaf0;
		background-size: 100% 24px;
	}

	.mood-line {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
	}

	.postcard-note {
		white-space: pre-line;
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.postcard-placeholder {
		color: #777064;
		font-size: 0.86rem;
		font-style: italic;
	}

	.weather-line {
		padding-top: 9px;
		border-top: 1px solid rgba(170, 104, 67, 0.18);
		color: #625e53;
		font-size: 0.76rem;
		line-height: 1.4;
	}

	.signature {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 700;
	}

	.postcard-truth {
		color: #777064;
		font-size: 0.72rem;
		font-weight: 700;
	}

	fieldset {
		padding: 0;
		margin: 0;
		border: 0;
	}

	.mood-field legend,
	.note-field > span strong {
		font-size: var(--text-floor);
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.mood-grid {
		margin-top: 7px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.mood-grid label {
		position: relative;
		min-width: 0;
	}

	.mood-grid input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.mood-grid label span {
		min-height: 44px;
		padding: 8px;
		display: grid;
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface-strong);
		color: var(--muted);
		font-size: var(--text-floor);
		font-weight: 800;
		text-align: center;
	}

	.mood-grid label.active span {
		border-color: var(--clay);
		background: var(--clay-soft);
		color: var(--clay);
	}

	.mood-grid input:focus-visible + span {
		outline: 3px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.note-field {
		display: grid;
		gap: 7px;
	}

	.note-field > span {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.note-field > span output {
		color: var(--muted);
		font-size: var(--text-floor);
		font-variant-numeric: tabular-nums;
	}

	textarea {
		width: 100%;
		min-height: 96px;
		resize: vertical;
		padding: 11px 12px;
		border: 1px solid var(--line);
		border-radius: 13px;
		background: var(--surface-strong);
		color: var(--ink);
		line-height: 1.45;
	}

	textarea:focus {
		outline: none;
		border-color: var(--forest);
		box-shadow: 0 0 0 3px var(--forest-soft);
	}

	.weather-choice {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 11px 12px;
		border: 1px solid var(--line);
		border-radius: 13px;
		background: var(--surface-strong);
	}

	.weather-choice.unavailable {
		opacity: 0.66;
	}

	.weather-choice input {
		width: 19px;
		height: 19px;
		margin: 1px 0 0;
		accent-color: var(--forest);
		flex: none;
	}

	.weather-choice span {
		display: grid;
		gap: 2px;
	}

	.weather-choice strong {
		font-size: 0.82rem;
	}

	.weather-choice small {
		color: var(--muted);
		font-size: var(--text-floor);
	}

	.postcard-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.postcard-actions button:disabled {
		opacity: 0.62;
		cursor: default;
	}

	.sheet-footer {
		position: sticky;
		bottom: calc(-16px - env(safe-area-inset-bottom, 0px));
		z-index: 2;
		margin-inline: -1px;
		padding: 11px 1px calc(16px + env(safe-area-inset-bottom, 0px));
		display: grid;
		gap: 6px;
		border-top: 1px solid var(--divider-soft);
		background: var(--surface);
	}

	.privacy-note {
		color: var(--muted);
		font-size: var(--text-floor);
		line-height: 1.4;
	}

	.action-status {
		min-height: 1.15em;
		font-size: var(--text-floor);
		font-weight: 800;
	}

	.action-status[data-tone='success'] {
		color: var(--success);
	}

	.action-status[data-tone='neutral'] {
		color: var(--muted);
	}

	.action-status[data-tone='error'] {
		color: var(--danger);
	}

	@media (max-width: 350px) {
		.postcard-actions {
			grid-template-columns: 1fr;
		}

		.postcard-night {
			padding: 14px;
			gap: 10px;
		}

		.postcard-mark {
			width: 42px;
			height: 42px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.postcard-sheet {
			animation: none;
		}
	}
</style>
