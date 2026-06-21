# iOS TestFlight upload and Dad Pilot setup

Checked at: 2026-06-21T12:43:00Z

## Status

The iOS archive was uploaded to App Store Connect and processed successfully.

- App: Hoggcountry
- App Store Connect app id: `6782505691`
- Bundle id: `com.hoggcountry.trailassistant`
- Version/build: `1.0 (2)`
- Build id / delivery UUID: `7f5f5216-7145-4839-b7ed-dcab3702ea41`
- Processing state: `VALID`
- Internal TestFlight state: `READY_FOR_BETA_TESTING`
- External TestFlight state: `READY_FOR_BETA_SUBMISSION`

## Key handling

Chris downloaded the App Store Connect API private key to Downloads. Codex copied it to the standard local private-key folder outside the repo and locked permissions:

- Local key path: `~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8`
- Permissions: `0600`
- Private key contents were not committed.

The API issuer id was confirmed by a harmless App Store Connect `list-apps` probe. The valid issuer listed app id `6782505691`.

## Upload proof

The signed archive came from:

`/.scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/HoggCountry.xcarchive`

The archive's app Info.plist contained:

- `CFBundleIdentifier = com.hoggcountry.trailassistant`
- `CFBundleShortVersionString = 1.0`
- `CFBundleVersion = 2`

Upload command shape:

```bash
xcodebuild -exportArchive \
  -archivePath .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/HoggCountry.xcarchive \
  -exportPath .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/export-authenticated \
  -exportOptionsPlist .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/ExportOptions.plist \
  -allowProvisioningUpdates \
  -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  -authenticationKeyID T272T83N98 \
  -authenticationKeyIssuerID <app-store-connect-issuer-id>
```

Result:

```text
Uploaded App
** EXPORT SUCCEEDED **
```

Non-blocking warning:

```text
warning: exportArchive Upload Symbols Failed. The archive did not include a dSYM for the CLiteRTLM.framework
```

The Xcode ContentDelivery log reported:

```text
UPLOAD SUCCEEDED with no errors
Delivery UUID: 7f5f5216-7145-4839-b7ed-dcab3702ea41
Transferred 16642691 bytes
```

`xcrun altool --build-status --delivery-id 7f5f5216-7145-4839-b7ed-dcab3702ea41 --wait ...` returned:

```json
{
  "delivery-uuid": "7f5f5216-7145-4839-b7ed-dcab3702ea41",
  "build-status": "VALID"
}
```

## Dad Pilot TestFlight setup

Created an external beta group:

- Group name: `Dad Pilot`
- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Public link: disabled
- Feedback: enabled
- Attached build: `7f5f5216-7145-4839-b7ed-dcab3702ea41`

Created and attached Dad's tester record:

- Tester email: `jimmy@hoggs.net`
- Tester id: `b4d8c5b9-6a40-4a0d-b671-1a6cbad2ee76`
- Tester state after create: `NOT_INVITED`

The tester is not invited yet because external TestFlight requires Beta App Review before Apple can send the external invite for this build.

## Beta App Review submission

Chris provided the required App Store Connect review contact phone number. Codex applied it to the Beta App Review detail without committing the full phone number to git.

- Review contact: Chris Hogg
- Review email: `chris.stitchscreen@gmail.com`
- Review phone: ending in `5761`
- Demo account required: `false`

Apple then required a Beta App Description before submission. Codex created the `en-US` beta app localization with:

- Feedback email: `chris.stitchscreen@gmail.com`
- Marketing URL: `https://hoggcountry.com`
- Privacy policy URL: `https://hoggcountry.com/privacy`
- Beta description: offline-first Appalachian Trail pilot focused on Today, Trail Guide search, Scout model setup/honest unavailable states, Safety/SMS support circle, Docs, Bible search, and offline kill/relaunch behavior.

After adding those fields, App Store Connect accepted the Beta App Review submission:

```json
{
  "betaReviewState": "WAITING_FOR_REVIEW"
}
```

The build beta detail now reports:

```json
{
  "internalBuildState": "READY_FOR_BETA_TESTING",
  "externalBuildState": "WAITING_FOR_BETA_REVIEW"
}
```

Codex polled the build state three times after submission; it remained `WAITING_FOR_BETA_REVIEW`.

## Remaining Apple-side wait

The contact-phone blocker is resolved. Build `1.0 (2)` is submitted for external Beta App Review and is waiting on Apple.

Previous blocker, now resolved:

```json
{
  "status": "409",
  "code": "ENTITY_ERROR.ATTRIBUTE.REQUIRED",
  "detail": "You must provide a value for the attribute 'contactPhone' with this request"
}
```

Next action: wait for Apple to approve external Beta App Review. After approval, Dad's `jimmy@hoggs.net` TestFlight invite can be sent from the Dad Pilot group if it is not auto-sent.
