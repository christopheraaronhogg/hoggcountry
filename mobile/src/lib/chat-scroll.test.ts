import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	distanceFromBottom,
	isAtLiveEdge,
	liveEdgeScrollTop,
	readingContextOffset,
	turnSpacerHeight,
	turnStartScrollTop
} from './chat-scroll.ts';

test('distanceFromBottom never returns negative overscroll distance', () => {
	assert.equal(distanceFromBottom({ scrollTop: 620, scrollHeight: 1000, clientHeight: 420 }), 0);
	assert.equal(distanceFromBottom({ scrollTop: 500, scrollHeight: 1000, clientHeight: 420 }), 80);
});

test('isAtLiveEdge allows small scroll slack but not a reader who moved away', () => {
	assert.equal(isAtLiveEdge({ scrollTop: 524, scrollHeight: 1000, clientHeight: 420 }), true);
	assert.equal(isAtLiveEdge({ scrollTop: 500, scrollHeight: 1000, clientHeight: 420 }), false);
});

test('readingContextOffset keeps previous conversation visible within bounded room', () => {
	assert.equal(readingContextOffset(240), 56);
	assert.equal(readingContextOffset(600), 108);
	assert.equal(readingContextOffset(1200), 128);
});

test('turnStartScrollTop places a new user turn below prior context', () => {
	assert.equal(turnStartScrollTop(900, 600), 792);
	assert.equal(turnStartScrollTop(40, 600), 0);
});

test('turnSpacerHeight leaves room for a reply to grow into the viewport', () => {
	assert.equal(turnSpacerHeight(600, 72), 396);
	assert.equal(turnSpacerHeight(180, 120), 0);
});

test('liveEdgeScrollTop targets the content edge, not trailing spacer', () => {
	assert.equal(liveEdgeScrollTop(1200, 600), 618);
	assert.equal(liveEdgeScrollTop(100, 600), 0);
});
