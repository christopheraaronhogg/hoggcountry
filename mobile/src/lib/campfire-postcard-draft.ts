import { CAMPFIRE_MOODS, CAMPFIRE_NOTE_MAX_CHARS, type CampfireMood } from './campfire-postcard.ts';
import type { PersistenceAdapter } from './mobile-persistence.ts';

export const CAMPFIRE_DRAFT_KEY = 'hc-campfire-postcard-draft-v1';

export interface CampfirePostcardDraft {
	version: 1;
	dateKey: string;
	dateLabel: string;
	dayNumber: number;
	currentMile: number;
	direction: 'NOBO' | 'SOBO';
	trailName?: string;
	mood: CampfireMood;
	note: string;
	includeWeather: boolean;
	updatedAt: string;
}

export function createCampfirePostcardDraft(
	input: {
		dayNumber: number;
		currentMile: number;
		direction: 'NOBO' | 'SOBO';
		trailName?: string;
		includeWeather: boolean;
	},
	now = new Date()
): CampfirePostcardDraft {
	return {
		version: 1,
		dateKey: localDateKey(now),
		dateLabel: new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(now),
		dayNumber: Math.max(1, Math.floor(input.dayNumber)),
		currentMile: Number.isFinite(input.currentMile) ? Math.max(0, input.currentMile) : 0,
		direction: input.direction,
		trailName: cleanTrailName(input.trailName),
		mood: 'grateful',
		note: '',
		includeWeather: input.includeWeather,
		updatedAt: now.toISOString()
	};
}

export function parseCampfirePostcardDraft(value: string | null): CampfirePostcardDraft | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(value) as Partial<CampfirePostcardDraft>;
		if (
			parsed.version !== 1 ||
			typeof parsed.dateKey !== 'string' ||
			typeof parsed.dateLabel !== 'string' ||
			typeof parsed.dayNumber !== 'number' ||
			typeof parsed.currentMile !== 'number' ||
			(parsed.direction !== 'NOBO' && parsed.direction !== 'SOBO') ||
			!CAMPFIRE_MOODS.some((mood) => mood.value === parsed.mood) ||
			typeof parsed.note !== 'string' ||
			typeof parsed.includeWeather !== 'boolean' ||
			typeof parsed.updatedAt !== 'string'
		) {
			return null;
		}
		return {
			version: 1,
			dateKey: parsed.dateKey,
			dateLabel: parsed.dateLabel,
			dayNumber: Math.max(1, Math.floor(parsed.dayNumber)),
			currentMile: Number.isFinite(parsed.currentMile) ? Math.max(0, parsed.currentMile) : 0,
			direction: parsed.direction,
			trailName: cleanTrailName(parsed.trailName),
			mood: parsed.mood as CampfireMood,
			note: parsed.note.trim().slice(0, CAMPFIRE_NOTE_MAX_CHARS),
			includeWeather: parsed.includeWeather,
			updatedAt: parsed.updatedAt
		};
	} catch {
		return null;
	}
}

export async function loadCampfirePostcardDraft(
	persistence: PersistenceAdapter
): Promise<CampfirePostcardDraft | null> {
	return parseCampfirePostcardDraft(await persistence.get(CAMPFIRE_DRAFT_KEY));
}

export async function saveCampfirePostcardDraft(
	persistence: PersistenceAdapter,
	draft: CampfirePostcardDraft
): Promise<void> {
	await persistence.set(CAMPFIRE_DRAFT_KEY, JSON.stringify(draft));
}

export function isTodaysCampfireDraft(draft: CampfirePostcardDraft, now = new Date()): boolean {
	return draft.dateKey === localDateKey(now);
}

export function localDateKey(date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function cleanTrailName(value: string | undefined): string | undefined {
	const cleaned = value?.replace(/\s+/gu, ' ').trim().slice(0, 40);
	return cleaned || undefined;
}
