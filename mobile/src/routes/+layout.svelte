<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { trailAssistant } from '$lib/trailState.svelte';

	let { children } = $props();

	onMount(() => {
		let removeResume: (() => void) | undefined;

		async function configureNativeChrome() {
			const [{ Capacitor }, { StatusBar }, { App }] = await Promise.all([
				import('@capacitor/core'),
				import('@capacitor/status-bar'),
				import('@capacitor/app')
			]);

			if (Capacitor.isNativePlatform()) {
				await StatusBar.setOverlaysWebView({ overlay: false });
				// When the app returns to the foreground, re-observe any model
				// download that kept running in the background service so the
				// progress UI catches up (or shows the now-ready model).
				const handle = await App.addListener('appStateChange', ({ isActive }) => {
					if (isActive) void trailAssistant.reconcileDownload();
				});
				removeResume = () => void handle.remove();
			}
		}

		configureNativeChrome().catch(() => {
			// The web shell should still run if a native chrome plugin is unavailable.
		});

		return () => removeResume?.();
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
