import type { TextHandoffOutcome } from './text-handoff.ts';

export const SAFE_CHECK_IN_DISCLOSURE =
	'“I’m safe” records this check-in on this phone and queues it for account backup when sync is available. It does not text or notify family.';

export const SAFE_CHECK_IN_RECORDED =
	'Recorded on this phone; backup queued for the next available account sync. Family was not notified.';

export function safeShareOutcomeNote(outcome: TextHandoffOutcome): string {
	if (outcome === 'share-handoff-complete') {
		return 'Returned from the share chooser. Scout cannot confirm anyone received anything.';
	}
	if (outcome === 'copied') return 'Safe update copied. Paste it into a message and send it yourself.';
	if (outcome === 'cancelled-or-no-target') {
		return 'Share did not complete or no target was available. Scout did not confirm anything was sent.';
	}
	return 'Sharing is unavailable. Call or message your support contact directly.';
}

export function helpShareOutcomeNote(outcome: TextHandoffOutcome): string {
	if (outcome === 'share-handoff-complete') {
		return 'Returned from the share chooser. Scout cannot confirm anyone received anything.';
	}
	if (outcome === 'copied') return 'Help details copied. Paste them into a message and send it yourself.';
	if (outcome === 'cancelled-or-no-target') {
		return 'Share did not complete or no target was available. The need-help check-in remains logged; Scout did not confirm anything was sent.';
	}
	return 'The need-help check-in is logged, but sharing is unavailable. Call, text, 911, or use your emergency device directly.';
}

export function buildCheckInShareText(input: {
	currentMile: number;
	trailName?: string;
}): { text: string } {
	const name = input.trailName?.trim() || 'Hiker';
	const mile = Number.isFinite(input.currentMile) ? input.currentMile.toFixed(1) : 'unavailable';
	const text = [
		`${name} checking in.`,
		`Last saved AT mile (may be stale): ${mile}.`,
		'Scout cannot send this or confirm delivery.'
	].join('\n');

	return { text };
}
