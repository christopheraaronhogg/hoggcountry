# Hogg Country Mobile Pilot

This is the Father's Day trail assistant pilot app. It is a SvelteKit static app wrapped by Capacitor, with a local Scout runtime and cached field-pack support.

The current pilot target is simple: Dad can open the app, load a trail-ahead field pack, keep using that pack offline, and see Scout answers with receipts and caveats.

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
