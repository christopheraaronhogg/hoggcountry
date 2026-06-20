import assert from 'node:assert/strict';
import test from 'node:test';

import {
	MAX_LOCAL_DOCUMENT_BODY_CHARS,
	MAX_LOCAL_DOCUMENTS,
	clampDocumentBody,
	createTrailDocument,
	limitTrailDocuments,
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
		updatedAt: NOW
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
		updatedAt: NOW
	});
});

test('createTrailDocument uses a fallback title and clamps oversized bodies', () => {
	const oversized = ` ${'x'.repeat(MAX_LOCAL_DOCUMENT_BODY_CHARS + 20)} `;
	const created = createTrailDocument({ title: '   ', body: oversized }, { id: 'doc-long', now: NOW });

	assert.equal(created?.title, 'Untitled field note');
	assert.equal(created?.body.length, MAX_LOCAL_DOCUMENT_BODY_CHARS);
	assert.equal(clampDocumentBody(oversized).length, MAX_LOCAL_DOCUMENT_BODY_CHARS);
});

test('updateTrailDocument preserves identity and only changes editable fields', () => {
	const original = doc('doc-update');
	const updated = updateTrailDocument(original, { title: '  New   title ', body: ' Updated body ' }, '2026-06-21T00:00:00.000Z');

	assert.equal(updated.id, original.id);
	assert.equal(updated.createdAt, original.createdAt);
	assert.equal(updated.title, 'New title');
	assert.equal(updated.body, 'Updated body');
	assert.equal(updated.updatedAt, '2026-06-21T00:00:00.000Z');
});

test('limitTrailDocuments enforces the local document cap without reordering', () => {
	const documents = Array.from({ length: MAX_LOCAL_DOCUMENTS + 2 }, (_, index) => doc(`doc-${index}`));
	const limited = limitTrailDocuments(documents);

	assert.equal(limited.length, MAX_LOCAL_DOCUMENTS);
	assert.equal(limited[0].id, 'doc-0');
	assert.equal(limited.at(-1)?.id, `doc-${MAX_LOCAL_DOCUMENTS - 1}`);
});

test('toContextDocuments exposes saved docs as Scout context references', () => {
	const documents = [doc('doc-context')];
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
