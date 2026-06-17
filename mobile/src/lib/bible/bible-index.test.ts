import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBibleIndex, tokenize, type KjvData } from './bible-index.ts';

// Tiny fixture mirroring the real kjv.json shape so the index logic is tested
// without loading the 19MB asset.
const fixture: KjvData = {
	books: [
		{
			number: 1,
			abbreviation: 'Gen',
			name: 'Genesis',
			chapters: [
				{
					number: 1,
					reference: 'Genesis 1',
					verses: [
						{
							id: 'Genesis.1.1',
							reference: 'Genesis 1:1',
							number: 1,
							text: 'In the beginning God created the heaven and the earth.',
							readingText: 'In the beginning God created the heaven and the earth.',
							searchText: 'in the beginning god created the heaven and the earth'
						}
					]
				}
			]
		},
		{
			number: 19,
			abbreviation: 'Psa',
			name: 'Psalms',
			chapters: [
				{
					number: 23,
					reference: 'Psalms 23',
					verses: [
						{
							id: 'Psalms.23.4',
							reference: 'Psalms 23:4',
							number: 4,
							text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.',
							readingText: 'Yea, though I walk through the valley of the shadow of death...',
							searchText: 'yea though i walk through the valley of the shadow of death i will fear no evil for thou art with me'
						}
					]
				}
			]
		}
	]
};

test('tokenize drops stopwords and short tokens, keeps meaningful faith words', () => {
	const tokens = tokenize('What does the Bible say about fear and God?');
	assert.ok(tokens.includes('fear'));
	assert.ok(tokens.includes('god'));
	assert.ok(tokens.includes('bible'));
	assert.ok(!tokens.includes('the'));
	assert.ok(!tokens.includes('and'));
});

test('search returns the most relevant verse with a real reference', () => {
	const index = buildBibleIndex(fixture);
	const hits = index.search('fear and the valley of death', 5);
	assert.ok(hits.length >= 1);
	assert.equal(hits[0].reference, 'Psalms 23:4');
	assert.equal(hits[0].bookName, 'Psalms');
	assert.ok(hits[0].text.includes('fear no evil'));
});

test('search ranks higher distinct-token coverage first', () => {
	const index = buildBibleIndex(fixture);
	const hits = index.search('beginning god created heaven earth', 5);
	assert.equal(hits[0].reference, 'Genesis 1:1');
});

test('search returns [] for an empty / all-stopword query', () => {
	const index = buildBibleIndex(fixture);
	assert.deepEqual(index.search(''), []);
	assert.deepEqual(index.search('the and of'), []);
});

test('getChapter returns verses for a known book + chapter', () => {
	const index = buildBibleIndex(fixture);
	const chapter = index.getChapter('Psalms', 23);
	assert.ok(chapter);
	assert.equal(chapter?.verses[0].reference, 'Psalms 23:4');
	assert.equal(index.getChapter('Nowhere', 1), undefined);
});
