/**
 * The hiker's OWN identity and position — the "My hike" calibration.
 *
 * This is deliberately separate from the field pack's `hiker` block. The field
 * pack is reference data (water/shelters/towns) fetched from Hogg Country and is
 * centered on whatever mile the server was asked about. The HikeProfile is the
 * user's own truth: who they are and where they are on the AT. It is persisted
 * locally and NEVER overwritten by a remote pack refresh — that was the original
 * bug, where every refresh snapped a real user back to Dad's pilot mile.
 *
 * Everything in this module is pure (no browser/Capacitor deps) so it can be unit
 * tested under `node --test` alongside the rest of scout/.
 */

import type { CheckInRecord } from '../types';
import type { ContextPack, SourceReceipt } from './types.ts';
import { directedMileDelta, trailAhead } from '@hoggcountry/trail-data/trail-direction';

/** Calibrated AT length (AWOL 2026, per repo CLAUDE.md). */
export const TOTAL_AT_MILES = 2197.4;

/**
 * `self` — the user is tracking their own hike; position is owned by this profile.
 * `dad-pilot` — following the Hogg family's real 2026 NOBO thru-hike; position
 * comes from the public Dad pilot pack (the original app behavior).
 */
export type HikeMode = 'self' | 'dad-pilot';

/** Where the current mile came from — surfaced honestly in the UI, never faked. */
export type MileSource = 'onboarding' | 'check-in' | 'gps' | 'manual' | 'pilot';

const SELF_CONTEXT_RADIUS_MILES = 50;
const SELF_WEATHER_RADIUS_MILES = 25;

export interface HikeProfile {
	/** False until the user has completed (or skipped) first-run calibration. */
	calibrated: boolean;
	mode: HikeMode;
	/** The user's trail name, when they're tracking their own hike. */
	trailName?: string;
	direction: 'NOBO' | 'SOBO';
	/** ISO `YYYY-MM-DD` the user started; drives the real day number in self mode. */
	startDate?: string;
	currentMile: number;
	mileSource: MileSource;
	/** ISO timestamp of the last position/profile change. */
	updatedAt: string;
}

export interface HikeCalibrationInput {
	mode: HikeMode;
	trailName?: string;
	direction?: 'NOBO' | 'SOBO';
	startDate?: string;
	currentMile?: number;
}

export interface HikeProfileTransition {
	profile: HikeProfile;
	currentMile: number | null;
	anchorCheckIn: CheckInRecord | null;
}

interface HikeProfileTransitionOptions {
	now?: Date;
	checkInId?: string;
}

/**
 * The pre-calibration default is intentionally neutral. The first-run sheet
 * appears because `calibrated` is false; Dad's real pilot pack is only used
 * after the user explicitly chooses to follow Dad.
 */
export const DEFAULT_HIKE_PROFILE: HikeProfile = {
	calibrated: false,
	mode: 'dad-pilot',
	direction: 'NOBO',
	currentMile: 0,
	mileSource: 'pilot',
	updatedAt: '1970-01-01T00:00:00.000Z'
};

/** True when position is the user's own (calibrated self-hike). */
export function isSelfTracked(profile: HikeProfile): boolean {
	return profile.calibrated && profile.mode === 'self';
}

/** True only after the hiker explicitly chooses to follow the public Dad pilot. */
export function isDadPilot(profile: HikeProfile): boolean {
	return profile.calibrated && profile.mode === 'dad-pilot';
}

/**
 * True when a context pack is recognizably the public Dad pilot pack.
 *
 * The bundled starter pack is also "pilot-ish" in broad product copy, so this
 * deliberately keys off the server's Dad-specific source/region/receipt labels.
 * That prevents a startup/network-failure state from rendering Dad's calendar
 * day beside a neutral mile-0 starter pack.
 */
export function isDadPilotContextPack(pack: ContextPack): boolean {
	const receiptText =
		pack.sourceReceipts
			?.map((receipt) => [receipt.id, receipt.title, receipt.citation].filter(Boolean).join(' '))
			.join(' ') ?? '';
	const haystack = [pack.frame.source, ...pack.downloadedRegions, receiptText].join(' ').toLowerCase();
	return (
		haystack.includes('dad pilot') ||
		haystack.includes('dad trail-ahead') ||
		haystack.includes('hogg country dad') ||
		haystack.includes('field-pack:dad')
	);
}

function containsDadPilotSignal(value: string | undefined): boolean {
	if (!value) return false;
	return /\b(?:dad\s+pilot|dad\s+trail-ahead|hogg\s+country\s+dad|field-pack:dad|cached-pilot)\b/i.test(value);
}

function receiptLooksPilotOwned(receipt: SourceReceipt): boolean {
	return containsDadPilotSignal([receipt.id, receipt.title, receipt.citation].filter(Boolean).join(' '));
}

function keepNearbyMile(mile: number | undefined, center: number, radius: number): boolean {
	return typeof mile === 'number' && Number.isFinite(mile) && Math.abs(mile - center) <= radius;
}

/**
 * Re-own a cached pack immediately after a hiker enters self-tracking mode.
 *
 * Network refresh may fail offline, but Scout tools still read the local pack.
 * This prevents a stale Dad/pilot cache from powering weather, region labels,
 * tool mileage, or fallback answer headers after the user has set their own mile.
 */
export function sanitizeContextPackForSelfProfile(
	pack: ContextPack,
	profile: HikeProfile,
	now: Date = new Date()
): ContextPack {
	if (!isSelfTracked(profile)) return pack;

	const currentMile = clampMile(profile.currentMile);
	const packLooksPilotOwned = isDadPilotContextPack(pack);
	const directionChanged = pack.hiker.direction !== profile.direction;
	const packCenteredElsewhere = Math.abs(pack.hiker.currentMile - currentMile) > SELF_CONTEXT_RADIUS_MILES;
	const incompatibleTrailSlice = packLooksPilotOwned || directionChanged || packCenteredElsewhere;
	const terrainMatchesDirection = !pack.terrain
		|| directedMileDelta(currentMile, pack.terrain.toMile, profile.direction) >= -0.01;
	const dayNumber = profile.startDate ? deriveDayNumber(profile.startDate, now) : 1;
	const weather =
		pack.weather &&
		pack.weather.source !== 'cached-pilot' &&
		keepNearbyMile(pack.weather.mile, currentMile, SELF_WEATHER_RADIUS_MILES)
			? pack.weather
			: null;
	const sourceReceipts = (pack.sourceReceipts ?? []).filter((receipt) => !receiptLooksPilotOwned(receipt));
	const water = incompatibleTrailSlice
		? []
		: trailAhead(pack.water, currentMile, profile.direction, SELF_CONTEXT_RADIUS_MILES);
	const shelters = incompatibleTrailSlice
		? []
		: trailAhead(pack.shelters, currentMile, profile.direction, SELF_CONTEXT_RADIUS_MILES);
	const towns = incompatibleTrailSlice
		? []
		: trailAhead(pack.towns, currentMile, profile.direction, SELF_CONTEXT_RADIUS_MILES);
	let pendingReason = 'Personal pack pending refresh.';
	if (!packLooksPilotOwned && directionChanged) {
		pendingReason = 'Your hike direction changed, so the old directional trail slice was cleared.';
	} else if (!packLooksPilotOwned && packCenteredElsewhere) {
		pendingReason = 'The saved trail slice was centered on a different section and was cleared.';
	}

	return {
		...pack,
		frame: {
			...pack.frame,
			source: packLooksPilotOwned
				? 'AWOL 2026 reference length + personal offline pack pending refresh'
				: pack.frame.source
		},
		hiker: {
			...pack.hiker,
			trailName: profile.trailName,
			currentMile,
			direction: profile.direction,
			dayNumber
		},
		water,
		shelters,
		towns,
		terrain: incompatibleTrailSlice || !terrainMatchesDirection ? null : pack.terrain,
		loadout: packLooksPilotOwned ? [] : pack.loadout,
		weather,
		downloadedRegions: incompatibleTrailSlice
			? [`Personal pack pending refresh around mile ${currentMile.toFixed(1)}`]
			: pack.downloadedRegions,
		generatedAt: incompatibleTrailSlice ? now.toISOString() : pack.generatedAt,
		validUntil: incompatibleTrailSlice ? undefined : pack.validUntil,
		sourceReceipts,
		pilotNotice: incompatibleTrailSlice
			? `${pendingReason} Scout is using your saved mile and local documents; refresh when connectivity returns, and verify water, weather, services, rules, and access before relying on them.`
			: pack.pilotNotice
	};
}

export function isValidMile(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= TOTAL_AT_MILES;
}

/** Clamp any number to a real AT mile, rounded to a tenth. */
export function clampMile(value: number): number {
	if (!Number.isFinite(value)) return 0;
	const bounded = Math.min(TOTAL_AT_MILES, Math.max(0, value));
	return Math.round(bounded * 10) / 10;
}

/** Today's date as an ISO `YYYY-MM-DD` string (for a sensible start-date default). */
export function todayISODate(now: Date = new Date()): string {
	return now.toISOString().slice(0, 10);
}

export function createSelfAnchorCheckIn(
	mile: number,
	options: HikeProfileTransitionOptions = {}
): CheckInRecord {
	const clamped = clampMile(mile);
	return {
		id: options.checkInId ?? crypto.randomUUID(),
		timestamp: (options.now ?? new Date()).toISOString(),
		location: `Mile ${clamped.toFixed(1)}`,
		mile: clamped,
		status: 'safe',
		note: 'Starting position set — log a check-in when you reach camp.'
	};
}

export function calibrateHikeProfile(
	input: HikeCalibrationInput,
	dadCurrentMile: number,
	options: HikeProfileTransitionOptions = {}
): HikeProfileTransition {
	const now = options.now ?? new Date();
	const updatedAt = now.toISOString();

	if (input.mode === 'dad-pilot') {
		return {
			profile: {
				calibrated: true,
				mode: 'dad-pilot',
				direction: 'NOBO',
				currentMile: dadCurrentMile,
				mileSource: 'pilot',
				updatedAt
			},
			currentMile: null,
			anchorCheckIn: null
		};
	}

	const mile = clampMile(input.currentMile ?? 0);
	return {
		profile: {
			calibrated: true,
			mode: 'self',
			trailName: input.trailName?.trim() || undefined,
			direction: input.direction ?? 'NOBO',
			startDate: input.startDate || todayISODate(now),
			currentMile: mile,
			mileSource: 'onboarding',
			updatedAt
		},
		currentMile: mile,
		anchorCheckIn: createSelfAnchorCheckIn(mile, options)
	};
}

export function updateHikeProfileMile(
	previous: HikeProfile,
	mile: number,
	source: MileSource,
	options: HikeProfileTransitionOptions = {}
): HikeProfileTransition {
	const now = options.now ?? new Date();
	const clamped = clampMile(mile);
	const becomingSelf = !previous.calibrated || previous.mode !== 'self';
	return {
		profile: {
			...previous,
			calibrated: true,
			mode: 'self',
			direction: previous.direction ?? 'NOBO',
			startDate: previous.startDate ?? todayISODate(now),
			currentMile: clamped,
			mileSource: source,
			updatedAt: now.toISOString()
		},
		currentMile: clamped,
		anchorCheckIn: becomingSelf ? createSelfAnchorCheckIn(clamped, options) : null
	};
}

/** Day N of the hike (1-based) from an ISO start date. Never below 1. */
export function deriveDayNumber(startDate: string, now: Date = new Date()): number {
	const start = new Date(`${startDate}T00:00:00`);
	if (Number.isNaN(start.getTime())) return 1;
	const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
	return Math.max(1, days);
}

/**
 * Resolve the position to SHOW, given the user's profile and the loaded pack.
 *
 * In self mode the profile wins and the pack's hiker block is ignored — this is
 * the whole point: a remote refresh can never move the user off their real mile.
 * Otherwise (uncalibrated, or explicitly following Dad) the pack drives position.
 */
export function resolvePosition(
	profile: HikeProfile,
	pack: ContextPack,
	dadStartDate: string,
	now: Date = new Date()
): { currentMile: number; dayNumber: number } {
	if (isSelfTracked(profile)) {
		return {
			currentMile: clampMile(profile.currentMile),
			dayNumber: profile.startDate ? deriveDayNumber(profile.startDate, now) : 1
		};
	}
	if (!profile.calibrated) {
		return {
			currentMile: pack.hiker.currentMile,
			dayNumber: pack.hiker.dayNumber
		};
	}
	if (!isDadPilotContextPack(pack)) {
		return {
			currentMile: pack.hiker.currentMile,
			dayNumber: pack.hiker.dayNumber
		};
	}
	return {
		currentMile: pack.hiker.currentMile,
		dayNumber: deriveDayNumber(dadStartDate, now)
	};
}

/**
 * Build the field-pack endpoint URL for a calibrated profile. Self-tracked hikers
 * request a pack centered on THEIR mile (`?mile=&direction=&personal=1`); explicit
 * Dad-pilot mode gets the public pilot pack at the bare endpoint. Uncalibrated
 * users should not refresh yet.
 */
export function buildFieldPackUrl(base: string, profile: HikeProfile): string {
	if (!isSelfTracked(profile)) return base;
	try {
		const url = new URL(base);
		url.searchParams.set('mile', clampMile(profile.currentMile).toFixed(1));
		url.searchParams.set('direction', profile.direction);
		url.searchParams.set('personal', '1');
		return url.toString();
	} catch {
		return base;
	}
}

/**
 * Detect a hiker stating their current mile in a chat message — e.g.
 * "I'm at mile 623.4", "reached mile 700", "update my mile to 950". Returns the
 * clamped mile, or null when the message isn't a position claim.
 *
 * Deliberately conservative: it requires a first-person arrival phrase or an
 * explicit set/update imperative AND the word "mile", so questions ABOUT a
 * landmark ("what's the water at mile 1442?") never trigger a position change.
 * The number is validated against the real trail length, so "mile 3000" is
 * rejected rather than clamped into a bogus calibration.
 */
export function parseMileFromText(text: string): number | null {
	if (!text) return null;
	const patterns: RegExp[] = [
		// "I'm at mile 623.4" / "im on mile 777" / "i am near mile 1200"
		/\b(?:i['’]?m|i\s*am|im)\s+(?:at|on|near|past)\s+mile\s*(?:marker\s*)?(\d{1,4}(?:\.\d)?)\b/i,
		// "reached mile 700" / "made it to mile 812.5" / "camped at mile 1010"
		/\b(?:currently\s+at|now\s+at|reached|made\s+it(?:\s+to)?|camped\s+at|stopped\s+at|hiked\s+to)\s+mile\s*(?:marker\s*)?(\d{1,4}(?:\.\d)?)\b/i,
		// "set my mile to 305.5" / "update my position to mile 410". A connector
		// (to/at/=/:) must sit between the noun and the number so a planning phrase
		// like "update my mile goal to 1500" or "...mile 1500 plan" does NOT match.
		/\b(?:set|update|change|log|mark|put)\s+(?:my\s+)?(?:current\s+)?(?:position|location|mile|spot)\s+(?:to|at|=|:|is)\s+(?:mile\s*(?:marker\s*)?)?(\d{1,4}(?:\.\d)?)\b/i
	];
	for (const pattern of patterns) {
		const match = pattern.exec(text);
		if (match) {
			const value = Number(match[1]);
			if (isValidMile(value)) return clampMile(value);
		}
	}
	return null;
}

// A bare locator ("at/near/by mile N") — looser than parseMileFromText, used ONLY
// when the message already carried a check-in status, so the strong false-positive
// protection still guards plain landmark questions.
const LOCATOR_MILE = /\b(?:at|near|by|around|@)\s+mile\s*(?:marker\s*)?(\d{1,4}(?:\.\d)?)\b/i;

/**
 * Extract the hiker's mile from a CHECK-IN message. Tries the strict patterns
 * first, then a looser "at/near mile N" locator — because a check-in often reads
 * "I'm safe at mile 700" or "need help at mile 1442", where the status word
 * ("safe"/"help") sits between "I'm" and "at" and breaks the strict pattern.
 * Getting this mile right matters most for emergency check-ins, which the support
 * circle relies on for location.
 */
export function parseMileFromCheckIn(text: string): number | null {
	const strict = parseMileFromText(text);
	if (strict !== null) return strict;
	if (!text) return null;
	const match = LOCATOR_MILE.exec(text);
	if (match) {
		const value = Number(match[1]);
		if (isValidMile(value)) return clampMile(value);
	}
	return null;
}
