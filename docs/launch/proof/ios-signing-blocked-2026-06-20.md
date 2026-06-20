# iOS signing blocker proof

Checked at: 2026-06-20T19:39:19Z
Checked by: Codex on Chris Hogg's local checkout
Repo SHA: cf4dbc807bbcdbddc827b5714dfa9de39c7c4c35

## Commands

```bash
security find-identity -v -p codesigning
ls -la "$HOME/Library/MobileDevice/Provisioning Profiles"
xcrun devicectl list devices
xcodebuild -workspace mobile/ios/App/App.xcworkspace -scheme App -showBuildSettings | /opt/homebrew/bin/rg -n "DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PRODUCT_BUNDLE_IDENTIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION"
```

## Output summary

```text
security find-identity -v -p codesigning
     0 valid identities found

ls -la "$HOME/Library/MobileDevice/Provisioning Profiles"
no profiles directory entries returned

xcrun devicectl list devices
No devices found.

xcodebuild selected settings
CODE_SIGN_STYLE = Automatic
CURRENT_PROJECT_VERSION = 1
MARKETING_VERSION = 1.0
PRODUCT_BUNDLE_IDENTIFIER = com.hoggcountry.trailassistant
```

No `DEVELOPMENT_TEAM` setting was present in the Xcode build settings output.

## Blocking action

Before an App Store archive/upload can be proven, Xcode needs a Chris-owned Apple Developer Team/signing identity for the `App` target. After that is configured, rerun:

```bash
cd mobile
npm run release:proof
```

Then archive/upload from Xcode or the chosen CI lane and attach the non-secret archive/upload proof to `apple-archive-upload`.
