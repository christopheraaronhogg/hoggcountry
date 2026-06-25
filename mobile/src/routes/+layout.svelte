<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { trailAssistant } from '$lib/trailState.svelte';
	import { cloudAuth } from '$lib/cloud/auth.svelte';
	import { syncEngine } from '$lib/cloud/syncEngine.svelte';
	import { registerCloudRestore } from '$lib/cloud/restore';
	import { people, stripPeopleInviteUrl } from '$lib/people/people.svelte';

	let { children } = $props();

	onMount(() => {
		let removeResume: (() => void) | undefined;

		if (people.acceptInviteLink(window.location.href)) {
			trailAssistant.activeTab = 'Map';
			people.openSheet();
			history.replaceState(history.state, '', stripPeopleInviteUrl(window.location.href));
		}

		// Opt-in cloud backup: register the restore applier, then restore any saved
		// session and start the outbox engine app-wide, so a signed-in hike keeps
		// backing up (and a fresh install restores) whether or not the Account tab is
		// ever opened. Registering the applier FIRST means a sign-in during boot has
		// somewhere to apply the pulled documents. All no-ops when signed out.
		registerCloudRestore();
		void cloudAuth.init();
		syncEngine.start();
		// NOTE: live tramily/family location (SpacetimeDB) is intentionally NOT started
		// here. Its connection is kicked off lazily from the Map tab (MapTab.onMount),
		// the same place water-report sync connects — a SpacetimeDB connection burst at
		// boot was saturating the WebView during hydration and freezing the UI. Keeping
		// it off the startup path lets the app boot + hydrate cleanly.

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
	<!-- viewport + PWA meta live in app.html (shared static shell) -->
	<title>Hoggcountry</title>
	<meta
		name="description"
		content="On-device Appalachian Trail companion — offline field guide, elevation profile, gear, scripture, and Scout, a private AI assistant that cites its sources."
	/>
</svelte:head>

{@render children()}
