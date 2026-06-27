import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBibleIndex, expandQueryToConceptGroups, tokenize, type KjvData } from './bible-index.ts';

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

test('shipped KJV search finds Acts 16 for salvation wording', async () => {
	const data = JSON.parse(await readFile(new URL('../../../static/bible/kjv.json', import.meta.url), 'utf8')) as KjvData;
	const index = buildBibleIndex(data);
	const hits = index.search('what must i do to be saved', 5);

	assert.ok(hits.length >= 1);
	assert.equal(hits[0].reference, 'Acts 16:30');
	assert.match(hits[0].text, /what must I do to be saved/i);
	assert.equal(hits[1]?.reference, 'Acts 16:31');
	assert.match(hits[1]?.text ?? '', /Believe on the Lord Jesus Christ/i);
});

test('expandQueryToConceptGroups drops framing words and expands to KJV vocabulary', () => {
	const groups = expandQueryToConceptGroups('what does the bible say about testing');
	// "what/does/the/about" are base stopwords; "bible"/"say" are query-framing.
	assert.equal(groups.length, 1, 'only the "testing" concept survives');
	const [testing] = groups;
	assert.ok(testing.includes('testing'), 'keeps the literal token');
	assert.ok(testing.includes('tempt'), 'reaches the KJV word "tempt"');
	assert.ok(testing.includes('trial'), 'reaches the KJV word "trial"');
});

test('all-framing query yields no concept groups', () => {
	assert.deepEqual(expandQueryToConceptGroups('what does the bible say'), []);
});

test('shipped KJV "testing" question lands on temptation/trial verses, not "say"', async () => {
	const data = JSON.parse(await readFile(new URL('../../../static/bible/kjv.json', import.meta.url), 'utf8')) as KjvData;
	const index = buildBibleIndex(data);
	const hits = index.search('what does the bible say about testing', 5);

	assert.ok(hits.length >= 3, 'returns several candidates');
	assert.ok(
		hits.some((hit) => /tempt|trial|trying|tried|prove/i.test(hit.text)),
		'results are about testing/trial, not generic "say" verses'
	);
});

test('shipped KJV fear search prefers comfort verses for a scared hiker', async () => {
	const data = JSON.parse(await readFile(new URL('../../../static/bible/kjv.json', import.meta.url), 'utf8')) as KjvData;
	const index = buildBibleIndex(data);
	const hits = index.search('I am scared and alone tonight. Give me scripture and practical next steps.', 5);
	const references = hits.map((hit) => hit.reference);

	assert.deepEqual(references.slice(0, 4), ['Psalms 56:3', 'Isaiah 41:10', '2 Timothy 1:7', 'Psalms 23:4']);
	assert.ok(!references.includes('2 Kings 6:29'), 'does not surface disturbing lexical matches for comfort queries');
	assert.match(hits[0]?.text ?? '', /afraid.*trust/i);
});

test('shipped KJV fear question returns direct fear comfort references', async () => {
	const data = JSON.parse(await readFile(new URL('../../../static/bible/kjv.json', import.meta.url), 'utf8')) as KjvData;
	const index = buildBibleIndex(data);
	const hits = index.search('What does the Bible say about fear while I am out here?', 4);

	assert.deepEqual(hits.map((hit) => hit.reference), ['Psalms 56:3', 'Isaiah 41:10', '2 Timothy 1:7', 'Psalms 23:4']);
});

test('shipped KJV search treats exact references as exact references', async () => {
	const data = JSON.parse(await readFile(new URL('../../../static/bible/kjv.json', import.meta.url), 'utf8')) as KjvData;
	const index = buildBibleIndex(data);

	const john316 = index.search('John 3:16', 25);
	assert.deepEqual(john316.map((hit) => hit.reference), ['John 3:16']);
	assert.match(john316[0]?.text ?? '', /For God so loved the world/i);

	const shortJohn316 = index.search('Jn 3:16', 25);
	assert.deepEqual(shortJohn316.map((hit) => hit.reference), ['John 3:16']);

	const firstJohn = index.search('1 John 4:8', 25);
	assert.deepEqual(firstJohn.map((hit) => hit.reference), ['1 John 4:8']);

	const range = index.search('John 3:16-17', 25);
	assert.deepEqual(range.map((hit) => hit.reference), ['John 3:16', 'John 3:17']);
});
