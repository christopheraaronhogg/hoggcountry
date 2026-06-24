/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, prerendered, version } from '$service-worker';

// Service worker for the installable PWA — caches the app shell so Hogg Country
// loads + runs offline on the trail (the same SvelteKit build the iOS app wraps).
// Versioned per build, so a new deploy (or `cap sync`) cleanly replaces the cache
// and never serves stale assets. Cross-origin requests (map tiles, the Laravel
// API, SpacetimeDB) pass straight through to the network.

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `hoggcountry-${version}`;
// build = hashed JS/CSS, files = static/ assets, prerendered = the HTML pages.
const PRECACHE = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
		})()
	);
});

// Web Push (PWA): show the pushed notification. Payload is JSON { title, body, url? }
// sent by the Laravel push sender; we fall back to safe defaults if it's empty.
sw.addEventListener('push', (event) => {
	let payload: { title?: string; body?: string; url?: string } = {};
	try {
		payload = event.data?.json() ?? {};
	} catch {
		const text = event.data?.text();
		if (text) payload = { body: text };
	}
	event.waitUntil(
		sw.registration.showNotification(payload.title ?? 'Hogg Country', {
			body: payload.body ?? '',
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			data: { url: payload.url ?? '/' }
		})
	);
});

// Tapping a notification focuses an open app window (or opens one) at its URL.
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
	event.waitUntil(
		(async () => {
			const clients = (await sw.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			})) as readonly WindowClient[];
			const open = clients[0];
			if (open) {
				await open.focus();
				if (url !== '/') await open.navigate(url).catch(() => {});
				return;
			}
			await sw.clients.openWindow(url);
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	// Only same-origin app assets — let map tiles / API / SpacetimeDB hit the network.
	if (url.origin !== location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Immutable, versioned build assets: cache-first.
			if (PRECACHE.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			// Everything else: network-first, fall back to cache, then the app shell
			// so the offline-first SPA can still boot with no connection.
			try {
				const response = await fetch(event.request);
				if (response.ok && response.type === 'basic') {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				const cached = await cache.match(event.request);
				if (cached) return cached;
				const shell = (await cache.match('/')) ?? (await cache.match('/index.html'));
				if (shell) return shell;
				return Response.error();
			}
		})()
	);
});
