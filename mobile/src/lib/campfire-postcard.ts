import type { CachedWeather } from './scout/types.ts';

export const CAMPFIRE_NOTE_MAX_CHARS = 600;

export const CAMPFIRE_MOODS = [
	{ value: 'grateful', label: 'Grateful', line: 'Grateful for today.' },
	{ value: 'strong', label: 'Strong', line: 'Feeling good about the miles.' },
	{ value: 'tired', label: 'Tired', line: 'Worn out and ready for camp.' },
	{ value: 'hard-day', label: 'Hard day', line: 'Today was hard.' }
] as const;

export type CampfireMood = (typeof CAMPFIRE_MOODS)[number]['value'];

export interface CampfirePostcardInput {
	dayNumber: number;
	currentMile: number;
	direction: 'NOBO' | 'SOBO';
	dateLabel: string;
	mood: CampfireMood;
	note: string;
	trailName?: string;
	weather?: CachedWeather | null;
}

export interface CampfirePostcard {
	title: string;
	trailLine: string;
	directionLabel: string;
	summary: string;
	moodLine: string;
	note: string;
	weatherLine: string | null;
	signature: string;
	shareText: string;
}

export interface CampfireShareHost {
	share?: (data: { title: string; text: string }) => Promise<void>;
	clipboard?: { writeText: (text: string) => Promise<void> };
}

export type CampfireShareOutcome =
	| 'share-sheet-closed'
	| 'copied'
	| 'cancelled'
	| 'unavailable'
	| 'failed';

export function normalizeCampfireNote(value: string): string {
	return value
		.replace(/\r\n?/gu, '\n')
		.replace(/[^\S\n]+/gu, ' ')
		.replace(/\n{3,}/gu, '\n\n')
		.trim()
		.slice(0, CAMPFIRE_NOTE_MAX_CHARS);
}

export function buildCampfirePostcard(input: CampfirePostcardInput): CampfirePostcard {
	const dayNumber = Math.max(1, Math.floor(input.dayNumber));
	const mile = Number.isFinite(input.currentMile) ? Math.max(0, input.currentMile) : 0;
	const dateLabel = input.dateLabel.trim() || 'Tonight';
	const title = `Campfire Postcard · ${dateLabel}`;
	const trailLine = `Day ${dayNumber} · Mile ${formatMile(mile)}`;
	const directionLabel = input.direction === 'SOBO' ? 'Southbound' : 'Northbound';
	const summary = `${trailLine} · ${directionLabel}`;
	const moodLine =
		CAMPFIRE_MOODS.find((mood) => mood.value === input.mood)?.line ?? CAMPFIRE_MOODS[0].line;
	const note = normalizeCampfireNote(input.note);
	const weatherLine = input.weather ? formatSavedForecast(input.weather) : null;
	const trailName = input.trailName?.replace(/\s+/gu, ' ').trim().slice(0, 40);
	const signature = trailName ? `— ${trailName}` : '— From the trail';
	const reflection = [moodLine, note].filter(Boolean).join('\n');
	const shareText = [
		'Campfire postcard from Hogg Country',
		`${summary}\n${dateLabel}`,
		reflection,
		weatherLine,
		signature,
		'A personal trail snapshot. This shares an approximate trail mile, not live GPS tracking.'
	]
		.filter((section): section is string => Boolean(section))
		.join('\n\n');

	return {
		title,
		trailLine,
		directionLabel,
		summary,
		moodLine,
		note,
		weatherLine,
		signature,
		shareText
	};
}

export async function shareCampfirePostcard(
	host: CampfireShareHost,
	postcard: Pick<CampfirePostcard, 'title' | 'shareText'>
): Promise<CampfireShareOutcome> {
	if (host.share) {
		try {
			await host.share({ title: postcard.title, text: postcard.shareText });
			return 'share-sheet-closed';
		} catch (error) {
			if (isShareCancellation(error)) return 'cancelled';
		}
	}

	if (host.clipboard) {
		try {
			await host.clipboard.writeText(postcard.shareText);
			return 'copied';
		} catch {
			return 'failed';
		}
	}

	return host.share ? 'failed' : 'unavailable';
}

function formatMile(mile: number): string {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(mile);
}

function formatSavedForecast(weather: CachedWeather): string {
	const savedAt = formatSavedDate(weather.forecastUpdatedAt ?? weather.generatedAt);
	const summary = weather.summary.trim().replace(/^NWS\s+/iu, '');
	const date = savedAt ? ` from ${savedAt}` : '';
	return `Saved forecast for around mile ${formatMile(weather.mile)}${date} · check before relying on it: ${weather.highF}° / ${weather.lowF}° · ${summary}`;
}

function formatSavedDate(value: string | null | undefined): string {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric'
	}).format(date);
}

function isShareCancellation(error: unknown): boolean {
	return (
		typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
	);
}
