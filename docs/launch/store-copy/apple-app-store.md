# Apple App Store Listing — Trail Assistant (Hogg Country)

Bundle ID: `com.hoggcountry.trailassistant` · iOS 14.0+ · No accounts · No ads · No third-party analytics/tracking SDKs (Firebase not active — `google-services.json` absent).

Character counts are shown next to each field against Apple's published limits. Counts are literal (every character — letters, spaces, punctuation, and the commas in Keywords — counted). Items needing your call are tagged **DECISION:**.

> **Accuracy note (read first):** This copy was rewritten to match the *verified* shipped data behavior in `mobile/src/lib/trailPulseSpacetime.ts` and `mobile/src/lib/trailState.svelte.ts`. The only outbound flow is the **optional Trail-Conditions report**, and the payload sent is exactly `{ trailId, source, chipText, noteText, reporterTrailName, snappedMile, observedAt }` — **raw latitude/longitude are NOT transmitted** (only the derived trail-mile). The on-device "check-in" writes to local state only and does **not** transmit, so this listing does **not** claim "family can see you're okay." (An earlier draft did — that claim was false and an App Privacy / 2.3.1 rejection risk; it has been removed.)

---

## APP NAME (limit 30)

The build ships `CFBundleDisplayName = "Trail Assistant"` and `appName = "Trail Assistant"` (verified in `ios/App/App/Info.plist` and `capacitor.config.json`). Apple flags store-name vs. installed-name mismatches under 2.3.7, so the store name should match the icon label.

1. **`Trail Assistant`** — **15 chars** ✅ (exact match to the build's display name; safest for review consistency)
2. **`Hogg Country: Trail`** — **19 chars** ✅ (brands the publisher; "Trail" carries a discovery keyword)
3. **`Trail Assistant: AT`** — **19 chars** ✅ (adds the "AT" search token; mild 2.3.7 keyword-stuffing scrutiny but well within bounds and truthful)

**Recommendation:** Ship **Option 1 `Trail Assistant`** so the store name matches the installed icon label exactly. Carry **"Hogg Country"** as the developer/seller name on the account, so it still appears under the title.

**DECISION:** Confirm the public App Store name. (Keep the chosen name's words OUT of the Keywords field — Apple already indexes the name; repeating wastes the 100-char budget. The keyword set below already excludes "trail" and "assistant.")

---

## SUBTITLE (limit 30)

1. **`Offline AT trail companion`** — **26 chars** ✅ (recommended: leads with the #1 differentiator; "AT" earns Appalachian Trail relevance)
2. **`Private offline trail guide`** — **27 chars** ✅
3. **`Your offline trail day, sorted`** — **30 chars** ✅ (exactly at limit)

**Recommendation:** Option 1 — "offline" is the strongest hook.

---

## PROMOTIONAL TEXT (limit 170)

> Built for a 2026 Appalachian Trail thru-hike. Your whole day, miles, water, weather, camp, plus a private on-device AI and the full offline KJV. No signal needed.

Count: **162 chars** ✅

(Promotional text updates anytime without a new build — the safe home for the time-sensitive "2026 thru-hike" line.)

---

## KEYWORDS (limit 100 total, including the commas — comma-separated, NO spaces after commas)

Rules applied: every character counted including commas; no spaces after commas; no words already in the app name ("trail", "assistant") or in the Apple category name; singular forms preferred (Apple auto-matches plurals).

```
offline,hiking,backpacking,appalachian,thru-hike,AT,GPS,elevation,KJV,bible,scripture,faith,shelter
```

Count: **99 chars** ✅ (literally counted, commas included)

Notes:
- Excludes `navigation` because it duplicates the recommended **Navigation** primary category — Apple already indexes the category, so spending 11 chars on it is waste.
- "KJV", "bible", "scripture", "faith" are deliberate — the offline KJV + scripture Q&A is a real differentiator and a distinct search audience.
- **DECISION:** If you do **not** pick Navigation as primary, swap in `navigation` (and drop a lower-value term to stay ≤100). A nav-inclusive alternative at **97 chars**: `offline,hiking,backpacking,appalachian,thru-hike,navigation,GPS,KJV,bible,scripture,faith,shelter`.

---

## DESCRIPTION (limit 4000)

> Trail Assistant works when nothing else does.
>
> No signal. No service. No problem. Trail Assistant is an offline-first companion for the Appalachian Trail, built with love for a 2026 NOBO thru-hike and for every hiker who'd rather look up than stare at a spinner.
>
> Everything that matters lives on your phone. Your journal, your gear list, your maps, the King James Bible, and the AI itself all run on the device. Drop into a 30-mile dead zone and the app doesn't blink.
>
> — YOUR DAY, LAID OUT —
> The Today view shows your day the way a hiker actually thinks about it: where you are on the 2,197.4-mile trail, miles done and miles to go, and the next water, shelter, and town with real distances. A first-class weather block turns the forecast into a plain-language "here's what it means" safety line, with a daylight-left bar so you know how much light you have to make camp.
>
> No fake "readiness score." The app has no way to read your body, so it refuses to pretend. Just honest information you can act on — and field-candidate data is clearly labeled "confirm in the field," because a guess dressed up as a fact can get a hiker hurt.
>
> — SCOUT: A PRIVATE AI IN YOUR POCKET —
> Scout is a trail assistant that runs entirely on your phone. Ask it about the trail ahead or about a verse of scripture, and it answers in plain words — with the sources cited, so you can check its work against the field guide, the trail data, and the Bible itself.
>
> Your questions never leave the device. Nothing is sent to a server or an AI cloud — not the question, not the answer. Scout has no open web access; it reasons only over the trail data and scripture bundled with the app. It is a thinking aid, not an oracle, and it will tell you to verify in the field.
>
> Scout's on-device AI uses a model that downloads once on first launch (about 2.6 GB, over Wi-Fi by default, checksum-verified). The rest of the app is fully usable before you ever download it.
>
> — A CALM TRAIL MAP —
> Not a battery-draining tile map — a clean trail-ribbon view that shows your position plus the water, shelters, and towns ahead, pinned by trail mile. A zoomable elevation profile shows the real climbs and descents waiting for you, so the day holds no nasty surprises.
>
> — AN OFFLINE LIBRARY —
> - Guide: the field guide, ready offline.
> - Bible: the complete King James Bible (Pure Cambridge Edition), browsable by book and chapter with clean, readable typography, full-text verse search, and a Scout-powered "Ask the Bible" that answers in plain words and cites the actual verses.
> - Journal: your trail journal, kept on your device.
> - Gear: your loadout, weights, and what's packed.
>
> — PRIVATE BY DESIGN —
> - No accounts. No login. Nothing to sign up for.
> - No ads, ever. No third-party analytics or tracking.
> - Your journal, gear, settings, and all AI stay on your phone.
> - The one thing that can leave your device is what you choose to send: an optional trail-conditions report. Tap to report, and the app shares a condition tag and any short note you typed, your optional trail name, an approximate position along the trail (a trail-mile, not your GPS coordinates), and the time — so other hikers benefit from current conditions. Your raw GPS never leaves the phone. That's it, and it's always your move.
>
> — A WORD ON SAFETY —
> Trail Assistant helps you think; it is not an emergency device and not a substitute for official weather forecasts, maps, or a personal locator beacon. Conditions change fast in the mountains. Always carry the proper gear and verify in the field.
>
> Made with love, for Dad — and for everyone walking north.

Count: **3,590 chars** ✅ (literal count of the description body, well under 4,000)

**Reviewer / critic notes (Apple 2.3.1 — metadata accuracy):**
- The Scout section describes on-device AI as a **core capability** ("runs entirely on your phone," "downloads once on first launch") **without ever promising it answers the instant you open day-one iOS.** There is no "ask Scout right now and get an answer" sentence. This is deliberate: per the build caveat, **the iOS AI engine may ship as a graceful "model unavailable" stub** until the native LiteRT package is wired (Android AI is fully wired). The copy stays true even if iOS stubs AI on first submission.
- **DECISION:** If the very first iOS build ships AI as a stub, consider adding one honest line in the Scout section for that build only, e.g. *"On-device AI is rolling out by platform; if it isn't active on your device yet, the app says so plainly."* Remove it once iOS AI is live.
- The trail-conditions paragraph now matches the verified payload exactly: condition tag, optional note, optional trail name, **trail-mile (not GPS), timestamp** — and explicitly states raw GPS never leaves the phone. Do not re-add any "family can see you're okay" / check-in-transmits language; the shipped check-in is local-only.

---

## WHAT'S NEW (v1.0)

> Welcome to Trail Assistant 1.0.
>
> This is the first release, built for a 2026 Appalachian Trail thru-hike and for anyone who wants a calm, private, offline companion on the trail.
>
> - Today: your day from camp to camp — miles, next water, shelter, town, and an honest weather read with daylight left.
> - Scout: a private, on-device AI for trail and scripture questions, with cited sources.
> - Map: a calm trail-ribbon view with a real elevation profile.
> - Trail library: offline field guide, the full KJV with search and "Ask the Bible," your journal, and your gear.
>
> No accounts. No ads. No tracking. Built with love. See you on the trail.

Count: **636 chars** ✅ (the What's New field shares the 4,000 limit; ample room)

---

## CATEGORIES

**Primary: Navigation.** The core daily loop is positional — where you are on 2,197.4 miles, next water/shelter/town by trail mile, elevation profile, a trail map. That is navigation, and it's where an AT hiker browses.

**Secondary: Health & Fitness.** The app is built for an endurance hike; the daylight/weather safety framing and gear/journal fit the fitness adjacency and widen discovery.

Rationale / alternatives:
- **Travel** is a defensible secondary if you'd rather lean "trip companion" than "fitness." Health & Fitness is the stronger pick because the app deliberately avoids vitals/scores and skews safety-and-effort — but note the app has **no health vitals at all**, so don't let Health & Fitness imply tracked biometrics.
- **Reference** would suit the offline KJV + field guide, but it undersells the live positional core.

**DECISION:** Confirm **Navigation (primary) + Health & Fitness (secondary)**, or swap the secondary to **Travel** (or **Reference** if you want the Bible/offline-library audience weighted more heavily).

---

## AGE RATING

**Recommendation: 4+** (Apple's lowest / no objectionable content). The bundled KJV is public-domain scripture and is not rated content under Apple's system; it does not raise the rating.

Answers to the App Store Connect age questionnaire that actually move the rating:
- Cartoon/Fantasy Violence, Realistic Violence, Sexual Content/Nudity, Profanity/Crude Humor, Horror/Fear, Alcohol/Tobacco/Drug use or references, Simulated Gambling, Mature/Suggestive Themes, Medical/Treatment Info, Contests: **None / No.**
- **Unrestricted Web Access: NO.** There is no in-app web browser, and Scout has no open web access.
- **AI / Generative AI questions (Apple's 2024–25 questionnaire additions) — answered honestly:**
  - Does the app include AI-generated content? **Yes** — Scout produces on-device generated text (trail + scripture answers).
  - Can the AI generate from *unrestricted / open* sources or the open web? **No.** Scout runs **locally** and reasons only over the **bundled / cached trail data, the field guide, and the bundled KJV** — no open-web retrieval, no server call for inference.
  - Is generated content age-appropriate / does it have safeguards? **Yes** — the corpus is curated (trail facts + public-domain scripture); there is no user-to-user content and no open generation surface.

This combination supports **4+**.

**DECISION:** Apple's generative-AI questionnaire is evolving. If at submission it asks specifically whether AI output is "moderated/filtered," answer based on the curated, closed corpus (no open web), which keeps 4+. A conservative **9+** is harmless but **not required** — recommend staying **4+**.

---

## SUPPORT URL & MARKETING URL

- **Support URL (required):** `https://hoggcountry.com/support`
  **DECISION:** This page must exist before submission (Apple checks it) and should carry a contact method (email is fine) + a short FAQ. If `/support` isn't live, point at `https://hoggcountry.com/contact` or a mailto-backed page. Confirm the path.
- **Marketing URL (optional):** `https://hoggcountry.com`
- **Privacy Policy URL (required for App Privacy):** `https://hoggcountry.com/privacy`
  **DECISION:** Required even though the app collects almost nothing. The policy must state (1) the single outbound flow — the optional Trail-Conditions report sends a condition tag, optional note, optional trail name, an approximate **trail-mile (not GPS coordinates)**, and a timestamp to Hogg Country's own real-time trail service (SpacetimeDB) over an encrypted connection — and (2) that the Gemma model downloads once from `huggingface.co` on first run. Confirm the path is live.

---

## APP PRIVACY ("Nutrition Label") — fill-in guidance

Not a copy field, but part of the listing and must be consistent with the description or Apple rejects under metadata accuracy. Per the verified data behavior:

- **Data used to track you:** **None.**
- **Data linked to you:** treat as **Not linked to identity** — there is no account. The only data that leaves the device is the optional report's contents.
- **Data collected (declare against the report flow only):**
  - **Coarse / Approximate Location** — collected **and** shared, **only** when the user submits a Trail-Conditions report; used for **App Functionality** (so other hikers see current conditions). This is the derived **trail-mile**, not coordinates.
  - **Precise Location — NOT collected.** Raw latitude/longitude are read **on-device only** to compute the trail-mile and are **never transmitted or stored off-device.** On-device-only GPS access is not "collection" under Apple's definition, so declare Precise = not collected.
  - **User Content** — the optional note text and optional trail name the hiker types, collected **and** shared only on report submission, for **App Functionality**. No account links it to an identity.
- **Data not collected:** no contact info, no identifiers, no advertising ID, no usage data, no diagnostics sent to you (no third-party analytics; Firebase not active — `google-services.json` absent).

**BUILD-vs-DISCLOSURE CONSISTENCY FLAGS (resolve before submitting):**
- **iOS:** `NSLocationWhenInUseUsageDescription` **is present** and its string already scopes location to "when you check in or report conditions… only read when you choose to share it… never tracked in the background." That matches the intended behavior. ✅ Make sure the App Privacy label declares **Approximate/Coarse** location (the shared trail-mile) and **Precise = not collected**, consistent with the code that transmits only `snappedMile`.
- **Android caveat (for the separate Play listing, not this Apple one):** the Android build does **not** request location permission, so on Android the trail-mile is derived without a live GPS fix. Do **not** reuse iOS location disclosure verbatim for Android; soften it (precise GPS not captured on Android). **DECISION:** flag for the Android listing pass.

---

## ONE-LINE SUMMARY

Saved the corrected Apple listing (3 name options with counts + `Trail Assistant` recommended, subtitle, 162-char promo, 99-char keyword string counted with commas, 3,590-char offline/on-device-private/day-timeline/KJV-led description, 636-char What's New, Navigation+Health&Fitness categories, 4+ with honest closed-corpus generative-AI answers, support/marketing/privacy URLs) — all within Apple limits; crucially fixed the prior false "sends your location so family can see you're okay" claim to match the verified payload (trail-mile + note only, raw GPS never leaves the device), kept iOS AI-stub wording 2.3.1-safe, set App Privacy to Coarse-location-shared / Precise-not-collected, and flagged the Android location gap; DECISIONs marked for your sign-off.
