# iOS TestFlight build 30 prep

Checked at: 2026-06-29T04:19:00Z

## Local candidate

- Local iOS target: `1.0 (30)`
- Previous Dad Pilot build: `1.0 (29)`
- Purpose: prepare a fresh latest-source TestFlight upload after native Scout source changed following the build `29` upload.

## What this proves

- `mobile/ios/App/App.xcodeproj/project.pbxproj` now targets build `30`.
- The Scout eval handoff keeps build `29` runnable for Dad's suite-compatible diagnostic Run 100.
- Build `30` is the next latest-source upload candidate.

## What this does not prove

This prep note does not prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local model
behavior, or 100/100 reviewed answers.

Build `29` remains the currently approved suite-compatible TestFlight build for
Dad's diagnostic Run 100 until App Store Connect proves build `30` is processed
and attached to Dad Pilot.

## Next commands

Upload build `30` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 30 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 30 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```
