import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	docKey,
	etagOf,
	makeDelete,
	makeUpsert,
	reconcilePush,
	restoreDecision,
	shouldEnqueueUpsert,
	toPushChanges,
	type PendingMap,
	type SyncedMap
} from './sync-outbox.ts';

test('etagOf is stable for equal content and differs for changed content', () => {
	const a = etagOf({ mile: 1507.2, source: 'pilot' });
	const b = etagOf({ mile: 1507.2, source: 'pilot' });
	const c = etagOf({ mile: 1507.3, source: 'pilot' });
	assert.equal(a, b, 'identical content → identical etag (so unchanged docs are skipped)');
	assert.notEqual(a, c, 'a real change → a new etag');
	assert.ok(a.length > 0 && a.length <= 64, 'etag fits the server column (≤64 chars)');
});

test('etagOf handles null/undefined content without throwing', () => {
	assert.ok(etagOf(null).length > 0);
	assert.ok(etagOf(undefined).length > 0);
	assert.notEqual(etagOf(null), etagOf({ a: 1 }));
});

test('shouldEnqueueUpsert skips unchanged docs, queues real changes', () => {
	const key = docKey('position', 'me');
	const pending: PendingMap = {};
	const synced: SyncedMap = {};

	// First ever sight of a doc → enqueue.
	assert.equal(shouldEnqueueUpsert(pending, synced, key, 'etag1'), true);

	// Already queued at the same version → skip (no duplicate).
	const queued: PendingMap = { [key]: makeUpsert('position', 'me', { m: 1 }, 'T') };
	assert.equal(shouldEnqueueUpsert(queued, synced, key, queued[key].etag), false);

	// Already backed up at this etag and not queued → skip.
	const backed: SyncedMap = { [key]: 'etag1' };
	assert.equal(shouldEnqueueUpsert({}, backed, key, 'etag1'), false);

	// Backed up but content moved → enqueue the new version.
	assert.equal(shouldEnqueueUpsert({}, backed, key, 'etag2'), true);
});

test('toPushChanges emits the server wire shape; delete carries no content', () => {
	const changes = toPushChanges(
		[
			makeUpsert('profile', 'me', { trailName: 'Dad' }, '2026-06-23T18:00:00.000Z'),
			makeDelete('documents', 'old', '2026-06-23T18:05:00.000Z')
		],
		1
	);

	assert.deepEqual(changes[0], {
		op: 'upsert',
		doc_type: 'profile',
		doc_id: 'me',
		schema_version: 1,
		client_updated_at: '2026-06-23T18:00:00.000Z',
		etag: changes[0].etag,
		content: { trailName: 'Dad' }
	});
	assert.equal(changes[1].op, 'delete');
	assert.equal('content' in changes[1], false, 'delete changes omit content per the API contract');
});

test('reconcilePush: applied records the server etag and clears the queue', () => {
	const key = docKey('position', 'me');
	const pending: PendingMap = { [key]: makeUpsert('position', 'me', { mile: 1507.2 }, 'T') };
	const etag = pending[key].etag;

	const out = reconcilePush(pending, {}, [{ doc_type: 'position', doc_id: 'me', etag }], []);
	assert.equal(out.pending[key], undefined, 'applied entry is removed from the outbox');
	assert.equal(out.synced[key], etag, 'server etag is remembered so it is not re-sent');
});

test('reconcilePush: a doc re-dirtied mid-flight is kept for the next round', () => {
	const key = docKey('position', 'me');
	// The version we PUSHED…
	const pushedEtag = etagOf({ mile: 1507.2 });
	// …but the outbox now holds a NEWER version (the hiker moved again while the
	// request was in flight), so its etag differs from what came back applied.
	const pending: PendingMap = { [key]: makeUpsert('position', 'me', { mile: 1509.9 }, 'T2') };

	const out = reconcilePush(
		pending,
		{},
		[{ doc_type: 'position', doc_id: 'me', etag: pushedEtag }],
		[]
	);
	assert.ok(out.pending[key], 'the newer pending change survives');
	assert.equal(out.pending[key].etag, pending[key].etag);
	assert.equal(out.synced[key], pushedEtag, 'the pushed version is still recorded as synced');
});

test('reconcilePush: rejected (stale) drops our push and forgets the baseline so restore re-pulls', () => {
	const key = docKey('settings', 'me');
	const pending: PendingMap = { [key]: makeUpsert('settings', 'me', { a: 1 }, 'T') };

	const out = reconcilePush(
		pending,
		{ [key]: 'old-baseline' },
		[],
		[{ doc_type: 'settings', doc_id: 'me', reason: 'stale_client_updated_at', server: { etag: 'srv-9' } }]
	);
	assert.equal(out.pending[key], undefined, 'stale local push is dropped, not retried in a loop');
	// We must NOT pin synced to the server etag without applying its content — that
	// would leave local silently diverged (a later restore would skip-have). Forget
	// the baseline so the engine's re-restore pulls + applies the server copy.
	assert.equal(out.synced[key], undefined, 'baseline forgotten so restore converges local to the server copy');
	assert.deepEqual(out.rejectedKeys, [key]);
});

test('reconcilePush does not mutate its inputs', () => {
	const key = docKey('loadout', 'me');
	const pending: PendingMap = { [key]: makeUpsert('loadout', 'me', { items: [] }, 'T') };
	const synced: SyncedMap = {};
	reconcilePush(pending, synced, [{ doc_type: 'loadout', doc_id: 'me', etag: pending[key].etag }], []);
	assert.ok(pending[key], 'original pending map is untouched (caller swaps in the returned maps)');
	assert.deepEqual(synced, {});
});

// --- restore policy (the data-loss-critical decisions) ----------------------

test('restore: a fresh install adopts the backup even over queued local defaults', () => {
	const key = docKey('profile', 'me');
	// On a fresh/lost-phone install the boot enqueue has already queued DEFAULT
	// state for this doc — restore must still pull the real backup down over it.
	const pending: PendingMap = { [key]: makeUpsert('profile', 'me', { calibrated: false }, 'T') };
	assert.equal(restoreDecision(pending, {}, key, 'remote-etag', true), 'apply');
});

test('restore: skip when we already hold this exact version (even on a fresh install)', () => {
	const key = docKey('settings', 'me');
	assert.equal(restoreDecision({}, { [key]: 'e1' }, key, 'e1', false), 'skip-have');
	assert.equal(restoreDecision({}, { [key]: 'e1' }, key, 'e1', true), 'skip-have');
});

test('restore: a real device with an unsynced local edit keeps local (never clobbered)', () => {
	const key = docKey('position', 'me');
	const pending: PendingMap = { [key]: makeUpsert('position', 'me', { mile: 1600 }, 'T') };
	// Not fresh, and we have an un-pushed local change → local wins; it will push
	// up rather than be overwritten by the (older) cloud copy.
	assert.equal(restoreDecision(pending, { [key]: 'old' }, key, 'cloud', false), 'skip-local');
});

test('restore: a real device adopts a doc another device changed since we synced', () => {
	const key = docKey('documents', 'me');
	// Not fresh, no local pending edit, and the cloud etag differs from our synced
	// baseline → another device changed it; adopt the newer cloud copy.
	assert.equal(restoreDecision({}, { [key]: 'old' }, key, 'newer', false), 'apply');
	// First sight of a doc we've never seen (no baseline, no pending) → adopt.
	assert.equal(restoreDecision({}, {}, key, 'remote', false), 'apply');
});
