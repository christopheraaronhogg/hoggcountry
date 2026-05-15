# Scout Trail Pulse Feedback

Status: Draft v1 design
Date: 2026-05-15
Owner: Hogg Country / Scout
Surface: SvelteKit + Capacitor mobile app, future watch companion, SpacetimeDB shared state

## Product Goal

Trail Pulse is the fastest possible way for hikers to leave location-tied trail feedback and have that feedback resurface for other hikers at the right spot.

The core interaction should feel lighter than chat:

1. Tap **Report trail**.
2. Pick a chip, record voice, or type a short note.
3. Scout captures the hiker's GPS, snaps it to the trail, and publishes the note immediately.
4. Other hikers see the note when they are within 0.1 trail miles of the report.

Example public display:

```text
Mile 582.4 | Rocks -Backtrack | just now
Mile 582.4 | lots of rocks | 3 days ago
```

## V1 Product Rules

- Reports are visible to all users immediately.
- Reports do not expire.
- Reports do not wait for moderation.
- Reports stay active indefinitely and use the timestamp as the trust signal.
- Nearby means `abs(currentSnappedMile - report.snappedMile) <= 0.1`.
- Chip-only reports display the exact chip text.
- If the hiker adds text or voice, the user-provided phrase is displayed instead of rewriting the chip.
- If the reporter has a trail name, append `-Trailname`.
- If the reporter has no trail name, omit the signature entirely.
- Public display should use snapped trail mile or segment context, not exact raw GPS.

## Non-Goals

- No report decay.
- No report moderation queue.
- No trust scoring.
- No category-level alert preferences.
- No machine-generated rewriting of chip labels.
- No public exact-coordinate feed.
- No attempt to turn reports into official trail conditions.

## Capture Experience

The phone app should expose a persistent **Report trail** action from Today and Map. The button opens a bottom sheet with quick chips first, then optional voice and text.

V1 chips:

- `Rocks`
- `Mud`
- `Blowdown`
- `Water`
- `Crowded`
- `Sketchy`
- `View`
- `Other`

A chip alone is enough to submit. Voice and text are optional. If voice is used, the app stores the local audio capture long enough to transcribe or sync it, but the public report should be the transcript text once available.

The future watch companion should be even simpler: one action starts voice capture. The watch sends audio or transcript plus timestamp and GPS back through the phone/app sync path.

## Resurfacing Experience

Trail Pulse reports should surface in two ways.

### Passive

Today and Map show a compact nearby Trail Pulse card when active reports fall within the 0.1-mile window. If several reports are close, show the newest first and group them visually under the same mile.

### Active

Entering the same 0.1-mile window triggers one active alert per report or tight cluster:

- phone local notification
- in-app alert card
- watch haptic and short text when the watch companion exists

Duplicate guard: do not alert again for the same report during the same pass through the area. The app can mark `seenReportIds` locally and clear or relax that later if we decide hikers should be reminded on return trips.

## Data Model

The SpacetimeDB module should add a public report table and reducers for app-created reports.

```ts
export type TrailPulseSource = 'chip' | 'text' | 'voice';
export type TrailPulseStatus = 'active';

export interface TrailConditionReport {
  id: string;
  trailId: string;
  reporterIdentity?: string;
  reporterTrailName?: string;
  source: TrailPulseSource;
  chipText?: string;
  noteText: string;
  rawLatitude?: number;
  rawLongitude?: number;
  snappedMile: number;
  observedAt: string;
  status: TrailPulseStatus;
  createdAt: string;
}
```

Implementation notes:

- `noteText` is the public display phrase.
- For chip-only reports, `noteText` equals the chip text exactly.
- Raw GPS can be stored for snapping/debugging but should not be exposed in public report views.
- `trailId` starts as `appalachian-trail`.
- `status` only needs `active` in v1, but keeping the field leaves room for later hidden/admin states.

## Sync And Offline

The mobile app should follow the existing local-first pattern:

1. Create a local pending report with a client-generated ID.
2. Capture GPS and snap to trail mile on-device if possible.
3. If online, publish through the SpacetimeDB reducer immediately.
4. If offline, keep the report in the local queue and replay when service returns.
5. Store recently downloaded nearby reports locally so passive cards and active alerts still work offline.

If GPS is unavailable, the app can fall back to the current known trail mile. If neither is available, disable submit and explain that location is needed to attach the report to the trail.

## Privacy

Immediate public visibility applies to the trail feedback, not the reporter's exact location.

Public report views should include:

- snapped mile
- note text
- optional trail name
- observed timestamp

Public report views should not include:

- raw latitude/longitude
- account email
- private profile fields
- exact identity unless a later social feature explicitly needs it

## Acceptance Checks

- A hiker can submit a chip-only report in two taps from Today or Map.
- Chip-only public display uses exactly the chip label.
- A hiker can submit a short text report.
- A voice report displays the transcript when available.
- A report without a trail name has no placeholder signature.
- A report with a trail name displays `-Trailname`.
- Reports appear immediately to other clients subscribed near the report mile.
- Reports remain active with no expiration behavior.
- Nearby filtering uses a 0.1-mile trail window.
- Entering the window creates one local active alert per report or cluster.
- Raw GPS is not exposed in public report views.
- Offline-created reports queue locally and publish when service returns.

## Open Implementation Questions

- Whether snapping should live fully on-device from the route pack, server-side in SpacetimeDB/Laravel, or both.
- Whether report subscriptions should be global for the small beta or filtered by mile window from the start.
- Whether the mobile prototype should land this first in `mobile/` or the newer `apps/openclaw-web` app shell before Capacitor packaging.
- Whether voice transcription should start with device dictation APIs, server transcription, or both depending on platform support.
