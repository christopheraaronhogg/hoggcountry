import type { ChatMessage } from './types.ts';
import type { ScoutConversationMessage } from './scout/types.ts';

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

interface BuildScoutConversationHistoryOptions {
	excludeMessageId?: string;
	maxMessages?: number;
	maxChars?: number;
}

const DEFAULT_SCOUT_CONTEXT_MESSAGES = 12;
const DEFAULT_SCOUT_CONTEXT_CHARS = 6000;

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

export function buildScoutConversationHistory(
	messages: ChatMessage[],
	options: BuildScoutConversationHistoryOptions = {}
): ScoutConversationMessage[] {
	const maxMessages = Math.max(0, options.maxMessages ?? DEFAULT_SCOUT_CONTEXT_MESSAGES);
	const maxChars = Math.max(0, options.maxChars ?? DEFAULT_SCOUT_CONTEXT_CHARS);
	if (maxMessages === 0 || maxChars === 0) return [];

	const candidates = messages
		.filter((message) => message.id !== options.excludeMessageId)
		.map((message): ScoutConversationMessage | null => {
			const content = normalizeConversationContent(message.content);
			if (!content) return null;
			return {
				role: message.role,
				content,
				timestamp: message.timestamp
			};
		})
		.filter((message): message is ScoutConversationMessage => message !== null)
		.slice(-maxMessages);

	const selected: ScoutConversationMessage[] = [];
	let remainingChars = maxChars;
	for (let index = candidates.length - 1; index >= 0; index -= 1) {
		if (remainingChars <= 0) break;
		const candidate = candidates[index];
		const content = clipToCharLimit(candidate.content, remainingChars);
		if (!content) continue;
		selected.unshift({ ...candidate, content });
		remainingChars -= content.length;
	}

	return selected;
}

export function actionRecordedChatText(actionTitle: string): string {
	return `Done — ${actionTitle.toLowerCase()} recorded. ✓`;
}

export function actionCancelledChatText(): string {
	return `No problem — I didn't record anything.`;
}

function normalizeConversationContent(content: string): string {
	return content.replace(/\s+/gu, ' ').trim();
}

function clipToCharLimit(content: string, maxChars: number): string {
	if (content.length <= maxChars) return content;
	if (maxChars <= 3) return content.slice(0, maxChars);
	return `${content.slice(0, maxChars - 3).trimEnd()}...`;
}
