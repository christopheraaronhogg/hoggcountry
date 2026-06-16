<script lang="ts">
	import { quickPrompts } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { ScoutConfidence, SourceReceipt as RuntimeSourceReceipt } from '$lib/scout';
	import { offlineModel, sourceReceipts } from './cockpitData';
	import type { SourceReceipt as UiSourceReceipt } from './cockpitData';
	import SourceChip from './SourceChip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';

	let draft = $state('');
	let logRef = $state<HTMLDivElement | null>(null);

	function scrollToBottom() {
		queueMicrotask(() => {
			logRef?.scrollTo({ top: logRef.scrollHeight, behavior: 'smooth' });
		});
	}

	function submit() {
		if (!draft.trim()) return;
		trailAssistant.sendCoachMessage(draft);
		draft = '';
		scrollToBottom();
	}

	function usePrompt(prompt: string) {
		trailAssistant.runQuickPrompt(prompt);
		scrollToBottom();
	}

	$effect(() => {
		trailAssistant.coachMessages.length;
		scrollToBottom();
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

	function receiptsFor(messageId: string, content: string): { receipts: UiSourceReceipt[]; tools: string[]; confidence: ScoutConfidence } {
		const answer = trailAssistant.scoutAnswerFor?.(messageId) ?? null;
		if (answer) {
			return {
				receipts: answer.receipts.map((receipt) => toUiReceipt(receipt, answer.confidence)),
				tools: answer.toolInvocations.map((invocation) => invocation.toolId),
				confidence: answer.confidence
			};
		}
		return {
			receipts: fallbackReceipts(content),
			tools: fallbackTools(content),
			confidence: trailAssistant.onlineStatus ? 'high' : 'medium'
		};
	}
</script>

<div class="section-stack coach-shell">
	<section class="coach-hero card">
		<div class="hero-head">
			<div>
				<p class="eyebrow">Scout</p>
				<h2>Field assistant</h2>
				<p class="hero-detail">
					Mile {trailAssistant.currentMile.toFixed(1)} · Day {trailAssistant.dayNumber} · {trailAssistant.onlineStatus
						? 'Cloud + local'
						: 'Local only'}
				</p>
			</div>
			<div class="mode-pill" data-online={trailAssistant.onlineStatus}>
				<span class="status-dot" class:status-online={trailAssistant.onlineStatus} class:status-offline={!trailAssistant.onlineStatus}></span>
				{trailAssistant.onlineStatus ? 'Online · cloud Scout' : `Offline · ${offlineModel.tier}`}
			</div>
		</div>

		<div class="hero-quick">
			<p class="quick-label">Quick prompts</p>
			<div class="prompt-row">
				{#each quickPrompts as prompt (prompt)}
					<button class="prompt-pill" onclick={() => usePrompt(prompt)}>{prompt}</button>
				{/each}
			</div>
		</div>
	</section>

	<section class="chat-card card">
		<div class="chat-log" bind:this={logRef}>
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
					{/if}

					<span class="timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
				</div>
			{/each}
		</div>

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
						{trailAssistant.onlineStatus ? 'Cloud Scout' : 'Local Scout'}
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

	.coach-hero {
		padding: 14px;
		display: grid;
		gap: 12px;
		background:
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.16), transparent 38%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(244, 238, 224, 0.96));
	}

	.hero-head {
		display: flex;
		gap: 12px;
		justify-content: space-between;
		align-items: flex-start;
	}

	.hero-head h2 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		margin: 2px 0;
	}

	.hero-detail {
		font-size: 0.8rem;
		color: var(--muted);
	}

	.mode-pill {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 800;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.mode-pill[data-online='false'] {
		background: rgba(200, 167, 122, 0.22);
		color: #8c5d1f;
	}

	.hero-quick {
		display: grid;
		gap: 6px;
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
	}

	.chat-log {
		display: grid;
		gap: 12px;
		max-height: 50vh;
		overflow: auto;
		padding-right: 4px;
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
