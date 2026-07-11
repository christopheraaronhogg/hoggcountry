import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	SAFE_CHECK_IN_DISCLOSURE,
	SAFE_CHECK_IN_RECORDED,
	buildCheckInShareText,
	helpShareOutcomeNote,
	safeShareOutcomeNote
} from './check-in-ui.ts';

test('safe check-in copy distinguishes record and backup from family notification', () => {
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /records this check-in on this phone/i);
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /backup/i);
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /does not text or notify family/i);
	assert.match(SAFE_CHECK_IN_RECORDED, /recorded on this phone/i);
	assert.match(SAFE_CHECK_IN_RECORDED, /family was not notified/i);
});

test('portable check-in handoff outcomes never claim delivery', () => {
	assert.match(safeShareOutcomeNote('share-handoff-complete'), /cannot confirm/i);
	assert.match(safeShareOutcomeNote('copied'), /paste/i);
	assert.match(safeShareOutcomeNote('cancelled-or-no-target'), /no target/i);
	assert.match(safeShareOutcomeNote('unavailable'), /unavailable/i);

	assert.match(helpShareOutcomeNote('share-handoff-complete'), /cannot confirm anyone/i);
	assert.match(helpShareOutcomeNote('copied'), /paste/i);
	assert.match(helpShareOutcomeNote('cancelled-or-no-target'), /remains logged/i);
	assert.match(helpShareOutcomeNote('unavailable'), /911/i);
});

test('buildCheckInShareText creates portable, truthful circle text', () => {
	const draft = buildCheckInShareText({
		currentMile: 42.34,
		trailName: '  Sprout '
	});

	assert.equal(
		draft.text,
		[
			'Sprout checking in.',
			'Last saved AT mile (may be stale): 42.3.',
			'Scout cannot send this or confirm delivery.'
		].join('\n')
	);
});
