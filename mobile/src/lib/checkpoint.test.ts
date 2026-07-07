import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildCheckpointDoc, checkpointDocId } from './checkpoint.ts';

test('checkpointDocId uses the UTC date from an ISO timestamp', () => {
	assert.equal(checkpointDocId('2026-07-06T12:34:56.000Z'), '2026-07-06');
	assert.equal(checkpointDocId('2026-07-06T21:00:00-04:00'), '2026-07-07');
});

test('buildCheckpointDoc passes through check-in values', () => {
	assert.deepEqual(
		buildCheckpointDoc({
			atIso: '2026-07-06T12:34:56.000Z',
			currentMile: 123.45,
			dayNumber: 42,
			status: 'safe'
		}),
		{
			at: '2026-07-06T12:34:56.000Z',
			mile: 123.45,
			dayNumber: 42,
			status: 'safe'
		}
	);
});

test('buildCheckpointDoc clamps non-finite numbers', () => {
	assert.deepEqual(
		buildCheckpointDoc({
			atIso: '2026-07-06T12:34:56.000Z',
			currentMile: Number.NaN,
			dayNumber: Number.POSITIVE_INFINITY
		}),
		{
			at: '2026-07-06T12:34:56.000Z',
			mile: 0,
			dayNumber: 1
		}
	);
});

test('buildCheckpointDoc omits status when undefined', () => {
	assert.deepEqual(
		buildCheckpointDoc({
			atIso: '2026-07-06T12:34:56.000Z',
			currentMile: 12,
			dayNumber: 3
		}),
		{
			at: '2026-07-06T12:34:56.000Z',
			mile: 12,
			dayNumber: 3
		}
	);
});
