import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cloneDefaultContextPack } from './default-pack.ts';
import {
	buildFieldPackUrl,
	clampMile,
	deriveDayNumber,
	DEFAULT_HIKE_PROFILE,
	isDadPilotContextPack,
	isDadPilot,
	isSelfTracked,
	isValidMile,
	parseMileFromCheckIn,
	parseMileFromText,
	resolvePosition,
	TOTAL_AT_MILES,
	type HikeProfile
} from './hike-profile.ts';

function selfProfile(overrides: Partial<HikeProfile> = {}): HikeProfile {
	return {
		calibrated: true,
		mode: 'self',
		trailName: 'Birdsong',
		direction: 'NOBO',
		startDate: '2026-03-01',
		currentMile: 623.4,
		mileSource: 'onboarding',
		updatedAt: '2026-06-20T00:00:00.000Z',
		...overrides
	};
}

function dadPilotPack() {
	const pack = cloneDefaultContextPack();
	pack.frame.source = 'Hogg Country Dad pilot pack + AWOL 2026 reference length';
	pack.hiker.currentMile = 1438;
	pack.hiker.dayNumber = 42;
	pack.downloadedRegions = ['Dad trail-ahead 1438.0-1474.0'];
	pack.sourceReceipts = [
		{
			id: 'field-pack:dad-pilot',
			title: 'Dad pilot field pack',
			kind: 'trail-pack',
			citation: 'Public Hogg Country Dad pilot pack'
		}
	];
	return pack;
}

test('clampMile bounds and rounds to the real trail length', () => {
	assert.equal(clampMile(623.44), 623.4);
	assert.equal(clampMile(-5), 0);
	assert.equal(clampMile(99999), TOTAL_AT_MILES);
	assert.equal(clampMile(Number.NaN), 0);
});

test('isValidMile rejects out-of-range and non-numbers', () => {
	assert.equal(isValidMile(0), true);
	assert.equal(isValidMile(TOTAL_AT_MILES), true);
	assert.equal(isValidMile(-1), false);
	assert.equal(isValidMile(2500), false);
	assert.equal(isValidMile('700'), false);
	assert.equal(isValidMile(Number.NaN), false);
});

test('deriveDayNumber is 1-based and never below 1', () => {
	const start = '2026-03-01';
	assert.equal(deriveDayNumber(start, new Date('2026-03-01T08:00:00')), 1);
	assert.equal(deriveDayNumber(start, new Date('2026-03-10T08:00:00')), 10);
	// A "now" before the start date still floors at day 1, never 0 or negative.
	assert.equal(deriveDayNumber(start, new Date('2026-02-01T08:00:00')), 1);
	assert.equal(deriveDayNumber('not-a-date'), 1);
});

test('isSelfTracked only when calibrated AND self mode', () => {
	assert.equal(isSelfTracked(selfProfile()), true);
	assert.equal(isSelfTracked(selfProfile({ calibrated: false })), false);
	assert.equal(isSelfTracked(selfProfile({ mode: 'dad-pilot' })), false);
	assert.equal(isSelfTracked(DEFAULT_HIKE_PROFILE), false);
});

test('isDadPilot only after explicit Dad-following calibration', () => {
	assert.equal(isDadPilot(DEFAULT_HIKE_PROFILE), false);
	assert.equal(isDadPilot(selfProfile()), false);
	assert.equal(isDadPilot(selfProfile({ calibrated: false, mode: 'dad-pilot' })), false);
	assert.equal(isDadPilot(selfProfile({ mode: 'dad-pilot' })), true);
});

test('isDadPilotContextPack only recognizes the real Dad pilot pack', () => {
	assert.equal(isDadPilotContextPack(cloneDefaultContextPack()), false);
	assert.equal(isDadPilotContextPack(dadPilotPack()), true);
});

test('default hike profile starts neutral until calibration', () => {
	assert.equal(DEFAULT_HIKE_PROFILE.calibrated, false);
	assert.equal(DEFAULT_HIKE_PROFILE.currentMile, 0);
	assert.equal(DEFAULT_HIKE_PROFILE.direction, 'NOBO');
});

test('resolvePosition: self profile wins over the pack (refresh can never move the user)', () => {
	const pack = cloneDefaultContextPack();
	pack.hiker.currentMile = 1438; // simulate a refreshed Dad pilot pack
	const now = new Date('2026-03-11T08:00:00'); // day 11 from 2026-03-01
	const resolved = resolvePosition(selfProfile(), pack, '2026-02-01', now);
	assert.equal(resolved.currentMile, 623.4);
	assert.equal(resolved.dayNumber, 11);
});

test('resolvePosition: uncalibrated / dad-pilot reads position from the pack', () => {
	const pack = cloneDefaultContextPack();
	const now = new Date('2026-03-15T08:00:00');
	const resolved = resolvePosition(DEFAULT_HIKE_PROFILE, pack, '2026-02-01', now);
	assert.equal(resolved.currentMile, pack.hiker.currentMile);
	assert.equal(resolved.dayNumber, pack.hiker.dayNumber);
});

test('resolvePosition: explicit dad-pilot with starter pack stays coherent', () => {
	const pack = cloneDefaultContextPack();
	const now = new Date('2026-03-15T08:00:00');
	const resolved = resolvePosition(
		{ ...DEFAULT_HIKE_PROFILE, calibrated: true, currentMile: 0 },
		pack,
		'2026-02-01',
		now
	);
	assert.equal(resolved.currentMile, pack.hiker.currentMile);
	assert.equal(resolved.dayNumber, pack.hiker.dayNumber);
});

test('resolvePosition: explicit dad-pilot with Dad pack derives day from Dad start date', () => {
	const pack = dadPilotPack();
	const now = new Date('2026-03-15T08:00:00');
	const resolved = resolvePosition(
		{ ...DEFAULT_HIKE_PROFILE, calibrated: true, currentMile: 1438 },
		pack,
		'2026-02-01',
		now
	);
	assert.equal(resolved.currentMile, pack.hiker.currentMile);
	assert.equal(resolved.dayNumber, deriveDayNumber('2026-02-01', now));
});

test('buildFieldPackUrl: self hikers request a pack centered on their mile', () => {
	const url = buildFieldPackUrl('https://hoggcountry.com/scout/field-pack', selfProfile({ currentMile: 623.4, direction: 'NOBO' }));
	const parsed = new URL(url);
	assert.equal(parsed.searchParams.get('mile'), '623.4');
	assert.equal(parsed.searchParams.get('direction'), 'NOBO');
	assert.equal(parsed.searchParams.get('personal'), '1');
});

test('buildFieldPackUrl: dad-pilot / uncalibrated return the bare endpoint', () => {
	const base = 'https://hoggcountry.com/scout/field-pack';
	assert.equal(buildFieldPackUrl(base, DEFAULT_HIKE_PROFILE), base);
	assert.equal(buildFieldPackUrl(base, selfProfile({ mode: 'dad-pilot' })), base);
});

test('parseMileFromText: catches first-person position claims', () => {
	assert.equal(parseMileFromText("I'm at mile 623.4"), 623.4);
	assert.equal(parseMileFromText('im at mile 623'), 623);
	assert.equal(parseMileFromText('I am near mile marker 1500.2'), 1500.2);
	assert.equal(parseMileFromText("I'm on mile 777"), 777);
	assert.equal(parseMileFromText('reached mile 700'), 700);
	assert.equal(parseMileFromText('made it to mile 812.5'), 812.5);
	assert.equal(parseMileFromText('camped at mile 1010'), 1010);
	assert.equal(parseMileFromText('stopped at mile 950.0'), 950);
	assert.equal(parseMileFromText('now at mile 1200'), 1200);
});

test('parseMileFromText: catches explicit set/update imperatives', () => {
	assert.equal(parseMileFromText('set my mile to 305.5'), 305.5);
	assert.equal(parseMileFromText('update my position to mile 410'), 410);
	assert.equal(parseMileFromText('mark my location at mile 88'), 88);
});

test('parseMileFromText: ignores questions about landmarks and non-position text', () => {
	assert.equal(parseMileFromText("what's the next water at mile 1442?"), null);
	assert.equal(parseMileFromText('can the shelter at mile 1451 hold us tonight?'), null);
	assert.equal(parseMileFromText('how far to mile 1500'), null);
	assert.equal(parseMileFromText("I'm thirsty and tired"), null);
	assert.equal(parseMileFromText('mile 1438'), null);
	assert.equal(parseMileFromText('give me the safest next move'), null);
});

test('parseMileFromText: imperative requires a connector, so planning phrases do not match', () => {
	// Valid set/update intents (number is the object of the imperative).
	assert.equal(parseMileFromText('set my mile to 305.5'), 305.5);
	assert.equal(parseMileFromText('update my position to mile 410'), 410);
	assert.equal(parseMileFromText('mark my location at mile 88'), 88);
	// Planning phrases where the number is NOT the position — must not fire.
	assert.equal(parseMileFromText('update my mile goal to 1500'), null);
	assert.equal(parseMileFromText('how do I update my mile 1500 plan'), null);
});

test('parseMileFromText: rejects miles beyond the trail length', () => {
	assert.equal(parseMileFromText("I'm at mile 3000"), null);
});

test('parseMileFromCheckIn: recovers a bare "at mile N" locator inside a check-in', () => {
	// The status word between "I'm" and "at" breaks the strict parser; the check-in
	// parser still finds the mile — critical so an emergency logs at the right spot.
	assert.equal(parseMileFromCheckIn("I'm safe at mile 700"), 700);
	assert.equal(parseMileFromCheckIn('need help at mile 1442'), 1442);
	assert.equal(parseMileFromCheckIn('checking in at mile 700'), 700);
	assert.equal(parseMileFromCheckIn('all good at mile 812.5'), 812.5);
	// Strict matches still work, and bogus miles are still rejected.
	assert.equal(parseMileFromCheckIn("I'm at mile 623.4"), 623.4);
	assert.equal(parseMileFromCheckIn('feeling strong today'), null);
	assert.equal(parseMileFromCheckIn('camp at mile 5000'), null);
});
