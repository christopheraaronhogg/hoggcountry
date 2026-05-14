import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { loadScoutAtOpenReferenceOfflineSummary } from '../apps/openclaw-web/src/lib/server/at-open-reference.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Scout app and API aliases exist while legacy Claw routes remain compatible', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/scout/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app/claw/+page.svelte', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app-api/scout/+server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/app-api/scout/[...path]/+server.ts', root)), true);

  const signup = read('apps/openclaw-web/src/routes/signup/+page.server.ts');
  const appLayout = read('apps/openclaw-web/src/routes/app/+layout.svelte');
  const alias = read('apps/openclaw-web/src/lib/server/scout-api-alias.ts');
  assert.match(signup, /redirect\(303, '\/app\/scout'\)/u);
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
