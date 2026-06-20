import assert from 'node:assert/strict';
import { test } from 'node:test';

import { detectTrailActionIntent } from './action-intents.ts';

test('detectTrailActionIntent: proposes a pure position update', () => {
	const intent = detectTrailActionIntent("I'm at mile 623.4", 600);

	assert.deepEqual(intent, {
		kind: 'position-update',
		mile: 623.4,
		title: 'Update your position',
		detail: 'Move to mile 623.4 (from mile 600.0)',
		confirmLabel: 'Update mile',
		prompt: "Want me to set your position to mile 623.4? I won't change anything until you confirm below."
	});
});

test('detectTrailActionIntent: proposes a safe check-in at the current mile', () => {
	const intent = detectTrailActionIntent("I'm safe", 42);

	assert.deepEqual(intent, {
		kind: 'check-in',
		status: 'safe',
		mile: 42,
		note: "I'm safe",
		movesPosition: false,
		title: 'Log a "Safe" check-in',
		detail: 'Mile 42.0 · "I\'m safe"',
		confirmLabel: 'Log check-in',
		prompt: "Want me to log a \"Safe\" check-in at mile 42.0? I won't record anything until you confirm below."
	});
});

test('detectTrailActionIntent: check-ins can include a mile locator', () => {
	const intent = detectTrailActionIntent('need help at mile 1442', 1438);

	assert.deepEqual(intent, {
		kind: 'check-in',
		status: 'need-help',
		mile: 1442,
		note: 'need help at mile 1442',
		movesPosition: true,
		title: 'Log a "Need help" check-in',
		detail: 'Mile 1442.0 · "need help at mile 1442"',
		confirmLabel: 'Log check-in',
		prompt: "Want me to mark you at mile 1442.0 and log a \"Need help\" check-in? I won't record anything until you confirm below."
	});
});

test('detectTrailActionIntent: detects delayed check-ins', () => {
	const intent = detectTrailActionIntent('running late near mile 88', 90);

	assert.deepEqual(intent, {
		kind: 'check-in',
		status: 'delayed',
		mile: 88,
		note: 'running late near mile 88',
		movesPosition: true,
		title: 'Log a "Delayed" check-in',
		detail: 'Mile 88.0 · "running late near mile 88"',
		confirmLabel: 'Log check-in',
		prompt: "Want me to mark you at mile 88.0 and log a \"Delayed\" check-in? I won't record anything until you confirm below."
	});
});

test('detectTrailActionIntent: ignores non-action landmark questions and planning phrases', () => {
	assert.equal(detectTrailActionIntent("what's the next water at mile 1442?", 1438), null);
	assert.equal(detectTrailActionIntent('update my mile goal to 1500', 1438), null);
	assert.equal(detectTrailActionIntent('how far is it to mile 1500?', 1438), null);
});
