# Trail Assistant — App Privacy & Data Safety Answers

App: **Trail Assistant** by Hogg Country
Bundle / Application ID: `com.hoggcountry.trailassistant`
Platforms: iOS 14+, Android 7.0+ (API 24)
Accounts: none (no login, no sign-up)
Ads / third-party analytics / tracking SDKs: none (no `google-services.json`; Firebase not active — verified)
On-device AI: Google Gemma via LiteRT, runs locally; **no prompt, question, or answer ever leaves the device**

This file is the single source of truth for the **Apple App Privacy ("nutrition label")**
and the **Google Play Data Safety** questionnaire. Both must agree with each other, with the
public privacy policy, **and with the shipped build**. The build was inspected to write this
(see "What the shipped code actually does" and the Consistency Warning at the bottom).

---

## What the shipped code actually does (verified against source, 2026-06-20)

This drove every answer below. **Read this before filling either store form** — several
of the brief's working assumptions did not match the shipped build, and over-declaring is
itself an App Store 2.3.1 / Play Data-Safety accuracy violation.

1. **The only off-device transmission is a trail-condition report**, sent when the hiker
   chooses to "report conditions" while online.
   - Sent via `publishTrailPulseReport()` → SpacetimeDB reducer `submitTrailConditionReport`
     (`mobile/src/lib/trailPulseSpacetime.ts`).
   - **The transmitted payload is: note text, an optional self-chosen trail name, a snapped
     trail-mile number (`snappedMile`), trail id, and a timestamp.**
   - **Raw GPS latitude/longitude are NOT transmitted or persisted in Trail Pulse reports.**
     The app may read GPS transiently on-device to compute `snappedMile`, then the local
     `TrailConditionReport` stores only that rounded trail-mile. The network reducer call sends
     only `snappedMile` — a position *along the trail* (a single distance number), not a lat/long
     coordinate. (`trailState.svelte.ts`, `types.ts`, `trailPulseSpacetime.ts`.)
   - **DECISION:** Because precise lat/long does **not** leave the device in this build,
     **precise location is declared as Data NOT Collected / NOT Shared on BOTH stores.**
     What is shared is a coarse trail-mile position, which we declare as **Approximate location**
     (functionally "which point on a public long-distance trail," not the device's geographic
     coordinates). See the per-platform tables for exact handling.

2. **The transport destination is SpacetimeDB**, a real-time database host, configured via
   `PUBLIC_SPACETIMEDB_HOST` (`trailPulseSpacetime.ts`). It is the Hogg Country project's own
   backing service, not a third-party advertiser or analytics vendor. Reports are shared so
   family/other hikers can see trail status.
   - **DECISION:** Treat SpacetimeDB as our own service provider (service-provider data
     handling), **not** a "third party" in the advertising/data-broker sense. Data is **not
     sold** and **not shared for ads.** On Play this is "Shared" (it goes off-device to a
     service we operate); on Apple it is "Collected" (Apple has no separate "shared" axis).

3. **Check-ins ("I'm safe") are local-only in this build.** No `submitCheckIn` /
   network-publish path exists. Whatever the marketing implies about family-visible check-ins,
   the *shipped* mechanism that goes off-device is the trail-condition report above.
   - **DECISION:** Do not declare any separate "check-in upload." Only the trail-condition
     report is a real transmission. Marketing/store copy that promises live family-visible
     check-ins should be softened until a network check-in path ships (flagged below).

4. **Location capture is platform-asymmetric — and now moot for the network label, but still
   a metadata-accuracy item:**
   - **iOS:** captures GPS. `navigator.geolocation.getCurrentPosition` runs and
     `NSLocationWhenInUseUsageDescription` is present in `Info.plist`. So iOS *reads* precise
     location on-device (to compute the trail-mile and to show you on the map), even though it
     does not transmit lat/long.
   - **Android:** does **not** capture GPS. `AndroidManifest.xml` declares **no**
     `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`; without it `navigator.geolocation`
     returns null. So on Android the trail-mile is derived without a live fix.
   - **DECISION:** Because iOS *accesses* device location on-device (even without transmitting
     it), the Apple label still answers the location question truthfully per Apple's rule that
     "collect" = access on the device. See Apple section. Android's Data-Safety location answer
     is scoped to what Android actually does.

5. **On-device AI collects nothing.** Gemma/LiteRT inference is fully local; the model is
   downloaded **once**, user-initiated, Wi-Fi-by-default, checksum-verified, from
   `huggingface.co` (`android/app/build.gradle`: `litert-community/gemma-4-E2B-it-litert-lm`).
   A model download is a file fetch from a CDN; it transmits no personal data **from** the
   device. **DECISION:** the model download is not a data-collection event and is declared as
   such (no user data sent); we disclose it in the privacy policy as a network call for
   transparency, but it is not a "data type collected."

6. **KJV is bundled offline; journal, gear, settings, all AI — on-device only.** No analytics,
   no advertising ID, no identifiers, no contact info, no data sold, no tracking.

---

# (1) APPLE — App Store Connect "App Privacy" answers

Overall app-level answers first, then per-data-type.

- **Does this app collect data?** → **YES** (because of the optional trail-condition report).
- **Do you or your third-party partners use data for tracking?** → **NO.**
  Overall **Tracking = NO.** No data is linked to third-party data for advertising, no
  advertising identifiers, no data shared with data brokers. (App Tracking Transparency prompt
  is **not** required and is **not** shown.)
- **Is any collected data linked to the user's identity?** → **NO for everything.**
  There is no account, no login, no stable user identifier, no email, no device-advertising ID.
  Every "Yes, collected" item below is therefore **Not Linked to the user.**

For each data type, Apple asks: *Collected?* · *Linked to identity?* · *Used for tracking?* · *Purpose.*

| Apple data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
|---|---|---|---|---|
| **Coarse Location** (the snapped trail-mile that is transmitted) | **YES** | **No** | **No** | **App Functionality** only. When the hiker chooses to report conditions, the report carries a snapped **trail-mile** — a coarse position *along a public long-distance trail*, not the device's geographic coordinates — so others can see where on the trail a condition was reported. Optional and user-initiated. This is the only location value that leaves the device. |
| **Precise Location** | **No** | — | — | **Not collected.** iOS may *access* the device GPS on-device to place the hiker on the trail map and compute the trail-mile, but raw lat/long is **never transmitted or stored off-device** — and under Apple's definition ("you 'collect' data if you transmit it off the device…"), reading a sensor on-device without transmitting it is **not** collection. Only the derived **coarse trail-mile** leaves the device (declared in the Coarse Location row). Matches the Play form (Precise = not collected) and the privacy policy. |
| **User Content** — *other user content* (the free-text note typed into a trail-condition report) | **YES** | **No** | **No** | **App Functionality** only. The hiker's typed note (and optional self-chosen trail name) is sent with a report so others can see current trail conditions. Optional and user-initiated. Journal entries are on-device and are **not** collected. |
| Contact Info (name, email, phone, address, other) | **No** | — | — | No account; nothing requested. |
| Health & Fitness | **No** | — | — | App deliberately collects no vitals; "Today" refuses to fabricate a readiness/fitness score. |
| Financial Info | **No** | — | — | No purchases, no payment. |
| Sensitive Info | **No** | — | — | — |
| Contacts | **No** | — | — | — |
| Browsing / Search History | **No** | — | — | — |
| Identifiers (User ID, Device ID) | **No** | — | — | No accounts, no advertising ID, no device ID collected. |
| Purchases | **No** | — | — | — |
| Usage Data (product interaction, ads, etc.) | **No** | — | — | No analytics SDK; no product-interaction telemetry. |
| Diagnostics (crash, performance, other) | **No** | — | — | No crash/diagnostics reporting SDK active. |
| **On-device AI inputs/outputs** | **No** | — | — | Gemma/LiteRT runs locally; no prompt, question, answer, or scripture query leaves the device. Explicitly **Data Not Collected.** |
| Everything else | **No** | — | — | **"Data Not Collected"** for all remaining Apple categories. |

**Apple summary line:** *Data collected (Coarse Location, User Content) — used only for App
Functionality, Not Linked to identity, Not Used for Tracking. Precise Location is NOT collected
(accessed on-device only, never transmitted). Everything else: Data Not Collected. On-device AI
collects nothing.*

**DECISION (Apple Coarse Location):** declared **Collected** because the only location value that
actually leaves the device is the **snapped trail-mile** — a coarse along-trail position. This is
the Apple-side counterpart of the Play "Approximate location (shared)" answer, so the two stores
agree on what is transmitted. App Functionality only; Not Linked; Not Tracking.

**Apple Precise Location = NOT collected.** Although iOS accesses GPS on-device, Apple's "collect"
test is *transmission off the device*; raw lat/long is never transmitted or stored off-device, so
it is not collected. Only the derived coarse trail-mile is shared (Coarse Location row). This keeps
all three artifacts aligned: Apple label, Play Data Safety (Precise = not collected), and the
privacy policy ("raw GPS never leaves the device"), and matches PrivacyInfo.xcprivacy (which
declares CoarseLocation, not Precise).

**DECISION (Apple iOS-AI honesty / 2.3.1):** the on-device AI may ship as a graceful
"model unavailable" stub on the very first iOS build until the native LiteRT package is wired.
Store metadata and this label must **not** state or imply the AI is guaranteed live on day-one
iOS. The privacy posture above ("on-device AI collects nothing") is still 100% accurate whether
the engine is live or stubbed — it never transmits regardless — so it carries no 2.3.1 risk. The
2.3.1 risk lives in **marketing copy**, not the privacy label; the reviewer/critic must flag any
wording that promises live on-device AI on iOS at launch.

---

# (2) GOOGLE PLAY — Data Safety questionnaire answers

App-level answers first.

- **Does your app collect or share any of the required user data types?** → **YES.**
- **Is all of the user data collected by your app encrypted in transit?** → **YES.**
  SpacetimeDB transport is over a secure WebSocket/HTTPS connection (`wss://`); the model
  download is over HTTPS from `huggingface.co`.
- **Do you provide a way for users to request that their data be deleted?** → **YES**,
  by email request (see deletion route below). There is no account to self-serve, so deletion
  is handled via a published support email.
- **Is your app's data collection independently validated against a security standard?** →
  **No** (not claimed).
- **Is any data sold?** → **No.**
- **Is any data shared with third parties for advertising or analytics?** → **No.**

### Data types — collected / shared

| Play data type | Collected? | Shared (off-device)? | Optional or Required? | Ephemeral? | Purpose | For ads? |
|---|---|---|---|---|---|---|
| **Location → Approximate location** | **YES** | **YES** | **Optional** (user-initiated report) | No | **App functionality** — the report carries a snapped trail-mile (a position *along a public trail*, not the device's geographic coordinates) so family/hikers see where on the trail a condition was reported. | **No** |
| **Location → Precise location** | **No** | **No** | — | — | Raw GPS lat/long is **not transmitted**; on Android it is **not even captured** (no location permission in the shipped manifest). | — |
| **App activity / App info & performance** | **No** | **No** | — | — | No analytics, no crash SDK. | — |
| **Messages / other in-app content → User-generated content** (the free-text trail-condition note + optional self-chosen trail name) | **YES** | **YES** | **Optional** (user-initiated) | No | **App functionality** — shown to others as the trail report. | **No** |
| Personal info (name, email, user IDs, address, phone) | **No** | **No** | — | — | No account. | — |
| Financial info | **No** | **No** | — | — | — | — |
| Health & fitness | **No** | **No** | — | — | No vitals collected by design. | — |
| Photos / videos / audio / files | **No** | **No** | — | — | — | — |
| Contacts / calendar | **No** | **No** | — | — | — | — |
| Web browsing history | **No** | **No** | — | — | — | — |
| Device or other IDs | **No** | **No** | — | — | No advertising ID, no device ID. | — |
| **On-device AI inputs/outputs** | **No** | **No** | — | — | Gemma/LiteRT is fully local; nothing leaves the device. | — |

**DECISION (Play location):** declare **Approximate location: collected + shared, optional,
app-functionality, not for ads** — because the transmitted value is a snapped trail-mile (a coarse
along-trail position), not device coordinates. Declare **Precise location: NOT collected / NOT
shared**, because raw lat/long is never transmitted and (on Android) never even captured. This is
the per-actual-behavior, no-over-declaration choice the brief requires.

**DECISION (Play deletion route):** users have no account; deletion is an **email request**.
Publish a deletion contact (e.g. `privacy@hoggcountry.com`) in the Play "Data deletion" URL/field
and in the privacy policy. Answer "Can users request deletion?" = **Yes**.

**Play summary line:** *Shares only an optional, user-initiated trail-condition report (a coarse
trail-mile position + the typed note) to our own backing service, over an encrypted connection,
for app functionality — not for ads, never sold, deletable by email. Everything else, including all
on-device AI, stays on the phone.*

---

# CONSISTENCY WARNING — privacy policy ⇄ Apple label ⇄ Play Data Safety ⇄ shipped build

All four must agree. Open items that **must** be reconciled before submission:

1. **Lat/long vs. trail-mile — the biggest correction.** The shipped report transmits a
   **snapped trail-mile**, not raw lat/long (`trailPulseSpacetime.ts`). Therefore:
   - **Do NOT declare "Precise location: shared"** on Play, and **do NOT** write a privacy policy
     that says "we send your precise GPS coordinates to our servers." That would over-declare and
     contradict the build.
   - **DECISION:** privacy policy must describe the transmitted value as **"your approximate
     position along the trail (a trail-mile) plus any note you type,"** matching both store forms.
   - Apple declares **Coarse Location = Collected** (the transmitted trail-mile) — the counterpart
     of Play's **Approximate location = Shared** — so both stores agree on what leaves the device.
   - Apple **Precise Location = NOT collected** (iOS may access GPS on-device, but the coordinate is
     used on-device and **never transmitted**, so it is not "collected" under Apple's transmission
     test; not captured at all on Android). This matches Play (Precise = not collected) and the policy.

2. **Android cannot read GPS — do not over-declare for Android.** `AndroidManifest.xml` ships
   **no** location permission, so Android captures no fix. Keep Play's **Precise location =
   Not collected** (already done above). **Build-vs-disclosure gap to fix:** either (a) wire the
   Android location permission + capture so behavior matches any "we use your location" marketing,
   or (b) keep marketing/policy honest that Android derives trail position without a live GPS fix.
   Until (a) ships, **Play must not declare precise-location collection for Android.**

3. **Destination is SpacetimeDB, not the Laravel/Forge API.** The privacy policy's "where your
   data goes" section must name the real recipient (our SpacetimeDB-backed Trail Pulse service),
   describe it as **our own service provider** (not an ad/analytics third party), and state the
   transport is encrypted. Don't write "sent to hoggcountry.com/api."

4. **Check-ins are local-only in this build.** Any policy/marketing/store text promising
   **live, family-visible "I'm safe" check-ins** over the network is **not** matched by a shipped
   transmission path. **DECISION:** soften check-in promises to "logged on your phone" until a
   network check-in path ships, OR ship that path before claiming it. Flag for product.

5. **iOS on-device AI may be a stub at launch (Apple 2.3.1).** The privacy label is safe either
   way (AI transmits nothing regardless). The **risk is marketing copy** implying guaranteed live
   on-device AI on day-one iOS. **DECISION:** describe on-device private AI as a *core capability*
   without promising it is live at launch on iOS; reviewer must reject any "answers your questions
   offline, right now, on your iPhone" phrasing for the first iOS build.

6. **Model download disclosure.** Privacy policy should mention the one-time, user-initiated,
   Wi-Fi-default, checksum-verified model download from `huggingface.co`, and clarify it sends
   **no** personal data from the device. Keep it out of the "data collected" tables (it isn't).

7. **Tracking = NO everywhere.** Apple Tracking = No, Play "shared for ads" = No, "sold" = No,
   no ATT prompt, no advertising ID. The policy must not contain boilerplate about ad partners,
   analytics, or cookies that would contradict this.

**Reconciliation owner / before-submit checklist:**
- [ ] Privacy policy rewritten to: approximate trail-mile (not lat/long), SpacetimeDB recipient,
      email deletion route, model-download note, no ads/analytics/tracking, on-device AI sends nothing.
- [ ] Apple label entered exactly as Section 1.
- [ ] Play Data Safety entered exactly as Section 2 (Approximate location shared / Precise not).
- [ ] Android location-permission gap resolved or marketing kept honest (item 2).
- [ ] iOS marketing copy reviewed for 2.3.1 (item 5).
- [ ] Check-in claims softened or network path shipped (item 4).

---

**One-line summary:** Trail Assistant shares only an optional, user-initiated trail-condition
report — a coarse along-trail mile plus the note you type — encrypted to our own backing service,
never sold, never for ads, deletable by email; precise GPS is never transmitted (and isn't even
captured on Android), all on-device AI sends nothing, and the only build-vs-disclosure items to
fix are the Android location-permission gap, the local-only check-ins, and not promising live
on-device AI on day-one iOS.
