import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

import {
  AWOL_WATER_SOURCES,
  AWOL_WATER_CITATION
} from '../apps/openclaw-web/src/lib/server/generated/awol-water-reference.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scoutWebRoot = path.join(repoRoot, 'apps/openclaw-web');
const TOTAL_AT_MILES = 2197.4;
const fixedNow = new Date('2026-06-24T15:30:00.000Z');

let viteServerPromise = null;
async function loadFieldPackBuilder() {
  viteServerPromise ??= createServer({
    configFile: false,
    root: scoutWebRoot,
    logLevel: 'error',
    resolve: { alias: { $lib: path.join(scoutWebRoot, 'src/lib') } },
    server: { middlewareMode: true },
    appType: 'custom'
  });
  return (await viteServerPromise).ssrLoadModule(path.join(scoutWebRoot, 'src/lib/server/public-mobile-field-pack.ts'));
}

test.after(async () => {
  if (viteServerPromise) (await viteServerPromise).close();
});

test('generated AWOL water reference is well-formed facts on our frame', () => {
  assert.ok(AWOL_WATER_SOURCES.length >= 100, 'expected a substantial reference');
  const valid = new Set(['reliable', 'seasonal', 'thin']);

  let prevMile = -Infinity;
  for (const source of AWOL_WATER_SOURCES) {
    assert.ok(source.mile >= 0 && source.mile <= TOTAL_AT_MILES, `mile in range: ${source.mile}`);
    assert.ok(source.mile >= prevMile, 'sources are sorted by mile');
    prevMile = source.mile;
    assert.ok(valid.has(source.reliability), `valid reliability: ${source.reliability}`);
    assert.ok(source.name.length > 0, 'has a name');
    // Our wording, not AWOL prose — every note follows the generator template.
    assert.match(source.note, /AWOL-listed/);
    assert.match(source.note, /confirm current flow/);
  }
});

test('AWOL citation attributes the facts and marks reliability as our derivation', () => {
  assert.match(AWOL_WATER_CITATION, /A\.T\. Guide|AWOL/);
  assert.match(AWOL_WATER_CITATION, /cite-and-verify|derivation/i);
});

test('field pack water layer prefers AWOL named sources and cites them', async () => {
  const { buildPublicMobileFieldPack } = await loadFieldPackBuilder();
  const originalFetch = globalThis.fetch;
  // Throw on every fetch: weather + conditions degrade gracefully; water comes
  // from the AWOL import + local open-reference, so it must still populate.
  globalThis.fetch = async () => {
    throw new Error('offline in test');
  };
  try {
    const pack = await buildPublicMobileFieldPack(fixedNow, { personal: true, mile: 600, direction: 'NOBO' });
    const water = pack.data.context_pack.water;
    assert.ok(water.length > 0, 'water layer is populated');
    assert.ok(
      water.some((entry) => /AWOL-listed/.test(entry.note ?? '')),
      'at least one served water source is an AWOL-cited real source'
    );
    assert.ok(
      pack.meta.source_receipts.some((receipt) => receipt.id === 'field-guide:awol-water'),
      'pack carries the AWOL water receipt'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
