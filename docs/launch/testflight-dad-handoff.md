# Dad TestFlight Handoff

Goal: send Dad a real iOS TestFlight install for the native Hogg Country app
without publishing publicly in the App Store.

## Current State

- Native code path is ready for the signing lane: mobile check/test, Capacitor
  iOS sync, simulator build/run, and unsigned device Release compile have passed.
- `npm run ios:testflight -- --archive-only` currently stops at Apple signing:
  this Mac has no valid code-signing identity, no provisioning profiles, and no
  `DEVELOPMENT_TEAM` selected for the iOS App target.
- Xcode account preferences currently show no usable Apple Developer account.
- The repeatable upload command exists:

```bash
npm run ios:testflight -- --upload --team-id <TEAMID>
```

## Correct TestFlight Path

For Dad as a normal known tester, use **external TestFlight**. Apple allows up to
10,000 external testers, but the first external build needs TestFlight App Review
before Dad can install it. This is not public App Store release.

Internal TestFlight is only for App Store Connect users on your Apple Developer
team. Use it only if you deliberately add Dad as a team user; otherwise do not
call Dad an internal tester in the launch plan.

## Account Steps

1. Enroll or sign in to the Apple Developer Program.
2. In Xcode, add the Apple ID under Settings > Accounts.
3. In `mobile/ios/App/App.xcworkspace`, select the `App` target and choose the
   Chris-owned Team under Signing & Capabilities.
4. Confirm the team is now visible:

```bash
xcodebuild -workspace mobile/ios/App/App.xcworkspace -scheme App -showBuildSettings | rg -n "DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PROVISIONING_PROFILE|PRODUCT_BUNDLE_IDENTIFIER"
```

5. Upload the build:

```bash
npm run ios:testflight -- --upload --team-id <TEAMID>
```

6. In App Store Connect, create or verify the app record for bundle
   `com.hoggcountry.trailassistant`.
7. In TestFlight, create the required internal testing group, then create an
   external group named `Dad Field Pilot`.
8. Add the uploaded build to the external group, fill What to Test, and submit
   it for TestFlight App Review.
9. After approval, invite Dad by email or create a public link with tester limit
   `1`, copy that link, and send it to Chris.

## Proof To Capture

- Signing proof: selected team id, `security find-identity` result, and
  `DEVELOPMENT_TEAM` build setting.
- Upload proof: `docs/launch/proof/ios-testflight-attempt-*.md` from the
  successful `--upload` run.
- App Store Connect proof: app record exists, bundle id matches, TestFlight build
  processed, external group exists, and Dad email or limited public link is
  available.
- Release ledger proof: mark `apple-archive-upload` only after upload/processing
  is proven, and mark `dad-testflight-invite` only after the actual invite or
  limited public link exists.
- Dad-ready proof: Dad can install from the TestFlight link and the physical
  iPhone smoke pass covers first-run setup, model missing/download path, GPS
  allowed/denied, offline kill/relaunch, and one Scout answer if store copy
  claims on-device AI.
