# Launch Copy & Privacy — Consistency Review

**Reviewer:** app-submission compliance pass
**Date:** 2026-06-18
**Files reviewed:**
- `docs/launch/store-copy/apple-app-store.md`
- `docs/launch/store-copy/google-play.md`
- `docs/launch/privacy/privacy-policy.md` (+ `privacy-policy.html`)
- `docs/launch/privacy/app-privacy-and-data-safety.md` (declared single source of truth)

**Verdict:** Submit-facing privacy/store-copy artifacts are internally consistent after the
current fixes. No document-only must-fix remains; the remaining items are account/manual
decisions already flagged for Chris.

> **Note on the prior version of this file:** an earlier CONSISTENCY-REVIEW described the
> drafts as still saying "we send your precise lat/long," "Hogg Country backend," a network
> "Check In," "family can see you're okay," and an Apple keyword field of 165 chars. **Those
> findings are now stale** — the drafts were regenerated and every one of those was fixed.
> Verified by grep: "family can see you're okay" survives only inside *negative* statements
> ("does NOT claim…"), the policy names SpacetimeDB and marks check-in local-only, and the
> Apple keyword string is literally 99 chars. This review reflects the **current** drafts.

---

## FIXED ITEMS

### MF-1 — Apple **Precise Location**: the two Apple-facing docs said opposite things. **[FIXED]**

This was the one real internal contradiction in the set, and it sat on the Apple privacy
label — the highest-scrutiny field. It is now resolved to **Precise Location = Not
Collected**, with Coarse Location covering the transmitted snapped trail-mile.

- `app-privacy-and-data-safety.md` (the declared source of truth) now says
  **Precise Location = NOT collected**. It also explains that GPS may be accessed
  transiently on-device to compute a snapped trail-mile, while raw lat/long is not
  transmitted or persisted in Trail Pulse reports.
- `apple-app-store.md` line 178 (App Privacy fill-in guidance) + line 183: **Precise
  Location = NOT collected.** Justification: *"On-device-only GPS access is not 'collection'
  under Apple's definition, so declare Precise = not collected."*

Same field, **opposite answers, opposite stated readings of "Apple's definition."** Whoever
fills App Store Connect follows one file and contradicts the other. Both cannot ship.

**The correct answer is NOT collected**, so align everything to the store-copy doc and the
Play form. Apple's own definition (App Store Connect → App Privacy): *"You 'collect' data if
you transmit it off the device in a way that allows you and/or your third-party partners to
access it…"* Reading a GPS sensor on-device and never transmitting the coordinate is **not**
collection under that definition. The transmitted value is the snapped trail-mile (coarse),
not lat/long. So Precise = Not Collected is both technically correct and the answer that
keeps Apple aligned with Play (Precise = not collected) and the policy ("raw GPS never leaves
the device"). The source-of-truth doc's line-101 reasoning is the error: it conflates "the
app reads a sensor" with "the app collects data."

**Applied fix — `app-privacy-and-data-safety.md` now says Precise = Not Collected:**
- **Line 101** — set Precise Location row to **Collected = No**; cell text: *"Accessed
  on-device only (iOS) to place the hiker on the trail map and compute the trail-mile. Raw
  lat/long is never transmitted or stored off-device, so under Apple's definition
  (collection = off-device transmission) Precise Location is NOT collected. Not captured at
  all on Android."*
- **Lines 116 & 118** — drop "Precise Location" from the "Data collected" summary lines:
  *"Data collected (Coarse Location, User Content)."*
- **Lines 125–129 (DECISION Apple Precise Location)** — rewrite to conclude **Not
  Collected**, keeping the forward note: *if a future iOS build ever transmits lat/long,
  upgrade this row to Collected.*
- **Line 86** — keep app-level "Does this app collect data? YES," but remove the "and
  because iOS accesses device location on-device" clause; the YES is carried by Coarse
  Location (trail-mile) + User Content alone.
- **Consistency-warning item 1 (lines ~204–206)** — update the "Apple Precise Location is
  *also* collected" bullet to read Precise = Not Collected.

After this fix, all four artifacts agree: **Coarse/Approximate location = collected & shared
(the trail-mile); Precise location = not collected; User content = collected & shared.**

> The opposite resolution (declare Precise = Collected everywhere, incl. on the Play form)
> would also be internally consistent but it **over-declares** on Play/policy and contradicts
> the build (Android captures nothing; iOS transmits nothing) — exactly the over-declaration
> the source-of-truth doc itself warns against. So the fix direction is not a coin-flip:
> align to **Precise = Not Collected.**

---

### MF-2 — Privacy policy effective date placeholder. **[FIXED]**

`privacy-policy.md` line 3 and `privacy-policy.html` line 167 now both carry a real effective
date: **June 18, 2026**. No literal `[EFFECTIVE DATE]` placeholder remains in the policy files.

---

## DECISION ITEMS FOR CHRIS (prioritized — choices, not errors)

These are already flagged inside the drafts; consolidated so none is missed. None blocks
submission *as an inconsistency*, but several gate the build/marketing.

1. **[HIGH] iOS on-device AI: live or stub at first submission?** (Apple 2.3.1)
   - All copy is currently 2.3.1-safe — it describes on-device AI as a *capability* and
     never promises "ask Scout right now on day-one iOS." Verified across Apple description
     (lines 75–80), Play description (lines 72–73, "fully usable before and without it"),
     short fields, and release notes. **This PASSES as written.**
   - The decision you owe: **if the first iOS build ships the AI stub**, decide whether to
     add the honest "rolling out by platform" line (`apple-app-store.md` line 106) and
     whether to keep the "AI" keywords/tags on the *iOS* listing (`google-play.md` lines
     176–179). Android copy is accurate as-is (AI fully wired).
   - One minor wording risk to consider: Apple **promo text** (line 37) says "plus a private
     on-device AI" with no "(one-time download)" qualifier. Promo text is build-independent
     and updatable, so low risk — but if iOS stubs AI at launch, soften to "a private
     on-device AI (one-time download)."

2. **[FIXED] Publish & confirm the privacy email** `chris.stitchscreen@gmail.com`.
   Flagged 5× in the policy (md lines 32, 118, 126, 155 + HTML) and required by the Play
   **Data deletion** route — the data-safety "users can request deletion = Yes" depends on a
   real, monitored address. Gmail inbox receipt was verified on 2026-06-20.

3. **[HIGH] Support & Privacy URLs must be live before submission.**
   `apple-app-store.md` lines 162–166: `https://hoggcountry.com/support` (Apple checks it)
   and `https://hoggcountry.com/privacy` (the hosted policy) must both resolve. Dead URLs =
   rejection.

4. **[MED] Android location-permission gap — resolved honestly; confirm the direction.**
   Handled correctly in all four docs: Android ships **no** location permission, captures no
   fix, derives the trail-mile without a live fix; Play declares **Precise = not collected**
   and the policy + Play description disclose it openly (`privacy-policy.md` line 75;
   `google-play.md` lines 274–275, 289–298). **PASS — disclosed, not hidden.** Your only open
   choice is product-side: leave Android as-is, or later wire `ACCESS_COARSE/FINE_LOCATION`.
   No copy change needed either way.

5. **[MED] Cross-store category parity.** Apple uses **Health & Fitness** as secondary
   (`apple-app-store.md` lines 132–138); Play **rejects** Health & Fitness and warns it
   invites health-data-safety scrutiny (`google-play.md` lines 150–159). Both files already
   flag this divergence. Recommend reconciling Apple's secondary to **Travel** (or Reference)
   so the stores tell the same story and Apple doesn't imply tracked biometrics the app
   deliberately lacks. Your call.

6. **[LOW] App name / listing title.** Apple recommends store name `Trail Assistant` (matches
   icon label, 2.3.7-safe); Play title `Trail Assistant: Offline AT`. Both flagged for
   confirmation (`apple-app-store.md` line 21; `google-play.md` line 32). Either is compliant.

7. **[LOW] Apple keyword set vs. primary category.** If you do **not** pick Navigation as
   Apple primary, swap `navigation` back into keywords (`apple-app-store.md` line 58) and drop
   a lower-value term to stay ≤100. Tied to the category decision.

8. **[LOW] Play target audience = 18+.** Intentional conservative choice given location
   handling, to avoid Designed-for-Families obligations (`google-play.md` lines 230–240).
   Confirm.

---

## ITEM-BY-ITEM CHECK RESULTS

### (a) Mutual consistency: privacy policy ⇄ Apple label ⇄ Play Data Safety

| Data point | Policy | Apple label | Play Data Safety | Verdict |
|---|---|---|---|---|
| Approximate/coarse location (trail-mile) | sent on report, "approximate position along the trail" | Coarse = **Collected**, shared, App Functionality | Approximate = **Collected & Shared**, optional | **PASS** |
| **Precise location / raw GPS** | "raw GPS never leaves the device" (not collected) | **NOT collected** | **NOT collected / NOT shared** | **PASS** |
| User content (note + optional trail name) | sent on report | User Content = Collected, shared | UGC = Collected & Shared, optional | **PASS** |
| On-device AI inputs/outputs | "never leaves your phone" | **Not Collected** | **Not Collected** | **PASS** |
| Check-in / "I'm safe" | on-device only, does not transmit | not declared (no upload) | no network check-in declared | **PASS** — consistently local-only across all four |
| Tracking | no ads/analytics/tracking | Tracking = **No**, no ATT | not for ads, not sold, no cross-app tracking | **PASS** |
| Data sold | never sold | n/a (no Apple "sold" axis) | **Not sold** | **PASS** |
| Identifiers / accounts | none | none collected | none collected | **PASS** |
| Recipient of the outbound flow | SpacetimeDB, "our own backend," encrypted | (own service) | "our own trail service," encrypted | **PASS** — consistently named, not the Forge/Laravel API |
| Model download (Hugging Face) | disclosed, "no personal data sent" | excluded from data tables (correct) | excluded from data tables (correct) | **PASS** |
| Deletion route | email `chris.stitchscreen@gmail.com` | n/a | "Yes," email request | **PASS** (mailbox receipt verified 2026-06-20) |

**Net:** the four documents are mutually consistent across the declared data types.

### (b) Over-claim audit

- **Live on-device AI as a 2.3.1 risk?** **PASS.** No store field (Apple name/subtitle/
  promo/description/What's-New; Play title/short/full/release-notes) promises the iOS AI
  answers at launch. Copy consistently uses capability framing + the load-bearing "fully
  usable before and without it." The stub-vs-live exposure lives only in a *future* DECISION
  (item 1), not in the current text. (Minor: promo text could add "(one-time download)" — see
  DECISION 1.)
- **Medical / emergency reliability implied?** **PASS, and notably well-handled.** Apple
  description lines 97–98, Play description lines 85–86, and policy §9 all explicitly state it
  is **"not an emergency device,"** not a substitute for official weather/maps/PLB/satellite
  communicator, with candidate-grade data "confirm in the field." The "no fake readiness/
  fitness score" framing (Apple lines 72–73, Play line 70) actively *under*-claims on health.
  No medical/emergency over-claim anywhere.
- **Privacy claims the data-safety contradicts?** **PASS** (after MF-1). The marketing's
  strong privacy promises ("nothing leaves your phone," "raw GPS never leaves the device,"
  "no ads/analytics/tracking") are *backed by* the labels — the labels declare even less
  collection than a cautious reader might fear. The one mismatch is the internal Apple
  Precise-Location disagreement (MF-1), not a marketing-vs-label over-claim.

### (c) Character limits

**All verified by literal count (spaces + punctuation + commas included). PASS.**

| Field | Limit | Claimed | Verified |
|---|---|---|---|
| Apple app name (all 3 options) | 30 | 15 / 19 / 19 | ✅ 15 / 19 / 19 |
| Apple subtitle (all 3) | 30 | 26 / 27 / 30 | ✅ 26 / 27 / 30 |
| Apple promo text | 170 | 162 | ✅ 162 |
| Apple keywords (commas incl.) | 100 | 99 | ✅ 99 |
| Apple keywords (nav alt) | 100 | 97 | ✅ 97 |
| Apple description | 4000 | 3,590 | ✅ 3,590 |
| Apple What's New | 4000 | 636 | ✅ 636 |
| Play title | 30 | 27 | ✅ 27 |
| Play short description | 80 | 80 | ✅ 80 (zero headroom — re-count on any edit) |
| Play short desc (alt) | 80 | 77 | ✅ 77 |
| Play full description | 4000 | 2,868 | ✅ 2,868 |
| Play release notes | 500 | 489 | ✅ 489 |

Watch item: Play short description is **exactly 80/80** — any edit busts the limit.

### (d) Android location-permission gap handled honestly

**PASS.** See DECISION 4. The gap is disclosed (not hidden) in the policy, the Play
description, and the source-of-truth doc; Play declares Precise = not collected, matching the
permission-free manifest. This is the honest handling the brief asked for.

### Bonus consistency checks

- **Privacy-policy HTML vs MD:** **PASS** — the hosted HTML (`privacy-policy.html`) faithfully
  mirrors the markdown section-for-section (local-only check-in row, trail-mile-not-GPS
  language, Android note, iOS-AI-availability note). Both carry the same real effective date
  and the same email DECISION flags.
- **Firebase / google-services.json absent:** consistently asserted across all four docs. PASS.
- **"~2.6 GB" model size:** consistent across Apple description, Play description, policy. PASS.

---

## BEFORE-SUBMIT CHECKLIST

- [x] **MF-1:** Edit `app-privacy-and-data-safety.md` so Apple **Precise Location = Not
      Collected** (align to the store-copy file, the Play form, and the policy). Update lines
      86, 101, 116, 118, 125–129, and consistency-warning item 1.
- [x] **MF-2:** Replace `[EFFECTIVE DATE]` with the real date in both `privacy-policy.md` and
      `privacy-policy.html` before hosting.
- [ ] DECISION 1: confirm iOS AI live-vs-stub; adjust the optional iOS-only AI line / AI
      keywords / promo qualifier accordingly.
- [x] DECISION 2: confirm + monitor `chris.stitchscreen@gmail.com`; wire it as the Play data-
      deletion contact.
- [ ] DECISION 3: stand up `hoggcountry.com/support` and `hoggcountry.com/privacy`.
- [ ] DECISION 5: reconcile Apple secondary category (Health & Fitness → Travel) for cross-
      store parity if desired.
- [ ] DECISIONs 6–8: confirm names/titles, keyword/category coupling, Play 18+ audience.

---

## Per-item scorecard

| Check | Result |
|---|---|
| (a) Policy ⇄ Apple ⇄ Play mutually consistent | **PASS** — Coarse/Approximate trail-mile is collected/shared; Precise/raw GPS is not collected/shared; User Content is collected/shared. |
| (b) No over-claiming (iOS AI 2.3.1 / medical / privacy-vs-form) | **PASS** — iOS-AI capability framing is 2.3.1-safe; medical/emergency explicitly disclaimed; privacy claims backed by labels. |
| (c) Char limits actually met | **PASS** — every claimed count verified exact by literal recount. |
| (d) Android location gap handled honestly | **PASS** — disclosed across policy/listing/label; Play declares Precise = not collected, matching the build. |

**Must-fix count: 0** — the prior MF-1 and MF-2 document blockers are fixed. Remaining items are
manual/account decisions: iOS AI live-vs-stub, monitored privacy mailbox, live support/privacy
URLs, and final App Store / Play Console form entry.
