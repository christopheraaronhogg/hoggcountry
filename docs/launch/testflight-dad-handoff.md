# Dad TestFlight Handoff

Goal: send Dad a real iOS TestFlight install for the native Hogg Country app
without publishing publicly in the App Store.

## Current State

- Dad Pilot is live through external TestFlight at
  `https://testflight.apple.com/join/BagBCrzf`.
- App Store Connect app id `6782505691` and bundle id
  `com.hoggcountry.trailassistant` are verified.
- Build `1.0 (10)` is in Dad Pilot and approved for external testing, but it is
  now the previous Dad Pilot build.
- The next Scout Eval Lab proof target is build `11`, because the eval handoff
  now records source-evidence gaps and final proof requires a TestFlight iPhone
  install on build `11` or newer before a 100-question device run can count as
  Dad proof.
- Read-only App Store Connect API proof captured on 2026-06-27 shows build
  `1.0 (11)` is not found in App Store Connect yet, and Dad Pilot still lists
  build `10`. Proof:
  `docs/launch/proof/ios-testflight-build-11-not-found-2026-06-27.md`.
- iOS Release signing is configured with team `3CFU9J87A5` and the
  `Hoggcountry App Store Connect` provisioning profile.
- Native pre-upload readiness was refreshed again after the Scout Eval Lab
  stale-export guardrail landed: `check`, unit tests, `cap:sync:ios`, and the
  diagnose-only signing lane passed with no tracked native diffs. Current proof:
  `docs/launch/proof/ios-testflight-attempt-2026-06-27T01-38-52-730Z.md`.
- That latest diagnose-only proof did not include App Store Connect API-key
  auth, so the account-bound upload still needs the issuer id supplied through
  `APP_STORE_CONNECT_API_ISSUER_ID` or the `--asc-issuer-id` flag.
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

3. Upload build `11` with the repeatable TestFlight command above. The
   2026-06-27 API refresh could not find build `11`, so this upload/processing
   step must happen before any Dad Pilot attachment can succeed.
4. In App Store Connect, wait for the new build to reach `VALID`.
5. Attach the new build to the existing `Dad Pilot` external group and remove
   the older build only after the new build is approved/available.
   The repeatable API helper for this step is read-only by default:

```bash
npm run refresh:testflight-dad-pilot
```

   After App Store Connect shows build `11` as available for external testing,
   attach it and refresh the local release ledger with:

```bash
npm run refresh:testflight-dad-pilot -- \
  --attach \
  --remove-previous \
  --update-release-evidence \
  --proof-out docs/launch/proof/ios-testflight-build-11-$(date +%F).md
```

6. If Apple asks for Beta App Review again, submit the build and wait for
   approval. Later TestFlight builds often skip a full review, but do not assume
   that until App Store Connect says the build is available.
7. After build `11` is attached to Dad Pilot, ask Dad to update/install through
   the public TestFlight link, open Settings, verify the Eval Lab shows
   `TestFlight ready`, run `Run 100`, and Share the JSON export back for
   import/review.

## Proof To Capture

- Signing proof: selected team id, `security find-identity` result, and
  `DEVELOPMENT_TEAM` build setting.
- Pre-upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-27T01-38-52-730Z.md`
  shows build `11` signing/readiness diagnostics passed on the current source
  before the manual upload step.
- Upload proof: `docs/launch/proof/ios-testflight-attempt-*.md` from the
  successful `--upload` run plus a build-state proof like
  `docs/launch/proof/ios-testflight-build-11-2026-06-26.md`.
- App Store Connect proof: build `11` processed, beta review state, Dad Pilot
  membership, public link enabled, and build `10` removal after build `11` is
  available.
- Release ledger proof: update `docs/launch/release-evidence.json` only after
  upload/processing and Dad Pilot attachment are proven.
- Dad-ready proof: Dad can install/update from the TestFlight link, the Eval Lab
  preflight says `TestFlight ready`, the model downloads/runs locally, the full
  100-question export imports cleanly, and every reviewed answer reaches 5/5.
