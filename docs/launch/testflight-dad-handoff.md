# Dad TestFlight Handoff

Goal: send Dad a real iOS TestFlight install for the native Hogg Country app
without publishing publicly in the App Store.

## Current State

- Dad Pilot is live through external TestFlight at
  `https://testflight.apple.com/join/BagBCrzf`.
- App Store Connect app id `6782505691` and bundle id
  `com.hoggcountry.trailassistant` are verified.
- Build `1.0 (13)` is in Dad Pilot, Apple beta review is approved, and App
  Store Connect reports external state `IN_BETA_TESTING`.
- Dad Pilot now lists only build `13`; build `12` was removed from the tester
  group after build `13` became available.
- Next native candidate `1.0 (14)` is prepared locally with the latest Scout
  Eval Lab export handoff copy and a fresh `cap:sync:ios` pass, but it is **not
  uploaded, processed, or attached to Dad Pilot yet**. Current prep proof:
  `docs/launch/proof/ios-testflight-build-14-prep-2026-06-27.md`.
- The Scout Eval Lab proof target is build `13`, because the eval handoff now
  records source-evidence gaps and final proof requires a TestFlight iPhone
  install on build `13` or newer before a 100-question device run can count as
  Dad proof.
- iOS Release signing is configured with team `3CFU9J87A5` and the
  `Hoggcountry App Store Connect` provisioning profile.
- Native upload proof for build `13`: `check`, unit tests, `cap:sync:ios`,
  archive, export, and App Store Connect upload passed on 2026-06-27:
  `docs/launch/proof/ios-testflight-attempt-2026-06-27T02-39-27-165Z.md`.
- Dad Pilot/App Store Connect proof for build `13`:
  `docs/launch/proof/ios-testflight-build-13-2026-06-27.md`.
- The repeatable upload command for the next build is:

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

Per the repo working notes, signed TestFlight upload remains an account-bound
step. Run `npm --prefix mobile run cap:sync:ios` before archiving if web/mobile
source changed after this handoff.

## Correct TestFlight Path

For Dad as a normal known tester, use **external TestFlight**. Apple allows up to
10,000 external testers, but the first external build needs TestFlight App Review
before Dad can install it. This is not public App Store release.

Internal TestFlight is only for App Store Connect users on your Apple Developer
team. Use it only if you deliberately add Dad as a team user; otherwise do not
call Dad an internal tester in the launch plan.

## Account Steps

1. Confirm the current source is clean and the build number is still higher
   than the latest TestFlight build. As of this handoff, local Xcode targets
   `1.0 (14)` and Dad Pilot is still on `1.0 (13)`:

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

3. Upload build `14` with the repeatable TestFlight command above.
4. In App Store Connect, wait for the new build to reach `VALID`.
5. Attach the new build to the existing `Dad Pilot` external group, submit beta
   review when App Store Connect reports `READY_FOR_BETA_SUBMISSION`, and remove
   the older build only after the new build is approved/available. The
   repeatable API helper for this step is read-only by default:

```bash
npm run refresh:testflight-dad-pilot
```

   After App Store Connect shows the target build as valid, attach it, submit
   beta review if needed, and refresh the local release ledger with:

```bash
npm run refresh:testflight-dad-pilot -- \
  --attach \
  --submit-review \
  --remove-previous \
  --update-release-evidence \
  --proof-out docs/launch/proof/ios-testflight-build-<next-build>-$(date +%F).md
```

6. Ask Dad to update/install through the public TestFlight link, open Settings,
   verify the Eval Lab shows
   `TestFlight ready`, run `Run 100`, and Share the JSON export back for
   import/review. Save or drag the shared JSON into
   `data/scout-local-ai/inbox/`, then prepare the review with:

```bash
npm run prepare-review:scout-local-ai-device-run -- --run inbox
```

   If the JSON lands as copied text or in the macOS clipboard, receive it
   directly instead of hand-making the inbox file:

```bash
npm run receive:scout-local-ai-device-run -- --clipboard
```

   For pasted/stdin JSON:

```bash
pbpaste | npm run receive:scout-local-ai-device-run -- --stdin
```

   If Chris is waiting while Dad sends the export, the guarded watcher can stay
   open and prepare the review automatically when a final-ready `Run 100` JSON
   lands in the repo inbox or Downloads:

```bash
npm run wait:scout-local-ai-device-run
```

While rating the generated Markdown packet, preview progress without writing the
review JSON:

```bash
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md
```

For a case-by-case pass, add `--next` to the status command so it opens the next
unrated answer, then update only that packet case after the answer has actually
earned the rating:

```bash
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --case DLA-001 --rating 5 --mark-all-pass
```

After each successful `rate-case` update, use the printed `Next focused check`
command. It reruns `review-status` with `--next`, so the review naturally moves
to the next unrated case and then loops back through any below-5 fixes.

## Proof To Capture

- Signing proof: selected team id, `security find-identity` result, and
  `DEVELOPMENT_TEAM` build setting.
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-27T02-39-27-165Z.md`
  from the successful `--upload` run.
- Candidate prep proof: build `14` local target bump plus `cap:sync:ios`
  completion. Current prep proof:
  `docs/launch/proof/ios-testflight-build-14-prep-2026-06-27.md`.
- App Store Connect proof: build `13` processed, beta review state, Dad Pilot
  membership, public link enabled, and build `12` removal after build `13` is
  available. Current uploaded proof:
  `docs/launch/proof/ios-testflight-build-13-2026-06-27.md`.
- Release ledger proof: update `docs/launch/release-evidence.json` only after
  upload/processing and Dad Pilot attachment are proven.
- Dad-ready proof: Dad can install/update from the TestFlight link, the Eval Lab
  preflight says `TestFlight ready`, the model downloads/runs locally, the full
  100-question export imports cleanly, and every reviewed answer reaches 5/5.
