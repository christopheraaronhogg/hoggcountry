# Improvement plans — mobile/ field reliability audit

Audit of `mobile/` (the primary product — Dad's AT thru-hike app) focused on reliability
and usefulness for a hiker in the field. Standard-depth audit, 4 parallel auditors
(offline/boot, cloud sync + live location, Scout runtime, tests/direction), every finding
below vetted against the code by the advisor before planning. Written against commit
`09d85489` (2026-07-06).

Run non-interactively: plans were written for the top findings by leverage (the default
when no user selection is available). Chris can reprioritize freely.

## Execution order & status

| # | Plan | Effort | Depends on | Status |
|---|------|--------|-----------|--------|
| 001 | [SyncEngine test harness + characterization tests](001-sync-engine-test-harness.md) | M | — | DONE |
| 002 | [Recover from token expiry (401) instead of silent retry loop](002-sync-auth-expiry-recovery.md) | S | 001 | DONE |
| 003 | [Poison-batch quarantine so one bad doc can't wedge backup](003-sync-poison-batch-resilience.md) | M | 001, after 002 | DONE |
| 004 | [Manual "Use GPS" canopy resilience (timeout + coarse fallback)](004-manual-gps-fix-resilience.md) | S | — | DONE |
| 005 | [Quarantine corrupt persisted hike state instead of silent reset](005-persisted-state-corruption-quarantine.md) | M | — | DONE |

004 and 005 are independent of the sync stack and can run in parallel with 001–003.
Executors: update the Status column (TODO / IN-PROGRESS / DONE / BLOCKED) as you go.

## Smaller confirmed items — worth doing, no full plan written

- **CI doesn't run the mobile build**: `.github/workflows/mobile-ci.yml` runs
  `npm run check` + `npm test` but not `npm run build`; a Vite-only failure ships to the
  phone-build step undetected. Fix: add `- name: Build` / `run: npm run build` after the
  test step. (S)
- **SpacetimeDB token in localStorage** (`mobile/src/lib/spacetime/connection.ts` —
  `localStorage.getItem/setItem(tokenKey)`): cloud auth uses Capacitor Preferences
  (`cloud/secureStore.ts`); the SpacetimeDB identity token should too. Losing it (WebView
  storage eviction) mints a new identity → silently orphans live-location group
  memberships; on a compromised device it's also the weaker store. (S-M)
- **Model-download watchdog**: `capacitor-gemma-bridge.ts` `observeTerminal` settles only
  on a native terminal event; a stalled native download leaves the await hanging. Add a
  progress-staleness watchdog (e.g. no progress event for 120s → fail the promise with a
  retryable error) rather than a fixed overall timeout. (M)
- **On-device input-truncation honesty**: `providers/on-device-gemma.ts` adds a
  confirmation chip when *output* is truncated (`on-device-truncated`) but `fitSystemContext`
  can drop system guidance on over-budget prompts with no flag. Emit the same style of
  confirmation when input context was cut. (M)
- **LWW clock-skew guard**: `client_updated_at` is stamped from the device clock and is
  the LWW tiebreaker server-side (`SyncController.php`). Fetch server time once per
  session, store the delta, stamp with corrected time; warn if |skew| > 5 min. (S)
- **Diagnostics redaction**: add `currentmile`/`mile` to `PRIVATE_CONTEXT_KEYS` in
  `scout-diagnostics.ts` (position-adjacent; bucketed mile events remain the intentional
  channel). (S)
- **Share-code fallback should fail closed**: `people.svelte.ts` `generateShareCode()`
  falls back to `Math.random` when `crypto.getRandomValues` is missing. Prefer throwing
  (block group creation) — crypto is universal on target platforms, so the branch should
  never run; if it does, a weak bearer code is worse than a visible error. (S)
- **SpacetimeDB reducer input caps**: `apps/openclaw-web/spacetimedb/src/index.ts`
  `joinGroup` checks a *minimum* groupCode length only; add max-length caps (e.g. 256) on
  `groupCode`/`trailName` in all reducers. (S)
- **Sign-out doesn't clear the persisted outbox** (`hc-sync-outbox-v1`): mostly storage
  hygiene, but leftover pending docs from account A could push into account B's backup
  after an account switch on the same device. Single-family app today → low, but clear
  pending-on-different-account at sign-in. (S)

## Direction (product options, not defects)

1. **Push notifications Phase 2 is the highest-leverage unfinished intent.** The client
   is fully built and inert (`mobile/src/lib/push/push.svelte.ts`, ~290 lines, opt-in +
   VAPID + APNs paths); the Laravel `/api/v1/devices/push` endpoint + sender don't exist.
   It blocks the two safety loops (daily readiness, missed-check-in alerts) that turn
   live location from "where is Dad" into "is Dad okay". Already planned in
   `docs/plans/2026-06-24-push-notifications-foundation.md` — this audit just confirms
   it's the right next build.
2. **Daily position checkpoint persistence** (Garmin/AGENTS.md TODO): no daily fixes are
   persisted anywhere; a "replay the hike" record and post-hoc safety reconstruction are
   impossible. Cheap client-side start: a `checkpoint` doc type in the existing sync
   outbox (position + mile + timestamp at check-in time) — the backup API already
   supports it without server changes.
3. **Component-level test coverage** (27 Svelte components, zero tests) is real debt but
   needs a harness decision (repo forbids new build tools; node:test can't mount
   components). Defer until after the plans above; revisit as its own tooling decision.

## Considered and rejected (do not re-audit)

- *Hydration effect persists pre-hydration state* — refuted: the `$effect` guard
  (`if (!this.#stateHydrated) return`) runs before any persist/backup call.
- *Stale GPS adopted after privacy toggle-off* (two variants) — refuted:
  `#adoptAutoGpsPosition` re-checks `#shouldAutoGpsWatch` (which reads live privacy
  settings) on every callback.
- *Restore/persist races with auth change mid-apply* (two variants) — refuted: the apply
  loop is synchronous with no awaits between the epoch check and persist; JS can't
  interleave an auth transition there.
- *1.9 MB JSON.parse freezes first Map open* — already mitigated by design:
  `trail-geometry.ts` yields to a macrotask before each parse and loads lazily off the
  boot path.
- *Model descriptor caches `null` and never retries* — refuted: a null cache is falsy, so
  the next `describe()` call re-probes.
- *Field-pack refresh error never clears* — refuted: `refreshFromEndpoint` sets
  `error: undefined` at refresh start and success rebuilds status from scratch.
- *Pilot receipts stripped on self-track loses attribution* — by design:
  `sanitizeContextPackForSelfProfile` deliberately de-owns the pilot pack and substitutes
  an explicit "personal pack pending refresh" notice.
- *`npm run check` fails locally (missing @sveltejs/adapter-static)* — environment
  artifact: the audit worktree had no `mobile/node_modules`; `npm ci` fixes it, CI passes.
- *Single generation retry for flaky LiteRT* — deprioritized: a second failure falls
  through to the router's fallback lane; multi-retry adds latency for marginal gain.
- *`group_member` rows never expire / no leftAt archival* — deferred: views are correctly
  sender-scoped; this is operational hygiene at family scale, not a leak.
- *Redundant `Date.parse` on pack status* — micro-optimization, not worth doing.
- *Pending count invisible for a beat before hydrate* — cosmetic, not worth doing.
- *Snapshot/a11y test layer* — premature until the component-harness decision (Direction #3).

## What was NOT audited

- The Android native shell, Xcode/iOS project internals, and the Gemma native plugin's
  Swift/Kotlin code (JS/TS bridge only).
- `apps/openclaw-web` (except the SpacetimeDB module), the legacy Astro tree, backend
  beyond the `/sync` contract, packages/, scripts/, trailhogg/.
- Bible, gear, guide-content, and Trail Pulse UI features (skimmed only where they touch
  boot/persistence).
- No `npm audit` pass (registry access not exercised); dependency posture unreviewed.
