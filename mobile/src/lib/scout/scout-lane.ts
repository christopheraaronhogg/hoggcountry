import { browser } from '$app/environment';
import { isNativePlatform } from './capacitor-gemma-bridge.ts';

// Which Scout engine this delivery shell talks to. The PWA (a browser, not the
// Capacitor native shell) has no on-device Gemma engine, so it answers through
// the cloud lane; the iOS shell answers on-device. Evaluated once at load — the
// platform can't change at runtime — so it's safe to use in static UI copy.
//
// NOTE: this imports `$app/environment`, so only import it from Svelte
// components / runtime modules, never from anything pulled into node:test.
export const scoutUsesCloud: boolean = browser && !isNativePlatform();

/** Short engine label for mode tags / eyebrows, accurate on both shells. */
export const scoutLaneLabel: string = scoutUsesCloud ? 'Cloud Scout' : 'On-device Scout';
