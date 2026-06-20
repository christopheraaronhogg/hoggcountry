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
