<script lang="ts">
	import { quickPrompts } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type {
		RequiredConfirmation,
		SafetyFlag,
		ScoutConfidence,
		SourceReceipt as RuntimeSourceReceipt
	} from '$lib/scout';
	import { sourceReceipts } from './fieldData';
	import type { SourceReceipt as UiSourceReceipt } from './fieldData';
	import SourceChip from './SourceChip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';

	let draft = $state('');
	let logRef = $state<HTMLDivElement | null>(null);

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

	// Re-runs on every message/token/state change. Only auto-sticks when pinned;
	// otherwise just flags that there's new content below the fold (for the pill).
	// Instant ('auto') while streaming so the view tracks growing text without a
	// perpetual smooth-scroll animation.
	$effect(() => {
		trailAssistant.coachMessages.length;
		trailAssistant.scoutThinking;
		trailAssistant.pendingAction;
		if (pinned) {
			scrollToBottom(false);
		} else {
			hasUnseen = true;
		}
	});

	// Convert a runtime SourceReceipt → the UI SourceChip shape. The runtime
	// owns citations and provenance; the UI just renders them faithfully.
	function toUiReceipt(receipt: RuntimeSourceReceipt, confidence: ScoutConfidence): UiSourceReceipt {
		const provider =
			receipt.kind === 'official'
				? 'Official source'
				: receipt.kind === 'field-guide'
					? 'Field guide'
					: receipt.kind === 'cached-weather'
						? 'Cached weather'
						: receipt.kind === 'hiker-input'
							? 'Your log'
							: receipt.kind === 'trail-pack'
								? 'On-device trail pack'
								: 'Derived';
		return {
			id: receipt.id,
			label: receipt.title,
			provider: receipt.citation ?? provider,
			confidence,
			freshness: receipt.generatedAt
				? `Generated ${new Date(receipt.generatedAt).toLocaleDateString()}`
				: receipt.miles
					? `Mile ${receipt.miles.from.toFixed(1)}${receipt.miles.to ? `–${receipt.miles.to.toFixed(1)}` : ''}`
					: 'Local context',
			verify: receipt.url
		};
	}

	// Fallback heuristics for messages that pre-date the runtime (e.g. the
	// hydrated seed message). Real runtime answers always override these.
	function fallbackReceipts(text: string): UiSourceReceipt[] {
		const lower = text.toLowerCase();
		const keys: Array<keyof typeof sourceReceipts> = [];
		if (lower.includes('water') || lower.includes('shelter') || lower.includes('town') || lower.includes('mile')) keys.push('awol2026');
		if (lower.includes('weather') || lower.includes('wind') || lower.includes('rain') || lower.includes('cold')) keys.push('nws');
		if (lower.includes('reports') || lower.includes('recent')) keys.push('farout');
		if (!keys.length) keys.push('scoutLocal');
		return keys.map((key) => sourceReceipts[key]);
	}

	function fallbackTools(text: string): string[] {
		const tools: string[] = [];
		const lower = text.toLowerCase();
		if (lower.includes('water') || lower.includes('spring') || lower.includes('creek')) tools.push('water-lookup');
		if (lower.includes('weather') || lower.includes('wind') || lower.includes('rain')) tools.push('weather-cache');
		if (lower.includes('shelter') || lower.includes('camp')) tools.push('next-shelter');
		if (lower.includes('town') || lower.includes('resupply') || lower.includes('motel')) tools.push('town-snapshot');
		if (lower.includes('mile') || lower.includes('push') || lower.includes('pace')) tools.push('pace-model');
		if (lower.includes('safe') || lower.includes('risk') || lower.includes('check-in')) tools.push('safety-window');
		if (!tools.length) tools.push('field-pack');
		return tools;
	}

	function receiptsFor(messageId: string, content: string): {
		receipts: UiSourceReceipt[];
		tools: string[];
		confidence: ScoutConfidence;
		confirmations: RequiredConfirmation[];
		safetyFlags: SafetyFlag[];
	} {
		const answer = trailAssistant.scoutAnswerFor?.(messageId) ?? null;
		if (answer) {
			return {
				receipts: answer.receipts.map((receipt) => toUiReceipt(receipt, answer.confidence)),
				tools: answer.toolInvocations.map((invocation) => invocation.toolId),
				confidence: answer.confidence,
				confirmations: answer.requiredConfirmations,
				safetyFlags: answer.safetyFlags
			};
		}
		return {
			receipts: fallbackReceipts(content),
			tools: fallbackTools(content),
			confidence: trailAssistant.onlineStatus ? 'high' : 'medium',
			confirmations: [],
			safetyFlags: []
		};
	}
</script>

<div class="section-stack coach-shell">
	<!-- Chat stays pure: status (Day/Mile/online) lives in the app header, not
	     repeated here. Only the starter prompts sit above the conversation, and
	     only until the hiker has started talking. -->
	{#if trailAssistant.coachMessages.length <= 1}
		<section class="hero-quick">
			<p class="quick-label">Quick prompts</p>
			<div class="prompt-row">
				{#each quickPrompts as prompt (prompt)}
					<button class="prompt-pill" onclick={() => usePrompt(prompt)}>{prompt}</button>
				{/each}
			</div>
		</section>
	{/if}

	<section class="chat-card card">
		<div class="chat-log" bind:this={logRef} onscroll={onLogScroll}>
			{#each trailAssistant.coachMessages as message (message.id)}
				{@const meta = message.role === 'assistant' ? receiptsFor(message.id, message.content) : null}
				<div class:assistant={message.role === 'assistant'} class:user={message.role === 'user'} class="message">
					{#if message.role === 'assistant' && meta}
						<div class="message-head">
							<span class="bot-mark" aria-hidden="true">S</span>
							<strong>Scout</strong>
							<ConfidenceBadge confidence={meta.confidence} short />
						</div>
					{/if}

					<p>{message.content}</p>

					{#if message.role === 'assistant' && meta}
						{#if meta.tools.length}
							<div class="message-tools">
								{#each meta.tools as tool (tool)}
									<span class="tool-tag">⌬ {tool}</span>
								{/each}
							</div>
						{/if}
						{#if meta.receipts.length}
							<div class="message-receipts">
								{#each meta.receipts as receipt (receipt.id)}
									<SourceChip source={receipt} />
								{/each}
							</div>
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

			{#if trailAssistant.scoutThinking}
				<div class="message assistant thinking">
					<div class="message-head">
						<span class="bot-mark" aria-hidden="true">S</span>
						<strong>Scout</strong>
					</div>
					<p class="thinking-dots" role="status" aria-label="Scout is thinking">
						<span></span><span></span><span></span>
						<em>thinking on-device…</em>
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
			<textarea
				bind:value={draft}
				rows="2"
				placeholder="Ask about mileage, water, town, safety, or recovery..."
				onkeydown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						event.preventDefault();
						submit();
					}
				}}
			></textarea>

			<div class="composer-actions">
				<div class="composer-meta">
					<span class="mode-tag" data-online={trailAssistant.onlineStatus}>
						{trailAssistant.onlineStatus ? 'Gemma-only Scout' : 'Local Scout'}
					</span>
					<span class="hint">Sources cited per answer</span>
				</div>
				<button class="cta-button send" onclick={submit} disabled={!draft.trim()}>Send</button>
			</div>
		</div>
	</section>
</div>

<style>
	.coach-shell {
		min-height: calc(100vh - 220px);
	}

	.hero-quick {
		display: grid;
		gap: 6px;
		padding-top: 4px;
	}

	.quick-label {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.prompt-row {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		margin: 0 -14px;
		padding: 0 14px;
	}

	.prompt-row::-webkit-scrollbar {
		display: none;
	}

	.prompt-pill {
		flex: 0 0 auto;
		padding: 8px 12px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
		font-size: 0.78rem;
		font-weight: 800;
		white-space: nowrap;
		border: 1px solid rgba(47, 75, 53, 0.1);
	}

	.chat-card {
		display: grid;
		gap: 12px;
		padding: 14px;
		position: relative; /* anchor for the floating jump-to-latest pill */
	}

	.chat-log {
		display: grid;
		gap: 12px;
		max-height: 50vh;
		overflow: auto;
		padding-right: 4px;
		overflow-anchor: none; /* we manage stickiness ourselves */
	}

	/* Floats over the bottom of the conversation only when the hiker has scrolled
	   up and there's newer content below. Tapping re-pins to the latest. */
	.jump-latest {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: calc(50vh - 28px);
		z-index: 4;
		min-height: 40px;
		padding: 8px 16px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 800;
		color: #f7f2e8;
		background: linear-gradient(135deg, var(--forest), var(--moss));
		box-shadow: var(--shadow-soft);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.message {
		max-width: 88%;
		padding: 11px 13px;
		border-radius: 16px;
		display: grid;
		gap: 6px;
		box-shadow: var(--shadow-soft);
	}

	.message.assistant {
		background: var(--surface);
		border: 1px solid var(--line);
	}

	.message.user {
		background: rgba(47, 75, 53, 0.12);
		margin-left: auto;
		max-width: 80%;
	}

	.message p {
		font-size: 0.92rem;
		line-height: 1.4;
	}

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
		font-size: 0.8rem;
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

	.action-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 8px 0;
		padding: 12px 14px;
		border-radius: 13px;
		border: 1px solid var(--forest);
		background: color-mix(in srgb, var(--forest) 8%, var(--surface));
	}
	.action-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.action-eyebrow {
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--forest);
	}
	.action-info strong {
		font-size: 0.95rem;
	}
	.action-detail {
		font-size: 0.82rem;
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
		font-size: 0.88rem;
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
		font-family: var(--font-display);
		font-size: 0.74rem;
		font-weight: 800;
	}

	.message-head strong {
		font-size: 0.82rem;
		color: var(--forest);
	}

	.message-tools {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tool-tag {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		font-weight: 700;
		color: var(--sky);
		padding: 3px 6px;
		border-radius: 6px;
		background: rgba(95, 128, 144, 0.1);
		letter-spacing: 0.02em;
	}

	.message-receipts {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.message-caveats {
		display: grid;
		gap: 5px;
	}

	.caveat-chip {
		display: block;
		padding: 7px 9px;
		border-radius: 10px;
		background: rgba(200, 167, 122, 0.18);
		color: #8c5d1f;
		font-size: 0.72rem;
		font-weight: 800;
		line-height: 1.25;
	}

	.caveat-chip[data-kind='critical'],
	.caveat-chip[data-kind='safety-critical'] {
		background: rgba(154, 59, 47, 0.12);
		color: var(--danger);
	}

	.timestamp {
		font-size: 0.66rem;
		color: var(--muted);
		justify-self: end;
	}

	.composer {
		display: grid;
		gap: 10px;
	}

	textarea {
		width: 100%;
		resize: none;
		border-radius: 14px;
		border: 1px solid var(--line);
		padding: 12px;
		min-height: 80px;
		background: #fffdf8;
		color: var(--ink);
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.composer-meta {
		display: grid;
		gap: 2px;
		font-size: 0.74rem;
		color: var(--muted);
		min-width: 0;
	}

	.mode-tag {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--forest);
		padding: 3px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		justify-self: start;
		width: max-content;
	}

	.mode-tag[data-online='false'] {
		color: #8c5d1f;
		background: rgba(200, 167, 122, 0.22);
	}

	.hint {
		font-size: 0.7rem;
		color: var(--muted);
	}

	.send {
		width: auto;
		min-width: 92px;
	}

	.send:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
