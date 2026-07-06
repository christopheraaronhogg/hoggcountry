import assert from 'node:assert/strict';
import test from 'node:test';

import { describeDiagnosticError, sanitizeDiagnosticContext } from './scout-diagnostics.ts';

test('Scout diagnostics sanitizer redacts private trail and prompt fields', () => {
	const context = sanitizeDiagnosticContext({
		phase: 'provider_generate',
		prompt: 'Where should I sleep?',
		lat: 42.1,
		lon: -73.2,
		currentMile: 1507.2,
		current_mile: 1507.3,
		mile: 1507.4,
		nested: {
			token: 'secret',
			error_summary: 'engine boom'
		}
	});

	assert.equal(context.phase, 'provider_generate');
	assert.equal(context.prompt, '[redacted]');
	assert.equal(context.lat, '[redacted]');
	assert.equal(context.lon, '[redacted]');
	assert.equal(context.currentMile, '[redacted]');
	assert.equal(context.current_mile, '[redacted]');
	assert.equal(context.mile, '[redacted]');
	assert.deepEqual(context.nested, {
		token: '[redacted]',
		error_summary: 'engine boom'
	});
});

test('Scout diagnostics error description excludes stack traces', () => {
	const details = describeDiagnosticError(new TypeError('native bridge timed out while loading'));

	assert.deepEqual(details, {
		error_name: 'TypeError',
		error_summary: 'native bridge timed out while loading'
	});
	assert.equal('stack' in details, false);
});
