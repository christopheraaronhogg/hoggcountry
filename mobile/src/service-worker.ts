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

const CACHE_PREFIX = 'hoggcountry-';
const CACHE = `${CACHE_PREFIX}${version}`;

// Hashed JS/CSS and the root HTML are the minimum viable offline app shell.
// Large static datasets and any additional pages are useful but optional: one
// failed Bible/map/reference asset must not prevent the shell from installing.
const REQUIRED_SHELL = [
	...new Set([
		...build,
		'/',
		...prerendered.filter((path) => path === '/' || path === '/index.html')
	])
];
const requiredPaths = new Set(REQUIRED_SHELL);
const PRECACHE = [...new Set([...REQUIRED_SHELL, ...files, ...prerendered])];
const OPTIONAL_ASSETS = PRECACHE.filter((path) => !requiredPaths.has(path));
const precachePaths = new Set(PRECACHE);

async function findPreviousResponse(path: string): Promise<Response | undefined> {
	const previousKeys = (await caches.keys())
		.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
		.reverse();

	for (const key of previousKeys) {
		const response = await (await caches.open(key)).match(path);
		if (response) return response;
	}
	return undefined;
}

async function cacheOptionalAsset(cache: Cache, path: string): Promise<void> {
	try {
		await cache.add(path);
		return;
	} catch {
		// Stable static paths can reuse the prior version when the update happens
		// over weak/no connectivity. A truly new missing asset remains optional.
		const previous = await findPreviousResponse(path);
		if (previous) await cache.put(path, previous.clone());
	}
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);

			// Required shell failures keep the previous worker active.
			for (const path of REQUIRED_SHELL) await cache.add(path);

			// Optional assets are isolated: one failed large Bible/map payload
			// cannot reject the entire service-worker installation.
			await Promise.allSettled(
				OPTIONAL_ASSETS.map((path) => cacheOptionalAsset(cache, path))
			);
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key.startsWith(CACHE_PREFIX) && key !== CACHE) {
					await caches.delete(key);
				}
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
			if (precachePaths.has(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			// Everything else: network-first, fall back to cache, then the app shell
			// so the offline-first SPA can still boot with no connection.
			try {
				const response = await fetch(event.request);
				if (response.ok && response.type === 'basic') {
					await cache.put(event.request, response.clone());
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
