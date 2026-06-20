# ☀️ Morning Brief — App Store + Google Play launch prep

**Date:** 2026-06-20 update  ·  **Branch:** `main`

## TL;DR
Everything that does **not** require your Apple/Google accounts, payment, a physical phone, or signature is **done and committed**: icons, launch screens, store screenshots (both stores, real build), full listing copy, privacy policy + both data-disclosure forms, native build/version config, Android upload signing proof, verified privacy/deletion mailbox, and live privacy/support/terms/data route proof.

**The long pole is Apple Developer signing.** This Mac currently has **0 valid code-signing identities**, no provisioning profiles, and no `DEVELOPMENT_TEAM` on the iOS `App` target. If you are **not already enrolled**, start Apple Developer Program enrollment first — Apple can take **a day or more** to approve, and nothing reaches an iPhone or TestFlight until it clears. Google Play Console ($25) is same-day. **If "submit today" matters, Apple signing/enrollment is the gate — do it first.**

---

## A) READY (prepped tonight, in the repo)

| Deliverable | Where | Notes |
|---|---|---|
| **App icon** (iOS 1024 no-alpha + Android adaptive/round/legacy, all densities, cream bg) | generated into `mobile/ios` + `mobile/android`; master at `docs/launch/icon/` | brand "boar on the ridge at sunset" emblem |
| **Launch screen / splash** (iOS + Android) | native projects | brand emblem on cream |
| **iOS screenshots** ×6 @ **1290×2796** | `docs/launch/screenshots/ios/` | Today, Map, Scout, Bible, Bible-Ask, Gear — native res, real M1 build |
| **Play screenshots** ×6 @ 1080×2160 + **feature graphic 1024×500** + **512 icon** | `docs/launch/screenshots/play/` | letterboxed to Play's aspect limit |
| **Framed marketing screenshots** (captioned, on brand background) | `…/screenshots/ios-framed/` + `…/play-framed/` | optional — use these *or* the raw set |
| **App Review notes** (both stores) | `docs/launch/store-copy/review-notes.md` | pre-empts the 2.6 GB-download / iOS-stub / foreground-service questions |
| **Apple listing copy** (name/subtitle/promo/keywords≤100/description/what's-new/category/age) | `docs/launch/store-copy/apple-app-store.md` | char limits verified |
| **Play listing copy** (title/short/full/category/IARC/ads/tags) | `docs/launch/store-copy/google-play.md` | char limits verified |
| **Privacy policy** (markdown + hostable HTML) | `docs/launch/privacy/privacy-policy.{md,html}` | grounded in real data flows |
| **Apple App Privacy + Play Data Safety answers** | `docs/launch/privacy/app-privacy-and-data-safety.md` | the field-by-field answers to type in |
| **Build/version config** | `docs/launch/config/build-config.md` + the native edits | see below |
| **Consistency review** | `docs/launch/CONSISTENCY-REVIEW.md` | 2 must-fixes found → both fixed |

**Config edits made tonight (committed):** iOS → iPhone-only, `ITSAppUsesNonExemptEncryption=false`, created `PrivacyInfo.xcprivacy`, location string (earlier). Android → `versionName 1.0.0`, brand icons + cream adaptive background. **Verified the LiteRT native libs are 16 KB-aligned** (Play's silent-rejection risk — cleared).

---

## B) Decisions

**Calls I made (reasonable defaults — override anytime):**
- **iPhone-only** (dropped iPad) — avoids owing iPad screenshots + iPad layout testing. Reversible (`TARGETED_DEVICE_FAMILY`).
- Privacy policy **effective date = June 18, 2026**.
- Privacy/support email published in launch docs and public pages: **chris.stitchscreen@gmail.com**. Gmail inbox receipt was verified on 2026-06-20.
- **App icon** = the boar-ridge-sunset emblem (a clean v1 mark; the boar is stylized — say the word and I'll refine or swap in a pro icon).

**Open decisions that need you (details in the docs, tagged `DECISION:`):**
1. **Store display name** — recommend **"Hogg Country: Trail"** (3 options in the Apple copy).
2. **iOS Scout AI at launch:** LiteRT-LM wiring is in progress through the local Swift package wrapper. Before claiming iOS AI in store metadata, prove model download + a real on-device Scout answer on a physical iPhone. *Android AI already works, pending the same physical smoke proof.*
3. **Check-ins:** v1 has **no network check-in** (logged on-phone only); copy reflects this. OK for launch?
4. **Categories:** Apple Navigation (+ Health & Fitness secondary) vs Play Maps & Navigation — reconcile if you want parity.

---

## C) The account-bound path to submit (only you can do these) — shortest path, in order

### 🍎 Apple — *start #1 immediately*
1. **Enroll in the Apple Developer Program** ($99/yr) → developer.apple.com. ⛔ **Long pole — approval can take 24–48h+.** *(If you already have a team, skip — just confirm you can sign in to App Store Connect.)*
2. **App Store Connect:** create the app (bundle `com.hoggcountry.trailassistant`); paste name/subtitle/keywords/description from the Apple copy doc; upload the 6 iOS screenshots (raw or framed); set category + age rating; add the **privacy policy URL** + **support URL**; fill **App Privacy** from the disclosures doc; set **Sign-in required = No** and paste the **App Review notes** (`review-notes.md`).
3. **On your Mac (with me, ~30 min):** open `mobile/ios` in Xcode, set **Signing Team**, verify the linked LiteRT Swift runtime on device, then **Product ▸ Archive ▸ upload**. `PrivacyInfo.xcprivacy` is already in the App target and the App scheme is already shared.
4. **TestFlight → Dad:** add him as an **internal tester** = instant install on his iPhone, no review. (Submit for App Review only when you want public release.)

### 🤖 Google Play
1. **Create a Play Console account** ($25 one-time) → play.google.com/console. Same-day.
2. **With me (~15 min):** generate the **upload keystore** (you keep the password), set `HC_ANDROID_*` env, build the signed AAB (`npm run android:release-bundle`).
3. **Play Console:** create the app; fill listing from the Play copy doc; upload screenshots + **feature graphic** + 512 icon; complete **Data Safety** from the disclosures doc; complete **IARC content rating**; file the **foreground-service (dataSync) declaration**; add the privacy policy URL.
4. **Internal testing → Dad:** upload the AAB, add Dad = instant install. Promote to Production when ready.

> **Fastest to Dad's phone:** TestFlight internal (Apple) / Internal testing (Play) — both skip full review. Apple needs enrollment first; that's the only thing standing between now and Dad having it.

---

## D) Things I can finish *with* your Mac/account (just ping me)
- iOS: signing config, device smoke, archive + upload.
- Verify the linked LiteRT Swift runtime and model download on iOS (per `docs/runbooks/ios-scout-gemma-bridge.md`).
- Generate the Android upload keystore + signed AAB.
- On-device verification that Scout produces a real answer (Android now; iOS after wiring).

## D2) Repeatable release proof
Run `cd mobile && npm run release:proof` to print the current proof ledger. Run
`npm run release:proof -- --next` to print unresolved gates with copyable
evidence stubs. Run
`npm run release:proof -- --strict` before archive/upload; strict mode stays red
until account, device, privacy/contact, and store-console proof exists. Details:
`docs/launch/release-proof.md`.

## E) Honest gaps / risks
- **iOS AI must be runtime-smoked on device before store metadata claims** (Android AI works, pending physical smoke proof). → Decision B-2.
- **Android can't read GPS** (no location permission) → location features no-op on Android; the disclosures are honest about this. Add the permission later if you want it live.
- **Screenshots are clean raw captures** (no marketing captions/device frames) — valid to submit; can be prettied later.
- **App icon** is a solid v1; refine the boar if you want more polish.
- **Model hosted on Hugging Face** (third-party) — fine for v1; consider your own host before scaling.

## Boundaries (respected)
Nothing submitted · no accounts created · no payment entered · no App Store Connect / Play Console record verified · no physical-device Scout/GPS/offline/accessibility proof captured yet.
