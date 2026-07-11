import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
	buildPeopleInviteText,
	buildPeopleInviteUrl,
	normalizeShareCode,
	parsePeopleInviteUrl,
	stripPeopleInviteUrl
} from './people/invite.ts';

const peopleSheetSource = readFileSync(new URL('./components/PeopleSheet.svelte', import.meta.url), 'utf8');

test('people invite links target the production app and carry code plus group', () => {
	const url = buildPeopleInviteUrl({ groupId: 'tramily', shareCode: ' HC-AbC 123 ' });

	assert.equal(url, 'https://app.hoggcountry.com/?hcInvite=hc-abc123&hcGroup=tramily');
	assert.deepEqual(parsePeopleInviteUrl(url), { groupId: 'tramily', shareCode: 'hc-abc123' });
});

test('people invite parsing defaults to family and rejects missing codes', () => {
	assert.deepEqual(parsePeopleInviteUrl('https://app.hoggcountry.com/?hcInvite=hc-xyz789'), {
		groupId: 'family',
		shareCode: 'hc-xyz789'
	});
	assert.equal(parsePeopleInviteUrl('https://app.hoggcountry.com/?hcInvite=short'), null);
	assert.equal(normalizeShareCode(' HC-AB CD '), 'hc-abcd');
});

test('people invite text is portable and names the code', () => {
	const inviteUrl = buildPeopleInviteUrl({ groupId: 'family', shareCode: 'hc-family123' });
	const message = buildPeopleInviteText({ groupName: 'Family', shareCode: 'hc-family123', inviteUrl });

	assert.equal(message, `Join my Hoggcountry family map: ${inviteUrl}\nInvite code: hc-family123`);
});

test('people invite params are stripped after the app consumes a link', () => {
	assert.equal(
		stripPeopleInviteUrl('https://app.hoggcountry.com/?hcInvite=hc-family123&hcGroup=family&tab=Map#top'),
		'/?tab=Map#top'
	);
});

test('preparing an invite never enables live-location publishing', () => {
	const ensureInvite = peopleSheetSource.match(
		/function ensureInvite\(\):[\s\S]*?\n\tfunction setLiveSharing/u
	)?.[0];

	assert.ok(ensureInvite, 'expected the invite preparation function');
	assert.match(ensureInvite, /people\.ensureShareCode\(activeGroup\.id\)/u);
	assert.doesNotMatch(ensureInvite, /setSharing\(/u);
});

test('closing the platform share sheet never claims an invite was delivered', () => {
	assert.match(peopleSheetSource, /handoffText/u);
	assert.match(peopleSheetSource, /cannot confirm the invite was sent or received/u);
	assert.doesNotMatch(peopleSheetSource, /window\.location\.href\s*=\s*buildPeopleInviteSmsHref/u);
});
