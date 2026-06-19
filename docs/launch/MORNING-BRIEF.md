# ☀️ Morning Brief — App Store + Google Play launch prep

**Date:** 2026-06-18 (overnight)  ·  **Branch:** `scout-redesign`  ·  **Everything below is committed under `docs/launch/`.**

## TL;DR
Everything that does **not** require your Apple/Google accounts, payment, or signature is **done and committed**: icons, launch screens, store screenshots (both stores, real build), full listing copy, privacy policy + both data-disclosure forms, and the native build/version config. The consistency review passed after I fixed the last 2 issues.

**The long pole is Apple Developer Program enrollment.** If you are **not already enrolled**, start it the moment you wake up — Apple can take **a day or more** to approve, and *nothing* reaches an iPhone or TestFlight until it clears. Google Play Console ($25) is same-day. **If "submit today" matters, enrollment is the gate — do it first.**

---

## A) READY (prepped tonight, in the repo)

| Deliverable | Where | Notes |
|---|---|---|
| **App icon** (iOS 1024 no-alpha + Android adaptive/round/legacy, all densities, cream bg) | generated into `mobile/ios` + `mobile/android`; master at `docs/launch/icon/` | brand "boar on the ridge at sunset" emblem |
| **Launch screen / splash** (iOS + Android) | native projects | brand emblem on cream |
| **iOS screenshots** ×6 @ **1290×2796** | `docs/launch/screenshots/ios/` | Today, Map, Scout, Bible, Bible-Ask, Gear — native res, real M1 build |
| **Play screenshots** ×6 @ 1080×2160 + **feature graphic 1024×500** + **512 icon** | `docs/launch/screenshots/play/` | letterboxed to Play's aspect limit |
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
- Privacy/support email placeholder **privacy@hoggcountry.com** — *confirm this inbox exists/forwards.*
- **App icon** = the boar-ridge-sunset emblem (a clean v1 mark; the boar is stylized — say the word and I'll refine or swap in a pro icon).

**Open decisions that need you (details in the docs, tagged `DECISION:`):**
1. **Store display name** — recommend **"Hogg Country: Trail"** (3 options in the Apple copy).
2. **iOS Scout AI at launch:** ship iOS **offline-first now** with on-device AI as a fast-follow (recommended — the iOS LiteRT wiring needs your Mac), **or** wait and wire it first. If you ship before it's wired: keep the iOS description's "rolling out by platform" line and **drop the on-device-AI keywords from the *iOS* listing** (Apple 2.3.1 metadata accuracy). *Android AI already works.*
3. **Check-ins:** v1 has **no network check-in** (logged on-phone only); copy reflects this. OK for launch?
4. **Categories:** Apple Navigation (+ Health & Fitness secondary) vs Play Maps & Navigation — reconcile if you want parity.

---

## C) The account-bound path to submit (only you can do these) — shortest path, in order

### 🍎 Apple — *start #1 immediately*
1. **Enroll in the Apple Developer Program** ($99/yr) → developer.apple.com. ⛔ **Long pole — approval can take 24–48h+.** *(If you already have a team, skip — just confirm you can sign in to App Store Connect.)*
2. **App Store Connect:** create the app (bundle `com.hoggcountry.trailassistant`); paste name/subtitle/keywords/description from the Apple copy doc; upload the 6 iOS screenshots; set category + age rating; add the **privacy policy URL** + **support URL**; fill **App Privacy** from the disclosures doc.
3. **On your Mac (with me, ~30 min):** open `mobile/ios` in Xcode → set **Signing Team** → **add `PrivacyInfo.xcprivacy` to the App target** → mark the **App scheme "Shared"** → (optional) wire the **LiteRT Swift package** for live iOS AI → **Product ▸ Archive ▸ upload**.
4. **TestFlight → Dad:** add him as an **internal tester** = instant install on his iPhone, no review. (Submit for App Review only when you want public release.)

### 🤖 Google Play
1. **Create a Play Console account** ($25 one-time) → play.google.com/console. Same-day.
2. **With me (~15 min):** generate the **upload keystore** (you keep the password), set `HC_ANDROID_*` env, build the signed AAB (`npm run android:release-bundle`).
3. **Play Console:** create the app; fill listing from the Play copy doc; upload screenshots + **feature graphic** + 512 icon; complete **Data Safety** from the disclosures doc; complete **IARC content rating**; file the **foreground-service (dataSync) declaration**; add the privacy policy URL.
4. **Internal testing → Dad:** upload the AAB, add Dad = instant install. Promote to Production when ready.

> **Fastest to Dad's phone:** TestFlight internal (Apple) / Internal testing (Play) — both skip full review. Apple needs enrollment first; that's the only thing standing between now and Dad having it.

---

## D) Things I can finish *with* your Mac/account (just ping me)
- iOS: signing config, add the privacy manifest to the target, share the scheme, archive + upload.
- **Wire the LiteRT Swift package so iOS Scout AI runs** (per `docs/runbooks/ios-scout-gemma-bridge.md`) — needs the Xcode GUI.
- Generate the Android upload keystore + signed AAB.
- On-device verification that Scout produces a real answer (Android now; iOS after wiring).

## E) Honest gaps / risks
- **iOS AI is a stub until the Swift package is wired** (Android AI works). → Decision B-2.
- **Android can't read GPS** (no location permission) → location features no-op on Android; the disclosures are honest about this. Add the permission later if you want it live.
- **Screenshots are clean raw captures** (no marketing captions/device frames) — valid to submit; can be prettied later.
- **App icon** is a solid v1; refine the boar if you want more polish.
- **Model hosted on Hugging Face** (third-party) — fine for v1; consider your own host before scaling.

## Boundaries (respected)
Nothing submitted · no accounts created · no payment entered · **no merge to `main`** · no emails sent. All work is on `scout-redesign`.
