import { browser } from '$app/environment';
import { untrack } from 'svelte';
import { memberLocation } from './memberLocation.svelte';
import { people } from './people.svelte';
import { trailAssistant } from '../trailState.svelte';

// Phase 3 coordinator: the store-aware glue between the local people roster, the
// hiker's live mile, and the SpacetimeDB live-location store. Reacting to which
// groups have sharing ON, it joins/leaves those groups and publishes the hiker's
// mile to them; the memberLocation store (server-scoped views) handles what comes
// back. All no-ops when SpacetimeDB isn't configured.

let started = false;

function myTrailName(): string {
	return trailAssistant.hikeProfile.trailName?.trim() || 'Hiker';
}

export function registerLiveLocation(): void {
	if (started || !browser || !memberLocation.available) return;
	started = true;
	void memberLocation.start();

	$effect.root(() => {
		// Effect 1 — MEMBERSHIP reconciliation. Drives the server's roster to the
		// desired sharing set off memberLocation.myMembershipCodes (which tracks the
		// member roster, NOT positions) + connected + people.groups. So it self-heals
		// across offline toggles AND app relaunches: a leave dropped while offline is
		// re-issued the moment the connection + roster come back, and a group
		// de-selected across a restart is left once the server roster loads — "going
		// dark" is reliable, not trusted to an in-memory set. Deliberately does NOT
		// read positions, so another member's position update can't trigger it.
		$effect(() => {
			const desired = new Set(
				people.groups.filter((g) => g.sharing && g.shareCode).map((g) => g.shareCode as string)
			);
			const serverMemberships = memberLocation.myMembershipCodes;
			const connected = memberLocation.connected;
			const name = myTrailName();
			untrack(() => {
				if (!connected) return; // can't change server state offline; re-runs on reconnect
				for (const code of desired) {
					if (!serverMemberships.includes(code)) void memberLocation.joinGroup(code, name);
				}
				for (const code of serverMemberships) {
					if (!desired.has(code)) void memberLocation.leaveGroup(code);
				}
				if (!desired.size) void memberLocation.stopSharing(); // idempotent: go dark
			});
		});

		// Effect 2 — PUBLISH my own position. Reacts ONLY to my own mile + sharing +
		// connection, never to other members' positions, so two phones sharing the
		// same group can't ping-pong each other into a publish storm.
		$effect(() => {
			const sharing = people.groups.some((g) => g.sharing && g.shareCode);
			const connected = memberLocation.connected;
			const mile = trailAssistant.currentMile;
			const name = myTrailName();
			untrack(() => {
				if (connected && sharing) void memberLocation.publish(mile, name);
			});
		});
	});

	// Heartbeat: republish periodically so "last seen" stays fresh for family even
	// when the mile hasn't moved.
	setInterval(() => {
		const sharing = people.groups.some((g) => g.sharing && g.shareCode);
		if (sharing && memberLocation.connected) {
			void memberLocation.publish(trailAssistant.currentMile, myTrailName());
		}
	}, 60_000);
}
