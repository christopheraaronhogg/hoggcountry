import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { loadScoutAtOpenReferenceOfflineSummary } from '../apps/openclaw-web/src/lib/server/at-open-reference.ts';
import { isScoutAdminProfile } from '../apps/openclaw-web/src/lib/server/scout-admin.ts';
import { readScoutReferenceTablePage } from '../apps/openclaw-web/src/lib/server/scout-resource-explorer.ts';
import { loadScoutReferenceProgressData } from '../apps/openclaw-web/src/lib/server/scout-reference-progress.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

class MemoryStorage {
  #values = new Map();

  get length() {
    return this.#values.size;
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#values.get(key) ?? null;
  }

  setItem(key, value) {
    this.#values.set(String(key), String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  clear() {
    this.#values.clear();
  }
}

function offlinePackFixture({ workspaceId, email }) {
  return {
    version: 1,
    cachedAt: '2026-07-11T12:00:00.000Z',
    workspaceId,
    workspace: {
      workspaceId,
      betaProfile: { name: 'Hiker', email, trailName: 'Hiker' },
      profile: null,
      sections: [],
      documents: [],
      resources: [],
      tools: [],
      providerConnections: [],
      clawMessages: [],
      factCandidates: [],
      locationHistory: [],
      skillSettings: {},
      createdAt: '2026-07-11T12:00:00.000Z',
      updatedAt: '2026-07-11T12:00:00.000Z'
    },
    claw: null,
    dailyBrief: null,
    atReference: null
  };
}

test('Scout app and API aliases exist while legacy Claw routes remain compatible', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/scout/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/claw/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app-api/scout/+server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app-api/scout/[...path]/+server.ts', root)), true);

  const signup = read('apps/openclaw-web/src/routes/signup/+page.server.ts');
  const appLayout = read('apps/openclaw-web/src/routes/app/+layout.svelte');
  const alias = read('apps/openclaw-web/src/lib/server/scout-api-alias.ts');
  // Private hosted beta keeps signup redirect-param aware for the login link,
  // but account creation itself is closed while AI costs are app-managed.
  assert.match(signup, /normalizeRedirect/u);
  assert.match(signup, /REGISTRATION_CLOSED_MESSAGE/u);
  assert.match(signup, /fail\(403/u);
  assert.match(appLayout, /href: '\/app\/scout'/u);
  assert.match(appLayout, /path\.startsWith\('\/app\/claw'\)/u);
  assert.match(alias, /target\.pathname = `\/app-api\/claw/u);
});

test('Scout can record Resources without treating them as user-maintained Docs', () => {
  const store = read('apps/openclaw-web/src/lib/server/workspace-store.ts');
  const agent = read('apps/openclaw-web/src/lib/server/claw-agent.ts');

  assert.match(store, /export async function recordWorkspaceScoutResource/u);
  assert.match(store, /createWorkspaceResourceForActor[\s\S]*'scout'\);/u);
  assert.match(agent, /name: 'record_resource'/u);
  assert.match(agent, /recordWorkspaceScoutResource/u);
  assert.match(agent, /resourceInputsFromWebResearch/u);
  assert.match(agent, /resourceInputsFromOfficialSources/u);
  assert.match(agent, /metadata|excerpt|Source URL|Fetched/u);
});

test('Scout document updates are gated by explicit user intent', () => {
  const agent = read('apps/openclaw-web/src/lib/server/claw-agent.ts');

  assert.match(agent, /Documents are user-controlled maintained artifacts/u);
  assert.match(agent, /promptExplicitlyRequestsDocumentRevision/u);
  assert.match(agent, /activeDocument\?\.rights === 'assistant-generated' && promptExplicitlyRequestsDocumentRevision\(trimmedPrompt\)/u);
  assert.match(agent, /ask the user to save or confirm/u);
});

test('Scout chat keeps source receipt rendering stable and replies copyable', () => {
  const page = read('apps/openclaw-web/src/routes/app/claw/+page.svelte');

  assert.match(page, /function copyAssistantReply\(message: ClawMessage\)/u);
  assert.match(page, /aria-label="Copy Scout reply"/u);
  assert.match(page, /copiedMessageId === message\.id \? 'Copied' : 'Copy'/u);
  assert.match(page, /receipt, receiptIndex/u);
  assert.doesNotMatch(page, /\{#each\s+(?:message\.sourceReceipts|activeTurnSourceReceipts|dailyBrief\.sourceReceipts)[^`]+`[^`]*\$\{receipt\.kind\}-\$\{receipt\.label\}`/u);
});

test('Today manual mile save does not require GPS and can start a profile', () => {
  const page = read('apps/openclaw-web/src/routes/app/+page.svelte');
  const endpoint = read('apps/openclaw-web/src/routes/app-api/workspace/profile/current-mile/+server.ts');

  assert.match(page, /let mileNotice = \$state\(''\)/u);
  assert.match(page, /locationError = '';\s*\n\s*try \{/u);
  assert.match(page, /createDefaultProfile/u);
  assert.match(page, /initializeManual\(starter\)/u);
  assert.match(page, /Profile started at AT mile/u);
  assert.match(page, /Manual mile saved: AT mile/u);
  assert.match(page, /\{#if mileNotice\}<p class="hud-note success-note">\{mileNotice\}<\/p>\{\/if\}/u);
  assert.match(endpoint, /getWorkspace\(workspaceId, betaProfile\)/u);
  assert.match(endpoint, /throw error\(409, 'Set up your hiker profile before saving a mile\.'\)/u);
});

test('Scout offline pack exposes compact AT reference context', async () => {
  const offlinePackEndpoint = read('apps/openclaw-web/src/routes/app-api/offline-pack/+server.ts');
  const offlinePackClient = read('apps/openclaw-web/src/lib/offline-field-pack.ts');
  const scoutChat = read('apps/openclaw-web/src/routes/app/claw/+page.svelte');

  assert.equal(existsSync(new URL('apps/openclaw-web/src/lib/server/generated/at-open-reference-summary.ts', root)), true);
  assert.match(offlinePackEndpoint, /loadScoutAtOpenReferenceOfflineSummary/u);
  assert.match(offlinePackEndpoint, /atReference/u);
  assert.match(offlinePackClient, /OfflineAtReferenceSummary/u);
  assert.match(offlinePackClient, /AT ref/u);
  assert.match(scoutChat, /Cached AT reference/u);

  const summary = await loadScoutAtOpenReferenceOfflineSummary(new Date('2026-05-14T00:00:00.000Z'));
  assert.equal(summary.available, true);
  assert.equal(summary.loadedAt, '2026-05-14T00:00:00.000Z');

  if (!summary.available) throw new Error(summary.reason);

  assert.equal(summary.route.official, false);
  assert.equal(summary.route.candidateStatus, 'not_production_final');
  assert.ok(summary.totals.records > 25_000);
  assert.ok(summary.datasets.some((dataset) => dataset.id === 'water-candidates' && dataset.recordCount > 1000));
  assert.match(summary.policies.generatedMileDisclosure, /not official ATC miles|not an official ATC mile/u);
  assert.match(summary.policies.liveConditionsDisclosure, /live checks|Offline answers/u);
});

test('Scout browser privacy boundaries isolate offline packs and purge private caches on logout', async () => {
  const serviceWorker = read('apps/openclaw-web/src/service-worker.ts');
  const appLayoutServer = read('apps/openclaw-web/src/routes/app/+layout.server.ts');
  const appLayout = read('apps/openclaw-web/src/routes/app/+layout.svelte');
  const logout = read('apps/openclaw-web/src/routes/app/logout/+server.ts');
  const login = read('apps/openclaw-web/src/routes/login/+page.svelte');

  assert.match(serviceWorker, /isPrivateAppRequestPath/u);
  assert.match(serviceWorker, /fetch\(request, \{ cache: 'no-store' \}\)/u);
  assert.match(serviceWorker, /if \(isPrivateAppRequestPath\(url\.pathname\)\)[\s\S]*?respondWith\(networkOnly\(request\)\)/u);
  assert.match(serviceWorker, /PURGE_PRIVATE_APP_DATA/u);
  assert.match(serviceWorker, /purgePrivateRuntimeCacheEntries/u);
  assert.match(serviceWorker, /request\.mode === 'navigate' \|\| isRuntimePath/u);

  assert.match(appLayoutServer, /workspaceId: event\.locals\.workspaceId/u);
  assert.match(appLayout, /configureOfflineFieldPackScope/u);
  assert.match(appLayout, /purgePrivateAppData/u);
  assert.match(appLayout, /handleLogout/u);
  assert.match(logout, /\/login\?signed_out=1/u);
  assert.match(login, /signed_out/u);
  assert.match(login, /purgePrivateAppData/u);

  const offlinePack = await import('../apps/openclaw-web/src/lib/offline-field-pack.ts');
  assert.equal(typeof offlinePack.configureOfflineFieldPackScope, 'function');
  assert.equal(typeof offlinePack.purgeOfflineFieldPackStorage, 'function');

  const previousWindow = globalThis.window;
  const localStorage = new MemoryStorage();
  globalThis.window = { localStorage };

  const alicePack = offlinePackFixture({ workspaceId: 'workspace-a', email: 'alice@example.com' });
  const bobPack = offlinePackFixture({ workspaceId: 'workspace-b', email: 'bob@example.com' });

  try {
    localStorage.setItem('hoggcountry.scout.offlineFieldPack.v1', JSON.stringify(alicePack));
    offlinePack.configureOfflineFieldPackScope(null);
    assert.equal(offlinePack.readOfflineFieldPack(), null, 'an unscoped caller must not see a legacy pack');

    offlinePack.configureOfflineFieldPackScope({
      identityId: 'user-a',
      identityEmail: 'Alice@Example.com',
      workspaceId: 'workspace-a'
    });
    assert.equal(offlinePack.readOfflineFieldPack()?.workspaceId, 'workspace-a', 'matching legacy data migrates safely');
    assert.equal(localStorage.getItem('hoggcountry.scout.offlineFieldPack.v1'), null);

    offlinePack.configureOfflineFieldPackScope({
      identityId: 'user-b',
      identityEmail: 'bob@example.com',
      workspaceId: 'workspace-a'
    });
    assert.equal(offlinePack.readOfflineFieldPack(), null, 'a second identity cannot read the first identity pack');

    offlinePack.configureOfflineFieldPackScope({
      identityId: 'user-a',
      identityEmail: 'alice@example.com',
      workspaceId: 'workspace-b'
    });
    assert.equal(offlinePack.readOfflineFieldPack(), null, 'a second workspace cannot read the first workspace pack');

    offlinePack.configureOfflineFieldPackScope({
      identityId: 'user-a',
      identityEmail: 'alice@example.com',
      workspaceId: 'workspace-a'
    });
    assert.equal(offlinePack.writeOfflineFieldPack(bobPack), null, 'workspace-mismatched writes fail closed');
    assert.equal(offlinePack.readOfflineFieldPack()?.workspaceId, 'workspace-a');

    offlinePack.configureOfflineFieldPackScope({
      identityId: 'user-b',
      identityEmail: 'bob@example.com',
      workspaceId: 'workspace-b'
    });
    assert.equal(offlinePack.writeOfflineFieldPack(bobPack)?.workspaceId, 'workspace-b');
    localStorage.setItem('hoggcountry.scout.offlineFieldPack.v1', JSON.stringify(alicePack));
    localStorage.setItem('unrelated.public.preference', 'keep');
    offlinePack.purgeOfflineFieldPackStorage();

    const remainingKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
    assert.deepEqual(remainingKeys, ['unrelated.public.preference'], 'logout purge leaves unrelated local storage intact');
  } finally {
    offlinePack.configureOfflineFieldPackScope(null);
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('Scout admin resource explorer exposes agent-accessible tables and docs', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/admin/resources/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/admin/resources/+page.server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app-api/admin/resources/table/+server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/lib/server/generated/resource-explorer.ts', root)), true);

  const page = read('apps/openclaw-web/src/routes/app/admin/resources/+page.svelte');
  const server = read('apps/openclaw-web/src/routes/app/admin/resources/+page.server.ts');
  const tableEndpoint = read('apps/openclaw-web/src/routes/app-api/admin/resources/table/+server.ts');
  const layout = read('apps/openclaw-web/src/routes/app/+layout.svelte');

  assert.match(page, /Resource Explorer/u);
  assert.match(page, /Bundled reference tables, RAG docs, and private workspace material/u);
  assert.match(page, /loadTablePage/u);
  assert.match(page, /panel === 'tables'/u);
  assert.match(page, /panel === 'workspace'/u);
  assert.match(server, /isScoutAdminProfile/u);
  assert.match(tableEndpoint, /readScoutReferenceTablePage/u);
  assert.match(layout, /href: '\/app\/admin\/resources'/u);

  assert.equal(isScoutAdminProfile({ name: 'Chris', email: 'chris@hoggcountry.local', trailName: 'Chris' }), true);
  assert.equal(isScoutAdminProfile({ name: 'Dad', email: 'dad@hoggcountry.local', trailName: 'Dad' }), false);

  const pageResult = readScoutReferenceTablePage({
    path: 'processed/water/water_candidates.json',
    offset: 0,
    limit: 5
  });
  assert.equal(pageResult.path, 'processed/water/water_candidates.json');
  assert.ok(pageResult.total > 1000);
  assert.equal(pageResult.rows.length, 5);
  assert.ok(pageResult.columns.includes('water_id'));
  assert.equal(pageResult.rows[0].source_id, 'usgs_3dhp_nhd');
});

test('Scout admin reference progress dashboard exposes RC1 progress without loading huge tables', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/admin/reference-progress/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/admin/reference-progress/+page.server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/lib/server/scout-reference-progress.ts', root)), true);

  const page = read('apps/openclaw-web/src/routes/app/admin/reference-progress/+page.svelte');
  const server = read('apps/openclaw-web/src/routes/app/admin/reference-progress/+page.server.ts');
  const resourcesPage = read('apps/openclaw-web/src/routes/app/admin/resources/+page.svelte');

  assert.match(page, /Reference Progress/u);
  assert.match(page, /MVP coverage/u);
  assert.match(page, /Davenport Gap to Damascus|yellow flags/u);
  assert.match(page, /Official 2026 reference/u);
  assert.match(page, /Length delta/u);
  assert.match(page, /Open Geometry Vs Official Reference/u);
  assert.match(page, /Rockiness V2/u);
  assert.match(page, /Rockiness V2\.1/u);
  assert.match(page, /Source extraction/u);
  assert.match(page, /generated\/open-route mile/u);
  assert.match(page, /Regenerate and verify/u);
  assert.match(server, /loadScoutReferenceProgressData/u);
  assert.match(resourcesPage, /\/app\/admin\/reference-progress/u);

  const progress = loadScoutReferenceProgressData();
  assert.equal(progress.rc1.routeMiles, 2106.2);
  assert.equal(progress.rc1.officialReferenceMiles, 2197.9);
  assert.equal(progress.rc1.routeLengthDeltaMiles, -91.7);
  assert.equal(progress.rc1.alignmentStatus, 'yellow_unresolved_open_route_delta');
  assert.ok(progress.rc1.geodesicRouteMiles > 2106 && progress.rc1.geodesicRouteMiles < 2107);
  assert.ok(progress.rc1.waymarkedRouteMiles > 2106 && progress.rc1.waymarkedRouteMiles < 2107);
  assert.ok(progress.rc1.threeDEstimateMiles > 2118 && progress.rc1.threeDEstimateMiles < 2119);
  assert.equal(progress.rc1.elevation100mComplete, true);
  assert.ok(progress.rc1.elevation100mSampleCount >= 33_000);
  assert.equal(typeof progress.rc1.maxContinuityGapMiles, 'number');
  assert.equal(progress.rc1.maxContinuityGapMiles < 1, true);
  assert.ok(progress.rc1.unresolvedCauses.some((cause) => /licensed official/i.test(cause)));
  assert.ok(progress.rc1.suspectedCauses.some((cause) => /OpenStreetMap|Waymarked/i.test(cause)));
  assert.equal(progress.rc1.qaQuestionCount, 638);
  assert.ok(progress.rc1.rockinessV2PointOneMileCount >= 21_000);
  assert.ok(progress.rc1.rockinessV2OneMileCount >= 2_100);
  assert.match(progress.rc1.rockinessV2Path, /tread_rockiness_v2/u);
  assert.ok(progress.rc1.rockinessV21OneMileCount >= 2_100);
  assert.equal(progress.rc1.rockinessV21SourceExtractionCount, 1);
  assert.match(progress.rc1.rockinessV21Path, /tread_rockiness_v2_1/u);
  assert.ok(progress.rc1.totalDatasetRecords > 25_000);
  assert.ok(progress.rc1.zipSizeBytes > 1_000_000);
  assert.ok(progress.packs.length >= 6);
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'water_candidates' && dataset.recordCount > 1700));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'elevation_samples_100m' && dataset.recordCount >= 33_000));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'rockiness_v2_0_1mi' && dataset.recordCount >= 21_000 && dataset.productionSafe));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'rockiness_v2_1mi' && dataset.recordCount >= 2_100 && dataset.productionSafe));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'rockiness_v2_1_source_extraction' && dataset.recordCount === 1 && dataset.productionSafe));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'rockiness_v2_1_1mi' && dataset.recordCount >= 2_100 && dataset.productionSafe));
  assert.ok(progress.datasets.some((dataset) => dataset.datasetId === 'route_alignment_diagnostics' && dataset.recordCount === 1));
  assert.ok(progress.rc1.statusRows.some((row) => row.area === 'Landmark Anchors' && /coordinate-first/i.test(row.notes)));
  assert.ok(progress.rc1.yellowFlags.some((flag) => /Davenport Gap to Damascus/i.test(flag.notes)));
  assert.ok(progress.rc1.yellowFlags.some((flag) => /official reference/i.test(flag.notes)));
  assert.ok(progress.commands.some((command) => /build-full-trail-100m-elevation\.mjs/.test(command.command)));
  assert.ok(progress.commands.some((command) => /discover-rockiness-v2-1-sources\.mjs/.test(command.command)));
  assert.ok(progress.commands.some((command) => /run_full_trail_validation.py/.test(command.command)));
});
