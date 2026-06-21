import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelPolicy } from './model-policy.ts';

test('model policy is always Gemma-only', () => {
	assert.equal(resolveModelPolicy('gemma4-only', true), 'gemma4-only');
	assert.equal(resolveModelPolicy('gemma4-only', false), 'gemma4-only');
	assert.equal(resolveModelPolicy('offline-tools', true), 'gemma4-only');
	assert.equal(resolveModelPolicy('offline-tools', false), 'gemma4-only');
	assert.equal(resolveModelPolicy(undefined, false), 'gemma4-only');
	assert.equal(resolveModelPolicy('', false), 'gemma4-only');
	assert.equal(resolveModelPolicy('garbage', false), 'gemma4-only');
	assert.equal(resolveModelPolicy(undefined, true), 'gemma4-only');
});
