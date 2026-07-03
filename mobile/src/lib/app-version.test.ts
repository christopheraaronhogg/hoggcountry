import assert from 'node:assert/strict';
import test from 'node:test';

import { compareBuilds, formatVersionLabel, needsAppUpdate } from './app-version-utils.ts';

test('formats the Dad-readable app version label', () => {
	assert.equal(formatVersionLabel('1.0', '40'), '1.0 (40)');
	assert.equal(formatVersionLabel('1.0', null), '1.0');
	assert.equal(formatVersionLabel(null, null), 'Unknown');
});

test('compares TestFlight build numbers numerically', () => {
	assert.ok(compareBuilds('40', '39') > 0);
	assert.ok(compareBuilds('39', '40') < 0);
	assert.equal(compareBuilds('40', '40'), 0);
	assert.equal(needsAppUpdate('39', '40'), true);
	assert.equal(needsAppUpdate('40', '40'), false);
	assert.equal(needsAppUpdate(null, '40'), false);
});
