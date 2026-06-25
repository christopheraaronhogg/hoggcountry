export const SCOUT_AUTH_WALL_MESSAGE =
	"Sign in to use Scout in the web app — Scout's cloud answers are for invited accounts only.";

export interface PendingScoutAuthPrompt {
	prompt: string;
	userMessageId: string;
	blockedMessageId: string;
	requestedAt: string;
}

export function createPendingScoutAuthPrompt(input: {
	prompt: string;
	userMessageId: string;
	blockedMessageId: string;
	now?: Date;
}): PendingScoutAuthPrompt {
	return {
		prompt: input.prompt,
		userMessageId: input.userMessageId,
		blockedMessageId: input.blockedMessageId,
		requestedAt: (input.now ?? new Date()).toISOString()
	};
}

export function isScoutAuthResumeMessage(
	messageId: string,
	pending: PendingScoutAuthPrompt | null
): boolean {
	return pending?.blockedMessageId === messageId;
}
