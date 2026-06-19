# Hogg Country Android Play Store Submission

## Current Target

- App name: `Trail Assistant`
- Package name: `com.hoggcountry.trailassistant`
- Version: `1.0.0` / version code `1`
- Android target SDK: `35`
- Release artifact: `mobile/android/app/build/outputs/bundle/release/app-release.aab`
- Model policy: Gemma 4 on-device only. No cloud/API model routing in Play release builds.
- Target SDK note: current public Play documentation requires API 35+. Re-check the next annual API window before final upload and move to API 36 if Play Console requires it.

## Build

From `mobile/`:

```sh
npm run android:release-bundle
```

For a signed upload bundle, set the upload keystore environment variables before building:

```sh
export HC_ANDROID_KEYSTORE_FILE=/absolute/path/to/upload-keystore.jks
export HC_ANDROID_KEYSTORE_PASSWORD=...
export HC_ANDROID_KEY_ALIAS=...
export HC_ANDROID_KEY_PASSWORD=...
npm run android:release-bundle
```

Do not commit keystores, passwords, Play Console exports, or private signing material.

## Required Before Production Submission

- Verify the native Android Gemma 4 engine through the `ScoutGemma` Capacitor plugin bridge on a physical device.
- Verify the approved Gemma 4 E2B LiteRT-LM model download on first run/on demand. The current E2B LiteRT-LM package is roughly 2.5 GB, so it is too large to ship inside the base app bundle or a normal Play asset-pack lane.
- Verify model download progress, resumable download, storage/RAM precheck, checksum verification, and a clear offline-ready state on device.
- Run a physical Android smoke test for first launch, field-pack refresh, offline reopen, and Scout answer latency.
- Review the current phone screenshots in `docs/launch/screenshots/play/` against the final signed build and recapture if the UI changed.
- Finalize privacy contact/deletion fields in Play Console; the policy text already says Scout uses on-device AI for chat and contacts Hogg Country only for field-pack/data refresh and user-initiated trail reports.
- Complete the Play Console foreground-service declaration for the user-initiated `dataSync` model download service.
- Create the Play upload key or enroll the app in Play App Signing, then build a signed AAB.

## Draft Listing Copy

Short description:

Trail-aware offline assistant for Appalachian Trail planning, check-ins, water, shelter, and town context.

Full description:

Trail Assistant is the Hogg Country field app for Appalachian Trail hikers. It keeps a compact trail-ahead field pack on your phone, shows water, shelter, town, mileage, and check-in context, and is being built around on-device Gemma 4 so core Scout answers can work without relying on a paid cloud model.

This early release is focused on a Dad pilot corridor and conservative source receipts. Water, shelter, and town entries are treated as field candidates unless verified from current sources. Trail Assistant is not an emergency service and does not replace official weather, land-manager, guidebook, or satellite communicator guidance.

## Data Safety Draft

- Location: optional, used on device to estimate trail context and attach user-submitted trail reports when the hiker chooses to submit them.
- App activity / messages: processed on device for Scout chat in Gemma-only builds.
- Network: used for field-pack refresh and user-initiated trail condition sync.
- No cloud/API model usage in the Play release build.
