/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const STATIC_CACHE = `scout-static-${version}`;
const RUNTIME_CACHE = `scout-runtime-${version}`;
const OFFLINE_FALLBACK = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scout offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f2e8; color: #27332b; font-family: system-ui, sans-serif; }
      main { width: min(90vw, 32rem); border: 1px solid rgba(77,89,74,.18); border-radius: 18px; background: #fffdf8; padding: 1.2rem; box-shadow: 0 16px 36px rgba(31,41,55,.09); }
      h1 { margin: 0 0 .35rem; font-size: 1.35rem; }
      p { margin: 0; line-height: 1.45; }
    </style>
  </head>
  <body>
    <main>
      <h1>Scout is offline</h1>
      <p>Open /app or /app/scout after saving a field pack to use cached trail context. Live weather, web research, and cloud replies need service.</p>
    </main>
  </body>
</html>`;

const STATIC_ASSETS = [...build, ...files];
const APP_RUNTIME_PATHS = [
  '/',
  '/app',
  '/app/today',
  '/app/scout',
  '/app/claw',
  '/app/profile',
  '/app/resources',
  '/app/docs',
  '/guide',
  '/at-map',
  '/track',
  '/track/map-pack',
  '/videos',
  '/app-api/workspace',
  '/app-api/scout',
  '/app-api/scout/daily-brief',
  '/app-api/claw',
  '/app-api/claw/daily-brief',
  '/app-api/offline-pack',
  '/app-api/map/pack',
  '/updates',
  '/tools',
  '/about',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/rss.xml',
  '/sitemap.xml',
  '/sitemap-index.xml'
];

function isRuntimePath(pathname: string): boolean {
  return APP_RUNTIME_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isStaticAsset(url: URL): boolean {
  return STATIC_ASSETS.includes(url.pathname)
    || /\.(?:css|js|mjs|json|svg|png|jpg|jpeg|webp|avif|woff2?)$/iu.test(url.pathname);
}

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return new Response(OFFLINE_FALLBACK, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
        status: 200
      });
    }
    throw new Error('Offline and no cached response is available.');
  }
}

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => worker.skipWaiting())
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('scout-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => worker.clients.claim())
  );
});

worker.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== worker.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate' || isRuntimePath(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});
