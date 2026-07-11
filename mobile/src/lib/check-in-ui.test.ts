import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	SAFE_CHECK_IN_DISCLOSURE,
	SAFE_CHECK_IN_RECORDED,
	buildCheckInSmsDraft
} from './check-in-ui.ts';

test('safe check-in copy distinguishes record and backup from family notification', () => {
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /records this check-in on this phone/i);
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /backup/i);
	assert.match(SAFE_CHECK_IN_DISCLOSURE, /does not text or notify family/i);
	assert.match(SAFE_CHECK_IN_RECORDED, /recorded on this phone/i);
	assert.match(SAFE_CHECK_IN_RECORDED, /family was not notified/i);
});

test('buildCheckInSmsDraft creates a separate user-sent circle text', () => {
	assert.equal(buildCheckInSmsDraft({
		contacts: [{ name: 'Reference only', role: 'Friend', method: 'Reference' }],
		currentMile: 42,
		trailName: 'Sprout'
	}), null);

	const draft = buildCheckInSmsDraft({
		contacts: [
			{ name: 'A', role: 'Mom', method: 'Text', phone: '(555) 123-4567' },
			{ name: 'B', role: 'Dad', method: 'Text', phone: '+1 555 765 4321' }
		],
		currentMile: 42.34,
		trailName: '  Sprout '
	});

	assert.deepEqual(draft?.recipients.map((contact) => contact.name), ['A', 'B']);
	assert.equal(draft?.href, 'sms:5551234567,+15557654321?&body=Sprout%20checking%20in%20near%20AT%20mile%2042.3.%20This%20message%20is%20sent%20only%20when%20I%20tap%20Send.');
});
