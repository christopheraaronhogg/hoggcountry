# iOS TestFlight build 3 state

Checked at: 2026-06-21T14:42:37Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Uploaded build: `1.0` (`3`)
- Build id: `61615b00-b0df-4d64-aad6-8330c64bf2a2`
- Processing state: `VALID`
- External beta state: `READY_FOR_BETA_SUBMISSION`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-21T14-36-45-831Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-21T14-36-45-831Z/`

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Build `3` is attached to Dad Pilot.
- Build `2` was removed from Dad Pilot to avoid sending Dad the stale map build.
- Public link: not enabled yet.
- Dad tester: `jimmy@hoggs.net`

## Current blocker

Apple still has build `2` (`7f5f5216-7145-4839-b7ed-dcab3702ea41`) in external beta review:

- Build `2` external beta state: `WAITING_FOR_BETA_REVIEW`
- Build `2` beta review submission state: `WAITING_FOR_REVIEW`
- App Store Connect API rejected build `3` beta submission with `ENTITY_UNPROCESSABLE.ANOTHER_BUILD_IN_REVIEW`.
- The API does not allow deleting `betaAppReviewSubmissions`; Apple returns `FORBIDDEN_ERROR` and says allowed operations are `CREATE`, `GET_COLLECTION`, and `GET_INSTANCE`.

Next action: once Apple finishes build `2` beta review, submit build `3` for Beta App Review. When build `3` is externally approved, enable the Dad Pilot public link with a limit of 5 and send that TestFlight link to Chris.
