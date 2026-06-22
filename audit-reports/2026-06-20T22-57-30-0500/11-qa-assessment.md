# QA Assessment Report

**Project:** Hoggcountry mobile hiker-critical flows
**Date:** 2026-06-20
**Consultant:** Codex QA Consultant
**Scope:** Fresh install, first-run setup, manual mile setting, GPS denied/manual fallback, Dad-mile/weather leak risk after hydration, Safety tab copy/mechanism, and state persistence across kill/relaunch.

## Executive Summary

The mobile code now has strong unit-level coverage for the recent "neutral starter, user-owned mile" direction. Fresh default state is neutral at mile 0, first-run setup is mandatory until the user chooses self-tracking or Dad-pilot mode, personal field-pack requests include `?mile=&direction=&personal=1`, and the server-side personal field-pack tests prove NWS weather is used when available and cached pilot weather is not substituted when NWS fails.

The main hiker-critical risk is stale context pack ownership. The app protects `trailAssistant.currentMile` from being overwritten by a remote pack in self mode, but Scout tools, weather UI, offline-region UI, and fallback answers still read from `fieldPack` directly. If a user was following Dad or has an old saved pilot pack, then switches to a manual/self mile while offline or while refresh fails, the UI can show the self mile while weather, offline region, loadout, and Scout answers still come from the cached pack.

QA maturity for this slice is **6.5/10**: good pure function and contract coverage, weak integrated runtime coverage. There is no actual clean-install or kill/relaunch simulator test proving Capacitor Preferences, hydration, and the Svelte store behave together on device.

## Commands Run

**PASS**

```bash
node --experimental-strip-types --experimental-transform-types --test mobile/src/lib/trail-state-defaults.test.ts mobile/src/lib/trail-state-persistence.test.ts mobile/src/lib/scout/hike-profile.test.ts mobile/src/lib/gps-mileage.test.ts mobile/src/lib/trail-position-service.test.ts mobile/src/lib/mobile-persistence.test.ts mobile/src/lib/safety.test.ts mobile/src/lib/scout/action-intents.test.ts scripts/scout-public-mobile-field-pack.test.mjs scripts/scout-mobile-offline-refresh.test.mjs scripts/mobile-privacy-contract.test.mjs scripts/mobile-trail-pulse-contract.test.mjs
```

Result: 78 tests passed, 0 failed.

**FAIL, concurrent dirty-file lane**

```bash
cd mobile && npm run check
```

Result: `svelte-check` found 1 error in `mobile/src/lib/scout/on-device-gemma.test.ts:85`. That file is already dirty and in the parallel model-download lane, so I did not treat it as this QA lane's product finding.

**NOT RUN**

Simulator build/kill/relaunch was not run. `xcodebuildmcp.session_show_defaults` showed no configured workspace, scheme, simulator, or bundle id.

## Findings

### High: Self-tracked users can still receive stale Dad/pilot field-pack weather and Scout answers

**Why it matters:** A hiker can see their own manual mile in the header but still get weather, water, region, or Scout chat answers centered on the cached pack mile. If that cached pack is Dad/pilot context, this is exactly the Dad-mile/weather leak the flow is supposed to eliminate.

**Evidence:**
- `mobile/src/lib/trailState.svelte.ts:261` ignores pack position for self-tracked users, but leaves the cached pack itself intact.
- `mobile/src/lib/trailState.svelte.ts:824` updates the self profile/current mile, then only calls `refreshFieldPack()` when online; offline or failed refresh keeps the old pack.
- `mobile/src/lib/scout/context-pack-store.ts:100` preserves the cached pack on refresh failure.
- `mobile/src/lib/components/TodayTab.svelte:28` and `mobile/src/lib/components/TodayTab.svelte:178` render `trailAssistant.fieldPack.weather` directly.
- `mobile/src/lib/scout/scout-runtime.ts:27` loads the store pack for answers, and `mobile/src/lib/scout/built-in-tools.ts:146`, `:165`, `:207`, `:237`, `:267`, `:304` default to `ctx.pack.hiker.currentMile`.
- `mobile/src/lib/scout/providers/deterministic-fallback.ts:119` builds answer headers from `pack.hiker.currentMile`.
- `mobile/src/lib/components/AccountTab.svelte:431` displays cached `fieldPackRegion`, which can still be `Dad trail-ahead ...`.

**Recommended fix:** On `calibrateHike({ mode: 'self' })` and `updateCurrentMile(...)`, immediately replace or sanitize the local context pack before any network refresh:
- set `pack.hiker.currentMile` and `direction` to the self profile,
- clear `weather` unless `Math.abs(weather.mile - currentMile)` is inside a small threshold,
- clear or mark water/shelter/town/loadout entries whose pack window does not bracket the self mile,
- replace Dad/pilot `downloadedRegions`, `pilotNotice`, and source receipts with a "personal pack pending refresh" state,
- persist that sanitized pack, then attempt remote refresh.

Add a regression test for "self profile + cached Dad pack + offline refresh failure" proving Today hides weather, OfflineStatus has no Dad region, and Scout answers do not say "from mile 1438" or use `cached-pilot` weather.

### Medium: Returning calibrated users can see first-run setup before async hydration completes

**Why it matters:** After kill/relaunch, Capacitor Preferences restore is async. The store starts from an uncalibrated default and `needsCalibration` does not check hydration, so a returning hiker can briefly see the setup sheet before persisted state loads.

**Evidence:**
- `mobile/src/lib/trailState.svelte.ts:120` tracks `#stateHydrated`.
- `mobile/src/lib/trailState.svelte.ts:182` starts async bootstrap from the constructor.
- `mobile/src/lib/trailState.svelte.ts:220` restores persisted state asynchronously.
- `mobile/src/lib/trailState.svelte.ts:493` returns `browser && !this.#state.hikeProfile.calibrated`, without `#stateHydrated`.
- `mobile/src/lib/trailState.svelte.ts:499` opens the sheet from `this.#hikeSetupOpen || this.needsCalibration`.

**Recommended fix:** Gate first-run UI on hydration, for example `browser && this.#stateHydrated && !this.#state.hikeProfile.calibrated`, and expose a small boot/skeleton state until hydration completes. Add a delayed-adapter test or simulator smoke that seeds Preferences with a calibrated profile and asserts the setup sheet never appears after relaunch.

### Medium: GPS permission denied is reported as a generic "clearer sky" failure

**Why it matters:** If iOS/Android location permission is denied, the hiker needs to know to use manual mile or enable OS permission. Current code discards the geolocation error and maps all no-position outcomes to "Couldn't get a GPS fix."

**Evidence:**
- `mobile/src/lib/trail-position-service.ts:157` resolves `null` for any `getCurrentPosition` error.
- `mobile/src/lib/gps-mileage.ts:61` reports "Couldn't get a GPS fix. Try again with a clearer view of the sky." for all `hasPosition: false` cases after the in-app precise-location toggle is on.
- `mobile/src/lib/gps-mileage.test.ts:132` covers failure reasons but has no permission-denied distinction.

**Recommended fix:** Capture `GeolocationPositionError.code` in `TrailPositionService.getCurrentPosition()` and return a typed failure reason from `resolveManualGpsMile()`. For permission denied, show "Location permission is denied. Set your mile manually or enable Location for Trail Assistant in system settings." Add unit tests for denied, timeout, unavailable, and off-trail cases.

### Medium: Manual "Set mile" is recorded as a check-in source

**Why it matters:** The Settings manual mile input changes location but does not log a check-in. The profile then says the mile came "from your last check-in," which is misleading in safety and support contexts.

**Evidence:**
- `mobile/src/lib/scout/hike-profile.ts:28` defines `MileSource = 'onboarding' | 'check-in' | 'gps' | 'pilot'`; no `manual` source exists.
- `mobile/src/lib/components/AccountTab.svelte:36` maps `'check-in'` to "from your last check-in."
- `mobile/src/lib/components/AccountTab.svelte:61` calls `trailAssistant.updateCurrentMile(mileDraft as number, 'check-in')` from the manual Set mile button.

**Recommended fix:** Add `manual` to `MileSource`, call `updateCurrentMile(..., 'manual')` from Settings, and label it "set manually." Keep chat/check-in intents on `check-in`. Update `hike-profile.test.ts` and `action-intents.test.ts`.

### Medium: No integrated kill/relaunch test exists for actual TrailAssistantStore + Capacitor Preferences

**Why it matters:** Current tests prove adapters and pure snapshot functions, but not the full Svelte store hydration sequence, first-run modal gating, context-pack cache, and UI rendering after an app kill/relaunch.

**Evidence:**
- `mobile/src/lib/mobile-persistence.test.ts` verifies the adapter behavior.
- `mobile/src/lib/trail-state-persistence.test.ts` verifies parse/snapshot repair.
- `scripts/scout-mobile-offline-refresh.test.mjs` verifies context-pack cache reload.
- No test boots the app, seeds native Preferences, kills/relaunches, and verifies mile/setup/weather UI.

**Recommended fix:** Add an automated simulator smoke or injectable store integration test:
1. clean install or clear app storage,
2. launch and assert setup sheet,
3. enter self mile 600.4 and add a support contact,
4. kill/relaunch,
5. assert setup sheet is absent, mile remains 600.4, support contact remains, and no Dad/pilot weather or region appears.

### Low: First-run "Start my hike" button appears enabled before a valid mile is entered

**Why it matters:** On a fresh install, the primary CTA can be tapped while the mile field is empty; it then silently stays on the sheet and only afterwards shows validation. This is confusing in the one mandatory setup step.

**Evidence:**
- `mobile/src/lib/components/HikeSetupSheet.svelte:24` computes `mileValid`.
- `mobile/src/lib/components/HikeSetupSheet.svelte:117` disables the CTA only when `saving || (touched && !mileValid)`, so the empty untouched form is clickable.

**Recommended fix:** Disable the CTA whenever `!mileValid || saving`, or keep it enabled but show validation immediately and move focus to the mile field.

## Verified Controls

- Fresh default state is neutral and uncalibrated, not Dad data: `mobile/src/lib/trail-state-defaults.ts:48` and `mobile/src/lib/trail-state-defaults.test.ts:17`.
- The bundled default pack is neutral at mile 0 with `weather: null`: `mobile/src/lib/scout/default-pack.ts:6` and `scripts/scout-mobile-runtime.test.mjs:28`.
- First-run setup has self setup and an explicit Dad-pilot path: `mobile/src/lib/components/HikeSetupSheet.svelte:30` and `:47`.
- Self-tracked profile position wins over pack position: `mobile/src/lib/scout/hike-profile.ts:222` and `mobile/src/lib/scout/hike-profile.test.ts:207`.
- Personal server field packs do not fall back to cached pilot weather on NWS failure: `scripts/scout-public-mobile-field-pack.test.mjs:182`.
- Safety copy accurately says "Need help" logs locally and only opens SMS, not 911/satellite SOS: `mobile/src/lib/components/SafetyTab.svelte:143`.
- SMS link construction returns `null` when no reachable contacts exist and encodes the current mile when contacts exist: `mobile/src/lib/safety.ts:72` and `mobile/src/lib/safety.test.ts:97`.

## QA Roadmap

1. Add the stale-pack self-mode regression first; it is the highest hiker-safety risk.
2. Gate setup on hydration and add a delayed-persistence test.
3. Split manual and check-in mile sources.
4. Improve GPS-denied error handling.
5. Add the simulator clean-install and kill/relaunch smoke once XcodeBuildMCP defaults are configured.
