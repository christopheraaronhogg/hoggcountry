export type GuideOfflineResourceKind = 'html' | 'json' | 'text';

export const GUIDE_OFFLINE_RESOURCES = [
  {
    path: '/guide',
    label: 'Field guide',
    kind: 'html',
    cachePrefix: 'scout-runtime-'
  },
  {
    path: '/guide-search-index.json',
    label: 'Guide search',
    kind: 'json',
    cachePrefix: 'scout-static-'
  },
  {
    path: '/guide-context.txt',
    label: 'Guide text',
    kind: 'text',
    cachePrefix: 'scout-static-'
  }
] as const;

type GuideOfflineResource = (typeof GUIDE_OFFLINE_RESOURCES)[number];

export interface GuideOfflineProgress {
  readonly completed: number;
  readonly total: number;
  readonly label: string;
}

interface GuideOfflineCache {
  match(request: string): Promise<Response | undefined>;
}

interface GuideOfflineCacheStorage {
  keys(): Promise<string[]>;
  open(cacheName: string): Promise<GuideOfflineCache>;
}

export interface GuideOfflinePlatform {
  readonly origin: string;
  readonly cacheStorage: GuideOfflineCacheStorage;
  isControlled(): boolean;
  prepare(): Promise<void>;
  fetch(url: string, init: RequestInit): Promise<Response>;
}

export interface SaveGuideOfflineOptions {
  readonly platform?: GuideOfflinePlatform;
  readonly onProgress?: (progress: GuideOfflineProgress) => void;
}

const SERVICE_WORKER_READY_TIMEOUT_MS = 12_000;
const SERVICE_WORKER_CONTROL_TIMEOUT_MS = 4_000;

function waitForServiceWorkerControl(): Promise<void> {
  if (navigator.serviceWorker.controller) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
    const handleControllerChange = () => {
      if (!navigator.serviceWorker.controller) return;
      cleanup();
      resolve();
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Offline saving is still starting. Reload the page and try again.'));
    }, SERVICE_WORKER_CONTROL_TIMEOUT_MS);

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
  });
}

async function prepareBrowserServiceWorker(): Promise<void> {
  let timeout: number | undefined;
  try {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timeout = window.setTimeout(() => {
          reject(new Error('Offline saving could not start. Reload the page and try again.'));
        }, SERVICE_WORKER_READY_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
  }

  await waitForServiceWorkerControl();
}

function browserPlatform(): GuideOfflinePlatform {
  if (
    typeof window === 'undefined'
    || typeof navigator === 'undefined'
    || !('caches' in window)
    || !('serviceWorker' in navigator)
  ) {
    throw new Error('This browser does not support saving the guide offline.');
  }

  return {
    origin: window.location.origin,
    cacheStorage: {
      keys: () => window.caches.keys(),
      open: async (cacheName) => {
        const cache = await window.caches.open(cacheName);
        return {
          match: (request) => cache.match(request)
        };
      }
    },
    isControlled: () => Boolean(navigator.serviceWorker.controller),
    prepare: prepareBrowserServiceWorker,
    fetch: (url, init) => window.fetch(url, init)
  };
}

function contentTypeMatches(resource: GuideOfflineResource, response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (resource.kind === 'html') return contentType.includes('text/html');
  if (resource.kind === 'json') return contentType.includes('application/json') || contentType.includes('+json');
  return contentType.includes('text/plain') || contentType.includes('text/markdown');
}

async function validateDownloadedResource(resource: GuideOfflineResource, response: Response): Promise<void> {
  if (!contentTypeMatches(resource, response)) {
    throw new Error(`${resource.label} returned unexpected content, so the guide was not marked saved.`);
  }

  if (resource.kind === 'json') {
    const value = await response.clone().json().catch(() => null);
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`${resource.label} was empty or invalid, so the guide was not marked saved.`);
    }
    return;
  }

  const text = await response.clone().text().catch(() => '');
  const minimumLength = resource.kind === 'html' ? 500 : 1_000;
  if (text.trim().length < minimumLength || !/Appalachian Trail|Field Guide/iu.test(text)) {
    throw new Error(`${resource.label} was incomplete, so the guide was not marked saved.`);
  }
}

async function cachedResourceExists(
  resource: GuideOfflineResource,
  platform: GuideOfflinePlatform
): Promise<boolean> {
  const resourceUrl = new URL(resource.path, platform.origin).href;
  const cacheNames = await platform.cacheStorage.keys();

  for (const cacheName of cacheNames.filter((name) => name.startsWith(resource.cachePrefix))) {
    try {
      const cache = await platform.cacheStorage.open(cacheName);
      const response = await cache.match(resourceUrl);
      if (response?.ok && contentTypeMatches(resource, response)) return true;
    } catch {
      // A superseded cache can disappear while a new worker activates.
    }
  }

  return false;
}

export async function guideIsSavedOffline(platform: GuideOfflinePlatform = browserPlatform()): Promise<boolean> {
  if (!platform.isControlled()) return false;
  for (const resource of GUIDE_OFFLINE_RESOURCES) {
    if (!await cachedResourceExists(resource, platform)) return false;
  }
  return true;
}

export async function saveGuideOffline(options: SaveGuideOfflineOptions = {}) {
  const platform = options.platform ?? browserPlatform();
  const total = GUIDE_OFFLINE_RESOURCES.length;
  options.onProgress?.({ completed: 0, total, label: 'Preparing offline storage' });

  await platform.prepare();
  if (!platform.isControlled()) {
    throw new Error('Offline saving is not active yet. Reload the page and try again.');
  }

  for (const [index, resource] of GUIDE_OFFLINE_RESOURCES.entries()) {
    const resourceUrl = new URL(resource.path, platform.origin).href;
    const response = await platform.fetch(resourceUrl, {
      cache: 'reload',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`${resource.label} could not be downloaded (${response.status}). The guide was not marked saved.`);
    }

    await validateDownloadedResource(resource, response);

    if (!await cachedResourceExists(resource, platform)) {
      throw new Error(`${resource.label} downloaded but could not be verified in offline storage.`);
    }

    options.onProgress?.({
      completed: index + 1,
      total,
      label: resource.label
    });
  }

  return {
    saved: true as const,
    resourceCount: total
  };
}
