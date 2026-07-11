import type { SupportContact } from './types';
import { reachableSupportContacts } from './safety.ts';

export const SAFE_CHECK_IN_DISCLOSURE =
	'“I’m safe” records this check-in on this phone and queues it for account backup when sync is available. It does not text or notify family.';

export const SAFE_CHECK_IN_RECORDED =
	'Recorded on this phone; backup queued for the next available account sync. Family was not notified.';

export function buildCheckInSmsDraft(input: {
	contacts: SupportContact[];
	currentMile: number;
	trailName?: string;
}): { href: string; recipients: SupportContact[] } | null {
	const reachable = reachableSupportContacts(input.contacts)
		.map((contact) => ({
			contact,
			number: (contact.phone ?? '').replace(/[^+\d]/g, '')
		}))
		.filter((entry) => entry.number.length > 0);
	if (!reachable.length) return null;

	const name = input.trailName?.trim() || 'Hiker';
	const body = `${name} checking in near AT mile ${input.currentMile.toFixed(1)}. This message is sent only when I tap Send.`;

	return {
		href: `sms:${reachable.map((entry) => entry.number).join(',')}?&body=${encodeURIComponent(body)}`,
		recipients: reachable.map((entry) => entry.contact)
	};
}
