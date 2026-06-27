# iOS TestFlight build 14 prep

Checked at: 2026-06-27T05:54:00Z

## Local candidate

- Repo SHA before prep: `8314256735764839e11ce7d9c8fa7cb82c02ff8c`
- Local iOS target: `1.0 (14)`
- Dad Pilot currently verified on: `1.0 (13)`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the latest Scout Eval Lab export handoff into the next native
  build, while keeping build `13` as the current approved Dad Pilot build until
  App Store Connect proves build `14` is uploaded, processed, reviewed, and
  attached.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `13` to `14` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed.
- The sync ran `npm run build`, mobile preflight, Capacitor iOS asset copy,
  CocoaPods install, and ScoutGemma plugin registration.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local model
behavior, or 100/100 reviewed answers.

Build `13` remains the currently approved suite-compatible TestFlight build for
Dad. Build `14` is the latest-code candidate and needs the normal upload plus
Dad Pilot refresh before Dad can install it from TestFlight.

## Next command

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```
