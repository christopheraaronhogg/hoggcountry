<script lang="ts">
	// One cohesive line-icon family for Hogg Country: a 24×24 grid, currentColor
	// stroke, consistent ~1.8 weight, round caps/joins. Icons inherit color + size
	// from context, so the nav, day-spine, map pins, and Bible all read as one set
	// — replacing the mixed emoji/unicode glyphs that rendered inconsistently.
	export type IconName =
		| 'today'
		| 'scout'
		| 'map'
		| 'trail'
		| 'settings'
		| 'check'
		| 'now'
		| 'water'
		| 'shelter'
		| 'town'
		| 'moon'
		| 'campfire'
		| 'arrowUp'
		| 'search'
		| 'book'
		| 'phone'
		| 'message'
		| 'speaker';

	let {
		name,
		size = 22,
		stroke = 1.8
	}: { name: IconName; size?: number | string; stroke?: number } = $props();
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{#if name === 'today'}
		<!-- sunrise over the horizon: the day ahead -->
		<path d="M12 4V2.4" />
		<path d="M5.4 6.6 4.3 5.5" />
		<path d="M18.6 6.6 19.7 5.5" />
		<path d="M7.5 15a4.5 4.5 0 0 1 9 0" />
		<path d="M3 15h18" />
		<path d="M6 18.5h12" />
	{:else if name === 'scout'}
		<!-- compass needle: Scout as guide, not generic AI sparkle -->
		<circle cx="12" cy="12" r="8.2" />
		<path d="M15.9 6.8 13.4 13.4 6.8 15.9 10.6 10.6Z" />
		<circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
	{:else if name === 'map'}
		<!-- folded map -->
		<path d="M3 6 9 4 15 6 21 4V18l-6 2-6-2-6 2Z" />
		<path d="M9 4v14" />
		<path d="M15 6v14" />
	{:else if name === 'trail'}
		<!-- open book: the offline library (guide · bible · journal) -->
		<path d="M12 7C9.5 5.3 6 5.3 3 6v12c3-.7 6.5-.7 9 1 2.5-1.7 6-1.7 9-1V6c-3-.7-6.5-.7-9 1Z" />
		<path d="M12 7v12" />
	{:else if name === 'settings'}
		<!-- cog: settings -->
		<path
			d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.2a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.2a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.2a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.2a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"
		/>
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'check'}
		<path d="M5 12.5 9.5 17 19 6.5" />
	{:else if name === 'now'}
		<!-- current position: target dot -->
		<circle cx="12" cy="12" r="7" />
		<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
	{:else if name === 'water'}
		<!-- droplet -->
		<path d="M12 3.5C12 3.5 5.5 11 5.5 15.5a6.5 6.5 0 0 0 13 0C18.5 11 12 3.5 12 3.5Z" />
	{:else if name === 'shelter'}
		<!-- tent -->
		<path d="M2.5 20 12 4.5 21.5 20" />
		<path d="M2.5 20H21.5" />
		<path d="M9 20 12 13.5 15 20" />
	{:else if name === 'town'}
		<!-- house -->
		<path d="M4 11 12 4.5 20 11V20H4Z" />
		<path d="M10 20v-5h4v5" />
	{:else if name === 'moon'}
		<!-- crescent: evening -->
		<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" />
	{:else if name === 'campfire'}
		<!-- flame over crossed trailwood -->
		<path d="M12 3.5c1.2 2.3.2 3.6 1.8 5.1 1.2 1.1 2.2 2.2 2.2 4.2a4 4 0 0 1-8 0c0-2.2 1.4-3.7 3.1-5.4.2 1.4.9 2.1 1.7 2.7.4-2.3-.6-4.3-.8-6.6Z" />
		<path d="m5.5 20 13-4" />
		<path d="m5.5 16 13 4" />
	{:else if name === 'arrowUp'}
		<path d="M12 19V6" />
		<path d="M6.5 11.5 12 6 17.5 11.5" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="6.5" />
		<path d="M16 16 20.5 20.5" />
	{:else if name === 'book'}
		<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z" />
		<path d="M18 16H7a2 2 0 0 0-2 2" />
	{:else if name === 'phone'}
		<!-- handset -->
		<path
			d="M6.5 3.5h3l1.3 3.3-1.7 1.3a11 11 0 0 0 5.3 5.3l1.3-1.7 3.3 1.3v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
		/>
	{:else if name === 'message'}
		<!-- speech bubble -->
		<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16H9l-4 3.5V16a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z" />
	{:else if name === 'speaker'}
		<!-- speaker with sound waves -->
		<path d="M4 9.5h3.4L12 5.8v12.4L7.4 14.5H4Z" />
		<path d="M15.4 9.2a4 4 0 0 1 0 5.6" />
		<path d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" />
	{/if}
</svg>

<style>
	.icon {
		display: inline-block;
		vertical-align: middle;
		flex: none;
	}
</style>
