import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBibleIndex, type KjvData } from './bible-index.ts';
import { enforceScriptureCitations } from './scripture-citations.ts';

const JOHN_316 =
	'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.';
const JOHN_317 =
	'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.';

const fixture: KjvData = {
	books: [
		{
			number: 43,
			abbreviation: 'John',
			name: 'John',
			chapters: [
				{
					number: 3,
					reference: 'John 3',
					verses: [
						{ id: 'John.3.16', reference: 'John 3:16', number: 16, text: JOHN_316, readingText: JOHN_316, searchText: JOHN_316.toLowerCase() },
						{ id: 'John.3.17', reference: 'John 3:17', number: 17, text: JOHN_317, readingText: JOHN_317, searchText: JOHN_317.toLowerCase() }
					]
				}
			]
		}
	]
};

const index = buildBibleIndex(fixture);

test('rewrites a misquoted verse to exact PCE text', () => {
	const input = 'There is real hope here. John 3:16 — "For God so loved the world that he gave his one and only Son" and that is the heart of it.';
	const result = enforceScriptureCitations(input, index);
	assert.ok(result.text.includes(JOHN_316), 'quote replaced with exact PCE wording');
	assert.ok(!result.text.includes('one and only Son'), 'the model paraphrase is gone');
	assert.equal(result.corrections, 1);
	assert.deepEqual(result.references, ['John 3:16']);
	assert.deepEqual(result.invalidReferences, []);
});

test('leaves an already-exact quote unchanged, no correction counted', () => {
	const input = `As it says, John 3:16 — "${JOHN_316}"`;
	const result = enforceScriptureCitations(input, index);
	assert.equal(result.corrections, 0);
	assert.ok(result.text.includes(JOHN_316));
	assert.deepEqual(result.references, ['John 3:16']);
});

test('expands and re-sources a verse range from PCE', () => {
	const input = 'John 3:16-17 — "wrong text here"';
	const result = enforceScriptureCitations(input, index);
	assert.ok(result.text.includes(JOHN_316));
	assert.ok(result.text.includes(JOHN_317));
	assert.equal(result.corrections, 1);
	assert.deepEqual(result.references, ['John 3:16–17']);
});

test('flags an invented reference instead of trusting it', () => {
	const input = 'Some claim John 3:99 — "a verse that does not exist" but it is not scripture.';
	const result = enforceScriptureCitations(input, index);
	assert.deepEqual(result.invalidReferences, ['John 3:99']);
	assert.deepEqual(result.references, []);
	assert.equal(result.corrections, 0);
	assert.ok(result.text.includes('a verse that does not exist'), 'unverifiable text is left as-is, but reported');
});

test('records reference-only citations without touching the prose', () => {
	const input = 'The promise of John 3:16 anchors the whole chapter.';
	const result = enforceScriptureCitations(input, index);
	assert.equal(result.text, input);
	assert.equal(result.corrections, 0);
	assert.deepEqual(result.references, ['John 3:16']);
});

test('empty answer is a no-op', () => {
	const result = enforceScriptureCitations('', index);
	assert.deepEqual(result, { text: '', references: [], invalidReferences: [], corrections: 0 });
});
