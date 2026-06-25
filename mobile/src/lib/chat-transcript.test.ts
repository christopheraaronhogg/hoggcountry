import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	actionCancelledChatText,
	actionRecordedChatText,
	appendAssistantStreamChunk,
	appendChatMessage,
	buildScoutConversationHistory,
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

test('buildScoutConversationHistory excludes the current prompt and keeps recent context', () => {
	const messages = [
		createChatMessage('assistant', 'Welcome', {
			id: 'seed',
			now: '2026-06-20T11:00:00.000Z'
		}),
		createChatMessage('user', 'testing 123', {
			id: 'previous-user',
			now: '2026-06-20T11:01:00.000Z'
		}),
		createChatMessage('assistant', 'I am here.', {
			id: 'previous-assistant',
			now: '2026-06-20T11:02:00.000Z'
		}),
		createChatMessage('user', 'what was my last question?', {
			id: 'current-user',
			now: '2026-06-20T11:03:00.000Z'
		})
	];

	const history = buildScoutConversationHistory(messages, {
		excludeMessageId: 'current-user'
	});

	assert.deepEqual(history.map((message) => message.content), [
		'Welcome',
		'testing 123',
		'I am here.'
	]);
	assert.equal(history.at(-1)?.role, 'assistant');
});

test('buildScoutConversationHistory bounds messages', () => {
	const messages = [
		createChatMessage('user', 'old one', { id: 'old', now: '2026-06-20T11:00:00.000Z' }),
		createChatMessage('user', 'middle two', { id: 'middle', now: '2026-06-20T11:01:00.000Z' }),
		createChatMessage('user', 'newest three words', { id: 'newest', now: '2026-06-20T11:02:00.000Z' })
	];

	const history = buildScoutConversationHistory(messages, {
		maxMessages: 2,
		maxChars: 100
	});

	assert.deepEqual(history.map((message) => message.content), ['middle two', 'newest three words']);
});

test('buildScoutConversationHistory clips long recent text', () => {
	const messages = [
		createChatMessage('user', 'newest three words', {
			id: 'newest',
			now: '2026-06-20T11:02:00.000Z'
		})
	];

	const history = buildScoutConversationHistory(messages, {
		maxMessages: 1,
		maxChars: 9
	});

	assert.equal(history[0]?.content, 'newest...');
});
