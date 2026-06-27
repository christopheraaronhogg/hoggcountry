<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { quickPrompts } from '$lib/scout/quick-prompts';
	import { trailAssistant } from '$lib/trailState.svelte';
	import {
		CHAT_FOLLOW_THRESHOLD,
		isAtLiveEdge,
		liveEdgeScrollTop,
		turnSpacerHeight,
		turnStartScrollTop
	} from '$lib/chat-scroll';
	import type {
		RequiredConfirmation,
		SafetyFlag,
		ScoutConfidence,
	} from '$lib/scout';
	import type { SourceReceipt as UiSourceReceipt } from './source-receipts';
	import { toUiSourceReceipt } from './source-receipts';
	import SourceChip from './SourceChip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';
	import Icon from './Icon.svelte';
	import ScoutModelStatusBubble from './ScoutModelStatusBubble.svelte';
	import { isScoutAuthResumeMessage } from '$lib/scout/scout-auth-resume';

	let draft = $state('');
	let logRef = $state<HTMLDivElement | null>(null);
	let liveEdgeRef = $state<HTMLDivElement | null>(null);
	let modelPhase = $derived(trailAssistant.modelPhase);
	let scoutReplyInProgress = $derived(trailAssistant.scoutReplyInProgress);

	// "Following" is an explicit reader mode, not just a geometry accident. It is
	// turned on by Send/quick prompt/Jump to latest, and turned off by reader
	// interactions such as scrolling, selection, keyboard use, or opening details.
	let following = $state(false);
	let hasUnseen = $state(false);
	let initialPlacementDone = $state(false);
	let activeTurnMessageId = $state<string | null>(null);
	let turnSpacer = $state(0);
	let searchQuery = $state('');
	let activeSearchMessageId = $state<string | null>(null);
	let firstUnseenMessageId = $state<string | null>(null);
	const searchResultIds = $derived(matchingMessageIds(searchQuery));
	const activeSearchIndex = $derived(
		activeSearchMessageId ? searchResultIds.indexOf(activeSearchMessageId) : -1
	);
	const searchResultLabel = $derived.by(() => {
		const query = searchQuery.trim();
		if (!query) return 'Search messages';
		if (searchResultIds.length === 0) return 'No matches';
		const ordinal = activeSearchIndex >= 0 ? activeSearchIndex + 1 : 1;
		return `${ordinal} of ${searchResultIds.length}`;
	});
	let outOfViewStatus = $derived(
		!following && (hasUnseen || scoutReplyInProgress)
			? scoutReplyInProgress
				? 'Scout is replying below.'
				: 'New Scout messages below.'
			: ''
	);

	const prefersReduced =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	let programmaticScroll = false;
	let programmaticTimer: ReturnType<typeof setTimeout> | null = null;
	let scrollFrame: number | null = null;
	let placementToken = 0;
	let turnPlacementInProgress = false;
	let observedSignature = '';
	let readerAnchor: { messageId: string; offsetFromTop: number } | null = null;
	const MESSAGE_HASH_PREFIX = '#chat-message-';

	onMount(() => {
		void restoreInitialReaderPosition();
		return () => {
			placementToken += 1;
			if (programmaticTimer) clearTimeout(programmaticTimer);
			if (scrollFrame !== null && typeof cancelAnimationFrame !== 'undefined') {
				cancelAnimationFrame(scrollFrame);
			}
		};
	});

	function distanceFromBottom(): number {
		if (!logRef) return 0;
		return logRef.scrollHeight - logRef.scrollTop - logRef.clientHeight;
	}

	function modelPhaseSignature(): string {
		if (modelPhase.kind === 'downloading') {
			return `${modelPhase.kind}:${modelPhase.percent}:${modelPhase.bytesLabel}`;
		}
		return modelPhase.kind;
	}

	function conversationSignature(): string {
		const messages = trailAssistant.coachMessages;
		const last = messages.at(-1);
		return [
			messages.length,
			last?.id ?? 'none',
			last?.content.length ?? 0,
			trailAssistant.scoutThinking ? 'thinking' : 'idle',
			scoutReplyInProgress ? 'replying' : 'done',
			trailAssistant.pendingAction?.id ?? 'no-action',
			modelPhaseSignature()
		].join('|');
	}

	function latestUserMessageId(): string | null {
		for (let index = trailAssistant.coachMessages.length - 1; index >= 0; index -= 1) {
			const message = trailAssistant.coachMessages[index];
			if (message?.role === 'user') return message.id;
		}
		return null;
	}

	function findMessageElement(messageId: string): HTMLElement | null {
		if (!logRef) return null;
		const messages = logRef.querySelectorAll<HTMLElement>('[data-message-id]');
		for (const message of messages) {
			if (message.dataset.messageId === messageId) return message;
		}
		return null;
	}

	function elementTopInLog(element: HTMLElement): number {
		if (!logRef) return element.offsetTop;
		const logRect = logRef.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();
		return elementRect.top - logRect.top + logRef.scrollTop;
	}

	function scheduleDomTask(task: () => void): void {
		void tick().then(() => {
			if (scrollFrame !== null && typeof cancelAnimationFrame !== 'undefined') {
				cancelAnimationFrame(scrollFrame);
			}
			const run = () => {
				scrollFrame = null;
				task();
			};
			if (typeof requestAnimationFrame === 'undefined') {
				run();
			} else {
				scrollFrame = requestAnimationFrame(run);
			}
		});
	}

	function markProgrammaticScroll(smooth: boolean): void {
		programmaticScroll = true;
		if (programmaticTimer) clearTimeout(programmaticTimer);
		programmaticTimer = setTimeout(
			() => {
				programmaticScroll = false;
			},
			smooth && !prefersReduced ? 520 : 90
		);
	}

	function scrollLogTo(top: number, smooth = false): void {
		if (!logRef) return;
		markProgrammaticScroll(smooth);
		logRef.scrollTo({
			top,
			behavior: smooth && !prefersReduced ? 'smooth' : 'auto'
		});
	}

	function updateTurnSpacer(messageId = activeTurnMessageId): void {
		if (!logRef || !messageId) {
			turnSpacer = 0;
			return;
		}
		const message = findMessageElement(messageId);
		turnSpacer = message ? turnSpacerHeight(logRef.clientHeight, message.offsetHeight) : 0;
	}

	function liveEdgeIsInFollowRange(): boolean {
		if (!logRef) return true;
		if (!liveEdgeRef) {
			return isAtLiveEdge(
				{
					scrollTop: logRef.scrollTop,
					scrollHeight: logRef.scrollHeight,
					clientHeight: logRef.clientHeight
				},
				CHAT_FOLLOW_THRESHOLD
			);
		}
		return elementTopInLog(liveEdgeRef) - (logRef.scrollTop + logRef.clientHeight) <= CHAT_FOLLOW_THRESHOLD;
	}

	function scrollToLiveEdge(smooth = false): void {
		following = true;
		hasUnseen = false;
		firstUnseenMessageId = null;
		scheduleDomTask(() => {
			if (!logRef) return;
			updateTurnSpacer();
			const target = liveEdgeRef
				? liveEdgeScrollTop(elementTopInLog(liveEdgeRef), logRef.clientHeight)
				: Math.max(0, logRef.scrollHeight - turnSpacer - logRef.clientHeight);
			scrollLogTo(target, smooth);
			rememberReaderAnchor();
		});
	}

	function keepLiveEdgeVisible(): void {
		scheduleDomTask(() => {
			if (!logRef || !liveEdgeRef) return;
			updateTurnSpacer();
			const liveEdgeTop = elementTopInLog(liveEdgeRef);
			const visibleBottom = logRef.scrollTop + logRef.clientHeight - 18;
			if (liveEdgeTop > visibleBottom) {
				scrollLogTo(liveEdgeScrollTop(liveEdgeTop, logRef.clientHeight), false);
			}
			rememberReaderAnchor();
		});
	}

	async function placeTurnAtReadingStart(
		messageId: string,
		smooth: boolean,
		resumeFollowing: boolean,
		clearUnseen = true
	): Promise<void> {
		const token = ++placementToken;
		turnPlacementInProgress = true;
		activeTurnMessageId = messageId;
		following = resumeFollowing;
		if (clearUnseen) {
			hasUnseen = false;
			firstUnseenMessageId = null;
		}

		await tick();
		if (token !== placementToken) return;
		updateTurnSpacer(messageId);
		await tick();
		if (token !== placementToken || !logRef) return;

		const message = findMessageElement(messageId);
		if (message) {
			scrollLogTo(turnStartScrollTop(elementTopInLog(message), logRef.clientHeight), smooth);
			rememberReaderAnchor();
		}

		turnPlacementInProgress = false;
	}

	async function restoreInitialReaderPosition(): Promise<void> {
		await tick();
		observedSignature = conversationSignature();
		const linkedMessageId = messageIdFromHash();
		if (linkedMessageId && findMessageElement(linkedMessageId)) {
			await placeTurnAtReadingStart(linkedMessageId, false, false);
			activeSearchMessageId = linkedMessageId;
		} else {
			const lastUserId = latestUserMessageId();
			if (lastUserId) {
				await placeTurnAtReadingStart(lastUserId, false, false);
			} else if (logRef) {
				turnSpacer = 0;
				scrollLogTo(0, false);
			}
		}
		following = false;
		hasUnseen = false;
		firstUnseenMessageId = null;
		initialPlacementDone = true;
		observedSignature = conversationSignature();
		rememberReaderAnchor();
	}

	function rememberReaderAnchor(): void {
		if (!logRef) return;
		const messages = logRef.querySelectorAll<HTMLElement>('[data-message-id]');
		for (const message of messages) {
			const messageTop = elementTopInLog(message);
			if (messageTop + message.offsetHeight >= logRef.scrollTop + 1) {
				readerAnchor = {
					messageId: message.dataset.messageId ?? '',
					offsetFromTop: messageTop - logRef.scrollTop
				};
				return;
			}
		}
		readerAnchor = null;
	}

	function restoreReaderAnchorSoon(): void {
		const anchor = readerAnchor;
		if (!anchor) return;
		scheduleDomTask(() => {
			if (!logRef || following) return;
			const message = findMessageElement(anchor.messageId);
			if (!message) return;
			scrollLogTo(Math.max(0, elementTopInLog(message) - anchor.offsetFromTop), false);
		});
	}

	function pauseForReaderIntent(): void {
		if (!initialPlacementDone) return;
		placementToken += 1;
		turnPlacementInProgress = false;
		programmaticScroll = false;
		following = false;
		rememberReaderAnchor();
		if (scoutReplyInProgress) {
			hasUnseen = true;
			firstUnseenMessageId ??= trailAssistant.coachMessages.at(-1)?.id ?? null;
		}
	}

	function onLogScroll() {
		if (programmaticScroll) return;
		const atLiveEdge = liveEdgeIsInFollowRange() || distanceFromBottom() <= CHAT_FOLLOW_THRESHOLD;
		following = atLiveEdge;
		if (atLiveEdge) {
			hasUnseen = false;
			firstUnseenMessageId = null;
		} else {
			rememberReaderAnchor();
		}
	}

	function submit() {
		if (!draft.trim()) return;
		const message = trailAssistant.sendCoachMessage(draft);
		draft = '';
		if (message) void placeTurnAtReadingStart(message.id, false, true);
	}

	function usePrompt(prompt: string) {
		const message = trailAssistant.runQuickPrompt(prompt);
		if (message) void placeTurnAtReadingStart(message.id, false, true);
	}

	function normalizeSearch(value: string): string {
		return value.trim().toLocaleLowerCase();
	}

	function matchingMessageIds(query: string): string[] {
		const needle = normalizeSearch(query);
		if (!needle) return [];
		return trailAssistant.coachMessages
			.filter((message) => message.content.toLocaleLowerCase().includes(needle))
			.map((message) => message.id);
	}

	function updateSearch(value: string) {
		searchQuery = value;
		pauseForReaderIntent();
		const [first] = matchingMessageIds(value);
		activeSearchMessageId = first ?? null;
		if (first) void navigateToMessage(first, false, false);
	}

	function onSearchInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		updateSearch(input.value);
	}

	function moveSearchResult(delta: -1 | 1) {
		pauseForReaderIntent();
		if (!searchResultIds.length) return;
		const currentIndex = activeSearchIndex >= 0 ? activeSearchIndex : delta > 0 ? -1 : 0;
		const nextIndex = (currentIndex + delta + searchResultIds.length) % searchResultIds.length;
		const nextId = searchResultIds[nextIndex];
		activeSearchMessageId = nextId;
		void navigateToMessage(nextId, true, false);
	}

	function onSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			moveSearchResult(event.shiftKey ? -1 : 1);
		}
	}

	function messageHash(messageId: string): string {
		return `${MESSAGE_HASH_PREFIX}${encodeURIComponent(messageId)}`;
	}

	function messageIdFromHash(): string | null {
		if (typeof window === 'undefined') return null;
		const hash = window.location.hash;
		if (!hash.startsWith(MESSAGE_HASH_PREFIX)) return null;
		try {
			return decodeURIComponent(hash.slice(MESSAGE_HASH_PREFIX.length));
		} catch {
			return null;
		}
	}

	function setMessageHash(messageId: string) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		url.hash = messageHash(messageId);
		history.pushState(history.state, '', url);
	}

	function navigateToMessage(messageId: string, smooth = true, updateHash = true) {
		pauseForReaderIntent();
		activeSearchMessageId = messageId;
		if (updateHash) setMessageHash(messageId);
		void placeTurnAtReadingStart(messageId, smooth, false, false);
	}

	function openMessageLink(event: MouseEvent, messageId: string) {
		event.preventDefault();
		navigateToMessage(messageId, true, true);
	}

	function onHashChange() {
		const messageId = messageIdFromHash();
		if (messageId) navigateToMessage(messageId, true, false);
	}

	function startScoutSignIn() {
		trailAssistant.openScoutSignIn();
	}

	function onComposerKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
			return;
		}
		pauseForReaderIntent();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.target instanceof HTMLTextAreaElement) return;
		if (eventTargetInsideLog(event)) {
			pauseForReaderIntent();
			return;
		}
		const key = event.key.toLowerCase();
		if (
			key === 'tab' ||
			key.startsWith('arrow') ||
			key === 'pageup' ||
			key === 'pagedown' ||
			key === 'home' ||
			key === 'end' ||
			((event.metaKey || event.ctrlKey) && (key === 'f' || key === 'g'))
		) {
			pauseForReaderIntent();
		}
	}

	function onWindowReaderIntent(event: Event) {
		if (eventTargetInsideLog(event)) pauseForReaderIntent();
	}

	function onDocumentSelectionChange() {
		if (!logRef) return;
		const selection = document.getSelection();
		if (!selection || selection.isCollapsed) return;
		if (nodeInsideLog(selection.anchorNode) || nodeInsideLog(selection.focusNode)) {
			pauseForReaderIntent();
		}
	}

	function eventTargetInsideLog(event: Event): boolean {
		if (!logRef || !(event.target instanceof Node)) return false;
		return logRef.contains(event.target);
	}

	function nodeInsideLog(node: Node | null): boolean {
		if (!node || !logRef) return false;
		const element = node instanceof Element ? node : node.parentElement;
		return element ? logRef.contains(element) : false;
	}

	function onViewportResize() {
		if (!initialPlacementDone) return;
		updateTurnSpacer();
		if (following) {
			keepLiveEdgeVisible();
		} else {
			restoreReaderAnchorSoon();
		}
	}

	$effect(() => {
		const signature = conversationSignature();
		if (!initialPlacementDone) {
			observedSignature = signature;
			return;
		}
		if (signature === observedSignature) return;
		observedSignature = signature;
		if (turnPlacementInProgress) return;
		if (following) {
			keepLiveEdgeVisible();
		} else {
			hasUnseen = true;
			const newestMessageId = trailAssistant.coachMessages.at(-1)?.id ?? null;
			firstUnseenMessageId ??= newestMessageId;
			restoreReaderAnchorSoon();
		}
	});

	function receiptsFor(messageId: string): {
		receipts: UiSourceReceipt[];
		tools: string[];
		confidence: ScoutConfidence | null;
		confirmations: RequiredConfirmation[];
		safetyFlags: SafetyFlag[];
	} {
		const answer = trailAssistant.scoutAnswerFor?.(messageId) ?? null;
		if (answer) {
			return {
				receipts: answer.receipts.map((receipt) => toUiSourceReceipt(receipt, answer.confidence)),
				tools: answer.toolInvocations.map((invocation) => invocation.toolId),
				confidence: answer.confidence,
				confirmations: answer.requiredConfirmations,
				safetyFlags: answer.safetyFlags
			};
		}
		// Messages without a real runtime answer (the seed/welcome message) get NO
		// fabricated citations, tools, or confidence — they render as plain text, so
		// source chips never appear on anything Scout's model didn't actually produce.
		return { receipts: [], tools: [], confidence: null, confirmations: [], safetyFlags: [] };
	}
</script>

<svelte:window
	onkeydown={onWindowKeydown}
	onpointerdown={onWindowReaderIntent}
	ontouchstart={onWindowReaderIntent}
	onwheel={onWindowReaderIntent}
	onhashchange={onHashChange}
	onresize={onViewportResize}
/>
<svelte:document onselectionchange={onDocumentSelectionChange} />

<div class="coach-shell" class:empty={trailAssistant.coachMessages.length <= 1}>
	<!-- Chat stays pure: status (Day/Mile/online) lives in the app header, not
	     repeated here. Only the starter prompts sit above the conversation, and
	     only until the hiker has started talking. -->
	{#if trailAssistant.coachMessages.length <= 1}
		<section class="welcome">
			<p class="welcome-eyebrow">Ask Scout</p>
			<div class="prompt-grid">
				{#each quickPrompts as prompt (prompt)}
					<button class="prompt-chip" onclick={() => usePrompt(prompt)}>
						<span>{prompt}</span>
						<span class="chip-go" aria-hidden="true">›</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#if trailAssistant.coachMessages.length > 4 || searchQuery}
		<div class="transcript-tools" role="search">
			<label class="search-box">
				<span aria-hidden="true"><Icon name="search" size={15} stroke={2} /></span>
				<input
					type="search"
					value={searchQuery}
					placeholder="Search messages"
					aria-label="Search Scout messages"
					onfocus={pauseForReaderIntent}
					oninput={onSearchInput}
					onkeydown={onSearchKeydown}
				/>
			</label>
			<div class="search-nav" aria-live="polite">
				<span>{searchResultLabel}</span>
				<button
					type="button"
					aria-label="Previous search result"
					disabled={!searchResultIds.length}
					onclick={() => moveSearchResult(-1)}
				>↑</button>
				<button
					type="button"
					aria-label="Next search result"
					disabled={!searchResultIds.length}
					onclick={() => moveSearchResult(1)}
				>↓</button>
			</div>
		</div>
	{/if}

	<div
		class="chat-log"
		bind:this={logRef}
		role="region"
		aria-label="Scout conversation"
		onscroll={onLogScroll}
	>
			{#each trailAssistant.coachMessages as message (message.id)}
				{@const meta = message.role === 'assistant' ? receiptsFor(message.id) : null}
				{#if hasUnseen && firstUnseenMessageId === message.id}
					<div class="unread-marker" role="status">New messages</div>
				{/if}
				<div
					id={`chat-message-${message.id}`}
					class:assistant={message.role === 'assistant'}
					class:user={message.role === 'user'}
					class:search-hit={activeSearchMessageId === message.id}
					class="message"
					data-message-id={message.id}
					data-message-role={message.role}
				>
					{#if message.role === 'assistant' && meta}
						<div class="message-head">
							<span class="bot-mark" aria-hidden="true"><Icon name="scout" size={14} stroke={2} /></span>
							<strong>Scout</strong>
							{#if meta.confidence}
								<ConfidenceBadge confidence={meta.confidence} short />
							{/if}
						</div>
					{/if}

					<p>{message.content}</p>

					{#if message.role === 'assistant' && isScoutAuthResumeMessage(message.id, trailAssistant.scoutAuthPrompt)}
						<div class="auth-wall-actions" role="group" aria-label="Scout sign-in actions">
							<button class="auth-wall-button" type="button" onclick={startScoutSignIn}>
								<span aria-hidden="true"><Icon name="scout" size={15} stroke={2} /></span>
								Sign in and send
							</button>
							<span class="auth-wall-note">Scout will return here and retry your question.</span>
						</div>
					{/if}

					{#if message.role === 'assistant' && meta}
						{#if meta.receipts.length}
							<details class="message-sources">
								<summary>{meta.receipts.length} {meta.receipts.length === 1 ? 'source' : 'sources'}</summary>
								<div class="message-receipts">
									{#each meta.receipts as receipt (receipt.id)}
										<SourceChip source={receipt} />
									{/each}
								</div>
							</details>
						{/if}
						{#if meta.confirmations.length || meta.safetyFlags.length}
							<div class="message-caveats">
								{#each meta.confirmations as confirmation (confirmation.id)}
									<span class="caveat-chip" data-kind={confirmation.reason}>{confirmation.prompt}</span>
								{/each}
								{#each meta.safetyFlags as flag (flag.id)}
									<span class="caveat-chip" data-kind={flag.severity}>{flag.message}</span>
								{/each}
							</div>
						{/if}
					{/if}

					<div class="message-foot">
						<a
							href={resolve(`/${messageHash(message.id)}` as `/#${string}`)}
							class="message-link"
							aria-label={`Link to ${message.role === 'assistant' ? 'Scout' : 'your'} message at ${new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
							onclick={(event) => openMessageLink(event, message.id)}
						>#</a>
						<span class="timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
					</div>
				</div>
			{/each}

			<ScoutModelStatusBubble
				phase={modelPhase}
				onRetry={() => trailAssistant.downloadModel()}
				onAllowMetered={() => trailAssistant.downloadModel({ allowMetered: true })}
				onDismissMetered={() => trailAssistant.dismissMeteredPrompt()}
				onCancel={() => trailAssistant.cancelModelDownload()}
			/>

			{#if trailAssistant.scoutThinking}
				<div class="message assistant thinking">
					<div class="message-head">
						<span class="bot-mark" aria-hidden="true"><Icon name="scout" size={14} stroke={2} /></span>
						<strong>Scout</strong>
					</div>
					<p class="thinking-dots" role="status" aria-label="Scout is thinking">
						<span></span><span></span><span></span>
						<em>thinking{trailAssistant.scoutUsesCloud ? '' : ' on-device'}…</em>
					</p>
				</div>
			{/if}

			<div class="live-edge" bind:this={liveEdgeRef} aria-hidden="true"></div>
			<div class="turn-spacer" aria-hidden="true" style:height={`${turnSpacer}px`}></div>
		</div>

		<p class="sr-status" aria-live="polite">{outOfViewStatus}</p>

		{#if !following && (hasUnseen || scoutReplyInProgress)}
			<button
				class="jump-latest"
				aria-label={scoutReplyInProgress ? 'Jump to latest. Scout is replying below.' : 'Jump to latest messages'}
				onclick={() => scrollToLiveEdge(true)}
			>
				↓ {scoutReplyInProgress ? 'Scout is replying' : 'New messages'}
			</button>
		{/if}

		{#if trailAssistant.pendingAction}
			<div class="action-card" role="group" aria-label="Confirm Scout action">
				<div class="action-info">
					<span class="action-eyebrow">⚙︎ Scout wants to update your trail log</span>
					<strong>{trailAssistant.pendingAction.title}</strong>
					<span class="action-detail">{trailAssistant.pendingAction.detail}</span>
				</div>
				<div class="action-buttons">
					<button class="action-cancel" onclick={() => trailAssistant.cancelPendingAction()}>Cancel</button>
					<button class="action-confirm" onclick={() => trailAssistant.confirmPendingAction()}>
						{trailAssistant.pendingAction.confirmLabel}
					</button>
				</div>
			</div>
		{/if}

		<div class="composer">
			<div class="composer-bar">
				<textarea
					bind:value={draft}
					rows="1"
					placeholder="Ask about water, town, or safety…"
					onfocus={pauseForReaderIntent}
					onkeydown={onComposerKeydown}
				></textarea>
				<button class="send" onclick={submit} disabled={!draft.trim()} aria-label="Send message">
					<span aria-hidden="true">↑</span>
				</button>
			</div>
			<div class="composer-meta">
				<span class="mode-tag" data-online={trailAssistant.onlineStatus}>{trailAssistant.scoutLaneLabel}</span>
				<span class="hint">Sources cited when used</span>
			</div>
		</div>
	</div>

<style>
	.coach-shell {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* welcome / quick prompts (empty state) */
	.welcome {
		flex: 0 0 auto;
		display: grid;
		gap: var(--space-2);
		padding-top: var(--space-1);
	}
	/* Before the conversation starts, center the prompts + greeting as one calm
	   group instead of pinning them to the top above a big dead void. The auto
	   margins split the free space above the welcome and below the greeting, while
	   the composer (a later flex child) stays pinned to the bottom. */
	.coach-shell.empty .welcome {
		margin-top: auto;
	}
	.coach-shell.empty .chat-log {
		flex: 0 0 auto;
		margin-bottom: auto;
		overflow: visible;
	}
	.welcome-eyebrow {
		font-size: var(--text-sm);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--moss);
	}
	.prompt-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.prompt-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px; /* primary entry point to Scout — meet the iOS touch min */
		padding: 8px 14px;
		border-radius: var(--radius-pill);
		background: var(--forest-soft);
		color: var(--forest);
		border: 1px solid color-mix(in srgb, var(--forest) 16%, transparent);
		font-size: var(--text-sm);
		font-weight: 800;
		text-align: left;
		line-height: 1.2;
	}
	.prompt-chip .chip-go {
		opacity: 0.55;
	}

	.transcript-tools {
		flex: 0 0 auto;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-2);
		min-height: 42px;
	}
	.search-box {
		min-width: 0;
		height: 40px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 11px;
		border-radius: var(--radius-control);
		border: 1px solid var(--line);
		background: var(--surface-strong);
		color: var(--muted);
	}
	.search-box:focus-within {
		border-color: color-mix(in srgb, var(--forest) 42%, var(--line));
		box-shadow: 0 0 0 3px var(--forest-soft);
	}
	.search-box input {
		min-width: 0;
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--ink);
		font-size: var(--text-sm);
		line-height: 1.2;
	}
	.search-nav {
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 5px;
		color: var(--muted);
		font-size: var(--text-xs);
		font-weight: 800;
		white-space: nowrap;
	}
	.search-nav button {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--forest);
		font-size: var(--text-sm);
		font-weight: 900;
	}
	.search-nav button:disabled {
		opacity: 0.35;
	}

	/* conversation fills the screen; composer pins to the bottom */
	.chat-log {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		gap: var(--space-3);
		align-content: start;
		overflow: auto;
		overflow-anchor: none;
		padding: var(--space-1) 2px var(--space-2);
	}
	.live-edge {
		width: 1px;
		height: 1px;
		pointer-events: none;
	}
	.turn-spacer {
		min-height: 0;
		pointer-events: none;
	}
	.unread-marker {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--moss);
		font-size: var(--text-xs);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.unread-marker::before,
	.unread-marker::after {
		content: '';
		height: 1px;
		flex: 1 1 auto;
		background: color-mix(in srgb, var(--moss) 45%, transparent);
	}

	.message {
		max-width: 86%;
		padding: 11px 14px;
		border-radius: 18px;
		display: grid;
		gap: 6px;
		animation: msg-in var(--dur-base) var(--ease-out) both;
	}
	@keyframes msg-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.message.assistant {
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		border-bottom-left-radius: 7px;
	}
	.message.user {
		background: var(--forest-soft);
		margin-left: auto;
		max-width: 80%;
		border-bottom-right-radius: 7px;
	}
	.message.search-hit {
		outline: 2px solid color-mix(in srgb, var(--sky) 70%, transparent);
		outline-offset: 2px;
	}
	.message p {
		font-size: var(--text-base);
		line-height: 1.45;
	}

	.auth-wall-actions {
		display: grid;
		gap: 6px;
		justify-items: start;
	}
	.auth-wall-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		min-height: 44px;
		padding: 8px 12px;
		border-radius: var(--radius-control);
		background: var(--forest);
		color: #fffdf8;
		font-size: var(--text-sm);
		font-weight: 900;
		line-height: 1.1;
	}
	.auth-wall-note {
		max-width: 24ch;
		color: var(--muted);
		font-size: var(--text-xs);
		line-height: 1.25;
	}

	.message-head {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.bot-mark {
		width: 20px;
		height: 20px;
		border-radius: 999px;
		background: linear-gradient(135deg, var(--forest), var(--moss));
		color: #f7f2e8;
		display: grid;
		place-items: center;
	}
	.message-head strong {
		font-size: var(--text-sm);
		color: var(--forest);
	}

	.message-sources {
		align-self: flex-start;
		max-width: 100%;
	}
	.message-sources > summary {
		cursor: pointer;
		list-style: none;
		font-size: var(--text-2xs);
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.02em;
		padding: 1px 0;
		user-select: none;
	}
	.message-sources > summary::-webkit-details-marker {
		display: none;
	}
	.message-sources > summary::before {
		content: '▸';
		display: inline-block;
		margin-right: 5px;
		color: var(--muted);
	}
	.message-sources[open] > summary::before {
		content: '▾';
	}
	.message-receipts {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		margin-top: 6px;
	}
	.message-caveats {
		display: grid;
		gap: 5px;
	}
	.caveat-chip {
		display: block;
		padding: 7px 9px;
		border-radius: 10px;
		background: var(--warn-soft);
		color: var(--warn);
		font-size: var(--text-xs);
		font-weight: 800;
		line-height: 1.25;
	}
	.caveat-chip[data-kind='critical'],
	.caveat-chip[data-kind='safety-critical'] {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.timestamp {
		font-size: var(--text-2xs);
		color: var(--muted);
	}
	.message-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
	}
	.message-link {
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 900;
		text-decoration: none;
		opacity: 0.72;
	}
	.message-link:hover,
	.message-link:focus-visible {
		background: var(--forest-soft);
		color: var(--forest);
		opacity: 1;
	}

	/* thinking */
	.thinking-dots {
		display: flex;
		align-items: center;
		gap: 5px;
		margin: 4px 0 2px;
	}
	.thinking-dots span {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: var(--forest);
		opacity: 0.3;
		animation: scoutDot 1s infinite ease-in-out;
	}
	.thinking-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}
	.thinking-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}
	.thinking-dots em {
		margin-left: 6px;
		font-style: normal;
		font-size: var(--text-sm);
		color: var(--muted);
	}
	@keyframes scoutDot {
		0%,
		60%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	/* jump to latest */
	.jump-latest {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 104px;
		z-index: 4;
		min-height: 38px;
		padding: 8px 16px;
		border-radius: var(--radius-pill);
		font-size: var(--text-sm);
		font-weight: 800;
		color: #f7f2e8;
		background: linear-gradient(135deg, var(--forest), var(--moss));
		box-shadow: var(--shadow);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.sr-status {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* pending action */
	.action-card {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px 14px;
		border-radius: var(--radius-control);
		border: 1px solid var(--forest);
		background: color-mix(in srgb, var(--forest) 8%, var(--surface));
	}
	.action-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.action-eyebrow {
		font-size: var(--text-xs);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--forest);
	}
	.action-info strong {
		font-size: var(--text-base);
	}
	.action-detail {
		font-size: var(--text-sm);
		color: var(--muted);
	}
	.action-buttons {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 8px;
	}
	.action-cancel,
	.action-confirm {
		min-height: 40px;
		border-radius: 11px;
		font-weight: 800;
		font-size: var(--text-sm);
	}
	.action-cancel {
		background: transparent;
		border: 1px solid var(--line);
		color: var(--ink);
	}
	.action-confirm {
		background: linear-gradient(135deg, var(--forest), var(--moss));
		color: #f7f2e8;
		border: none;
	}

	/* composer */
	.composer {
		flex: 0 0 auto;
		display: grid;
		gap: var(--space-2);
	}
	.composer-bar {
		display: flex;
		align-items: flex-end;
		gap: var(--space-2);
		padding: 7px 7px 7px 15px;
		border-radius: 24px;
		background: var(--surface-strong);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		transition:
			border-color var(--dur-base) ease,
			box-shadow var(--dur-base) ease;
	}
	.composer-bar:focus-within {
		border-color: color-mix(in srgb, var(--forest) 42%, var(--line));
		box-shadow: 0 0 0 3px var(--forest-soft);
	}
	.composer textarea {
		flex: 1 1 auto;
		min-width: 0;
		border: 0;
		background: transparent;
		resize: none;
		min-height: 26px;
		max-height: 124px;
		padding: 9px 0;
		color: var(--ink);
		font-size: var(--text-base);
		line-height: 1.4;
	}
	.composer textarea:focus {
		outline: none;
	}
	.send {
		flex: 0 0 auto;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--forest), var(--moss));
		color: #f7f2e8;
		font-size: 1.2rem;
		line-height: 1;
		font-weight: 800;
		box-shadow: var(--shadow-soft);
	}
	.send:disabled {
		opacity: 0.4;
	}
	.composer-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 4px;
	}
	.mode-tag {
		font-size: var(--text-2xs);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--forest);
		padding: 3px 8px;
		border-radius: var(--radius-pill);
		background: var(--forest-soft);
	}
	.mode-tag[data-online='false'] {
		color: var(--warn);
		background: var(--warn-soft);
	}
	.hint {
		font-size: var(--text-xs);
		color: var(--muted);
	}

	@media (prefers-color-scheme: dark) {
		/* filled-accent elements need a dark glyph on the light-green accent */
		.bot-mark,
		.send,
		.action-confirm,
		.jump-latest {
			color: #10160f;
		}
	}

	@media (max-width: 380px) {
		.transcript-tools {
			grid-template-columns: 1fr;
		}
		.search-nav {
			justify-content: space-between;
		}
	}
</style>
