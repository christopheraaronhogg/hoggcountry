<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { onMount } from 'svelte';

	let inputMessage = $state('');
	let chatContainer = $state<HTMLElement | null>(null);

	function sendMessage() {
		if (!inputMessage.trim()) return;
		trailAssistant.addMessage('user', inputMessage);
		inputMessage = '';
	}

	$effect(() => {
		if (trailAssistant.messages && chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});
</script>

<div class="chat-wrapper">
	<div class="chat-container" bind:this={chatContainer}>
		{#each trailAssistant.messages as message}
			<div class="message-row {message.role}">
				<div class="message {message.role}">
					{message.content}
					<span class="time">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="input-area card">
		<input 
			type="text" 
			placeholder="Ask about water, miles, or town..." 
			bind:value={inputMessage}
			onkeydown={(e) => e.key === 'Enter' && sendMessage()}
		/>
		<button class="send-btn" onclick={sendMessage}>
			<span>↑</span>
		</button>
	</div>
</div>

<style>
	.chat-wrapper {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 120px);
		padding: 20px;
		gap: 12px;
	}

	.chat-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-bottom: 20px;
	}

	.message-row {
		display: flex;
		width: 100%;
	}

	.message-row.user { justify-content: flex-end; }

	.message {
		max-width: 80%;
		padding: 12px 16px;
		border-radius: 18px;
		font-size: 14px;
		line-height: 1.4;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.message.coach {
		background: var(--color-card);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		border-bottom-left-radius: 4px;
	}

	.message.user {
		background: var(--color-primary);
		color: white;
		border-bottom-right-radius: 4px;
	}

	.time {
		font-size: 9px;
		opacity: 0.7;
		align-self: flex-end;
	}

	.input-area {
		display: flex;
		gap: 10px;
		padding: 8px 12px;
		align-items: center;
		margin-bottom: 80px;
	}

	input {
		flex: 1;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 14px;
		background: transparent;
	}

	.send-btn {
		width: 32px;
		height: 32px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 900;
	}
</style>
