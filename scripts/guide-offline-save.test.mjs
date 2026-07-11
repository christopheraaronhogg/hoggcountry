import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  GUIDE_OFFLINE_RESOURCES,
  guideIsSavedOffline,
  saveGuideOffline
} from '../apps/openclaw-web/src/routes/guide/offline-guide.ts';

const root = new URL('../', import.meta.url);

function responseFor(pathname) {
  if (pathname === '/guide') {
    return new Response(
      `<!doctype html><title>Appalachian Trail Field Guide</title><main>${'Trail-tested field guide. '.repeat(40)}</main>`,
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }
  if (pathname === '/guide-search-index.json') {
    return new Response(JSON.stringify([{ id: 'intro', title: 'Introduction' }]), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
  return new Response(`# THE COMPLETE APPALACHIAN TRAIL FIELD GUIDE\n${'Trail-tested guide context. '.repeat(50)}`, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}

function createPlatform({ skipCachePath = '' } = {}) {
  const origin = 'https://hoggcountry.test';
  const stores = new Map([
    ['scout-runtime-test', new Map()],
    ['scout-static-test', new Map()]
  ]);
  const fetches = [];
  let prepareCalls = 0;

  const platform = {
    origin,
    isControlled: () => true,
    prepare: async () => {
      prepareCalls += 1;
    },
    fetch: async (url, init) => {
      fetches.push({ url, init });
      const pathname = new URL(url).pathname;
      const response = responseFor(pathname);
      if (pathname !== skipCachePath) {
        const cacheName = pathname === '/guide' ? 'scout-runtime-test' : 'scout-static-test';
        stores.get(cacheName).set(url, response.clone());
      }
      return response;
    },
    cacheStorage: {
      keys: async () => [...stores.keys()],
      open: async (cacheName) => ({
        match: async (request) => stores.get(cacheName)?.get(String(request))?.clone()
      })
    }
  };

  return {
    platform,
    fetches,
    prepareCalls: () => prepareCalls
  };
}

test('guide offline save reports progress and only succeeds after Cache API verification', async () => {
  const success = createPlatform();
  const progress = [];
  const result = await saveGuideOffline({
    platform: success.platform,
    onProgress: (update) => progress.push(update)
  });

  assert.deepEqual(result, { saved: true, resourceCount: 3 });
  assert.equal(success.prepareCalls(), 1);
  assert.deepEqual(
    success.fetches.map(({ url }) => new URL(url).pathname),
    GUIDE_OFFLINE_RESOURCES.map(({ path }) => path)
  );
  assert.ok(success.fetches.every(({ init }) => init.cache === 'reload' && init.credentials === 'same-origin'));
  assert.deepEqual(progress.map(({ completed }) => completed), [0, 1, 2, 3]);
  assert.equal(await guideIsSavedOffline(success.platform), true);
  assert.equal(
    await guideIsSavedOffline({ ...success.platform, isControlled: () => false }),
    false
  );

  const missingCacheWrite = createPlatform({ skipCachePath: '/guide-context.txt' });
  const failedProgress = [];
  await assert.rejects(
    saveGuideOffline({
      platform: missingCacheWrite.platform,
      onProgress: (update) => failedProgress.push(update)
    }),
    /Guide text downloaded but could not be verified in offline storage/u
  );
  assert.deepEqual(failedProgress.map(({ completed }) => completed), [0, 1, 2]);
  assert.equal(await guideIsSavedOffline(missingCacheWrite.platform), false);

  const route = readFileSync(new URL('apps/openclaw-web/src/routes/guide/+page.svelte', root), 'utf8');
  assert.match(route, /saveGuideOffline/u);
  assert.match(route, /onclick=\{handleOfflineSave\}/u);
  assert.match(route, /aria-live="polite"/u);
  assert.match(route, /offlineState = 'saved'/u);
  assert.match(route, /offlineState = 'error'/u);
});
