<script lang="ts">
	import { parseScoutMarkdown } from '$lib/scout/scout-markdown';

	let { content } = $props<{ content: string }>();
	const blocks = $derived(parseScoutMarkdown(content));
</script>

<div class="message-body">
	{#each blocks as block, blockIndex (blockIndex)}
		{#if block.kind === 'heading'}
			<svelte:element this={block.level <= 2 ? 'h3' : 'h4'} class="md-heading">
				{#each block.segments as segment, segmentIndex (segmentIndex)}
					{#if segment.kind === 'strong'}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
				{/each}
			</svelte:element>
		{:else if block.kind === 'paragraph'}
			<p>
				{#each block.segments as segment, segmentIndex (segmentIndex)}
					{#if segment.kind === 'strong'}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
				{/each}
			</p>
		{:else if block.kind === 'quote'}
			<blockquote>
				{#each block.segments as segment, segmentIndex (segmentIndex)}
					{#if segment.kind === 'strong'}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
				{/each}
			</blockquote>
		{:else if block.kind === 'ordered-list'}
			<ol>
				{#each block.items as item, itemIndex (itemIndex)}
					<li>
						{#each item.segments as segment, segmentIndex (segmentIndex)}
							{#if segment.kind === 'strong'}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
						{/each}
					</li>
				{/each}
			</ol>
		{:else if block.kind === 'unordered-list'}
			<ul>
				{#each block.items as item, itemIndex (itemIndex)}
					<li>
						{#each item.segments as segment, segmentIndex (segmentIndex)}
							{#if segment.kind === 'strong'}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
						{/each}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</div>

<style>
	.message-body {
		display: grid;
		gap: 7px;
		min-width: 0;
	}

	.message-body :where(p, li, blockquote) {
		font-size: var(--text-base);
		line-height: 1.45;
	}

	.message-body p,
	.message-body blockquote,
	.message-body ol,
	.message-body ul,
	.message-body .md-heading {
		margin: 0;
	}

	.message-body .md-heading {
		font-size: var(--text-sm);
		font-weight: 900;
		line-height: 1.25;
		color: var(--forest);
	}

	.message-body h4.md-heading {
		font-size: var(--text-base);
	}

	.message-body ol,
	.message-body ul {
		display: grid;
		gap: 5px;
		padding-left: 1.25rem;
	}

	.message-body blockquote {
		padding-left: 10px;
		border-left: 3px solid color-mix(in srgb, var(--moss) 42%, transparent);
		color: color-mix(in srgb, var(--ink) 86%, var(--moss));
	}

	.message-body strong {
		font-weight: 900;
	}
</style>
