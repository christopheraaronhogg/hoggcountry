# Dad TestFlight Handoff

Goal: send Dad a real iOS TestFlight install for the native Hogg Country app
without publishing publicly in the App Store.

## Current State

- Dad Pilot is live through external TestFlight at
  `https://testflight.apple.com/join/BagBCrzf`.
- App Store Connect app id `6782505691` and bundle id
  `com.hoggcountry.trailassistant` are verified.
- Build `1.0 (9)` is in Dad Pilot and approved for external testing, but it was
  archived before the latest Scout Eval Lab final-proof gates on `main`.
- The iOS project is now prepared as build `1.0 (10)` for the next TestFlight
  upload. Use build `10` for the next Dad Eval Lab pass.
- iOS Release signing is configured with team `3CFU9J87A5` and the
  `Hoggcountry App Store Connect` provisioning profile.
- The repeatable upload command is:

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

Per the repo working notes, the signed TestFlight upload itself remains Chris's
manual/account-bound step. Run `npm --prefix mobile run cap:sync:ios` before
archiving if web/mobile source changed after this handoff.

## Correct TestFlight Path

For Dad as a normal known tester, use **external TestFlight**. Apple allows up to
10,000 external testers, but the first external build needs TestFlight App Review
before Dad can install it. This is not public App Store release.

Internal TestFlight is only for App Store Connect users on your Apple Developer
team. Use it only if you deliberately add Dad as a team user; otherwise do not
call Dad an internal tester in the launch plan.

## Account Steps

1. Confirm the current source is clean and the build number is still higher
   than the latest TestFlight build:

```bash
git status --short
xcodebuild -showBuildSettings -workspace mobile/ios/App/App.xcworkspace -scheme App -configuration Release | rg -n "MARKETING_VERSION|CURRENT_PROJECT_VERSION|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PROVISIONING_PROFILE_SPECIFIER"
```

2. Run the local gates and sync web assets into iOS:

```bash
npm --prefix mobile run check
npm --prefix mobile test
npm --prefix mobile run cap:sync:ios
```

3. Upload build `10` with the repeatable TestFlight command above.
4. In App Store Connect, wait for build `1.0 (10)` to reach `VALID`.
5. Attach build `10` to the existing `Dad Pilot` external group and remove the
   older build so Dad sees only the latest.
6. If Apple asks for Beta App Review again, submit the build and wait for
   approval. Later TestFlight builds often skip a full review, but do not assume
   that until App Store Connect says the build is available.
7. Ask Dad to update/install through the public TestFlight link, open Settings,
   verify the Eval Lab shows `TestFlight ready`, run `Run 100`, and Share the
   JSON export back for import/review.

## Proof To Capture

- Signing proof: selected team id, `security find-identity` result, and
  `DEVELOPMENT_TEAM` build setting.
- Upload proof: `docs/launch/proof/ios-testflight-attempt-*.md` from the
  successful `--upload` run plus a build-state proof like
  `docs/launch/proof/ios-testflight-build-10-2026-06-26.md`.
- App Store Connect proof: build `10` processed, beta review state, Dad Pilot
  membership, public link enabled, and older build removal if applicable.
- Release ledger proof: update `docs/launch/release-evidence.json` only after
  upload/processing and Dad Pilot attachment are proven.
- Dad-ready proof: Dad can install/update from the TestFlight link, the Eval Lab
  preflight says `TestFlight ready`, the model downloads/runs locally, the full
  100-question export imports cleanly, and every reviewed answer reaches 5/5.
