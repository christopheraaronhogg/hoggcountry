import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelPolicy } from './model-policy.ts';

test('explicit gemma4-only is honored in dev and prod', () => {
	assert.equal(resolveModelPolicy('gemma4-only', true), 'gemma4-only');
	assert.equal(resolveModelPolicy('gemma4-only', false), 'gemma4-only');
});

test('explicit offline-tools is honored in dev and prod', () => {
	assert.equal(resolveModelPolicy('offline-tools', true), 'offline-tools');
	assert.equal(resolveModelPolicy('offline-tools', false), 'offline-tools');
});

test('unset policy FAILS CLOSED in production (gemma4-only)', () => {
	assert.equal(resolveModelPolicy(undefined, false), 'gemma4-only');
	assert.equal(resolveModelPolicy('', false), 'gemma4-only');
	assert.equal(resolveModelPolicy('garbage', false), 'gemma4-only');
});

test('unset policy defaults to offline-tools in dev so the browser preview runs', () => {
	assert.equal(resolveModelPolicy(undefined, true), 'offline-tools');
});
