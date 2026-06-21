import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cloneDefaultContextPack } from './default-pack.ts';
import { mergeOfflineSourceDocs } from './offline-source-docs.ts';
import type { FieldGuideExcerpt } from './types.ts';

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

test("offline source bundle includes Dad's full field guide sections", () => {
	const payload = JSON.parse(
		readFileSync(new URL('../../../static/scout/offline-source-docs.json', import.meta.url), 'utf8')
	) as { documents: FieldGuideExcerpt[] };
	const fieldGuideDocs = payload.documents.filter((document) => document.id.startsWith('field-guide:'));
	const guideWordCount = fieldGuideDocs.reduce(
		(sum, document) => sum + document.body.trim().split(/\s+/).filter(Boolean).length,
		0
	);

	assert.ok(fieldGuideDocs.length >= 20);
	assert.ok(guideWordCount >= 20_000);
	assert.deepEqual(
		fieldGuideDocs.slice(0, 3).map((document) => document.id),
		[
			'field-guide:00-introduction',
			'field-guide:01-hiker-profile-and-experience',
			'field-guide:02-trail-sections-and-milestones'
		]
	);
	assert.ok(fieldGuideDocs.some((document) => /Gear System/i.test(document.title)));
	assert.ok(fieldGuideDocs.some((document) => /Water Treatment/i.test(document.title)));
	assert.ok(fieldGuideDocs.some((document) => /Safety.*Emergency/i.test(document.title)));
});
