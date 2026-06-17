<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		async function configureNativeChrome() {
			const [{ Capacitor }, { StatusBar }] = await Promise.all([import('@capacitor/core'), import('@capacitor/status-bar')]);

			if (Capacitor.isNativePlatform()) {
				await StatusBar.setOverlaysWebView({ overlay: false });
			}
		}

		configureNativeChrome().catch(() => {
			// The web shell should still run if a native chrome plugin is unavailable.
		});
	});
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
