# Android upload keystore proof

Date: 2026-06-20

Purpose: prove that the Google Play upload-key lane exists locally, the Gradle
release signing environment contract is configured, and a signed Android App
Bundle can be produced without committing signing secrets.

## Result

Verified for local release signing. The upload keystore and env file were
created outside the repository with owner-only permissions, then used by
`npm run android:release-bundle` to produce a signed release AAB.

This does not prove Play Console enrollment, Play App Signing enrollment,
internal testing upload, physical-device smoke, or production approval.

## Secret storage

- Keystore path: `/Users/chrishogg/.hoggcountry/trail-assistant/android/upload-keystore.jks`
- Env file path: `/Users/chrishogg/.hoggcountry/trail-assistant/android/upload-keystore.env`
- Env contract:
  - `HC_ANDROID_KEYSTORE_FILE`
  - `HC_ANDROID_KEYSTORE_PASSWORD`
  - `HC_ANDROID_KEY_ALIAS`
  - `HC_ANDROID_KEY_PASSWORD`
- File permissions observed: `-rw-------` for both the keystore and env file.
- Keystore and password are not committed to git.

## Upload certificate

```text
Alias name: hoggcountry-upload
Creation date: Jun 20, 2026
Entry type: PrivateKeyEntry
Owner: CN=Hogg Country Trail Assistant, OU=Trail Assistant, O=Hogg Country, L=Fayetteville, ST=Arkansas, C=US
Issuer: CN=Hogg Country Trail Assistant, OU=Trail Assistant, O=Hogg Country, L=Fayetteville, ST=Arkansas, C=US
Serial number: db5249c32f1e0932
Valid from: Sat Jun 20 14:16:38 CDT 2026 until: Wed Nov 05 13:16:38 CST 2053
SHA1: 8C:BC:AF:9F:84:AD:00:75:9C:88:68:7F:D0:FB:BE:2C:12:C1:16:BF
SHA256: 75:B0:DD:8C:19:FB:02:54:22:F7:F2:F8:02:53:3F:A1:48:4F:9E:3E:72:17:EA:7B:58:10:E3:65:6D:63:89:7C
Signature algorithm name: SHA384withRSA
Subject Public Key Algorithm: 4096-bit RSA key
```

## Signed AAB proof

```text
AAB: /Volumes/ChrisProjectsSSD/GitHub/hoggcountry/mobile/android/app/build/outputs/bundle/release/app-release.aab
Size: 27M
SHA256: 245e56a001b7c5a037ee91b3866b673c6406c8852e3dc9b5fe251ea9badc97ae
jarsigner: jar verified.
Signer: CN=Hogg Country Trail Assistant, OU=Trail Assistant, O=Hogg Country, L=Fayetteville, ST=Arkansas, C=US
Signature algorithm: SHA256withRSA, 4096-bit key
Signer certificate expires: 2053-11-05
```

The `jarsigner` self-signed certificate warnings are expected for a Google Play
upload key. Play App Signing will manage the app signing key after enrollment;
this proof covers the local upload key and signed bundle only.

## Commands

```bash
keytool -genkeypair -keystore "$HOME/.hoggcountry/trail-assistant/android/upload-keystore.jks" -storetype PKCS12 -alias hoggcountry-upload -keyalg RSA -keysize 4096 -validity 10000
source "$HOME/.hoggcountry/trail-assistant/android/upload-keystore.env"
cd mobile
npm run android:release-bundle
cd ..
shasum -a 256 mobile/android/app/build/outputs/bundle/release/app-release.aab
jarsigner -verify -verbose -certs mobile/android/app/build/outputs/bundle/release/app-release.aab
```
