# iOS TestFlight build 15 prep

Checked at: 2026-06-27T08:49:20Z

## Local candidate

- Repo SHA before prep: `820f2c4860c5652f599418ed0472fc67b38c74bc`
- Local iOS target: `1.0 (15)`
- Dad Pilot currently verified on: `1.0 (13)`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the native Eval Lab keep-awake guard into the next TestFlight
  candidate so Dad's long `Run 100` is less likely to be interrupted by iPhone
  sleep while preserving build `13` as the current approved Dad Pilot build.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `14` to `15` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed.
- XcodeBuildMCP simulator build passed for workspace
  `mobile/ios/App/App.xcworkspace`, scheme `App`, simulator `iPhone 16e`.
  Build log:
  `/Users/chrishogg/Library/Developer/XcodeBuildMCP/workspaces/hoggcountry-7fc5a6f6fa21/logs/build_sim_2026-06-27T08-49-49-538Z_pid41854_a50dd821.log`.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local model
behavior, or 100/100 reviewed answers.

Build `13` remains the currently approved suite-compatible TestFlight build for
Dad. Build `15` is the latest-code candidate and needs the normal upload plus
Dad Pilot refresh before Dad can install that exact build from TestFlight.

## Next command

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```
