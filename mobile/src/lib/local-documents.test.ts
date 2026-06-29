import assert from 'node:assert/strict';
import test from 'node:test';

import {
	MAX_LOCAL_DOCUMENT_BODY_CHARS,
	MAX_LOCAL_DOCUMENTS,
	clampDocumentBody,
	createTrailDocument,
	deleteTrailDocument,
	limitTrailDocuments,
	normalizeTrailDocuments,
	restoreTrailDocument,
	toContextDocuments,
	updateTrailDocument
} from './local-documents.ts';
import type { TrailDocument } from './types.ts';

const NOW = '2026-06-20T12:00:00.000Z';

function doc(id: string): TrailDocument {
	return {
		id,
		title: `Doc ${id}`,
		body: `Body ${id}`,
		source: 'manual',
		createdAt: NOW,
		updatedAt: NOW,
		revision: 1,
		revisions: []
	};
}

test('createTrailDocument normalizes title/body and rejects blank bodies', () => {
	assert.equal(createTrailDocument({ title: 'Blank', body: '   ' }, { id: 'doc-blank', now: NOW }), null);

	const created = createTrailDocument(
		{ title: '  Foot   care  ', body: '\nTrim the tape.  ', source: 'scout-draft' },
		{ id: 'doc-foot-care', now: NOW }
	);

	assert.deepEqual(created, {
		id: 'doc-foot-care',
		title: 'Foot care',
		body: 'Trim the tape.',
		source: 'scout-draft',
		createdAt: NOW,
		updatedAt: NOW,
		revision: 1,
		revisions: []
	});
});

test('createTrailDocument uses a fallback title and clamps oversized bodies', () => {
	const oversized = ` ${'x'.repeat(MAX_LOCAL_DOCUMENT_BODY_CHARS + 20)} `;
	const created = createTrailDocument({ title: '   ', body: oversized }, { id: 'doc-long', now: NOW });

	assert.equal(created?.title, 'Untitled field note');
	assert.equal(created?.body.length, MAX_LOCAL_DOCUMENT_BODY_CHARS);
	assert.equal(clampDocumentBody(oversized).length, MAX_LOCAL_DOCUMENT_BODY_CHARS);
});

test('updateTrailDocument preserves identity and records a recoverable revision', () => {
	const original = doc('doc-update');
	const updated = updateTrailDocument(original, { title: '  New   title ', body: ' Updated body ' }, '2026-06-21T00:00:00.000Z');

	assert.equal(updated.id, original.id);
	assert.equal(updated.createdAt, original.createdAt);
	assert.equal(updated.title, 'New title');
	assert.equal(updated.body, 'Updated body');
	assert.equal(updated.updatedAt, '2026-06-21T00:00:00.000Z');
	assert.equal(updated.revision, 2);
	assert.deepEqual(updated.revisions, [
		{
			revision: 1,
			title: original.title,
			body: original.body,
			source: original.source,
			updatedAt: original.updatedAt
		}
	]);
});

test('deleteTrailDocument creates a tombstone and restoreTrailDocument clears it', () => {
	const original = doc('doc-delete');
	const deleted = deleteTrailDocument(original, '2026-06-21T00:00:00.000Z');

	assert.equal(deleted.deletedAt, '2026-06-21T00:00:00.000Z');
	assert.equal(deleted.revision, 2);
	assert.equal(deleted.revisions.length, 1);

	const restored = restoreTrailDocument(deleted, '2026-06-22T00:00:00.000Z');
	assert.equal(restored.deletedAt, undefined);
	assert.equal(restored.revision, 3);
	assert.equal(restored.revisions.length, 2);
});

test('limitTrailDocuments enforces the local document cap without reordering', () => {
	const documents = Array.from({ length: MAX_LOCAL_DOCUMENTS + 2 }, (_, index) => doc(`doc-${index}`));
	const limited = limitTrailDocuments(documents);

	assert.equal(limited.length, MAX_LOCAL_DOCUMENTS);
	assert.equal(limited[0].id, 'doc-0');
	assert.equal(limited.at(-1)?.id, `doc-${MAX_LOCAL_DOCUMENTS - 1}`);
});

test('toContextDocuments exposes active saved docs and skips deleted tombstones', () => {
	const documents = [doc('doc-context'), deleteTrailDocument(doc('doc-deleted'))];
	const contextDocs = toContextDocuments(documents);

	assert.deepEqual(contextDocs, [
		{
			id: 'doc-context',
			title: 'Doc doc-context',
			body: 'Body doc-context',
			source: 'manual',
			createdAt: NOW,
			updatedAt: NOW
		}
	]);
});

test('normalizeTrailDocuments migrates legacy documents into versioned records', () => {
	const [normalized] = normalizeTrailDocuments([
		{
			id: 'legacy',
			title: 'Legacy',
			body: 'Old body',
			source: 'manual',
			createdAt: NOW,
			updatedAt: NOW
		} as TrailDocument
	]);

	assert.equal(normalized?.revision, 1);
	assert.deepEqual(normalized?.revisions, []);
});
