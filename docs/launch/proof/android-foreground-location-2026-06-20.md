# Android foreground location permission proof

Verified at: 2026-06-20T19:58:40Z
Verified by: Codex on Chris Hogg's local checkout
Repo SHA before commit: 37c06e653e643b84cb07fac583e463fce9c644a6

## What changed

The Android build now declares foreground location permission so existing user-initiated GPS paths can work on Android:

- manual "Update from GPS" current-mile snap
- Trail Pulse trail-mile calculation
- opt-in auto-log mileage when Trail-mile reports and Auto-log mileage are both enabled

The build does **not** declare background location. Raw GPS coordinates remain on-device and are not transmitted in Trail Pulse reports.

## Commands

```bash
cd mobile
set -a
. /Users/chrishogg/.hoggcountry/trail-assistant/android/upload-keystore.env
set +a
npm run android:release-bundle

rg -n "ACCESS_FINE_LOCATION|ACCESS_COARSE_LOCATION|ACCESS_BACKGROUND_LOCATION" \
  mobile/android/app/build/intermediates -g 'AndroidManifest.xml'

shasum -a 256 mobile/android/app/build/outputs/bundle/release/app-release.aab
jarsigner -verify -verbose -certs mobile/android/app/build/outputs/bundle/release/app-release.aab
```

## Output summary

```text
npm run android:release-bundle
BUILD SUCCESSFUL
AAB: mobile/android/app/build/outputs/bundle/release/app-release.aab

generated release manifests:
ACCESS_COARSE_LOCATION present
ACCESS_FINE_LOCATION present
ACCESS_BACKGROUND_LOCATION absent

AAB SHA256:
18e5da5081909db84bbf8d34fcf53c04adfe1bb8a92102cefb76acfe4fa646e6

jarsigner:
jar verified.
```

## Disclosure alignment

Updated the launch privacy/store docs to say Android may read a foreground, user-granted GPS fix on-device for trail-mile snapping, while Play/App Store labels still declare raw precise coordinates as not collected/shared because they are not transmitted or stored off-device.
