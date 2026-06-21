import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneDefaultContextPack } from './default-pack.ts';
import { mergeOfflineSourceDocs } from './offline-source-docs.ts';

test('mergeOfflineSourceDocs adds bundled docs without duplicating existing excerpts', () => {
	const pack = cloneDefaultContextPack();
	const originalCount = pack.guideExcerpts.length;
	const docs = [
		{
			id: 'offline:water',
			title: 'Water policy',
			body: 'Mapped water candidates are not promises.',
			tags: ['water'],
			citation: 'Offline source docs'
		},
		pack.guideExcerpts[0]
	];

	const first = mergeOfflineSourceDocs(pack, docs);
	assert.equal(first.changed, true);
	assert.equal(first.pack.guideExcerpts.length, originalCount + 1);
	assert.ok(first.pack.guideExcerpts.some((doc) => doc.id === 'offline:water'));

	const second = mergeOfflineSourceDocs(first.pack, docs);
	assert.equal(second.changed, false);
	assert.equal(second.pack.guideExcerpts.length, originalCount + 1);
});
