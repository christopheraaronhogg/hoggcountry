import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	buildEmergencyShareSms,
	buildHelpSms,
	createCheckInRecord,
	isoHoursFromNow,
	missedCheckInRisk,
	nextCheckInHours,
	normalizeSupportContact,
	reachableSupportContacts,
	removeSupportContactByName
} from './safety.ts';

function smsBody(href: string): string {
	return decodeURIComponent(href.split('body=')[1] ?? '');
}

test('isoHoursFromNow and nextCheckInHours preserve check-in timing policy', () => {
	const now = new Date('2026-02-02T12:00:00.000Z');

	assert.equal(isoHoursFromNow(4, now), '2026-02-02T16:00:00.000Z');
	assert.equal(nextCheckInHours('safe'), 4);
	assert.equal(nextCheckInHours('delayed'), 4);
	assert.equal(nextCheckInHours('need-help'), 1);
});

test('createCheckInRecord formats mile location and fallback notes', () => {
	const record = createCheckInRecord({
		id: 'check-1',
		status: 'safe',
		note: '',
		mile: 12.34,
		now: new Date('2026-02-02T12:00:00.000Z')
	});

	assert.equal(record.id, 'check-1');
	assert.equal(record.timestamp, '2026-02-02T12:00:00.000Z');
	assert.equal(record.location, 'Mile 12.3');
	assert.equal(record.mile, 12.34);
	assert.equal(record.note, 'Still on plan and moving well.');
});

test('missedCheckInRisk matches offline and due-soon thresholds', () => {
	const now = new Date('2026-02-02T12:00:00.000Z');

	assert.equal(
		missedCheckInRisk({ nextCheckInDueAt: '2026-02-02T13:00:00.000Z', onlineStatus: false, now }),
		'high'
	);
	assert.equal(
		missedCheckInRisk({ nextCheckInDueAt: '2026-02-02T13:00:00.000Z', onlineStatus: true, now }),
		'medium'
	);
	assert.equal(
		missedCheckInRisk({ nextCheckInDueAt: '2026-02-02T15:00:00.000Z', onlineStatus: false, now }),
		'low'
	);
});

test('normalizeSupportContact trims fields and rejects blank names', () => {
	assert.equal(
		normalizeSupportContact({
			name: '   ',
			role: '',
			method: '',
			phone: '',
			email: ''
		}),
		null
	);

	assert.deepEqual(
		normalizeSupportContact({
			name: '  Chris ',
			role: '',
			method: '',
			phone: '  (555) 123-4567 ',
			email: '  chris@example.com '
		}),
		{
			name: 'Chris',
			role: 'Emergency contact',
			method: 'Text / call',
			phone: '(555) 123-4567',
			email: 'chris@example.com'
		}
	);
});

test('support contact helpers filter reachable contacts and remove by name', () => {
	const contacts = [
		{ name: 'A', role: 'Mom', method: 'Text', phone: '555-1111' },
		{ name: 'B', role: 'Friend', method: 'Reference' }
	];

	assert.deepEqual(reachableSupportContacts(contacts).map((contact) => contact.name), ['A']);
	assert.deepEqual(removeSupportContactByName(contacts, 'A').map((contact) => contact.name), ['B']);
});

test('buildHelpSms returns null without phone contacts and encodes a signal-gated sms link', () => {
	assert.equal(
		buildHelpSms({
			contacts: [{ name: 'B', role: 'Friend', method: 'Reference' }],
			currentMile: 42,
			trailName: 'Sprout'
		}),
		null
	);

	const sms = buildHelpSms({
		contacts: [
			{ name: 'A', role: 'Mom', method: 'Text', phone: '(555) 123-4567' },
			{ name: 'B', role: 'Dad', method: 'Text', phone: '+1 555 765 4321' }
		],
		currentMile: 42.34,
		trailName: '  Sprout '
	});

	assert.equal(sms?.recipients.length, 2);
	assert.equal(
		sms?.href,
		'sms:5551234567,+15557654321?&body=Sprout%20needs%20help%20on%20the%20AT.%20Near%20mile%2042.3.%20Sent%20from%20Hogg%20Country%20Trail%20Assistant.'
	);
});

test('buildEmergencyShareSms includes UTC draft time, GPS fix, map link, and saved mile', () => {
	const sms = buildEmergencyShareSms({
		contacts: [
			{ name: 'A', role: 'Mom', method: 'Text', phone: '(555) 123-4567' },
			{ name: 'B', role: 'Dad', method: 'Text', phone: '+1 555 765 4321' }
		],
		currentMile: 42.34,
		trailName: '  Sprout ',
		preparedAt: new Date('2026-07-11T12:34:56.000Z'),
		coordinates: { latitude: 34.123456, longitude: -84.987654 }
	});

	assert.deepEqual(sms?.recipients.map((contact) => contact.name), ['A', 'B']);
	assert.equal(sms?.usedCoordinates, true);
	assert.equal(
		smsBody(sms?.href ?? ''),
		[
			'Sprout needs help on the AT.',
			'Draft time (UTC): 2026-07-11T12:34:56.000Z.',
			'GPS fix: 34.12346, -84.98765. Map: https://maps.google.com/?q=34.12346,-84.98765',
			'Last saved AT mile: 42.3.',
			'This message sends only when I tap Send. It is not 911 or satellite SOS.'
		].join('\n')
	);
});

test('buildEmergencyShareSms honestly falls back when GPS is missing or invalid', () => {
	const contacts = [{ name: 'A', role: 'Mom', method: 'Text', phone: '555-1234' }];
	const withoutGps = buildEmergencyShareSms({
		contacts,
		currentMile: 42,
		trailName: '',
		preparedAt: new Date('2026-07-11T12:34:56.000Z'),
		coordinates: null
	});
	const invalidGps = buildEmergencyShareSms({
		contacts,
		currentMile: 42,
		preparedAt: new Date('2026-07-11T12:34:56.000Z'),
		coordinates: { latitude: 120, longitude: Number.NaN }
	});

	assert.equal(withoutGps?.usedCoordinates, false);
	assert.match(smsBody(withoutGps?.href ?? ''), /GPS fix unavailable/);
	assert.doesNotMatch(smsBody(withoutGps?.href ?? ''), /maps\.google/);
	assert.equal(invalidGps?.usedCoordinates, false);
	assert.match(smsBody(invalidGps?.href ?? ''), /GPS fix unavailable/);
	assert.equal(
		buildEmergencyShareSms({
			contacts: [{ name: 'Reference', role: 'Friend', method: 'Reference' }],
			currentMile: 42,
			preparedAt: new Date(),
			coordinates: null
		}),
		null
	);
});
