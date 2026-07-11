import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const draftSource = readFileSync(
	new URL('./components/PreparedHelpDraft.svelte', import.meta.url),
	'utf8'
);

test('prepared help draft stays visible and supports explicit portable copy', () => {
	assert.match(draftSource, /Prepared help details — not confirmed sent/);
	assert.match(draftSource, /<pre>\{text\}<\/pre>/);
	assert.match(draftSource, /copyHandoffText/);
	assert.match(draftSource, /Copy help details/);
	assert.match(draftSource, /Start new help request/);
	assert.match(draftSource, /onStartNew/);
	assert.match(draftSource, /logs another local need-help check-in/);
	assert.match(draftSource, /if \(copyBusy \|\| !text\) return/);
	assert.doesNotMatch(draftSource, /navigator\.clipboard/);
});
