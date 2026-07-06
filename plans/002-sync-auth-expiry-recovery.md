# 002 — Recover from token expiry instead of looping in silent 'error'

- **Status**: TODO
- **Written against**: commit `09d85489`
- **Effort**: S (half a day incl. tests)
- **Risk**: LOW-MED (touches the sync engine's auth branches; plan 001's tests fence it)
- **Depends on**: plan 001 (test harness + seams must exist)
- **Blocks**: nothing

## Why this matters in the field

The app is a thru-hiker's phone app; the hiker (Dad) is offline for days and signs in
once. If his Sanctum token dies mid-hike (server-side revocation, forced logout from
another device, token pruning), the app never recovers:

- `#fetchBootstrap()` swallows the 401 and returns null → restore "fails" → status
  `'error'` → `#scheduleDrain(RETRY_MS)` → drain → restore again → **401 → 'error' → retry,
  every 20 seconds, forever**. Battery burn + a permanently red backup card, and no hint
  that the fix is "sign in again".
- `#drain()`'s 401 branch sets `status = 'signed-out'` with the comment "auth.init/logout
  owns the sign-out" — but **nothing actually signs out**: `cloudAuth.status` remains
  `'signed-in'`, so the Account UI says signed-in while backup silently stopped. The next
  heartbeat (60s) re-runs the same dead push.

`cloudAuth.init()` only validates the token at boot. Mid-session death has no owner.

## Current code (excerpts, verified at commit above)

`mobile/src/lib/cloud/syncEngine.svelte.ts`:

```ts
async #fetchBootstrap(): Promise<{ docs: RemoteDoc[]; cursor: string } | null> {
	try {
		return await apiRequest<{ docs: RemoteDoc[]; cursor: string }>('/sync/bootstrap', {
			token: cloudAuth.token
		});
	} catch (error) {
		const err = error as ApiError;
		// Offline or a dead token → no restore this pass; the backup is untouched.
		if (err?.status !== 0 && err?.code !== 'offline' && err?.status !== 401) {
			console.error('Bootstrap pull failed', error);
		}
		return null;
	}
}
```

and in `#drain()`'s catch:

```ts
} else if (err?.status === 401) {
	// Token died; auth.init/logout owns the sign-out, just pause backup.
	this.status = 'signed-out';
}
```

`mobile/src/lib/cloud/auth.svelte.ts` — `init()` already has the exact recovery semantics
we want (validate via `/auth/me`; 401 → `#clear()`, network error → stay signed in):

```ts
try {
	const me = await apiRequest<{ user: CloudUser }>('/auth/me', { token: this.#token });
	this.user = me.user;
	this.status = 'signed-in';
} catch (e) {
	// Offline → keep the token and treat as signed-in (backup resumes later);
	// a real 401 → the token is dead, sign out.
	if ((e as ApiError).status === 401) {
		await this.#clear();
	} else {
		this.status = 'signed-in';
	}
}
```

Note: `#clear()` is private. Check its body before starting: it should null the token,
remove it from secure storage, and set `status = 'signed-out'` (which flips the sync
engine's `$effect` auth watcher to `'signed-out'` state).

## Design

Add one method to `CloudAuth` and call it from both 401 sites in the engine:

1. **`auth.svelte.ts`** — add:

```ts
/** A signed request got a 401 mid-session. Re-validate the token once against
 *  /auth/me; if the server confirms it is dead, sign out (so the UI tells the
 *  hiker to sign back in) — a transient/offline failure keeps the session. */
async revalidate(): Promise<void> {
	if (this.status !== 'signed-in' || !this.#token) return;
	try {
		const me = await apiRequest<{ user: CloudUser }>('/auth/me', { token: this.#token });
		this.user = me.user;
	} catch (e) {
		if ((e as ApiError).status === 401) {
			this.error = 'Your session expired. Sign in again to resume cloud backup.';
			await this.#clear();
		}
	}
}
```

Guard against concurrent calls with a private in-flight promise (`#revalidating`), the
same coalescing pattern used by `connecting` in `mobile/src/lib/spacetime/connection.ts`.

2. **`sync-engine-core.svelte.ts`** (the class extracted by plan 001) — the deps interface
gains `auth.revalidate(): Promise<void>`:

- In `#fetchBootstrap()`'s catch: when `err?.status === 401`, call
  `void this.#deps.auth.revalidate();` before returning null. The subsequent flow is
  unchanged (restore fails this pass); if revalidate confirms death, the auth watcher
  flips the engine to `'signed-out'` and the 20s retry loop stops because
  `#ensureRestoredThenDrain()` exits at the `!cloudAuth.signedIn` check.
- In `#drain()`'s 401 branch: replace `this.status = 'signed-out';` with
  `this.status = 'error'; void this.#deps.auth.revalidate();` and update the comment —
  the status must not claim signed-out while auth still says signed-in; revalidate is now
  the owner of that transition. (If revalidate finds the token alive — transient 401 —
  the next heartbeat retries the push normally.)

3. **Surface the message**: `cloudAuth.error` is already a reactive field. Confirm the
Account UI renders it (`mobile/src/lib/components/AccountTab.svelte` — search for
`cloudAuth.error` or `.error`). If it only renders during sign-in forms, add the message
to the signed-out card so a hiker who opens Account sees *why* they were signed out. Keep
the copy exactly: "Your session expired. Sign in again to resume cloud backup."

**Data safety (do not skip):** signing out must NOT clear the persisted outbox — queued
changes must survive and push after re-sign-in. Verify `#clear()` and the engine's
signed-out branch don't touch `#pending`/`#synced` persistence (at this commit they don't;
keep it that way). The restore-before-drain gate then protects the re-sign-in flow.

## Steps

1. Read `auth.svelte.ts` fully (it's ~180 lines). Add `revalidate()` with coalescing.
2. Update the two 401 sites in `sync-engine-core.svelte.ts`; thread `revalidate` through
   the `SyncEngineDeps` interface and the real-deps wrapper in `syncEngine.svelte.ts`.
3. Update plan 001's characterization tests 5 and 6:
   - Test 5 becomes: bootstrap 401 → `fakeAuth.revalidate` was called; status `'error'`.
   - Test 6 becomes: push 401 → `fakeAuth.revalidate` was called; status `'error'` (not
     `'signed-out'`).
   - New test: after revalidate flips `fakeAuth` to signed-out and
     `notifyAuthChangedForTest()` runs, a subsequent `flushForTest()` makes **zero** api
     calls (the retry loop actually stops) and the persisted outbox still contains the
     pending items.
4. If AccountTab needed a change, keep it to rendering the existing `cloudAuth.error`
   string — no new state, no new components.
5. Run gates: `cd mobile && npm test && npm run check && npm run build`.

## Hard boundaries

- **In scope**: `mobile/src/lib/cloud/auth.svelte.ts`,
  `mobile/src/lib/cloud/sync-engine-core.svelte.ts`,
  `mobile/src/lib/cloud/syncEngine.svelte.ts` (deps wiring only),
  `mobile/src/lib/cloud/syncEngine.test.ts`, and at most a few rendering lines in
  `mobile/src/lib/components/AccountTab.svelte`.
- **Out of scope**: `backend/` (no server changes), token refresh/rotation schemes,
  Sign in with Apple, `sync-outbox.ts`, any change to LWW semantics or the restore gate.

## Done criteria

- `cd mobile && npm test` exit 0 with the updated + new tests.
- `npm run check` 0 errors; `npm run build` exit 0.
- Grep proof: `grep -n "status = 'signed-out'" mobile/src/lib/cloud/sync-engine-core.svelte.ts`
  matches only the auth-watcher branch (where auth really is signed out), not the drain
  401 branch.

## Maintenance note

Any future auth flow (Sign in with Apple lands eventually) must route mid-session 401s
through `revalidate()` too — it is now the single owner of "token died while running".

## Escape hatches — STOP and report if:

- `#clear()` does anything beyond token-wipe + status flip (e.g. it clears the outbox) —
  that changes the data-safety analysis.
- `/auth/me` doesn't exist in `backend/routes/` (grep `auth/me`) — the endpoint contract
  differs from what `init()` implies.
- Plan 001 has not landed (no `sync-engine-core.svelte.ts`): do not re-implement it here.
