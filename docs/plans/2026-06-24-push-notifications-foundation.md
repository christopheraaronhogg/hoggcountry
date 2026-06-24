# Push Notifications — Foundation Plan

**Status:** Phase 1 (PWA Web Push client) building 2026-06-24. Backend + iOS APNs are handoffs (below).
**Why:** the two highest-value product loops — daily readiness (#4) and family "missed check-in" alerts (#5) — can't reach Dad without a push channel, and none exists in the repo. This is the foundation they sit on, not the features themselves.

## Architecture — two transports, one device row

Push is **opt-in, signed-in-only, never automatic**. A signed-out app stays fully anonymous + offline (the standing promise). Two delivery transports converge on the existing per-device record:

```
                         ┌─ PWA / Web Push ─ Notification.requestPermission()
  user toggles ON  ─────►│                   → SW.pushManager.subscribe(VAPID public)
  (signed in, gesture)   │                   → POST /api/v1/devices/push { subscription }
                         └─ iOS / APNs ────── @capacitor/push-notifications register()
                                              → APNs device token
                                              → POST /api/v1/devices/push { token }
        backend stores the token/subscription on the existing `devices` row (1:1),
        sender fans out: Web Push (VAPID) for web subs, APNs HTTP/2 for iOS tokens.
```

- **`devices` table is the home** (already user-scoped, Sanctum-gated, has `platform`). Backend adds `push_provider` (`webpush`|`apns`), `push_token` (apns hex), `push_subscription` (json: `{endpoint, keys:{p256dh,auth}}`), `push_updated_at`.
- **VAPID public key** is the only push secret that reaches the client (`PUBLIC_VAPID_PUBLIC_KEY` in `mobile/.env`). VAPID private key + APNs `.p8` stay server-side (Forge env → Laravel `config/services.php`), exactly like `NPS_API_KEY`.

## Privacy rules this foundation enforces (from the recon)

1. **Signed-in only.** No token without an account; accounts are invite-only. Opt-in must not break the signed-out app.
2. **Opt-in, default-off, device-local.** The toggle is a *device* preference (not the synced `trailSettings`, which would back up/restore a device-specific grant across phones). Stored locally.
3. **Never auto-publish location or auto-send a check-in** (SafetyTab promise). A future "missed check-in" push carries status, not precise location, unless `sharePreciseLocation`/`stealthMode` already permit it.
4. **Human/notify-only, never auto-dispatch** (SOS runbook). Safety pushes notify people; no automated emergency dispatch.
5. **Per-user, no shared logins.** A "family" push fans out to each member's own registered devices.

## Phase 1 — PWA Web Push client (this commit)

Buildable + verifiable with no new dependency and no Apple account; reaches Dad's **installed** PWA (`app.hoggcountry.com`; iOS 16.4+ delivers Web Push to home-screen PWAs).

- `mobile/src/lib/push/push.svelte.ts` — the push manager: reactive `permission`/`enabled`/`available`; `enable()` (request permission → subscribe via `registration.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: VAPID })` → POST to backend), `disable()` (unsubscribe + DELETE), device-local opt-in persistence. Graceful: no-ops when unsupported, no VAPID configured, or signed out.
- `mobile/src/service-worker.ts` — `push` (show notification) + `notificationclick` (focus/open the app) handlers.
- Opt-in toggle in `AccountTab` (visible only when signed in; surfaces permission state).
- Reuses `apiRequest` + the bearer token; new `POST/DELETE /api/v1/devices/push`.

## Phase 2 — iOS APNs (next; needs Chris's Apple steps)

- `npm i @capacitor/push-notifications@^7`; push-manager iOS branch (`requestPermissions` → `register` → APNs token → POST).
- **Chris (Apple portal / Xcode, agent can't):** enable Push Notifications capability on `com.hoggcountry.trailassistant`, generate the **APNs Auth Key (`.p8`)**, add the entitlement (`aps-environment`) + `UIBackgroundModes: remote-notification` to Info.plist, then `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`.

## Backend handoff (Codex — Laravel)

1. **Migration:** add `push_provider` (string, nullable), `push_token` (text, nullable), `push_subscription` (json, nullable), `push_updated_at` (timestampTz, nullable) to `devices`; add to `Device::$fillable`.
2. **Endpoint** `POST /api/v1/devices/push` (+ `DELETE`), `auth:sanctum`, in the `devices` group — validates `device_id` (uuid, must belong to the user), `provider` in `webpush|apns`, and either `subscription` (json) or `token` (string); `updateOrCreate`s onto the device row. 404/409 like `DeviceController::register`.
3. **Config:** add `webpush` (`vapid_public`, `vapid_private`, `subject`) and `apns` (`key_id`, `team_id`, `bundle_id`, `key_path`, `production`) blocks to `config/services.php`, env-keyed; `503`-degrade when unset (the NPS pattern). `.env.example` placeholders + a `docs/runbooks/push-keys.md` (mirror `nps-api-key.md`). The APNs `.p8` is a FILE under the persistent `$APP/` root (survives release pruning), referenced by `APNS_KEY_PATH`.
4. **Sender:** `App\Services\PushSender->sendToUser(User, {title, body, url?})` — Web Push via `minishlink/web-push` (one new composer package) for `webpush` rows; APNs HTTP/2 via `Http::withHeaders([...])->post(...)` with an ES256 JWT signed by `firebase/php-jwt` (already installed) for `apns` rows. Prune dead tokens on APNs `410`/web-push `404/410`. `503`/no-op when keys absent.
5. **Test push:** `POST /api/v1/devices/push/test` (sends "Hogg Country push is live" to the caller's devices) for end-to-end proof, and a `make:command` daily-ping slot in `routes/console.php` (the proven scheduler) for #4 later.
6. **Generate the VAPID keypair** (`web-push generate-vapid-keys`): public → Chris for `mobile/.env`'s `PUBLIC_VAPID_PUBLIC_KEY`; private → Forge env.

## Out of scope here (later)

The actual notification *content* — #4 daily readiness (note: the readiness engine doesn't exist yet; TodayTab deliberately has no score) and #5 missed-check-in family alerts — build on this foundation once the channel is proven end-to-end.
