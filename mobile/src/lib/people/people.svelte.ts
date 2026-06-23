import { browser } from '$app/environment';
import { syncEngine } from '../cloud/syncEngine.svelte';

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

/** Digits (+ leading '+') only — a tel:/sms: target the OS will accept. */
export function dialString(phone: string): string {
	const trimmed = phone.trim();
	const plus = trimmed.startsWith('+') ? '+' : '';
	return plus + trimmed.replace(/[^0-9]/g, '');
}

export interface PeopleGroup {
	id: string;
	name: string;
	members: Person[];
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
