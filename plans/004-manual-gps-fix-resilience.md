# 004 — Make manual "Use GPS" survive forest canopy (timeout + graceful fallback)

- **Status**: TODO
- **Written against**: commit `09d85489`
- **Effort**: S (hours incl. tests)
- **Risk**: LOW (parameter + fallback change in an isolated, already-tested service)
- **Depends on**: nothing (independent of the sync plans)

## Why this matters in the field

Manual "Use GPS" is how the hiker snaps his current trail mile — the number that drives
Today-tab context, Scout's "next water/shelter" answers, and live location. The current
fix request gives the GPS **4 seconds**:

```ts
// mobile/src/lib/trail-position-service.ts (verified at commit above)
getCurrentPosition(): Promise<TrailGpsPosition | null> {
	const geolocation = this.#geolocation();
	if (!geolocation) return Promise.resolve(null);
	if (!this.#getPrivacySettings().sharePreciseLocation) return Promise.resolve(null);

	return new Promise((resolve) => {
		geolocation.getCurrentPosition(
			(position) => resolve(position),
			() => resolve(null),
			{ enableHighAccuracy: true, maximumAge: 60_000, timeout: 4_000 }
		);
	});
}
```

Under dense Appalachian canopy or in a hollow, a fresh high-accuracy fix routinely takes
10–30 seconds. With `maximumAge: 60_000`, the 4s budget only succeeds when the OS has a
cached fix under a minute old — exactly what a hiker who just pulled the phone out of a
hip pocket doesn't have. The failure path returns null →
`resolveManualGpsMile` (in `mobile/src/lib/gps-mileage.ts`) tells him:

```ts
if (!input.hasPosition) {
	return { ok: false, reason: "Couldn't get a GPS fix. Try again with a clearer view of the sky." };
}
```

…so he retries repeatedly, each retry burning another GPS power-up cycle. Meanwhile the
*background* auto-watcher uses the opposite tradeoff (`enableHighAccuracy: false,
timeout: 10_000`) — the manual action, where the user is actively waiting and accuracy
matters most, gets the tightest budget. That's backwards.

## Design

Two-stage acquisition inside `getCurrentPosition()`, still resolving to
`TrailGpsPosition | null` so **no caller changes**:

1. **Stage 1**: `enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000`.
2. **Stage 2 (fallback)**: on stage-1 failure, one retry with
   `enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 8_000` — a coarse
   (cell/Wi-Fi/last-known) fix. The 20-metre snap index tolerates coarse fixes: snapping
   rejects anything > 2 miles off-trail (`snapToMile` in
   `mobile/src/lib/trail/trail-geometry.ts` returns null beyond `maxMiles = 2`), so a
   wildly wrong coarse fix cannot fabricate a trail mile — it degrades to the existing
   honest "more than 2 miles from the AT route" message.

Worst-case wait becomes ~23s. That is long enough that the button needs a busy state —
check the call-site component before deciding it's missing (see step 3).

## Steps

### Step 1 — the service change

Rewrite `getCurrentPosition()` in `mobile/src/lib/trail-position-service.ts` as two
chained attempts. Extract a private helper so it stays readable:

```ts
#requestPosition(geolocation: TrailGeolocation, options: TrailGpsOptions): Promise<TrailGpsPosition | null> {
	return new Promise((resolve) => {
		geolocation.getCurrentPosition((position) => resolve(position), () => resolve(null), options);
	});
}
```

Then stage 1 → if null, stage 2 → return. Keep the privacy guard and null-geolocation
guard exactly where they are (first, before any GPS activity). Match the file's existing
comment style: one comment explaining the canopy rationale and the 2-mile snap guard that
makes the coarse fallback safe.

### Step 2 — tests

`mobile/src/lib/trail-position-service.test.ts` already exists and constructs the service
with a fake `TrailGeolocation` — read it first and follow its fixture pattern (node:test,
`assert/strict`, tabs). Add:

1. Stage-1 success → resolves with the position; fake records exactly one
   `getCurrentPosition` call with `enableHighAccuracy: true` and `timeout: 15_000`.
2. Stage-1 failure, stage-2 success → resolves with the coarse position; fake records the
   second call with `enableHighAccuracy: false`.
3. Both fail → resolves null (existing "couldn't get a fix" contract intact).
4. Privacy off → resolves null with **zero** geolocation calls (regression guard).

### Step 3 — busy state at the call site

Find the UI that invokes `useGpsForMile` (grep `useGpsForMile` in
`mobile/src/lib/components/` — expected in the hike setup / trail tab surface). If the
button already disables + shows a pending label while awaiting, do nothing. If it doesn't,
add the minimal Svelte-5 pattern already used elsewhere in the file (a local
`let busy = $state(false)` around the await, button `disabled={busy}`, label swaps to
"Getting GPS fix…"). Do not restructure the component.

### Step 4 — verification gates

`cd mobile && npm test && npm run check && npm run build` — all exit 0.

## Hard boundaries

- **In scope**: `mobile/src/lib/trail-position-service.ts`, its test file, and (only if
  step 3 finds no busy state) the single component that calls `useGpsForMile`.
- **Out of scope**: `gps-mileage.ts` (`resolveManualGpsMile` messages and logic stay
  untouched), the background auto-watcher options in `reconcileAutoGpsWatch()` (its
  low-accuracy/quiet tradeoff is deliberate), `snapToMile`, live-location publishing,
  anything in `people/`.

## Done criteria

- `cd mobile && npm test` exit 0 incl. the four new cases.
- `npm run check` 0 errors; `npm run build` exit 0.
- `grep -n "timeout: 4_000" mobile/src/lib/trail-position-service.ts` → no matches.

## Maintenance note

If a future change adds Capacitor's native Geolocation plugin (higher-quality fixes on
iOS), it plugs in behind `TrailGeolocation`; keep the two-stage budget logic in the
service, not the adapter.

## Escape hatches — STOP and report if:

- `trail-position-service.test.ts`'s fake geolocation can't express per-call options
  assertions without large fixture surgery.
- The `useGpsForMile` call site turns out to be in a Svelte component that pipes through
  a store method with its own timeout assumptions (grep for other `4_000` literals first).
