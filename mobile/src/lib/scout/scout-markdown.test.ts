import test from 'node:test';
import assert from 'node:assert/strict';

import { parseScoutMarkdown, scoutMarkdownToPlainText } from './scout-markdown.ts';

test('parseScoutMarkdown renders a safe small Markdown subset', () => {
	const blocks = parseScoutMarkdown(`# Salvation\n\n**Believe** on the Lord.\n\n1. Acts 16:31\n2. Romans 10:13\n\n> A simple prayer can express faith.`);

	assert.equal(blocks[0]?.kind, 'heading');
	assert.equal(blocks[1]?.kind, 'paragraph');
	assert.deepEqual(blocks[1]?.segments, [
		{ kind: 'strong', text: 'Believe' },
		{ kind: 'text', text: ' on the Lord.' }
	]);
	assert.equal(blocks[2]?.kind, 'ordered-list');
	assert.equal(blocks[3]?.kind, 'quote');
});

test('scoutMarkdownToPlainText strips formatting markers for speech', () => {
	const text = scoutMarkdownToPlainText(`## Key verses\n\n- **Acts 16:31** says believe.\n- Romans 10:13 says call.`);

	assert.equal(text, 'Key verses\n\n- Acts 16:31 says believe.\n- Romans 10:13 says call.');
});
