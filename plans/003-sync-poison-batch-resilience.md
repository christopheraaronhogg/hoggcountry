# 003 — Stop one bad document from wedging cloud backup forever

- **Status**: TODO
- **Written against**: commit `09d85489`
- **Effort**: M (a day-ish incl. tests)
- **Risk**: MED (touches the drain path; the quarantine must never drop valid data)
- **Depends on**: plan 001 (test harness); land after plan 002 (same file, smaller diff first)

## Why this matters in the field

The sync engine pushes up to 200 outbox changes per request to Laravel
`/api/v1/sync/push`. The server validates the **whole request** up front
(`backend/app/Http/Controllers/Api/V1/SyncController.php`):

```php
$validated = $request->validate([
    'device_id' => ['required', 'uuid'],
    'changes' => ['required', 'array', 'min:1'],
    'changes.*.op' => ['required', 'in:upsert,delete'],
    'changes.*.doc_type' => ['required', 'string', 'max:100'],
    'changes.*.doc_id' => ['required', 'string', 'max:100'],
    'changes.*.schema_version' => ['nullable', 'integer', 'min:1'],
    'changes.*.client_updated_at' => ['required', 'date'],
    'changes.*.etag' => ['required', 'string', 'max:64'],
    'changes.*.content' => ['nullable', 'array'],
]);
```

If **any one** change fails validation (e.g. a future doc type whose content serializes to
a scalar — `content` must be an array/object — or an oversized field), Laravel throws a
ValidationException → the whole request 422s. The client
(`mobile/src/lib/cloud/sync-engine-core.svelte.ts`, `#drain()` catch) has no 422 branch:

```ts
} else {
	console.error('Backup push failed', error);
	this.status = 'error';
	this.#scheduleDrain(RETRY_MS);
}
```

`#pending` keys are drained in insertion order and the batch is rebuilt identically every
time — so one poison document blocks **every** subsequent backup, retrying every 20
seconds forever. The hiker sees a permanently red backup card; every new change queues
behind the poison item and never reaches the cloud. Today no client doc type produces
invalid payloads (this is latent), but the outbox persists across app updates — a bug in
any future enqueue call turns into a permanently wedged backup for a hiker in the field.

## Design: quarantine, don't drop

On a 422 push failure, identify the offending change(s), move them from `#pending` to a
new persisted `#quarantined` map, log loudly, and keep draining the rest. Quarantined
items are kept (never silently deleted) so they can be inspected/recovered later.

Identifying the offender:

1. Laravel validation errors arrive as `{ message, errors: { "changes.3.client_updated_at": [...] } }`.
   Parse the `errors` keys with `/^changes\.(\d+)\./` → indexes into the batch you sent.
2. The controller's custom `invalid_change` failure returns
   `"changes.{$index}.content is required..."` in the message — parse the same pattern
   from `message` as a fallback.
3. If a 422 arrives and **no index is parseable**, fall back to bisection: set a
   `#batchLimit` that halves on each consecutive unattributed 422 (200 → 100 → … → 1).
   At limit 1 a failing push identifies the poison item exactly → quarantine it, reset
   `#batchLimit` to 200. Persist nothing about `#batchLimit`; in-memory is fine (a
   relaunch just re-shrinks).

First check what `ApiError` exposes: read `mobile/src/lib/cloud/api.ts`. If it doesn't
carry the response body, extend it with a `details?: unknown` field populated from the
parsed JSON body (keep the existing fields untouched; grep for `ApiError` usages —
`auth.svelte.ts` and the engine — to confirm nothing breaks).

## Steps

### Step 1 — carry the 422 body in ApiError

In `mobile/src/lib/cloud/api.ts`, ensure a non-OK response parses its JSON body (it likely
already does to get `code`) and attach it as `details` on the thrown error. `npm run check`.

### Step 2 — quarantine store in the engine

In `sync-engine-core.svelte.ts`:

- Add `#quarantined: PendingMap = {};` and include it in `#snapshot()` /
  `#hydrate()` (new optional field on `PersistedOutbox`; default `{}` when absent so
  existing persisted outboxes hydrate cleanly).
- Add `get quarantinedCount(): number` for the UI/diagnostics.
- Add a private `#quarantine(keys: string[], reason: string): void` that moves entries
  from `#pending` to `#quarantined`, `console.error`s each with its doc key and reason,
  and calls `#persistNow()`.
- If a *newer* change for a quarantined key is enqueued later and pushes successfully,
  drop the quarantined copy (it is superseded): in the applied-reconcile path, delete
  `#quarantined[key]` for every applied key.

### Step 3 — the 422 branch in `#drain()`

Insert before the generic `else`:

```ts
} else if (err?.status === 422 && err?.code !== 'unknown_device') {
	const badIndexes = parsePoisonIndexes(err); // from errors keys + message, see Design
	if (badIndexes.length) {
		this.#quarantine(badIndexes.map((i) => batchKeys[i]).filter(Boolean),
			'rejected by server validation');
		this.#batchLimit = PUSH_BATCH;
	} else {
		this.#batchLimit = Math.max(1, Math.floor(this.#batchLimit / 2));
		if (this.#batchLimit === 1) {
			// next pass pushes one item; a 422 there is attributable
		}
	}
	this.status = 'error';
	this.#scheduleDrain(0); // retry immediately with the poison removed / smaller batch
}
```

`batchKeys` already exists in `#drain()`. `parsePoisonIndexes` is a small pure function —
put it in `mobile/src/lib/cloud/sync-outbox.ts` (the pure, tested module) with unit tests,
not in the engine. When the batch limit is 1 and that single-item push 422s without a
parseable index, quarantine that one key (it is the poison item by construction).

Use `this.#batchLimit` instead of `PUSH_BATCH` in the `keys.slice(0, ...)` call; reset to
`PUSH_BATCH` after any fully successful push.

### Step 4 — tests

- Unit tests for `parsePoisonIndexes` in `sync-outbox.test.ts` (Laravel `errors` shape,
  `invalid_change` message shape, garbage input → `[]`). Follow the existing test style —
  see `mobile/src/lib/cloud/sync-outbox.test.ts` (node:test + `assert/strict`).
- Engine tests in `syncEngine.test.ts` (plan 001 harness):
  1. Push 422 with `errors: {"changes.1.content": [...]}` on a 3-item batch → item 1 is
     quarantined, a second `flushForTest()` pushes the remaining 2 and succeeds, status
     `'idle'`, quarantined item present in persisted snapshot.
  2. Push 422 with no parseable index → batch limit halves; drive to limit 1 → the
     single failing item gets quarantined; the rest then drain.
  3. Update plan 001's characterization test 7 (which asserted the old wedge behavior).
  4. A successful applied response for a key with a quarantined older copy removes it
     from quarantine.
- Run `cd mobile && npm test && npm run check && npm run build`.

### Step 5 — minimal visibility

Where the backup card reads `syncEngine.pendingCount` (grep `pendingCount` in
`mobile/src/lib/components/` — likely `AccountTab.svelte`), append a single conditional
line when `quarantinedCount > 0`: "N change(s) couldn't be backed up and were set aside."
No new components, no buttons. Recovery/inspection UI is a future decision.

## Hard boundaries

- **In scope**: `mobile/src/lib/cloud/sync-engine-core.svelte.ts`,
  `mobile/src/lib/cloud/sync-outbox.ts` (+ its test), `mobile/src/lib/cloud/api.ts`
  (error body only), `syncEngine.test.ts`, one line in the Account backup card.
- **Out of scope**: `backend/` — do NOT change server validation semantics (a per-item
  accept/reject API would be nicer but is a contract change; note it in the PR
  description as a future option instead). No changes to LWW/restore logic.
- Never delete a quarantined item except when superseded by an applied newer etag.

## Done criteria

- `cd mobile && npm test` exit 0 including the new poison-batch tests.
- `npm run check` 0 errors; `npm run build` exit 0.
- A grep for `catch` in `sync-engine-core.svelte.ts` shows the 422 branch ordered before
  the generic error branch.

## Maintenance note

If the server contract ever moves to per-item validation results in a 200 response, the
`rejected` array path (already handled by `reconcilePush`) should absorb this and the 422
branch becomes dead — remove `parsePoisonIndexes` then.

## Escape hatches — STOP and report if:

- `api.ts` discards response bodies in a way that can't carry `details` without changing
  its public error contract for other callers.
- The server returns 422 bodies in a shape other than Laravel's default (verify once with
  a `backend:test` run if suites exist: `npm run backend:test` from repo root — read-only).
- Plans 001/002 haven't landed.
