export interface ScrollMetrics {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
}

export const CHAT_FOLLOW_THRESHOLD = 56;
export const CHAT_TURN_CONTEXT_MIN = 56;
export const CHAT_TURN_CONTEXT_MAX = 128;
export const CHAT_TURN_CONTEXT_RATIO = 0.18;
export const CHAT_LIVE_EDGE_INSET = 18;
export const CHAT_TURN_BOTTOM_ROOM = 24;

export function distanceFromBottom(metrics: ScrollMetrics): number {
	return Math.max(0, metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight);
}

export function isAtLiveEdge(
	metrics: ScrollMetrics,
	threshold = CHAT_FOLLOW_THRESHOLD
): boolean {
	return distanceFromBottom(metrics) <= threshold;
}

export function readingContextOffset(clientHeight: number): number {
	if (!Number.isFinite(clientHeight) || clientHeight <= 0) return CHAT_TURN_CONTEXT_MIN;
	return Math.min(
		CHAT_TURN_CONTEXT_MAX,
		Math.max(CHAT_TURN_CONTEXT_MIN, Math.round(clientHeight * CHAT_TURN_CONTEXT_RATIO))
	);
}

export function turnStartScrollTop(messageOffsetTop: number, clientHeight: number): number {
	return Math.max(0, Math.round(messageOffsetTop - readingContextOffset(clientHeight)));
}

export function turnSpacerHeight(clientHeight: number, messageHeight: number): number {
	if (!Number.isFinite(clientHeight) || clientHeight <= 0) return 0;
	const available = clientHeight - readingContextOffset(clientHeight) - messageHeight - CHAT_TURN_BOTTOM_ROOM;
	return Math.max(0, Math.round(available));
}

export function liveEdgeScrollTop(
	liveEdgeOffsetTop: number,
	clientHeight: number,
	inset = CHAT_LIVE_EDGE_INSET
): number {
	return Math.max(0, Math.round(liveEdgeOffsetTop - clientHeight + inset));
}
