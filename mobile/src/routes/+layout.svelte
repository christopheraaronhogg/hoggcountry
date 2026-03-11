<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trail Assistant | Hogg Country</title>
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	main {
		max-width: 500px;
		margin: 0 auto;
		min-height: 100vh;
		position: relative;
	}
</style>
