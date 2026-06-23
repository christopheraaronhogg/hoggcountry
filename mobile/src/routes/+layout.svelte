<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { trailAssistant } from '$lib/trailState.svelte';
	import { cloudAuth } from '$lib/cloud/auth.svelte';
	import { syncEngine } from '$lib/cloud/syncEngine.svelte';
	import { registerCloudRestore } from '$lib/cloud/restore';

	let { children } = $props();

	onMount(() => {
		let removeResume: (() => void) | undefined;

		// Opt-in cloud backup: register the restore applier, then restore any saved
		// session and start the outbox engine app-wide, so a signed-in hike keeps
		// backing up (and a fresh install restores) whether or not the Account tab is
		// ever opened. Registering the applier FIRST means a sign-in during boot has
		// somewhere to apply the pulled documents. All no-ops when signed out.
		registerCloudRestore();
		void cloudAuth.init();
		syncEngine.start();

		async function configureNativeChrome() {
			const [{ Capacitor }, { StatusBar }, { App }] = await Promise.all([
				import('@capacitor/core'),
				import('@capacitor/status-bar'),
				import('@capacitor/app')
			]);

			if (Capacitor.isNativePlatform()) {
				await StatusBar.setOverlaysWebView({ overlay: false });
				void trailAssistant.reconcileDownload();
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
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<title>Hoggcountry</title>
	<meta
		name="description"
		content="On-device Appalachian Trail companion — offline field guide, elevation profile, gear, scripture, and Scout, a private AI assistant that cites its sources."
	/>
</svelte:head>

{@render children()}
