# Hogg Country Mobile — the primary product

The Hogg Country app for Dad's 2026 NOBO thru-hike. **One SvelteKit static build, two delivery shells:** native **iOS** (Capacitor → TestFlight) and an installable **PWA** (the same `build/` served over HTTPS). 100% shared code — build once, ship both.

On top of the Scout field-pack core it has: offline-first cloud backup, live tramily/family location, on-device Scout (Gemma), the AT map, field guide, Bible, and gear.

## Architecture

```
src/lib/
  trailState.svelte.ts       # the central store (position, profile, checkins, docs, gear…)
  cloud/                     # cloud backup + restore
    sync-outbox.ts           #   PURE, unit-tested LWW core (etag dedup, reconcile, restore policy)
    syncEngine.svelte.ts     #   reactive outbox: drains to /api/v1/sync/push, restore-on-signin gate
    restore.ts               #   applies pulled docs back into the stores
    auth.svelte.ts, api.ts   #   Sanctum auth (invite-only), the /api/v1 client
  spacetime/connection.ts    # the ONE shared SpacetimeDB DbConnection (never build a second)
  people/                    # live tramily/family location (Life360-style)
    memberLocation.svelte.ts #   subscribe to sender-scoped views + publish position
    liveLocation.ts          #   coordinator: reconciles server roster ↔ desired sharing
  trailPulseSpacetime.ts, waterReportSpacetime.ts   # other features on the shared connection
src/service-worker.ts        # PWA offline cache (versioned)
static/manifest.webmanifest  # PWA install manifest + icons
```

- **Cloud backup + restore** (opt-in, off until sign-in): the outbox decomposes durable state into per-entity docs (profile, position, settings, checkins, loadout, documents, people) and pushes to the Laravel **`/api/v1/sync/*`** API (document-level last-write-wins). Restore pulls `/sync/bootstrap` on sign-in. Accounts are **invite-only** (a shared launch-invite credential; public registration is gated off). The pure LWW + restore logic is unit-tested in `cloud/sync-outbox.test.ts`.
- **Live tramily/family location**: rides SpacetimeDB. `group_member`/`group_position` are **server-private** tables; clients read only the sender-scoped views `my_group_positions` / `my_group_members` (a non-member sees nothing). Group code = high-entropy bearer secret (invite-link model). Module: `apps/openclaw-web/spacetimedb/src/index.ts`.
- **PWA**: `manifest.webmanifest` + `service-worker.ts` make the same build installable + offline on the web. Hosted at `app.hoggcountry.com` (HTTPS required).

### Hard rules (each cost a real debugging session)

- **Exactly ONE SpacetimeDB `DbConnection`** for the whole app (`lib/spacetime/connection.ts`). Three separate connections (Trail Pulse, water, live location) was a boot "connection storm." Features register via `onSpacetimeConnect(...)` and call `connect()` for reducers.
- **Nothing heavy or looping on the boot/hydration path.** A SpacetimeDB connect burst in `+layout` boot saturated the iOS WebView during Svelte hydration → frozen prerendered "Day 1" screen, no taps. Connect lazily from the tab that uses it (live location connects in `MapTab.onMount`).
- Modal overlays must be `position: fixed` (not `absolute`) under `viewport-fit=cover`, or the sheet mis-anchors off-screen on iOS while its invisible scrim eats every tap. The viewport meta in `app.html` locks zoom (`maximum-scale=1, user-scalable=no`).
- Native plugins degrade gracefully on web so the PWA works (Preferences → localStorage, StatusBar/Gemma → no-op).
- `PUBLIC_`-prefixed env only reaches the build because `vite.config.ts` sets `envPrefix: ['VITE_','PUBLIC_']`.

---

The pilot target: Dad opens the app, loads a trail-ahead field pack, keeps using it offline, and sees Scout answers with receipts and caveats.

## Status

- Web/mobile shell builds locally.
- Field packs load from `https://hoggcountry.com/scout/field-pack` by default.
- The app caches the latest pack in browser/native preferences storage.
- The bundled pack remains as fallback if no remote or saved pack exists.
- Native iOS and Android Capacitor shells are committed for pilot installs.
- Android debug APK builds locally as the backup sideload path when iOS signing/device install blocks.

## Daily Pilot Checks

Run these from `mobile/` before a phone build:

```sh
npm run smoke:field-pack
npm run check
npm run build
```

Run this from the repo root when the public field-pack endpoint changed:

```sh
SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web
```

## Browser Smoke

```sh
npm run dev -- --host 127.0.0.1
```

Open the local Vite URL at a phone width and verify:

- Today shows pack-backed next water, shelter, and town context.
- Offline status shows pack source, receipts, loaded age, and regions.
- Refresh updates the pack when online.
- Scout answers show receipts, confidence, and safety/caveat chips.
- Failed refresh keeps the cached pack instead of dropping to empty state.

## Native Phone Prep

Sync the built web app into the native project:

```sh
npm run cap:sync:ios
npm run cap:sync:android
```

Open the platform project:

```sh
npm run cap:open:ios
npm run cap:open:android
```

For an iPhone pilot install, use Xcode after `cap:open:ios`:

- Pick the connected iPhone as the run target.
- Set Chris's Apple developer team/signing if Xcode asks.
- Build and run on device.
- After first online refresh, enable airplane mode and reopen the app to confirm the cached pack still drives Today and Scout.

For the Android backup path, build a debug APK:

```sh
npm run android:debug-apk
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`. To install directly when a USB-debugging Android phone is attached:

```sh
bash scripts/android-debug-apk.sh --install
```

For a Google Play upload candidate, build the Android App Bundle. This turns on the Gemma-only mobile policy so Scout chat cannot route to a cloud/API model:

```sh
npm run android:release-bundle
```

The bundle lands at `android/app/build/outputs/bundle/release/app-release.aab`. If upload signing is configured, provide the keystore through environment variables before building:

```sh
export HC_ANDROID_KEYSTORE_FILE=/absolute/path/to/upload-keystore.jks
export HC_ANDROID_KEYSTORE_PASSWORD=...
export HC_ANDROID_KEY_ALIAS=...
export HC_ANDROID_KEY_PASSWORD=...
npm run android:release-bundle
```

## Pilot Caveats

- Water is open-reference candidate data. Treat it as low-confidence until current flow/potability is confirmed.
- Shelter and town entries are open-data candidates, not guaranteed current logistics.
- Scout's local fallback is deterministic and receipt-bound; it is not a live emergency service.
- This is a Dad-ready pilot track, not an App Store release package.
