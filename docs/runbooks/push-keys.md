# Push Notification Key Setup

Hogg Country keeps push credentials server-side in Laravel. Do not put the VAPID private key, APNs IDs, or APNs `.p8` in `mobile/.env`, `VITE_*`, or `PUBLIC_*`. The only push value allowed in the mobile/PWA bundle is the VAPID public key.

## Web Push / VAPID

Generate a VAPID keypair:

```sh
npx web-push generate-vapid-keys
```

Set these in `backend/.env` locally and in Forge environment variables for production:

```dotenv
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:chris@hoggcountry.com
```

Set the same public key in the mobile/PWA build environment:

```dotenv
PUBLIC_VAPID_PUBLIC_KEY=your-public-key
```

Then rebuild the PWA/native bundle so `mobile/src/lib/push/push.svelte.ts` can subscribe browsers with the same public key the Laravel sender signs with.

## APNs

In Apple Developer, enable Push Notifications for `com.hoggcountry.trailassistant` and create an APNs Auth Key (`.p8`). Store the `.p8` as a file under the persistent Forge app root so it survives release pruning, then point Laravel at the absolute path:

```dotenv
APNS_KEY_ID=your-10-character-key-id
APNS_TEAM_ID=your-10-character-team-id
APNS_BUNDLE_ID=com.hoggcountry.trailassistant
APNS_KEY_PATH=/home/forge/hoggcountry.com/apns/AuthKey_XXXXXXXXXX.p8
APNS_PRODUCTION=false
```

Use `APNS_PRODUCTION=false` for development/TestFlight sandbox pushes until the production push path is ready.

If config is cached on the server, clear or rebuild Laravel config after changing keys:

```sh
php artisan config:clear
```

## Smoke Test

After signing into the PWA or iOS build and enabling notifications, call the test endpoint with that account's bearer token:

```sh
curl -X POST https://hoggcountry.com/api/v1/devices/push/test \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Accept: application/json'
```

The endpoint sends a single "Hogg Country push is live" notification to the caller's registered devices. If provider keys are missing, it returns `503` instead of pretending push is configured.
