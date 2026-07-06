# 001 — SyncEngine test harness + characterization tests

- **Status**: TODO
- **Written against**: commit `09d85489`
- **Effort**: M (a day-ish)
- **Risk**: LOW (adds tests only; no production code changes except an optional testability seam)
- **Depends on**: nothing
- **Blocks**: plans 002 and 003 (both modify `syncEngine.svelte.ts`; this plan pins its current behavior first)

## Why

`mobile/src/lib/cloud/syncEngine.svelte.ts` is the cloud-backup engine for a thru-hiker's
phone: it queues every durable state change into a persisted outbox and drains it to the
Laravel `/api/v1/sync/push` API. Its pure reconciliation core (`sync-outbox.ts`) is well
unit-tested, but the orchestration layer — restore-before-drain gating, auth-epoch
invalidation, retry scheduling, 401/422/offline error branches — has **zero tests**. Plans
002 and 003 change exactly those error branches. Without characterization tests first, a
weaker executor could silently break the "never push defaults over the real backup" safety
gate, which is the single most dangerous regression in this app (it destroys the cloud
backup).

## Repo facts you need

- Repo root: the git repo containing `mobile/`. All paths below are repo-relative.
- Stack: SvelteKit 2 + Svelte 5 (runes), TypeScript, tabs for indentation.
- Test runner: Node's built-in `node:test` via `npm --prefix mobile test`, which runs:
  `node --experimental-strip-types --experimental-transform-types --test src/lib/*.test.ts src/lib/trail/*.test.ts src/lib/cloud/*.test.ts src/lib/push/*.test.ts src/lib/scout/*.test.ts src/lib/bible/*.test.ts`
  A new file at `mobile/src/lib/cloud/syncEngine.test.ts` is picked up by the existing glob. **Do not add vitest, jest, or any new test dependency — the repo forbids new build tools.**
- Setup: run `npm ci` inside `mobile/` first if `mobile/node_modules` is missing.
- Verification gates (run all from `mobile/`): `npm test`, `npm run check`, `npm run build`.

## The problem to solve: runes in node:test

`syncEngine.svelte.ts` uses Svelte 5 runes at module scope:

```ts
// mobile/src/lib/cloud/syncEngine.svelte.ts (excerpt, current code)
class SyncEngine {
	status = $state<BackupStatus>('signed-out');
	lastBackupAt = $state<string | null>(null);
	#pending = $state<PendingMap>({});
	...
	start(): void {
		...
		$effect.root(() => {
			$effect(() => {
				const authed = cloudAuth.status;
				this.#authEpoch++;
				...
			});
		});
	}
}
export const syncEngine = new SyncEngine();
```

Under `node --experimental-strip-types`, `$state(...)` / `$effect.root(...)` are plain
global function calls that don't exist → `ReferenceError` on import. That is why only the
pure core is tested today. The harness fixes this with **global rune shims** installed
*before* importing the module under test:

```ts
// shim sketch — $state passes the value through; effects run their body once, no reactivity
(globalThis as Record<string, unknown>).$state = <T>(v: T): T => v;
const effectShim = (() => {}) as unknown as { (fn: () => void): void; root: (fn: () => void) => () => void };
// $effect must be callable AND have .root / .pre properties
```

Reactivity semantics are lost (fine — these tests drive methods directly and assert on
state + calls), but all the orchestration logic runs.

Two more module-level dependencies must be neutralized before import:

1. `import { browser } from '$app/environment'` — a SvelteKit virtual module that doesn't
   exist in node. Check how other tests in `mobile/src/lib/cloud/` or `mobile/src/lib/`
   handle imports; `sync-outbox.ts` deliberately avoids such imports. `syncEngine.svelte.ts`
   also imports `./api` (which may import more) and `./auth.svelte` (more runes) and
   `../mobile-persistence`.
2. Because those imports form a chain you cannot mock with plain node:test ESM, **the clean
   solution is a small testability seam**: extract the `SyncEngine` class into a factory
   that takes its dependencies as a parameter object, keeping `syncEngine.svelte.ts` as a
   thin wrapper that instantiates it with the real deps.

## Steps

### Step 1 — extract a dependency-injected core (mechanical refactor, behavior identical)

Create `mobile/src/lib/cloud/sync-engine-core.svelte.ts` containing the `SyncEngine` class,
modified only as follows:

- Constructor takes a deps object:

```ts
export interface SyncEngineDeps {
	browser: boolean;
	api: <T>(path: string, options?: { method?: string; token?: string | null; body?: unknown }) => Promise<T>;
	auth: {
		readonly status: 'unknown' | 'signed-out' | 'signed-in';
		readonly signedIn: boolean;
		readonly token: string | null;
		deviceId(): Promise<string>;
		ensureDeviceRegistered(): Promise<void>;
	};
	storage: PersistenceAdapter | null;
	isOnline: () => boolean; // replaces direct navigator.onLine reads
	now: () => string;       // replaces nowIso()
}
```

- Every `apiRequest(...)` call becomes `this.#deps.api(...)`; every `cloudAuth.X` becomes
  `this.#deps.auth.X`; every `navigator.onLine` becomes `this.#deps.isOnline()`; every
  `nowIso()` becomes `this.#deps.now()`; `browser` becomes `this.#deps.browser`; the
  storage adapter comes from `this.#deps.storage`.
- The `window.addEventListener` / `document.addEventListener` / `setInterval` wiring and
  the `$effect.root` auth watcher stay in `start()` exactly as they are (they no-op in
  tests because tests never call `start()`; tests drive the private flows via the public
  surface — see step 3 for what needs exposing).
- `syncEngine.svelte.ts` shrinks to: build the real deps object (importing `browser`,
  `apiRequest`, `cloudAuth`, `createMobilePersistenceAdapter`) and export
  `export const syncEngine = new SyncEngine(realDeps);` plus the existing type re-exports
  (`BackupStatus`, `RestoreProvider`, `RestoreApply`). Grep the repo for
  `from './syncEngine.svelte'` / `from '$lib/cloud/syncEngine.svelte'` and confirm every
  importer still type-checks; do not change any importer's API.
- Preserve every comment from the original file — they document data-safety reasoning.

Verification: `npm run check` (0 errors), `npm run build` succeeds, `npm test` still passes.

### Step 2 — make the internal triggers testable

Tests need to invoke a drain/restore cycle without timers. Add to the class (in
`sync-engine-core.svelte.ts` only):

```ts
/** TEST SEAM: run one restore-gate + drain pass immediately (no debounce). */
async flushForTest(): Promise<void> { await this.#ensureRestoredThenDrain(); await this.#drain(); }
/** TEST SEAM: signal an auth transition exactly like the $effect in start() does. */
notifyAuthChangedForTest(): void { this.#authEpoch++; if (this.#deps.auth.status === 'signed-in') { void this.#ensureRestoredThenDrain(); } else if (this.#deps.auth.status === 'signed-out') { this.#restoreOk = false; this.status = 'signed-out'; } }
/** TEST SEAM: wait for outbox hydration (mirrors the private #hydratedDone). */
whenHydratedForTest(): Promise<void> { return this.#hydratedDone; }
```

Also expose hydration start: tests construct the engine, so move the `void this.#hydrate()`
call out of `start()`? **No — check first.** In the current code `#hydrate()` is called from
`start()`. Keep it there, and add a test seam `hydrateForTest()` that calls `#hydrate()`
directly. Keep the `ForTest` suffix on all seams so reviewers can spot them; they must
contain no logic beyond delegation.

The auth-transition seam must mirror the real `$effect` body **exactly** — if plan 002 later
changes that body, it must change both places (note this in a comment at both sites).

Verification: `npm run check`, `npm test`, `npm run build`.

### Step 3 — write the characterization tests

Create `mobile/src/lib/cloud/syncEngine.test.ts`. At the very top, before any import of the
engine, install the rune shims:

```ts
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const g = globalThis as Record<string, unknown>;
g.$state = <T>(v: T): T => v;
const effect = Object.assign((_fn: () => void) => {}, { root: (fn: () => void) => { fn(); return () => {}; }, pre: (_fn: () => void) => {} });
g.$effect = effect;
g.$derived = <T>(v: T): T => v;

const { SyncEngine } = await import('./sync-engine-core.svelte.ts');
```

Build small fakes:

- `fakeStorage`: in-memory `Map`-backed `PersistenceAdapter` (`get`/`set`/`remove`).
  Follow the adapter shape in `mobile/src/lib/mobile-persistence.ts`.
- `fakeApi`: a function you can program per-path with queued responses or thrown
  `ApiError`-shaped objects (`{ status: number; code?: string; message?: string }` — check
  the exact shape in `mobile/src/lib/cloud/api.ts` and match it).
- `fakeAuth`: mutable `{ status, signedIn, token, deviceId: async () => 'dev-1', ensureDeviceRegistered: async () => {} }`.

Characterization tests to write (assert **current** behavior, even where plans 002/003
will change it — mark those with a `// plan 002 will change this` comment):

1. **Restore gate**: signed-in + online + pending items, but `/sync/bootstrap` throws
   `{status: 500}` → after `flushForTest()`, no `/sync/push` call was made, status is
   `'error'`. (The core data-safety invariant.)
2. **Restore success unlocks drain**: bootstrap returns `{docs: [], cursor: '1'}` →
   `/sync/push` is called with the pending batch; applied response clears pending; status
   ends `'idle'`; `lastBackupAt` set.
3. **Restore applies remote docs**: bootstrap returns a doc; a registered
   `RestoreProvider` (fake `apply` returning true, `isFresh` returning true) receives it;
   the doc's etag lands in the synced baseline (verify via `fakeStorage` snapshot content).
4. **Offline**: `isOnline()` false, pending non-empty → status `'offline'`, no api calls.
5. **401 on bootstrap (current behavior)**: bootstrap throws `{status: 401}` → status
   `'error'`, no push, no sign-out side effects. `// plan 002 will change this`
6. **401 on push (current behavior)**: bootstrap ok, push throws `{status: 401}` → status
   `'signed-out'` while `fakeAuth.status` is still `'signed-in'`. `// plan 002 will change this`
7. **Non-retryable push error (current behavior)**: push throws `{status: 422}` → status
   `'error'`, pending batch untouched (still in outbox). `// plan 003 will change this`
8. **unknown_device**: push throws `{code: 'unknown_device', status: 422}` →
   `ensureDeviceRegistered` was called.
9. **Auth-epoch discard**: start a restore whose bootstrap promise is manually resolved
   *after* calling `notifyAuthChangedForTest()` with auth flipped to signed-out → the
   provider's `apply` is never called and no push happens.
10. **Persistence round-trip**: enqueue two docs, snapshot `fakeStorage`, build a fresh
    engine over the same storage, `hydrateForTest()` → `pendingCount === 2`.

Timer note: `#scheduleDrain` uses real `setTimeout`. Tests avoid waiting by calling
`flushForTest()` directly; where a test would otherwise leave a pending 20s retry timer,
end the test process cleanly by using short-circuit assertions only — if a dangling timer
keeps node:test alive, add a `stopForTest()` seam that clears `#drainTimer`/`#persistTimer`
and call it in `afterEach`.

Verification: `npm test` — all new tests pass, all 261 existing tests still pass.

## Hard boundaries

- **In scope**: `mobile/src/lib/cloud/sync-engine-core.svelte.ts` (new),
  `mobile/src/lib/cloud/syncEngine.svelte.ts` (thin wrapper),
  `mobile/src/lib/cloud/syncEngine.test.ts` (new).
- **Out of scope**: `sync-outbox.ts` (the tested pure core — do not touch),
  `auth.svelte.ts`, `api.ts`, `restore.ts`, anything under `backend/`, any Svelte
  component, any behavior change however tempting. If a step reveals a bug, record it as a
  comment `// KNOWN-ISSUE (see plans/00X)` and keep the characterization test asserting
  current behavior.

## Done criteria (machine-checkable)

- `cd mobile && npm test` → exit 0, includes ≥10 new tests whose names start with `syncEngine:`.
- `cd mobile && npm run check` → 0 errors, 0 warnings introduced (compare against a pre-change run).
- `cd mobile && npm run build` → exit 0.
- `git diff --stat` touches only the three in-scope files.

## Maintenance note

Plans 002/003 edit the error branches this file pins down; they must update tests 5–7
rather than delete them. The `notifyAuthChangedForTest` seam duplicates the `$effect` body
in `start()` — keep them in lockstep (both sites carry a comment saying so).

## Escape hatches — STOP and report back instead of improvising if:

- The rune shim approach fails because compiled Svelte output is required (e.g. `$state`
  used in a way that isn't a plain call). Report the exact error.
- Extracting the class breaks an importer you can't fix with a pure re-export.
- Existing tests fail before you change anything (baseline is broken).
