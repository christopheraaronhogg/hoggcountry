import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	SCOUT_AUTH_WALL_MESSAGE,
	createPendingScoutAuthPrompt,
	isScoutAuthResumeMessage
} from './scout-auth-resume.ts';

test('createPendingScoutAuthPrompt preserves the original prompt and message ids', () => {
	const pending = createPendingScoutAuthPrompt({
		prompt: 'What is my next reliable water source?',
		userMessageId: 'user-1',
		blockedMessageId: 'assistant-1',
		now: new Date('2026-06-25T12:00:00.000Z')
	});

	assert.equal(pending.prompt, 'What is my next reliable water source?');
	assert.equal(pending.userMessageId, 'user-1');
	assert.equal(pending.blockedMessageId, 'assistant-1');
	assert.equal(pending.requestedAt, '2026-06-25T12:00:00.000Z');
});

test('isScoutAuthResumeMessage only marks the blocked auth-wall response', () => {
	const pending = createPendingScoutAuthPrompt({
		prompt: 'test',
		userMessageId: 'user-1',
		blockedMessageId: 'assistant-1',
		now: new Date('2026-06-25T12:00:00.000Z')
	});

	assert.equal(isScoutAuthResumeMessage('assistant-1', pending), true);
	assert.equal(isScoutAuthResumeMessage('assistant-2', pending), false);
	assert.equal(isScoutAuthResumeMessage('assistant-1', null), false);
});

test('Scout auth wall message stays centralized for chat and tests', () => {
	assert.match(SCOUT_AUTH_WALL_MESSAGE, /Sign in to use Scout/);
	assert.match(SCOUT_AUTH_WALL_MESSAGE, /invited accounts only/);
});
