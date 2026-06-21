# iOS TestFlight build 5 state

Checked at: 2026-06-21T15:26:03Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Repo SHA: `9ab36e452bc528af57c8e8307de9c546aa0a62a9`
- Uploaded build: `1.0` (`5`)
- Build id: `3e2c90ff-d3dc-4d8f-afa7-8fe292ff8dde`
- Processing state: `VALID`
- External beta state: `WAITING_FOR_BETA_REVIEW`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-21T15-20-34-857Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-21T15-20-34-857Z/`

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- App Store Connect upload/export: passed

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Build `5` is attached to Dad Pilot.
- Build `4` was removed from Dad Pilot.
- Public link: not enabled yet.
- Dad tester: `jimmy@hoggs.net`

## Build 4 review cleared

- Build `4` external beta state after removal: `READY_FOR_BETA_SUBMISSION`
- Build `4` remains removed from Dad Pilot.
- Removal path: App Store Connect UI `Remove from Review` on the build `4` TestFlight detail page.

## Current blocker

Build `5` was submitted for external Beta App Review at 2026-06-21T15:26:03Z:

- Submission API status: `201 Created`
- Submission id: `3e2c90ff-d3dc-4d8f-afa7-8fe292ff8dde`
- Build `5` external beta state: `WAITING_FOR_BETA_REVIEW`

Next action: wait for Apple to approve build `5` for external testing. When build `5` is externally approved, enable the Dad Pilot public link with a limit of 5 and send that TestFlight link to Chris.
