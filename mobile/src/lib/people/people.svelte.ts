import { browser } from '$app/environment';
import { syncEngine } from '../cloud/syncEngine.svelte';
import {
	dialString,
	normalizeShareCode,
	normalizeInviteGroupId,
	parsePeopleInviteUrl,
	type PeopleInviteGroupId
} from './invite';

export {
	PEOPLE_INVITE_APP_URL,
	PEOPLE_INVITE_CODE_PARAM,
	PEOPLE_INVITE_GROUP_PARAM,
	buildPeopleInviteSmsHref,
	buildPeopleInviteText,
	buildPeopleInviteUrl,
	dialString,
	normalizeShareCode,
	parsePeopleInviteUrl,
	stripPeopleInviteUrl
} from './invite';

// Phase 1 of "Life360 for the tramily". A person is a member of a group; only
// members who are actively sharing a live position get a map avatar. Right now
// the one real on-trail position is the hiker (injected live from trailState);
// people you add are real names you invite, shown as "following" until the
// SpacetimeDB live-location sync (which already powers Trail Pulse) lands and
// fills in their `mile`/`lastSeen`.

export type PersonStatus = 'on-trail' | 'following' | 'invited';

export interface Person {
	id: string;
	name: string;
	tint: number; // index into AVATAR_TINTS
	mile: number | null; // live trail mile, or null when not sharing a position
	lastSeen: string | null; // ISO timestamp of the last position, when shared
	phone?: string; // for one-tap call / text via the phone's own apps
	self?: boolean; // the device owner
}

export interface PeopleGroup {
	id: string;
	name: string;
	members: Person[];
	// Live-location sharing (Phase 3). shareCode is the high-entropy SpacetimeDB
	// group code (the bearer secret you text to family); sharing = "broadcast my
	// live position to this group". Both back up with the roster.
	shareCode?: string;
	sharing?: boolean;
}

/** A high-entropy, unguessable group code — the bearer secret that grants access
 *  to a live group (like a Life360 invite link). Never derive it from the group
 *  name/id, which would be guessable. */
export function generateShareCode(): string {
	const bytes = new Uint8Array(12);
	if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
		throw new Error('Secure random is unavailable on this device, so a private share code cannot be created.');
	}
	try {
		crypto.getRandomValues(bytes);
	} catch {
		throw new Error('Secure random is unavailable on this device, so a private share code cannot be created.');
	}
	const base32 = 'abcdefghijkmnpqrstuvwxyz23456789';
	let code = '';
	for (const b of bytes) code += base32[b & 31];
	return `hc-${code}`;
}

// Avatar ring colours, mode-agnostic (read on both themes).
export const AVATAR_TINTS = ['#2f4b35', '#aa6843', '#5f8090', '#b8860b', '#6a845f', '#8a5a83'];

export function personStatus(p: Person): PersonStatus {
	if (p.mile != null) return 'on-trail';
	if (p.lastSeen != null) return 'following';
	return 'invited';
}

export function personInitial(name: string): string {
	return (name.trim()[0] || '?').toUpperCase();
}

const STORE_KEY = 'hc-people-v1';

function defaultGroups(): PeopleGroup[] {
	return [
		{ id: 'family', name: 'Family', members: [] },
		{ id: 'tramily', name: 'Tramily', members: [] }
	];
}

function loadGroups(): PeopleGroup[] {
	if (!browser) return defaultGroups();
	try {
		const raw = localStorage.getItem(STORE_KEY);
		if (!raw) return defaultGroups();
		const parsed = JSON.parse(raw) as PeopleGroup[];
		if (!Array.isArray(parsed) || !parsed.length) return defaultGroups();
		return parsed;
	} catch {
		return defaultGroups();
	}
}

class PeopleStore {
	#groups = $state<PeopleGroup[]>(loadGroups());
	activeGroupId = $state<string>('family');
	sheetOpen = $state(false);

	get groups(): PeopleGroup[] {
		return this.#groups;
	}

	get activeGroup(): PeopleGroup {
		return this.#groups.find((g) => g.id === this.activeGroupId) ?? this.#groups[0];
	}

	#persist() {
		if (!browser) return;
		try {
			localStorage.setItem(STORE_KEY, JSON.stringify(this.#groups));
		} catch {
			/* storage may be unavailable */
		}
		// Mirror the family/tramily roster (names, phones, tints) to the cloud
		// backup so it restores on a new phone. Live positions are deliberately
		// excluded here — those flow through the realtime SpacetimeDB layer.
		syncEngine.enqueue('people-groups', 'me', this.#groups);
	}

	#nextTint(group: PeopleGroup): number {
		// Tint 0 (forest, the brand colour) is reserved for the device hiker, so
		// invited members read as distinct from "you".
		const used = new Set(group.members.map((m) => m.tint));
		for (let i = 1; i < AVATAR_TINTS.length; i++) if (!used.has(i)) return i;
		return 1 + (group.members.length % (AVATAR_TINTS.length - 1));
	}

	addPerson(groupId: string, name: string, phone?: string): void {
		const trimmed = name.trim();
		if (!trimmed) return;
		const group = this.#groups.find((g) => g.id === groupId);
		if (!group) return;
		group.members.push({
			id: crypto.randomUUID(),
			name: trimmed,
			tint: this.#nextTint(group),
			mile: null,
			lastSeen: null,
			phone: phone?.trim() || undefined
		});
		this.#persist();
	}

	setPhone(groupId: string, personId: string, phone: string): void {
		const member = this.#groups.find((g) => g.id === groupId)?.members.find((m) => m.id === personId);
		if (!member) return;
		member.phone = phone.trim() || undefined;
		this.#persist();
	}

	removePerson(groupId: string, personId: string): void {
		const group = this.#groups.find((g) => g.id === groupId);
		if (!group) return;
		group.members = group.members.filter((m) => m.id !== personId);
		this.#persist();
	}

	/**
	 * Replace the roster with a restored cloud copy (the inverse of the backup in
	 * #persist). Returns whether it applied; a non-array is rejected so a malformed
	 * document never wipes the roster. Persists locally afterward. Called only by
	 * the cloud restore orchestrator under the last-write-wins policy.
	 */
	applyRestored(groups: unknown): boolean {
		if (!Array.isArray(groups) || groups.length === 0) return false;
		this.#groups = groups as PeopleGroup[];
		if (!this.#groups.some((g) => g.id === this.activeGroupId)) {
			this.activeGroupId = this.#groups[0].id;
		}
		this.#persist();
		return true;
	}

	/** Generate (once) and return this group's shareable code. */
	ensureShareCode(groupId: string): string | undefined {
		const group = this.#groups.find((g) => g.id === groupId);
		if (!group) return undefined;
		if (!group.shareCode) {
			group.shareCode = generateShareCode();
			this.#persist();
		}
		return group.shareCode;
	}

	/** Turn live-location sharing on/off for a group (the liveLocation coordinator
	 *  reacts to this flag to join/leave + publish/stop). Turning on mints a code. */
	setSharing(groupId: string, on: boolean): void {
		const group = this.#groups.find((g) => g.id === groupId);
		if (!group) return;
		if (on && !group.shareCode) group.shareCode = generateShareCode();
		group.sharing = on;
		this.#persist();
	}

	/** Adopt a code a family member shared, so this device joins the SAME live
	 *  group. Returns false if the code looks invalid. */
	joinWithCode(groupId: string, rawCode: string): boolean {
		const group = this.#groups.find((g) => g.id === groupId);
		if (!group) return false;
		const code = normalizeShareCode(rawCode);
		if (code.length < 8) return false;
		group.shareCode = code;
		group.sharing = true;
		this.#persist();
		return true;
	}

	/** Consume a share link from SMS/Web Share and open this device into the same
	 *  private group. The link only carries the group bearer code; server membership
	 *  is still created by this device's own SpacetimeDB identity. */
	acceptInviteLink(rawUrl: string): boolean {
		const invite = parsePeopleInviteUrl(rawUrl);
		if (!invite) return false;
		const groupId: PeopleInviteGroupId = normalizeInviteGroupId(invite.groupId);
		const accepted = this.joinWithCode(groupId, invite.shareCode);
		if (accepted) this.activeGroupId = groupId;
		return accepted;
	}

	setActiveGroup(id: string): void {
		this.activeGroupId = id;
	}
	openSheet(): void {
		this.sheetOpen = true;
	}
	closeSheet(): void {
		this.sheetOpen = false;
	}
}

export const people = new PeopleStore();
