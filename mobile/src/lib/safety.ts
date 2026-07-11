import type { CheckInRecord, CheckInStatus, SupportContact } from './types';

const CHECK_IN_FALLBACK_NOTES: Record<CheckInStatus, string> = {
	safe: 'Still on plan and moving well.',
	delayed: 'Taking a lighter day and protecting recovery.',
	'need-help': 'Need human review on the next move.'
};

export function isoHoursFromNow(hours: number, now = new Date()): string {
	return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function nextCheckInHours(status: CheckInStatus): number {
	return status === 'need-help' ? 1 : 4;
}

export function createCheckInRecord(input: {
	status: CheckInStatus;
	note: string;
	mile: number;
	now?: Date;
	id?: string;
}): CheckInRecord {
	const timestamp = (input.now ?? new Date()).toISOString();
	const note = input.note || CHECK_IN_FALLBACK_NOTES[input.status];

	return {
		id: input.id ?? crypto.randomUUID(),
		timestamp,
		location: `Mile ${input.mile.toFixed(1)}`,
		mile: input.mile,
		status: input.status,
		note
	};
}

export function missedCheckInRisk(input: {
	nextCheckInDueAt: string;
	onlineStatus: boolean;
	now?: Date;
}): 'low' | 'medium' | 'high' {
	const now = input.now ?? new Date();
	const hoursUntilDue = (new Date(input.nextCheckInDueAt).getTime() - now.getTime()) / (60 * 60 * 1000);

	if (!input.onlineStatus && hoursUntilDue < 1.5) return 'high';
	if (hoursUntilDue < 2) return 'medium';
	return 'low';
}

export function normalizeSupportContact(contact: SupportContact): SupportContact | null {
	const name = contact.name.trim();
	if (!name) return null;
	const phone = contact.phone?.trim() || undefined;

	return {
		name,
		role: contact.role.trim() || 'Emergency contact',
		method: contact.method.trim() || (phone ? 'Text / call' : 'Reference'),
		phone,
		email: contact.email?.trim() || undefined
	};
}

export function reachableSupportContacts(contacts: SupportContact[]): SupportContact[] {
	return contacts.filter((contact) => !!contact.phone);
}

export function removeSupportContactByName(contacts: SupportContact[], name: string): SupportContact[] {
	return contacts.filter((contact) => contact.name !== name);
}

export function buildHelpSms(input: {
	contacts: SupportContact[];
	currentMile: number;
	trailName?: string;
	fallbackTrailName?: string;
}): { href: string; recipients: SupportContact[] } | null {
	const recipients = reachableSupportContacts(input.contacts);
	if (!recipients.length) return null;

	const mile = input.currentMile.toFixed(1);
	const name = input.trailName?.trim() || input.fallbackTrailName || 'Hiker';
	const body = `${name} needs help on the AT. Near mile ${mile}. Sent from Hogg Country Trail Assistant.`;
	const numbers = recipients
		.map((contact) => (contact.phone ?? '').replace(/[^+\d]/g, ''))
		.filter(Boolean);
	const href = `sms:${numbers.join(',')}?&body=${encodeURIComponent(body)}`;

	return { href, recipients };
}

export interface EmergencyShareFix {
	latitude: number;
	longitude: number;
	fixedAt: string | null;
	accuracyM: number | null;
}

export function buildEmergencyShareText(input: {
	currentMile: number;
	trailName?: string;
	preparedAt: Date;
	fix: EmergencyShareFix | null;
}): { text: string; usedCoordinates: boolean; cachedFix: boolean } {
	const fix = input.fix;
	const fixIsValid = Boolean(
		fix &&
			Number.isFinite(fix.latitude) &&
			Number.isFinite(fix.longitude) &&
			Math.abs(fix.latitude) <= 90 &&
			Math.abs(fix.longitude) <= 180
	);
	const name = input.trailName?.trim() || 'Hiker';
	const preparedAtMs = input.preparedAt.getTime();
	const preparedAt = Number.isFinite(preparedAtMs)
		? input.preparedAt.toISOString()
		: 'unavailable';
	const mile = Number.isFinite(input.currentMile) ? input.currentMile.toFixed(1) : 'unavailable';
	const fixedAtMs = fix?.fixedAt ? Date.parse(fix.fixedAt) : Number.NaN;
	const cachedFix = fixIsValid && Number.isFinite(fixedAtMs) && Number.isFinite(preparedAtMs)
		? preparedAtMs - fixedAtMs > 60_000
		: false;
	const lines = [`${name} needs help.`, `Draft time (UTC): ${preparedAt}.`];

	if (fixIsValid && fix) {
		const latitude = fix.latitude.toFixed(5);
		const longitude = fix.longitude.toFixed(5);
		lines.push(
			`GPS fix${cachedFix ? ' (cached)' : ''}: ${latitude}, ${longitude}.`,
			`GPS fix time (UTC): ${fix.fixedAt ?? 'unavailable'}.`,
			`GPS accuracy: ${fix.accuracyM === null ? 'unknown' : `about ${Math.round(fix.accuracyM)} m`}.`,
			`Map: https://maps.google.com/?q=${latitude},${longitude}`
		);
	} else {
		lines.push('GPS fix unavailable.');
	}

	lines.push(
		`Last saved AT mile (may be stale): ${mile}.`,
		'Scout cannot send this or confirm delivery. It is not 911 or satellite SOS.'
	);

	return {
		text: lines.join('\n'),
		usedCoordinates: fixIsValid,
		cachedFix
	};
}
