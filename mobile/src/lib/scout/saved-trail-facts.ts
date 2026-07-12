import {
	directedMileDelta,
	trailAhead,
	type TrailDirection
} from '@hoggcountry/trail-data/trail-direction';
import type { ScoutOfflineReadinessStage } from './offline-readiness.ts';
import type { ContextPackPersistenceResult } from './context-pack-store.ts';
import type {
	ContextPack,
	ContextPackStatus,
	ShelterReference,
	TownReference,
	WaterReference
} from './types.ts';

export const SAVED_TRAIL_FACTS_MAX_MILES = 120;

export type SavedWaterFact = {
	name: string;
	mile: number;
	milesAhead: number;
	reliability: WaterReference['reliability'];
	note: string | null;
};

export type SavedShelterFact = {
	name: string;
	mile: number;
	milesAhead: number;
	capacity: number | null;
	note: string | null;
};

export type SavedTownFact = {
	name: string;
	mile: number;
	milesAhead: number;
	access: string | null;
	servicesNote: string | null;
};

export type SavedTrailFacts = {
	currentMile: number;
	direction: TrailDirection;
	maxMiles: typeof SAVED_TRAIL_FACTS_MAX_MILES;
	nextWater: SavedWaterFact | null;
	nextReliableWater: SavedWaterFact | null;
	nextShelter: SavedShelterFact | null;
	nextTown: SavedTownFact | null;
	hasLandmarks: boolean;
	packLabel: string;
	heading: 'Saved trail facts' | 'Loaded trail facts' | 'Bundled trail facts';
	storage: 'saved' | 'session' | 'bundled';
	cachedOnly: boolean;
	notice: string;
};

export function shouldShowSavedTrailFacts(stage: ScoutOfflineReadinessStage): boolean {
	return (
		stage === 'needs_model' ||
		stage === 'initializing' ||
		stage === 'testing' ||
		stage === 'failed'
	);
}

/**
 * Select a tiny, deterministic view of what is already saved on the phone.
 *
 * Live app position is deliberately separate from the pack snapshot: an old pack
 * center must never override a mile or direction that the hiker just corrected.
 * This function does not infer availability, safety, current flow, or services.
 */
export function buildSavedTrailFacts(input: {
	pack: ContextPack;
	currentMile: number;
	direction: TrailDirection;
	status: ContextPackStatus;
	persistence: ContextPackPersistenceResult;
}): SavedTrailFacts | null {
	const { pack, currentMile, direction, status, persistence } = input;
	if (
		!Number.isFinite(currentMile) ||
		!Number.isFinite(pack.frame.totalMiles) ||
		pack.frame.totalMiles <= 0 ||
		currentMile < 0 ||
		currentMile > pack.frame.totalMiles ||
		(direction !== 'NOBO' && direction !== 'SOBO')
	) {
		return null;
	}

	const validWater = validNamedMileItems(pack.water);
	const nextWater = nextValid(validWater, currentMile, direction);
	const nextReliableWater = nextValid(
		validWater.filter((water) => water.reliability === 'reliable'),
		currentMile,
		direction
	);
	const nextShelter = nextValid(pack.shelters, currentMile, direction);
	const nextTown = nextValid(pack.towns, currentMile, direction);
	const cachedOnly = status.state !== 'ready' && status.state !== 'saved';
	const packLabel = cleanText(status.label) ?? 'Field pack status unknown';
	const statusDetail = cleanText(status.detail);
	const persistenceError = cleanText(persistence.error);
	const storage =
		status.source === 'bundled' ? 'bundled' : persistence.verified ? 'saved' : 'session';
	const heading =
		storage === 'bundled'
			? 'Bundled trail facts'
			: storage === 'session'
				? 'Loaded trail facts'
				: 'Saved trail facts';

	const waterFact = nextWater ? toWaterFact(nextWater, currentMile, direction) : null;
	const reliableWaterFact = nextReliableWater
		? toWaterFact(nextReliableWater, currentMile, direction)
		: null;
	const shelterFact = nextShelter ? toShelterFact(nextShelter, currentMile, direction) : null;
	const townFact = nextTown ? toTownFact(nextTown, currentMile, direction) : null;

	return {
		currentMile,
		direction,
		maxMiles: SAVED_TRAIL_FACTS_MAX_MILES,
		nextWater: waterFact,
		nextReliableWater: reliableWaterFact,
		nextShelter: shelterFact,
		nextTown: townFact,
		hasLandmarks: Boolean(waterFact || shelterFact || townFact),
		packLabel,
		heading,
		storage,
		cachedOnly,
		notice:
			storage === 'session'
				? `${packLabel}. These facts are loaded for this session only; offline storage is not verified. ${[statusDetail, persistenceError].filter((detail, index, all) => detail && all.indexOf(detail) === index).join(' ')} Refresh before depending on them after restart or relying on water, shelter, access, or services.`
				: storage === 'bundled'
					? `${packLabel}. Bundled planning facts only; refresh for the hiker's mile before relying on water, shelter, access, or services.`
					: cachedOnly
						? `${packLabel}. Cached planning facts only; refresh before relying on water, shelter, access, or services. This does not prove current conditions.`
						: `${packLabel}. Trail conditions can change; confirm water flow, shelter status and rules, access, and services before relying on saved facts.`
	};
}

function validNamedMileItems<T extends { name: string; mile: number }>(items: readonly T[]): T[] {
	return items.filter((item) => isNamedMileRecord(item));
}

function isNamedMileRecord(value: unknown): value is { name: string; mile: number } {
	if (typeof value !== 'object' || value === null) return false;
	const record = value as Record<string, unknown>;
	return (
		Boolean(cleanText(record.name)) &&
		typeof record.mile === 'number' &&
		Number.isFinite(record.mile)
	);
}

function nextValid<T extends { name: string; mile: number }>(
	items: readonly T[],
	currentMile: number,
	direction: TrailDirection
): T | null {
	return (
		trailAhead(
			validNamedMileItems(items),
			currentMile,
			direction,
			SAVED_TRAIL_FACTS_MAX_MILES
		)[0] ?? null
	);
}

function milesAhead(currentMile: number, targetMile: number, direction: TrailDirection): number {
	return Math.max(0, directedMileDelta(currentMile, targetMile, direction));
}

function toWaterFact(
	water: WaterReference,
	currentMile: number,
	direction: TrailDirection
): SavedWaterFact {
	return {
		name: water.name.trim(),
		mile: water.mile,
		milesAhead: milesAhead(currentMile, water.mile, direction),
		reliability: water.reliability,
		note: cleanText(water.note)
	};
}

function toShelterFact(
	shelter: ShelterReference,
	currentMile: number,
	direction: TrailDirection
): SavedShelterFact {
	return {
		name: shelter.name.trim(),
		mile: shelter.mile,
		milesAhead: milesAhead(currentMile, shelter.mile, direction),
		capacity:
			Number.isFinite(shelter.capacity) && (shelter.capacity ?? 0) > 0
				? shelter.capacity ?? null
				: null,
		note: cleanText(shelter.note)
	};
}

function toTownFact(
	town: TownReference,
	currentMile: number,
	direction: TrailDirection
): SavedTownFact {
	return {
		name: town.name.trim(),
		mile: town.mile,
		milesAhead: milesAhead(currentMile, town.mile, direction),
		access: cleanText(town.access),
		servicesNote: cleanText(town.servicesNote)
	};
}

function cleanText(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const cleaned = value.trim();
	return cleaned || null;
}
