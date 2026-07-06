import { browser } from '$app/environment';
import { apiRequest } from './api';
import { cloudAuth } from './auth.svelte';
import { createMobilePersistenceAdapter } from '../mobile-persistence';
import { SyncEngine } from './sync-engine-core.svelte';

export type { BackupStatus, RestoreApply, RestoreProvider } from './sync-engine-core.svelte';

export const syncEngine = new SyncEngine({
	browser,
	api: apiRequest,
	auth: cloudAuth,
	storage: browser ? createMobilePersistenceAdapter() : null,
	isOnline: () => browser && navigator.onLine,
	now: () => new Date().toISOString()
});
