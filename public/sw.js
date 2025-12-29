/**
 * AT Field Guide Service Worker
 * Enables offline access to the entire field guide on mobile
 */

const CACHE_NAME = 'at-field-guide-v1';

// Core resources to cache immediately on install
const PRECACHE_URLS = [
  '/guide/',
  '/guide-search-index.json',
  '/AT-Field-Guide-2026.pdf',
];

// Guide chapter paths to cache
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

// Install event - precache core resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core resources');
      return cache.addAll([...PRECACHE_URLS, ...GUIDE_CHAPTERS]);
    }).then(() => {
      console.log('[SW] Precache complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
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
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For guide pages and assets, use cache-first strategy
  if (url.pathname.startsWith('/guide') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.pdf') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff')) {

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, but also update cache in background
          event.waitUntil(
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            }).catch(() => {
              // Network failed, that's fine - we have cache
            })
          );
          return cachedResponse;
        }

        // Not in cache - fetch from network and cache it
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Allow forcing a cache refresh
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
