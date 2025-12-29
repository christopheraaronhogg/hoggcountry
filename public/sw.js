/**
 * Hogg Country Service Worker
 * Full site offline support - caches all pages and assets
 */

const CACHE_NAME = 'hogg-country-v3';

// Core pages to precache on install
const CORE_PAGES = [
  '/',
  '/about/',
  '/tools/',
  '/guide/',
  '/trips/',
  '/videos/',
  '/tags/',
];

// Guide chapters (high priority - the main offline use case)
const GUIDE_CHAPTERS = [
  '/guide/00-introduction/',
  '/guide/01-hiker-profile/',
  '/guide/02-gear-system/',
  '/guide/03-clothing-system/',
  '/guide/04-water-treatment/',
  '/guide/05-shelter-decisions/',
  '/guide/06-weather-strategy/',
  '/guide/07-food-resupply/',
  '/guide/08-town-strategy/',
  '/guide/09-permits-logistics/',
  '/guide/09-trail-resources/',
  '/guide/10-mail-drops/',
  '/guide/11-power-electronics/',
  '/guide/12-medical-planning/',
  '/guide/13-safety-emergency/',
  '/guide/14-trail-sections/',
  '/guide/15-content-creation/',
  '/guide/16-financial-planning/',
  '/guide/17-final-truths/',
  '/guide/quick/shelter-triggers/',
  '/guide/quick/layering/',
  '/guide/quick/emergency/',
  '/guide/quick/resupply/',
  '/guide/quick/weather-signs/',
];

// Static assets to cache
const STATIC_ASSETS = [
  '/guide-search-index.json',
  '/AT-Field-Guide-2026.pdf',
  '/manifest.json',
  '/favicon.svg',
  '/default-background.svg',
  '/fonts/atkinson-regular.woff',
  '/fonts/atkinson-bold.woff',
];

// Install event - precache core resources + JS/CSS chunks
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching core pages and assets');

      // Cache static assets first
      await cache.addAll(STATIC_ASSETS);

      // Fetch and cache the asset manifest (JS/CSS chunks)
      try {
        const manifestResponse = await fetch('/asset-manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          console.log(`[SW] Caching ${manifest.assets.length} JS/CSS chunks`);

          // Cache all JS/CSS assets in parallel
          const assetPromises = manifest.assets.map(async (url) => {
            try {
              await cache.add(url);
            } catch (err) {
              console.warn(`[SW] Failed to cache asset ${url}:`, err.message);
            }
          });
          await Promise.all(assetPromises);
        }
      } catch (err) {
        console.warn('[SW] Could not load asset manifest:', err.message);
      }

      // Cache core pages
      const pagePromises = [...CORE_PAGES, ...GUIDE_CHAPTERS].map(async (url) => {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[SW] Failed to cache ${url}:`, err.message);
        }
      });

      await Promise.all(pagePromises);
      console.log('[SW] Precache complete - site ready for offline use');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Skip admin routes
  if (url.pathname.startsWith('/admin')) {
    return;
  }

  // Determine caching strategy based on resource type
  const isPage = event.request.mode === 'navigate' ||
                 event.request.headers.get('accept')?.includes('text/html');

  const isStaticAsset = /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|pdf|json)$/i.test(url.pathname) ||
                        url.pathname.startsWith('/_astro/');

  if (isStaticAsset) {
    // Static assets: Cache-first, then network
    event.respondWith(cacheFirst(event.request));
  } else if (isPage) {
    // HTML pages: Network-first, fall back to cache
    event.respondWith(networkFirst(event.request));
  } else {
    // Everything else: Try cache, then network
    event.respondWith(cacheFirst(event.request));
  }
});

// Cache-first strategy (static assets)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Return cached, but update in background
    updateCache(request);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] Fetch failed for:', request.url);
    return new Response('Offline - resource not cached', { status: 503 });
  }
}

// Network-first strategy (HTML pages)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed - try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cached;
    }

    // No cache - return offline page or error
    const offlinePage = await caches.match('/');
    if (offlinePage) {
      return offlinePage;
    }

    return new Response(offlineHTML(), {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background cache update
function updateCache(request) {
  fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Network failed, that's fine
  });
}

// Simple offline fallback HTML
function offlineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - Hogg Country</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f2e8;
      color: #2b2f26;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
      text-align: center;
    }
    .container { max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #5c665a; line-height: 1.6; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    a { color: #4d594a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📵</div>
    <h1>You're Offline</h1>
    <p>This page hasn't been cached yet. Visit the <a href="/guide/">Field Guide</a> or <a href="/tools/">Tools</a> while online to cache them for offline use.</p>
  </div>
</body>
</html>`;
}

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }

  // Allow requesting cache refresh
  if (event.data?.type === 'CACHE_ALL') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll([...CORE_PAGES, ...GUIDE_CHAPTERS, ...STATIC_ASSETS]);
    });
  }
});
