export const PEOPLE_INVITE_CODE_PARAM = 'hcInvite';
export const PEOPLE_INVITE_GROUP_PARAM = 'hcGroup';
export const PEOPLE_INVITE_APP_URL = 'https://app.hoggcountry.com/';

export type PeopleInviteGroupId = 'family' | 'tramily';

export interface PeopleInvite {
	groupId: PeopleInviteGroupId;
	shareCode: string;
}

export function dialString(phone: string): string {
	const trimmed = phone.trim();
	const plus = trimmed.startsWith('+') ? '+' : '';
	return plus + trimmed.replace(/[^0-9]/g, '');
}

export function normalizeShareCode(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, '');
}

export function normalizeInviteGroupId(raw: string | null | undefined): PeopleInviteGroupId {
	return raw === 'tramily' ? 'tramily' : 'family';
}

export function buildPeopleInviteUrl(input: {
	groupId: string;
	shareCode: string;
	baseUrl?: string;
}): string {
	const url = new URL(input.baseUrl ?? PEOPLE_INVITE_APP_URL);
	url.searchParams.set(PEOPLE_INVITE_CODE_PARAM, normalizeShareCode(input.shareCode));
	url.searchParams.set(PEOPLE_INVITE_GROUP_PARAM, normalizeInviteGroupId(input.groupId));
	return url.toString();
}

export function buildPeopleInviteText(input: {
	groupName: string;
	shareCode: string;
	inviteUrl: string;
}): string {
	return [
		`Join my Hoggcountry ${input.groupName.toLowerCase()} map: ${input.inviteUrl}`,
		`Invite code: ${normalizeShareCode(input.shareCode)}`
	].join('\n');
}

export function buildPeopleInviteSmsHref(input: { phone?: string; message: string }): string {
	const target = input.phone ? dialString(input.phone) : '';
	return `sms:${target}?&body=${encodeURIComponent(input.message)}`;
}

export function parsePeopleInviteUrl(rawUrl: string): PeopleInvite | null {
	try {
		const url = new URL(rawUrl);
		const shareCode = normalizeShareCode(url.searchParams.get(PEOPLE_INVITE_CODE_PARAM) ?? '');
		if (shareCode.length < 8) return null;
		return {
			groupId: normalizeInviteGroupId(url.searchParams.get(PEOPLE_INVITE_GROUP_PARAM)),
			shareCode
		};
	} catch {
		return null;
	}
}

export function stripPeopleInviteUrl(rawUrl: string): string {
	try {
		const url = new URL(rawUrl);
		url.searchParams.delete(PEOPLE_INVITE_CODE_PARAM);
		url.searchParams.delete(PEOPLE_INVITE_GROUP_PARAM);
		const query = url.searchParams.toString();
		return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
	} catch {
		return rawUrl;
	}
}
