# Scout saved trail facts fallback

**Date:** 2026-07-11
**Status:** Accepted for implementation
**Scope:** Native mobile Scout when Gemma 4 cannot answer yet

## Problem

The phone can hold a useful field pack even while Gemma 4 is missing, downloading,
initializing, being tested, or recovering from a failure. Today the Scout surface
correctly refuses to invent an AI answer in those states, but the hiker must leave
Scout and reconstruct the nearest cached landmarks elsewhere in the app.

The fallback must expose those saved facts without making them look like a model
answer, a live lookup, or a safety recommendation.

## Decision

Add a deterministic **Saved trail facts · not an AI answer** card beside the Scout
conversation. It is a separate semantic section, not a chat message, and it never
creates a `ScoutAnswer`, provider, confidence score, source receipt, or conversation
history entry.

The card is visible only in the native-app states where local Gemma is unavailable
or occupied with readiness work:

- `needs_model`
- `initializing`
- `testing`
- `failed`

It stays hidden for the web demo (`unsupported`) because that surface has an
independent Cloud Scout lane, and it stays hidden when the local runtime is usable.

## Facts and direction

A pure function reads the current in-memory `ContextPack`, the app's current saved
mile/direction, and the pack's derived freshness status. Keeping live app position
separate prevents an old pack center from overriding a mile the hiker just corrected.
It uses the shared `@hoggcountry/trail-data` direction contract and a 120-mile cap to
select, in actual encounter order:

1. current saved AT mile and NOBO/SOBO direction;
2. nearest loaded water;
3. nearest water explicitly labeled `reliable`;
4. nearest loaded shelter;
5. nearest loaded town/access entry.

Invalid miles, blank names, behind-the-hiker entries, and entries outside the cap
are excluded. `seasonal` and `thin` water never become “reliable” through inference.
An exact-current landmark remains eligible under the shared mile tolerance.

## Truthful copy

- Every landmark says **loaded** or **saved**, never live, current, confirmed, open,
  available, safe, or recommended.
- Water shows its exact stored reliability label and always says to confirm flow and
  treat it.
- Shelter is a candidate; status, rules, capacity, water, and crowding are unverified.
- Town/access is a candidate; access and services require confirmation.
- A stale, errored, fallback, or unknown-freshness pack gets a prominent cached-only
  warning. A ready/saved pack still says conditions can change and should be checked.
- If persistence verification failed, the heading changes to **Loaded trail facts**
  and says the data is available only for this session; it never calls those bytes
  saved for offline restart.
- An empty 120-mile slice says no matching fact is loaded; it does not imply that the
  landmark does not exist.

## UI behavior

The compact disclosure sits outside the conversation region and above the composer.
It is collapsed by default so a missing model cannot squeeze the transcript or
composer. When opened, its body has a bounded internal scroll area; the two-column
fact grid collapses to one column on narrow phones. It includes a plain explanation
of why Gemma is unavailable and updates from the existing shared minute clock, so a
pack that expires while the app remains open changes to cached-only truth.

There is no question parser and no canned prose response. The card is useful even
before a prompt and cannot be mistaken for an answer to an arbitrary safety question.

## Verification

Pure tests cover NOBO and SOBO order, the 120-mile boundary, invalid/behind records,
strict reliable-water selection, empty slices, non-mutation, and stale/unknown pack
copy. Visibility tests cover every offline-readiness stage. UI contract tests prove
that the card is outside the conversation region, contains the not-an-AI label, uses
the minute clock, and does not register a `ScoutAnswer`.

Release gates remain the mobile test suite, Svelte check, production build, repository
tests, Android packaging, and the existing physical-device Gemma proof. This fallback
does not convert an unproven model build into an offline-ready build.
