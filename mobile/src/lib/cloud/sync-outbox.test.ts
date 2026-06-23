import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	docKey,
	etagOf,
	makeDelete,
	makeUpsert,
	reconcilePush,
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

test('reconcilePush: rejected (stale) drops our push and adopts the server copy', () => {
	const key = docKey('settings', 'me');
	const pending: PendingMap = { [key]: makeUpsert('settings', 'me', { a: 1 }, 'T') };

	const out = reconcilePush(
		pending,
		{},
		[],
		[{ doc_type: 'settings', doc_id: 'me', reason: 'stale_client_updated_at', server: { etag: 'srv-9' } }]
	);
	assert.equal(out.pending[key], undefined, 'stale local push is dropped, not retried in a loop');
	assert.equal(out.synced[key], 'srv-9', 'the newer server etag wins');
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
