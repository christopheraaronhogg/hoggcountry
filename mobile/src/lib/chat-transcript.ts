import type { ChatMessage } from './types.ts';

interface ChatMessageOptions {
	id?: string;
	now?: string;
}

interface AppendChatMessageResult {
	messages: ChatMessage[];
	message: ChatMessage;
}

interface AppendAssistantStreamChunkResult {
	messages: ChatMessage[];
	streamingMessageId: string | null;
	started: boolean;
}

function defaultMessageId(): string {
	return crypto.randomUUID();
}

function defaultTimestamp(): string {
	return new Date().toISOString();
}

export function createChatMessage(
	role: ChatMessage['role'],
	content: string,
	options: ChatMessageOptions = {}
): ChatMessage {
	return {
		id: options.id ?? defaultMessageId(),
		role,
		content,
		timestamp: options.now ?? defaultTimestamp()
	};
}

export function appendChatMessage(
	messages: ChatMessage[],
	role: ChatMessage['role'],
	content: string,
	options: ChatMessageOptions = {}
): AppendChatMessageResult {
	const message = createChatMessage(role, content, options);
	return {
		messages: [...messages, message],
		message
	};
}

export function setChatMessageContent(
	messages: ChatMessage[],
	messageId: string,
	content: string
): ChatMessage[] {
	return messages.map((message) =>
		message.id === messageId ? { ...message, content } : message
	);
}

export function appendAssistantStreamChunk(
	messages: ChatMessage[],
	streamingMessageId: string | null,
	chunk: string
): AppendAssistantStreamChunkResult {
	if (!chunk) {
		return { messages, streamingMessageId, started: false };
	}

	if (streamingMessageId === null) {
		const result = appendChatMessage(messages, 'assistant', chunk);
		return {
			messages: result.messages,
			streamingMessageId: result.message.id,
			started: true
		};
	}

	return {
		messages: messages.map((message) =>
			message.id === streamingMessageId
				? { ...message, content: message.content + chunk }
				: message
		),
		streamingMessageId,
		started: false
	};
}

export function actionRecordedChatText(actionTitle: string): string {
	return `Done — ${actionTitle.toLowerCase()} recorded. ✓`;
}

export function actionCancelledChatText(): string {
	return `No problem — I didn't record anything.`;
}
