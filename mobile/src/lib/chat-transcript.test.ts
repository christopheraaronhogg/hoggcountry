import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	actionCancelledChatText,
	actionRecordedChatText,
	appendAssistantStreamChunk,
	appendChatMessage,
	createChatMessage,
	setChatMessageContent
} from './chat-transcript.ts';

test('createChatMessage uses deterministic test inputs when provided', () => {
	const message = createChatMessage('user', 'Mile 42', {
		id: 'msg-1',
		now: '2026-06-20T12:00:00.000Z'
	});

	assert.deepEqual(message, {
		id: 'msg-1',
		role: 'user',
		content: 'Mile 42',
		timestamp: '2026-06-20T12:00:00.000Z'
	});
});

test('appendChatMessage appends immutably and returns the new message', () => {
	const original = [
		createChatMessage('assistant', 'Hi', {
			id: 'existing',
			now: '2026-06-20T12:00:00.000Z'
		})
	];

	const result = appendChatMessage(original, 'user', 'Where is water?', {
		id: 'user-1',
		now: '2026-06-20T12:01:00.000Z'
	});

	assert.equal(original.length, 1);
	assert.equal(result.messages.length, 2);
	assert.equal(result.message.id, 'user-1');
	assert.equal(result.messages[1], result.message);
});

test('appendAssistantStreamChunk creates one bubble then appends chunks to it', () => {
	const first = appendAssistantStreamChunk([], null, 'The next ');

	assert.equal(first.started, true);
	assert.equal(first.streamingMessageId, first.messages[0]?.id);
	assert.equal(first.messages[0]?.content, 'The next ');

	const second = appendAssistantStreamChunk(first.messages, first.streamingMessageId, 'water is 0.4 mi.');

	assert.equal(second.started, false);
	assert.equal(second.streamingMessageId, first.streamingMessageId);
	assert.equal(second.messages.length, 1);
	assert.equal(second.messages[0]?.content, 'The next water is 0.4 mi.');
});

test('appendAssistantStreamChunk ignores empty chunks without changing identity', () => {
	const messages = [
		createChatMessage('assistant', 'Existing', {
			id: 'existing',
			now: '2026-06-20T12:00:00.000Z'
		})
	];

	const result = appendAssistantStreamChunk(messages, 'existing', '');

	assert.equal(result.messages, messages);
	assert.equal(result.streamingMessageId, 'existing');
	assert.equal(result.started, false);
});

test('setChatMessageContent replaces only the targeted message', () => {
	const messages = [
		createChatMessage('assistant', 'draft', {
			id: 'answer',
			now: '2026-06-20T12:00:00.000Z'
		}),
		createChatMessage('user', 'keep me', {
			id: 'user',
			now: '2026-06-20T12:01:00.000Z'
		})
	];

	const updated = setChatMessageContent(messages, 'answer', 'final');

	assert.equal(updated[0]?.content, 'final');
	assert.equal(updated[1]?.content, 'keep me');
	assert.equal(messages[0]?.content, 'draft');
});

test('action status text stays centralized and plain', () => {
	assert.equal(actionRecordedChatText('Check-in'), 'Done — check-in recorded. ✓');
	assert.equal(actionCancelledChatText(), `No problem — I didn't record anything.`);
});
