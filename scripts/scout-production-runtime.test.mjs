import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('security headers allow configured API origins without leaking API paths', async () => {
  const { buildContentSecurityPolicy, configuredConnectSourceOrigins } = await import(
    '../apps/openclaw-web/src/lib/server/security-headers.ts'
  );

  const env = {
    PUBLIC_API_BASE_URL: 'http://127.0.0.1:8000/api/v1/',
    TRAIL_UPDATES_API_BASE: 'https://updates.example.test/api/v1?token=local'
  };

  assert.deepEqual(configuredConnectSourceOrigins(env), [
    'http://127.0.0.1:8000',
    'https://updates.example.test'
  ]);

  const csp = buildContentSecurityPolicy(env);
  const connectDirective = csp
    .split('; ')
    .find((directive) => directive.startsWith('connect-src '));

  assert.ok(connectDirective, 'connect-src directive should be present');
  assert.match(connectDirective, /http:\/\/127\.0\.0\.1:8000/u);
  assert.match(connectDirective, /https:\/\/updates\.example\.test/u);
  assert.doesNotMatch(connectDirective, /\/api\/v1/u);
  assert.doesNotMatch(connectDirective, /token=local/u);
});

test('Scout app teardown keeps browser-only globals out of SSR cleanup', () => {
  const page = read('apps/openclaw-web/src/routes/app/claw/+page.svelte');
  const cleanupStart = page.indexOf('onDestroy(() => {');
  const cleanupEnd = page.indexOf('  });', cleanupStart);
  const cleanup = page.slice(cleanupStart, cleanupEnd);

  assert.match(cleanup, /if \(typeof document !== 'undefined'\) \{\n\s+document\.body\.classList\.remove/u);
  assert.match(cleanup, /if \(typeof window !== 'undefined'\) \{\n\s+if \(streamingAppendFrame\) window\.cancelAnimationFrame/u);
  assert.equal(/(?<!typeof )document\./u.test(cleanup.replace(/document\.body\.classList\.remove/u, '')), false);
});
