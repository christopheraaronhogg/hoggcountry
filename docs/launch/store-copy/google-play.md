# Google Play Store Listing — Trail Assistant

> App: **Trail Assistant** by Hogg Country · Package `com.hoggcountry.trailassistant`
> Offline-first Appalachian Trail companion. iOS 14+ / Android 7.0+ (API 24).
> No accounts · No ads · No third-party analytics/tracking SDKs.
> Last updated: 2026-06-18 · Status: **draft for v1.0 submission**

This is the canonical Google Play listing copy. Paste fields into Play Console exactly
as written; the character counts below are verified literally (spaces + punctuation
included) against Google's limits.

**Authoritative cross-reference:** every privacy/data claim here is reconciled with
`docs/launch/privacy/app-privacy-and-data-safety.md`, which was written against the
*shipped build*. That file is the single source of truth for the Data Safety form. This
listing must never claim more than that file declares. The two corrections that file
forced into earlier drafts: (1) only a **snapped trail-mile + note** leaves the device,
**not** raw GPS lat/long; (2) there is **no network check-in** — "I'm okay" is logged
on-device only, so the listing does **not** promise "family can see you're okay."

---

## TITLE — 27 / 30

```
Trail Assistant: Offline AT
```

- Limit: 30 characters. Count: **27**. ✅
- Keeps the app name first (brand recognition for Hogg Country links/QR), then the two
  highest-value keywords: "Offline" and "AT" (Appalachian Trail).

> **DECISION (Chris):** confirm the store title. The on-device store *app name* is
> `Trail Assistant`; the Play listing title can carry the extra keywords ("Offline AT")
> without changing the installed app label. If you'd rather the listing read exactly
> `Trail Assistant` to match the icon label, that's 15 chars and also fine — just less
> discoverable. Default recommendation: keep `Trail Assistant: Offline AT`.

---

## SHORT DESCRIPTION — 80 / 80

```
Offline Appalachian Trail companion: day timeline, water, shelter, on-device AI.
```

- Limit: 80 characters. Count: **80** (exactly at limit — zero headroom; any edit
  re-counts). ✅
- Leads with the #1 differentiator (**offline**), names the trail in full for search,
  then the four things a hiker actually wants: the day timeline, water, shelter, and the
  private on-device AI.
- Deliberately does **not** say "AI guaranteed" or "AI included" — see the metadata-risk
  note under Full Description. "on-device AI" describes a core capability without
  promising it is live on every platform on day one.

> **DECISION (Chris):** if you want to hedge the iOS-AI caveat even harder, an 80-char
> alternative that drops the AI claim entirely:
> `Offline Appalachian Trail companion: day timeline, water, shelter, KJV Bible.` (77).
> Recommendation: keep the AI version for Android (AI is fully wired on Android).

---

## FULL DESCRIPTION — 2,868 / 4,000

```
Trail Assistant is a calm, offline-first companion for the Appalachian Trail — built with love for one NOBO thru-hiker and shared with everyone walking the 2,197.4 miles from Springer to Katahdin.

It works without signal. No account. No login. No ads. No third-party tracking.

— TODAY: YOUR DAY, MILE BY MILE —
See your day laid out from camp to camp: your current mile and percent complete, miles done and miles to go, and the next water, shelter, and town with real distances. A first-class weather block translates the forecast into a plain-language "what it means" safety line, with a daylight-left bar so you know how much light you have. No fake "fitness score" — the app has no vitals and won't pretend it does. Candidate trail data is labeled honestly, so you always know what to confirm in the field.

— SCOUT: PRIVATE AI, ON YOUR PHONE —
Scout is an on-device AI trail assistant. It answers trail questions and scripture questions with cited sources — the field guide, trail and landmark data, and the King James Bible. Nothing leaves your phone: no question, prompt, or answer is ever sent to any server or AI cloud. Scout works fully offline. A one-time model download (~2.6 GB, over Wi-Fi by default, checksum-verified) powers it; the app is fully usable before and without it.

— MAP: A TRAIL RIBBON, NOT A BATTERY DRAIN —
A quiet trail-ribbon map shows your position and the water, shelters, and towns ahead, pinned by trail mile — plus a zoomable elevation profile with real ascent and descent. No heavy tile map draining your battery.

— TRAIL: YOUR OFFLINE LIBRARY —
Everything you need to read and remember:
• GUIDE — the field guide, offline.
• BIBLE — browse the full KJV by book and chapter in clean, readable type, search every verse, and ask a plain-language question that Scout answers with the actual verses cited.
• JOURNAL — your trail notes, kept on your device.
• GEAR — your loadout and pack weights.

— HONEST ABOUT SAFETY —
Trail Assistant helps you think. It is not an emergency device and not a substitute for official weather, maps, or a satellite communicator. Always verify in the field.

— WHAT LEAVES YOUR PHONE (AND WHAT DOESN'T) —
Almost nothing. Your journal, gear, settings, and all AI run on-device. The only thing that ever leaves your phone is an optional trail-condition report you choose to send: your approximate position along the trail — a trail-mile, not your GPS coordinates — plus any note you type, sent over an encrypted connection to our own trail service so other hikers benefit from current conditions. That's it, and it's always your move. Any "I'm okay" check-in is kept on your phone. The Bible is bundled. The AI model downloads once from Hugging Face.

No accounts. No advertising IDs. No analytics. Nothing sold, nothing used to track you.

Made with love for Dad — and for everyone chasing Katahdin.
```

- Limit: 4,000 characters. Count: **2,868**. ✅
- Scannable: short hook, then six labeled sections (`— SECTION —`) mirroring the four
  pillars + a safety section + a data-honesty section. Bullets used only where they read
  as a true list (the TRAIL library). Play renders plain text, so headers use em-dashes
  rather than markdown.

### Why the "what leaves your phone" section is worded this way (data-safety parity)

This paragraph is the one most likely to create a Data-Safety mismatch, so it is written
to match `app-privacy-and-data-safety.md` exactly:

- It says the report carries **"your approximate position along the trail — a trail-mile,
  not your GPS coordinates."** The shipped report (`mobile/src/lib/trailPulseSpacetime.ts`)
  transmits a `snappedMile`, **not** lat/long. Do **not** restore any "we send your
  location / precise location" phrasing — that would over-declare and contradict the
  build and both store labels.
- It says **"Any 'I'm okay' check-in is kept on your phone."** There is **no network
  check-in path in this build**; the old "so family can see you're okay" promise was
  removed because it described a feature that does not ship. Do **not** re-add a
  family-visible check-in claim until a network check-in path actually ships.
- It names the recipient as **"our own trail service"** over an **encrypted connection**
  (the SpacetimeDB-backed Trail Pulse service we operate — a service provider, not an
  ad/analytics third party). It does **not** say "Hogg Country backend / our servers /
  hoggcountry.com/api," which is the wrong endpoint.

### Metadata-accuracy notes (Apple 2.3.1 / Play deceptive-behavior parity)

The caveat is that **iOS may ship the on-device AI as a graceful "model unavailable"
stub in the first build**, while **Android AI is fully wired**. This listing is the
Google Play listing (Android), where AI is live — but keep wording portable so the App
Store version can reuse it. Guardrails applied:

- The copy says Scout *is* an on-device AI assistant and describes the capability, but
  **never** says "guaranteed," "always available," "instant on first launch," or implies
  AI works before the one-time model download. It explicitly states **"the app is fully
  usable before and without it."** That sentence is load-bearing — do not cut it.
- The ~2.6 GB one-time download is disclosed in the description itself (sets expectation;
  avoids a "where's the AI?" 1-star / accuracy complaint).
- **DECISION (Chris) — iOS reuse:** before reusing this exact text in the App Store
  listing, confirm whether the iOS build at submission ships live AI or the stub. If it
  ships the stub, the Scout section for iOS should soften to capability-not-yet-active
  wording (e.g., "Scout's on-device AI is rolling out") to stay clear of Apple 2.3.1.
  The Android copy here is accurate as written.

---

## CATEGORY

> **DECISION (Chris): Primary category = Maps & Navigation.**

| Candidate | Fit | Verdict |
|---|---|---|
| **Maps & Navigation** | The core daily loop is wayfinding: current mile, next water/shelter/town by distance, trail-ribbon map, elevation profile, trail-condition reports pinned by trail mile. This is what the hiker opens the app *for*. | **Primary (recommended).** |
| Travel & Local | Reasonable second framing (trip companion, towns, local services). Less precise than Maps & Nav for the day-to-day use, but the closest secondary. | Use as the mental "backup" framing; Play allows only one category. |
| Health & Fitness | **Avoid.** The app deliberately has **no** vitals, no fitness/readiness score, no activity tracking. Listing here invites the exact "where's my fitness data?" expectation the product refuses to fake, and risks Health data-safety scrutiny it shouldn't attract. | **Reject.** |

Rationale: Maps & Navigation matches the primary job-to-be-done (knowing where you are
and what's ahead on a 2,197.4-mile line) and keeps the listing away from Health/Fitness
data-safety expectations that don't apply to an app with no vitals.

> **Cross-store note:** the Apple draft currently keeps **Health & Fitness as a
> *secondary*** while this Play draft *rejects* Health & Fitness outright. If you want
> cross-store category parity, reconcile by making the Apple secondary **Travel** (or
> Reference for the KJV audience) instead of Health & Fitness.

---

## TAGS (store tags / keyword hints)

Play uses your title + short/long description for indexing (no separate keyword field
like iOS). These are the terms intentionally seeded above and the tags to select if Play
Console offers tag chips for this category:

- Appalachian Trail · AT thru-hike · NOBO
- offline field guide · hiking · backpacking · trail
- water sources · shelters · trail towns
- elevation profile · navigation · trail conditions
- KJV Bible · scripture · offline Bible
- on-device AI · private AI · field guide

> **DECISION (Chris):** "AI" tags help Android discovery but invite the iOS-stub
> accuracy question. Keep AI tags on the **Play (Android)** listing; reconsider for the
> App Store listing depending on the iOS build at submission. (Note: dropped a
> "GPS check-in" tag from an earlier draft — there is no network check-in to advertise.)

---

## IARC CONTENT RATING — questionnaire answers

Run via Play Console's IARC questionnaire. Answer honestly; the entries that matter:

- **Violence (cartoon/fantasy/realistic):** None.
- **Sexual content / nudity:** None.
- **Profanity / crude humor (in-app):** None. *(The bundled KJV is archaic English; it is
  scripture, not profanity. Answer the in-app-language question as None.)*
- **Controlled substances (drugs/alcohol/tobacco):** None. *(No depiction or
  encouragement; trail-town context does not promote substances.)*
- **Gambling (real or simulated):** None.
- **Horror / fear:** None.
- **User-generated content / user-to-user interaction / social features:** **Yes, in a
  limited form — disclose it.** Hikers can type a note and submit a **trail-condition
  report** that is shared off-device (a snapped trail-mile + the typed note + an optional
  self-chosen trail name, to our own trail service; reports are visible to other hikers).
  There is **no** in-app chat, no user-to-user messaging, no public comment feed, no user
  profiles, and **no network check-in**. Describe it as: *optional, user-initiated,
  text-only trail-condition reports with a coarse along-trail position; no direct
  user-to-user communication.* This keeps the rating accurate without over-claiming a
  social network. *(This must match the Data Safety form: User-generated content +
  Approximate location, both Optional/Shared.)*
- **References to religion / ideology:** **Yes — disclose.** The **King James Bible (KJV)
  is bundled** as an offline reading library and as a source Scout cites for scripture
  questions. It is presented as a reading/reference feature. Religious *reference* does not
  by itself raise the age rating, but answer truthfully.
- **Personal information / location shared with other users:** **Approximate location
  only.** When the user chooses to report, a **coarse along-trail position (a trail-mile,
  not GPS coordinates)** and the note are shared. **Precise location is not shared and is
  not even captured on Android.** (Must match the Data Safety doc — see cross-reference.)
- **Digital purchases / in-app purchases:** None.

Expected outcome: a low rating (Everyone / PEGI 3 / equivalent), with UGC and
approximate-location-sharing flags acknowledged. Do not suppress the UGC and
location-sharing disclosures to chase a cleaner rating — accuracy here must match the
Data Safety form.

> **DECISION (Chris):** confirm the UGC framing. Trail-condition reports are
> **hiker-facing** (other hikers benefit from current conditions). If, at launch, you
> instead restrict report visibility, update the "shared with other users" answer — but
> the approximate-trail-mile-leaves-device fact still stands and must be declared.
> Reconcile this with the Data Safety doc before submitting.

---

## TARGET AUDIENCE & AGE

- **Target age group:** **18+** (primary), with the app appropriate for all ages.
  - **DECISION (Chris):** set the Play "Target audience" to **18+** (or 18–65+). Rationale:
    (a) thru-hikers are adults; (b) the app shares a coarse along-trail position on opt-in
    reports and (on iOS) accesses precise GPS on-device, so keeping the target audience
    adult-only avoids triggering Google's **Families / Designed for Families** program
    obligations and child-data scrutiny that a location-capable app should not opt into.
    The content itself is benign for all ages, but the *target audience* should not include
    children given location handling.
- **Appeals to children?** No. Do not enroll in Designed for Families.
- **Content rating audience:** Everyone (low IARC), but **target audience = adults** is the
  intentional, conservative choice given location.

---

## ADS DECLARATION

- **Contains ads: NO.** ✅
- In Play Console → "Ads" section, answer **"No, my app does not contain ads."**
- No ad SDKs, no advertising IDs, no ad mediation. This must match the Data Safety form
  (no data collected for advertising/marketing) and the absence of `google-services.json`
  (Firebase not active — verified).

---

## DATA SAFETY — cross-reference

The Play **Data safety** form is filled from the companion doc, not from this file. Keep
the two in lockstep; this listing's claims must match the form exactly.

- **Authoritative doc:** `docs/launch/privacy/app-privacy-and-data-safety.md`
  (Section 2 — "GOOGLE PLAY — Data Safety questionnaire answers"). Enter the Play form
  **exactly** as that section specifies.
- **Public privacy policy:** `docs/launch/privacy/privacy-policy.md` /
  `privacy-policy.html` (the Play "Privacy policy URL" → `https://hoggcountry.com/privacy`).

Summary the Data Safety form must reflect (do **not** treat this block as the form — the
authoritative doc governs; this is the must-match digest):

- **Location → Approximate location:** **Collected and Shared**, **Optional /
  user-initiated only**, at trail-condition report. The transmitted value is a snapped
  **trail-mile** (a position *along a public trail*, not the device's geographic
  coordinates). Purpose: App functionality. **Not for ads.**
- **Location → Precise location:** **NOT collected / NOT shared.** Raw GPS lat/long is
  never transmitted, and on Android it is **not even captured** (no location permission in
  the shipped `AndroidManifest.xml`). iOS *accesses* precise GPS on-device to compute the
  trail-mile, but that is on-device use, not collection-for-the-Play-form.
- **Messages / other in-app content → User-generated content** (the free-text report note
  + optional self-chosen trail name): **Collected and Shared**, **Optional**, App
  functionality. Scout chat text is processed **on device** and is **not** collected.
- **No** collection for: advertising, analytics, personalization tracking,
  account/identity (there are no accounts), financial info, contacts, photos, or device
  IDs for tracking. **On-device AI inputs/outputs: Not collected.**
- **Data not sold. Not used to track users across apps/sites. No ATT-equivalent.**
- **Encrypted in transit: YES** (the report goes over a secure WebSocket/HTTPS connection;
  the one-time model download is over HTTPS from Hugging Face).
- **Deletion:** no account, so no account-level deletion; deletion is an **email request**
  (publish a contact, e.g. `chris.stitchscreen@gmail.com`, in the Play "Data deletion" field and
  the privacy policy). Answer "Can users request deletion?" = **Yes**.

> **DECISION (Chris) — Android location, resolved direction (FLAG kept for sign-off):**
> The shipped report transmits only a snapped trail-mile, and the **current Android build
> declares no location permission**, so Android never captures precise GPS. The
> authoritative doc therefore declares **Precise location = NOT collected** and only
> **Approximate location (trail-mile) = collected & shared** — which matches the build.
> **Do not** declare "Precise location collected/shared" on the Play form. The only open
> choice is product-side: leave Android deriving the trail-mile without a live fix (current
> behavior, disclosure already honest), or later wire `ACCESS_COARSE/FINE_LOCATION`. Either
> way the v1.0 Play form above stays correct. (This corrects an earlier draft of this block
> that wrongly read "Location (precise): Collected and shared.")

---

## v1.0 RELEASE NOTES (What's new — 500 char limit)

```
Trail Assistant v1.0 — offline-first companion for the Appalachian Trail.

• TODAY: your day from camp to camp — current mile, next water, shelter & town, weather with a plain-language safety line and daylight-left bar.
• SCOUT: private on-device AI that cites its sources. Works fully offline.
• MAP: calm trail-ribbon view + real elevation profile.
• TRAIL: offline field guide, full KJV Bible with verse search, journal & gear.

No account. No ads. No tracking. Built with love for Dad.
```

- Limit: 500 characters. Count: **489**. ✅
- Keeps the same AI wording discipline as the description ("works fully offline," no
  day-one guarantee). Safe for the Android listing.

---

## Pre-submit checklist (listing-only)

- [ ] Title ≤ 30 (27 ✅) · Short ≤ 80 (80 ✅, no headroom) · Full ≤ 4000 (2,868 ✅) ·
      Release note ≤ 500 (489 ✅). *(Counts are literal — re-count any field you edit.)*
- [ ] Category = Maps & Navigation; **not** Health & Fitness.
- [ ] Ads = No (matches Data Safety: no ad/marketing data).
- [ ] IARC: UGC (trail-condition reports) + **approximate**-location-sharing + religion
      (KJV) disclosed; **no network check-in claimed**.
- [ ] Target audience = 18+ (location handling; no Designed for Families).
- [ ] Data Safety form entered **exactly** per
      `docs/launch/privacy/app-privacy-and-data-safety.md` §2: Approximate location
      shared (optional), Precise location **not** collected, UGC shared (optional),
      everything else not collected, not sold, not for ads, deletion by email.
- [ ] "What leaves your phone" copy matches the label file (trail-mile not GPS; no
      family-visible check-in; recipient = our own trail service / SpacetimeDB).
- [ ] iOS reuse only after confirming whether the iOS build ships live AI or the stub
      (Apple 2.3.1).
