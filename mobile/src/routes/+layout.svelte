<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trail Assistant</title>
	<meta
		name="description"
		content="Phone-first prototype for the Hogg Country Trail Assistant."
	/>
</svelte:head>

{@render children()}
