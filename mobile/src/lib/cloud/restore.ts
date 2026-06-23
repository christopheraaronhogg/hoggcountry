import { syncEngine } from './syncEngine.svelte';
import { trailAssistant } from '../trailState.svelte';
import { people } from '../people/people.svelte';
import type { RemoteDoc } from './sync-outbox';

// Phase 2 of the cloud-backup plan: RESTORE. The store-aware glue that turns the
// engine's restore pass (which owns the last-write-wins policy + cursor) into
// actual writes back into the local stores. Kept separate from the engine so the
// engine stays ignorant of individual stores (no import cycle): the engine calls
// these synchronous appliers; this module knows trailState + people.

const TRAIL_DOC_TYPES = new Set([
	'profile',
	'position',
	'settings',
	'support-circle',
	'loadout',
	'documents',
	'checkins'
]);

function applyRestoredDoc(doc: RemoteDoc): boolean {
	if (TRAIL_DOC_TYPES.has(doc.doc_type)) {
		return trailAssistant.applyRestoredDoc(doc.doc_type, doc.content);
	}
	if (doc.doc_type === 'people-groups') {
		return people.applyRestored(doc.content);
	}
	// Unknown doc type (e.g. written by a newer app version) — leave it untouched
	// in the cloud rather than adopt a shape this build doesn't understand.
	return false;
}

/**
 * Wire the cloud-restore applier into the sync engine. Call once at boot, BEFORE
 * starting the engine / restoring a session, so a sign-in that fires during boot
 * already has somewhere to apply the pulled documents.
 */
export function registerCloudRestore(): void {
	syncEngine.setRestoreProvider({
		apply: (doc) => applyRestoredDoc(doc),
		isFresh: () => trailAssistant.isFreshInstall
	});
}
