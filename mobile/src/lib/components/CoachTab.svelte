<script lang="ts">
	import { quickPrompts } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';

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
</script>

<div class="section-stack coach-shell">
	<section class="card coach-intro">
		<div class="section-heading">
			<p class="eyebrow">Coach</p>
			<h2>Context-aware trail ops</h2>
			<p>
				{trailAssistant.onlineStatus
					? 'You are online, so this prototype behaves like live trail coaching.'
					: 'You are offline, so replies are coming from on-device trail logic.'}
			</p>
		</div>

		<div class="prompt-row">
			{#each quickPrompts as prompt}
				<button class="prompt-pill" onclick={() => usePrompt(prompt)}>{prompt}</button>
			{/each}
		</div>
	</section>

	<section class="card chat-card">
		<div class="chat-log" bind:this={logRef}>
			{#each trailAssistant.coachMessages as message}
				<div class:assistant={message.role === 'assistant'} class:user={message.role === 'user'} class="message">
					<p>{message.content}</p>
					<span>{new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
				</div>
			{/each}
		</div>

		<div class="composer">
			<textarea
				bind:value={draft}
				rows="2"
				placeholder="Ask about mileage, water, town timing, safety, or recovery..."
				onkeydown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						event.preventDefault();
						submit();
					}
				}}
			></textarea>

			<div class="composer-actions">
				<span>{trailAssistant.onlineStatus ? 'Live mode' : 'Offline mode'}</span>
				<button class="cta-button send" onclick={submit}>Send</button>
			</div>
		</div>
	</section>
</div>

<style>
	.coach-shell {
		min-height: calc(100vh - 210px);
	}

	.coach-intro,
	.chat-card {
		padding: 18px;
	}

	.prompt-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	.prompt-pill {
		padding: 10px 12px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.chat-card {
		display: grid;
		gap: 14px;
	}

	.chat-log {
		display: grid;
		gap: 10px;
		max-height: 50vh;
		overflow: auto;
		padding-right: 4px;
	}

	.message {
		max-width: 86%;
		padding: 12px 14px;
		border-radius: 18px;
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
	}

	.message p {
		font-size: 0.92rem;
	}

	.message span {
		font-size: 0.72rem;
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
		border-radius: 16px;
		border: 1px solid var(--line);
		padding: 14px;
		min-height: 92px;
		background: #fffdf8;
		color: var(--ink);
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.78rem;
		color: var(--muted);
	}

	.send {
		width: auto;
		min-width: 92px;
	}
</style>
