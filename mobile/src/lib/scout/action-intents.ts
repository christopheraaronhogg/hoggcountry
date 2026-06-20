import type { CheckInStatus } from '../types';
import { parseMileFromCheckIn, parseMileFromText } from './hike-profile.ts';

const CHECK_IN_LABELS: Record<CheckInStatus, string> = {
	safe: 'Safe',
	delayed: 'Delayed',
	'need-help': 'Need help'
};

export type TrailActionIntent =
	| {
			kind: 'position-update';
			mile: number;
			title: string;
			detail: string;
			confirmLabel: 'Update mile';
			prompt: string;
	  }
	| {
			kind: 'check-in';
			status: CheckInStatus;
			mile: number;
			note: string;
			movesPosition: boolean;
			title: string;
			detail: string;
			confirmLabel: 'Log check-in';
			prompt: string;
	  };

function checkInStatusFromText(text: string): CheckInStatus | null {
	const lower = text.toLowerCase();
	if (/\b(need help|need-help|emergency|injured|hurt|sos|rescue|bailing)\b/.test(lower)) {
		return 'need-help';
	}
	if (/\b(delayed|behind schedule|running late|short day|taking it slow|slowing down|resting up)\b/.test(lower)) {
		return 'delayed';
	}
	if (/\b(check ?in|checking in|i'?m safe|im safe|log me safe|all good|made camp|safe and sound)\b/.test(lower)) {
		return 'safe';
	}
	return null;
}

/**
 * Detect a Scout "Do" request in chat. This returns only a typed proposal; the
 * caller owns IDs and side effects so no hiker state changes until confirmation.
 */
export function detectTrailActionIntent(text: string, currentMile: number): TrailActionIntent | null {
	const status = checkInStatusFromText(text);

	// Pure position updates use the strict parser. Check-ins additionally accept
	// a bare "at mile N" locator, so "need help at mile 1442" keeps its location.
	const parsedMile = status ? parseMileFromCheckIn(text) : parseMileFromText(text);
	if (!status && parsedMile === null) return null;

	if (!status && parsedMile !== null) {
		return {
			kind: 'position-update',
			mile: parsedMile,
			title: 'Update your position',
			detail: `Move to mile ${parsedMile.toFixed(1)} (from mile ${currentMile.toFixed(1)})`,
			confirmLabel: 'Update mile',
			prompt: `Want me to set your position to mile ${parsedMile.toFixed(1)}? I won't change anything until you confirm below.`
		};
	}

	if (!status) return null;

	const mile = parsedMile ?? currentMile;
	const label = CHECK_IN_LABELS[status];
	const movesPosition = parsedMile !== null && Math.abs(parsedMile - currentMile) >= 0.05;
	return {
		kind: 'check-in',
		status,
		mile,
		note: text,
		movesPosition,
		title: `Log a "${label}" check-in`,
		detail: `Mile ${mile.toFixed(1)} · "${text}"`,
		confirmLabel: 'Log check-in',
		prompt: movesPosition
			? `Want me to mark you at mile ${mile.toFixed(1)} and log a "${label}" check-in? I won't record anything until you confirm below.`
			: `Want me to log a "${label}" check-in at mile ${mile.toFixed(1)}? I won't record anything until you confirm below.`
	};
}
