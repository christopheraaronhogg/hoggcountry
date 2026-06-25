<script lang="ts">
	import { quickPrompts } from '$lib/scout/quick-prompts';
	import { trailAssistant } from '$lib/trailState.svelte';
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
	let modelPhase = $derived(trailAssistant.modelPhase);

	// Auto-scroll only when the hiker is following the bottom. If they've scrolled
	// up to read, we must NOT yank them back down on every streamed token (the
	// "it fights me" complaint). Intent is inferred purely from scroll geometry:
	// near the bottom = pinned (auto-stick); scrolled up = unpinned (leave them be).
	let pinned = $state(true);
	let hasUnseen = $state(false); // new content arrived while unpinned
	const STICK_THRESHOLD = 56; // px of slack that still counts as "at bottom"

	const prefersReduced =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	function distanceFromBottom(): number {
		if (!logRef) return 0;
		return logRef.scrollHeight - logRef.scrollTop - logRef.clientHeight;
	}

	function scrollToBottom(smooth = false) {
		queueMicrotask(() => {
			if (!logRef) return;
			logRef.scrollTo({
				top: logRef.scrollHeight,
				behavior: smooth && !prefersReduced ? 'smooth' : 'auto'
			});
			pinned = true;
			hasUnseen = false;
		});
	}

	// Geometry-only intent detection. A programmatic scroll-to-bottom lands within
	// the threshold (stays pinned); a user dragging up measures far-from-bottom and
	// unpins — no programmatic-scroll flag needed.
	function onLogScroll() {
		const atBottom = distanceFromBottom() <= STICK_THRESHOLD;
		pinned = atBottom;
		if (atBottom) hasUnseen = false;
	}

	function submit() {
		if (!draft.trim()) return;
		trailAssistant.sendCoachMessage(draft);
		draft = '';
		scrollToBottom(true); // deliberate send → follow, smoothly
	}

	function usePrompt(prompt: string) {
		trailAssistant.runQuickPrompt(prompt);
		scrollToBottom(true);
	}

	function startScoutSignIn() {
		trailAssistant.openScoutSignIn();
	}

	// Re-runs on every message/token/state change. Only auto-sticks when pinned;
	// otherwise just flags that there's new content below the fold (for the pill).
	// Instant ('auto') while streaming so the view tracks growing text without a
	// perpetual smooth-scroll animation.
	$effect(() => {
		trailAssistant.coachMessages.length;
		trailAssistant.scoutThinking;
		trailAssistant.pendingAction;
		modelPhase.kind;
		if (modelPhase.kind === 'downloading') {
			modelPhase.percent;
			modelPhase.bytesLabel;
		}
		if (pinned) {
			scrollToBottom(false);
		} else {
			hasUnseen = true;
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

	<div class="chat-log" bind:this={logRef} onscroll={onLogScroll}>
			{#each trailAssistant.coachMessages as message (message.id)}
				{@const meta = message.role === 'assistant' ? receiptsFor(message.id) : null}
				<div class:assistant={message.role === 'assistant'} class:user={message.role === 'user'} class="message">
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

					<span class="timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
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
		</div>

		{#if !pinned && (hasUnseen || trailAssistant.scoutThinking)}
			<button
				class="jump-latest"
				aria-label="Jump to latest messages"
				onclick={() => scrollToBottom(true)}
			>
				↓ {trailAssistant.scoutThinking ? 'Scout is replying' : 'New messages'}
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
					onkeydown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							submit();
						}
					}}
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
		justify-self: end;
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
</style>
