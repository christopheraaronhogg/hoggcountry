import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatAge, formatTimeUntil, millisecondsUntilNextMinute } from './freshness.ts';

const NOW = Date.parse('2026-07-11T12:00:00.000Z');

test('formatAge gives compact, deterministic freshness labels', () => {
	assert.equal(formatAge('2026-07-11T11:59:45.000Z', NOW), 'just now');
	assert.equal(formatAge('2026-07-11T11:59:00.000Z', NOW), '1m ago');
	assert.equal(formatAge('2026-07-11T11:01:00.000Z', NOW), '59m ago');
	assert.equal(formatAge('2026-07-11T10:00:00.000Z', NOW), '2h ago');
	assert.equal(formatAge('2026-07-09T12:00:00.000Z', NOW), '2d ago');
});

test('formatAge handles missing, invalid, and future timestamps honestly', () => {
	assert.equal(formatAge(null, NOW), 'Unknown');
	assert.equal(formatAge(null, NOW, 'Bundled'), 'Bundled');
	assert.equal(formatAge('not-a-date', NOW), 'Unknown');
	assert.equal(formatAge('2026-07-11T12:05:00.000Z', NOW), 'just now');
});

test('formatTimeUntil updates check-in countdown language at minute boundaries', () => {
	assert.equal(formatTimeUntil('2026-07-11T12:00:29.000Z', NOW), 'due now');
	assert.equal(formatTimeUntil('2026-07-11T12:01:00.000Z', NOW), 'in 1m');
	assert.equal(formatTimeUntil('2026-07-11T13:30:00.000Z', NOW), 'in 1h 30m');
	assert.equal(formatTimeUntil('2026-07-11T12:00:00.000Z', NOW), 'overdue');
	assert.equal(formatTimeUntil('not-a-date', NOW), 'time unknown');
});

test('millisecondsUntilNextMinute aligns clock updates to wall-clock minutes', () => {
	assert.equal(millisecondsUntilNextMinute(Date.parse('2026-07-11T12:00:00.000Z')), 60_000);
	assert.equal(millisecondsUntilNextMinute(Date.parse('2026-07-11T12:00:30.250Z')), 29_750);
});
