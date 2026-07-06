# 005 — Quarantine corrupt persisted hike state instead of silently resetting

- **Status**: TODO
- **Written against**: commit `09d85489`
- **Effort**: M (a day incl. tests)
- **Risk**: LOW-MED (touches the boot/hydration path — keep it lean; the hard rule is no
  heavy work at boot)
- **Depends on**: nothing (independent of the sync plans)

## Why this matters in the field

The whole hike lives in one persisted JSON blob (`trailState.svelte.ts` → key
`STORAGE_KEY`, via Capacitor Preferences with localStorage fallback). Hydration at boot:

```ts
// mobile/src/lib/trailState.svelte.ts (verified at commit above)
async #hydrate() {
	const raw = await this.#stateStorage?.get(STORAGE_KEY).catch(() => null);
	if (!raw) {
		this.#stateHydrated = true;
		return;
	}
	try {
		this.#state = parsePersistedTrailState(raw);
	} catch (error) {
		console.error('Failed to restore Trail Assistant state', error);
	} finally {
		this.#stateHydrated = true;
	}
}
```

`parsePersistedTrailState` (`mobile/src/lib/trail-state-persistence.ts`) is
`JSON.parse(raw)` + shape repair. If the blob is corrupt (interrupted write, quota
truncation, storage-layer bit-rot), the catch logs to a console nobody sees and the app
boots on **defaults** — to the hiker it looks like his entire hike reset. Worse: the
persistence `$effect` fires on his next state change and **overwrites the corrupt-but-
possibly-recoverable blob with defaults+that change**. The original data is destroyed.
Cloud backup mitigates this only if he opted in and was signed in; the offline-first
design means local persistence must be self-sufficient.

The shape-repair path has the same silent-reset property for a *valid-JSON-wrong-shape*
blob: `restorePersistedTrailState` spreads whatever parsed over defaults and calls
`resetToUncalibratedStarterState` when `hikeProfile.mode` is missing — reasonable repair,
but again invisible.

## Design

Three small changes, all off the hot path:

1. **Quarantine before overwrite.** When `parsePersistedTrailState(raw)` throws, write the
   raw blob to a sibling key before continuing:
   `hc-trail-state-quarantine-v1` = JSON string
   `{ savedAt: <ISO now>, reason: <error message>, raw: <the blob> }`.
   Never overwrite an existing quarantine entry (first corruption wins — a second
   corruption of the *defaults* must not clobber the real hike data captured by the
   first). Fire-and-forget (`void ... .catch(console.error)`) so boot never blocks on it.
2. **Surface it.** Add a reactive flag the UI can read (`recoveryAvailable`-style boolean
   on the trail store, set true when a quarantine write happened at this boot OR a
   quarantine key exists). Render one dismissible notice in the Settings surface
   (`mobile/src/lib/components/SettingsTab.svelte`): "A previous copy of your hike data
   couldn't be read and was set aside. Cloud restore or support can recover it." with a
   single "Dismiss" action that clears the flag for this device
   (persist the dismissal in the quarantine record: add `dismissed: true` — do NOT delete
   the blob). No restore-from-quarantine UI in this plan; recovery is a manual/support
   operation by design.
3. **Distinguish parse-fail from empty.** The current `console.error` string stays, but
   also record a Scout diagnostic event (the app has an events channel:
   `recordScoutDiagnostic` in `mobile/src/lib/scout/scout-diagnostics.ts`) with name
   `trail_state_corrupt` and context `{ reason }` — no state contents in the event
   (diagnostics redact known keys, but don't rely on that; send only the error message).
   Read `scout-diagnostics.ts`'s exported signatures first and call it the way other
   call sites do (grep `recordScoutDiagnostic(` for examples).

## Steps

### Step 1 — quarantine write in `#hydrate()`

In `trailState.svelte.ts`, extend the catch block. Add a module const
`QUARANTINE_KEY = 'hc-trail-state-quarantine-v1';` near `STORAGE_KEY` (find its exact
declaration first). Implementation notes:

- Check-then-write: `const existing = await this.#stateStorage?.get(QUARANTINE_KEY)` —
  only write when null/absent. This runs *inside the already-failed catch branch*, so the
  extra await cannot slow a healthy boot.
- Set the reactive flag (step 2's field) after the write, and also when `existing` is
  found with `dismissed` !== true.

### Step 2 — the flag + notice

- Add to the trail store class: `stateRecoveryNotice = $state(false);` (follow the naming
  and placement conventions of the other `$state` fields in the file), plus a
  `dismissStateRecoveryNotice()` method that sets it false and rewrites the quarantine
  record with `dismissed: true`.
- `SettingsTab.svelte`: read the store the way the component already does (it imports the
  shared trail store — match the existing accessor), render the notice inside an existing
  card/section pattern — copy the markup idiom of a neighboring block rather than
  inventing new styles; use existing design tokens only.

### Step 3 — tests

`mobile/src/lib/trail-state-persistence.test.ts` exists — extend it where the logic is
pure, and add hydration tests where they can run under node:test:

1. Pure: `parsePersistedTrailState('not json {{{')` throws (characterize the error type).
2. Pure: valid JSON, missing `hikeProfile.mode` → returns uncalibrated starter state
   (already-existing behavior — add the test only if not already present; read the file
   first).
3. Hydration: the trail store class is heavily runes-based and not directly importable
   under node:test — so extract the quarantine decision into a pure helper in
   `trail-state-persistence.ts`:
   `quarantineRecord(raw: string, reason: string, existing: string | null, nowIso: string): string | null`
   returning the JSON to write or null (when an existing record must be preserved). Unit-
   test that helper for: no existing → writes; existing → null; record shape round-trips.
   `#hydrate()` then just calls it. This keeps the store diff minimal and the logic tested.

### Step 4 — verification gates

`cd mobile && npm test && npm run check && npm run build` — all exit 0.

Manual smoke (document in the PR, requires a browser): run `npm --prefix mobile run dev`,
in devtools set `localStorage['hc-trail-state'...]` (use the real `STORAGE_KEY` value) to
`"{corrupt"`, reload → app boots on defaults, quarantine key exists in localStorage,
Settings shows the notice, Dismiss persists across reload.

## Hard boundaries

- **In scope**: `mobile/src/lib/trailState.svelte.ts` (catch branch + flag + dismiss
  method only), `mobile/src/lib/trail-state-persistence.ts` (+ its test),
  `mobile/src/lib/components/SettingsTab.svelte` (one notice block).
- **Out of scope**: any restore-from-quarantine feature, changes to
  `restorePersistedTrailState` repair semantics, the persistence `$effect`, cloud
  restore (`cloud/restore.ts`), the service worker, `scout/context-pack-store.ts` (its
  own parse-failure handling is a separate, lower-value concern — leave it).
- **Boot-path rule (repo hard rule)**: no new work on the *successful* hydration path.
  Everything this plan adds executes only in the failure branch or lazily in Settings.

## Done criteria

- `cd mobile && npm test` exit 0 incl. new quarantine-helper tests.
- `npm run check` 0 errors; `npm run build` exit 0.
- `grep -n "QUARANTINE_KEY" mobile/src/lib/trailState.svelte.ts` shows the key used in
  the catch branch only (not on the success path).

## Maintenance note

The quarantine blob is bounded to one entry by design. If document-vault growth ever makes
the state blob large (multi-MB), revisit: quota-exceeded writes become likelier and the
quarantine copy doubles storage cost of the corrupt case — acceptable now, worth a size
guard later. Future doc: a support runbook line for "recover a quarantined hike state".

## Escape hatches — STOP and report if:

- `STORAGE_KEY`'s adapter (`#stateStorage`) lacks a way to check existence without reading
  the whole value AND quarantine blobs could exceed Preferences size limits (check
  `createMobilePersistenceAdapter` in `mobile/src/lib/mobile-persistence.ts` — it proxies
  Capacitor Preferences with localStorage fallback; if either layer rejects large values,
  report rather than truncate).
- `SettingsTab.svelte` has no natural place for a notice (report with a screenshot-level
  description of its structure instead of forcing one in).
