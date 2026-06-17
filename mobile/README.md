# Hogg Country Mobile Pilot

This is the Father's Day trail assistant pilot app. It is a SvelteKit static app wrapped by Capacitor, with a local Scout runtime and cached field-pack support.

The current pilot target is simple: Dad can open the app, load a trail-ahead field pack, keep using that pack offline, and see Scout answers with receipts and caveats.

## Status

- Web/mobile shell builds locally.
- Field packs load from `https://hoggcountry.com/scout/field-pack` by default.
- The app caches the latest pack in browser/native preferences storage.
- The bundled pack remains as fallback if no remote or saved pack exists.
- Native iOS/Android folders are intentionally not committed yet. Generate them locally when preparing a phone install.

## Daily Pilot Checks

Run these from `mobile/` before a phone build:

```sh
npm run smoke:field-pack
npm run check
npm run build
```

Run this from the repo root when the public field-pack endpoint changed:

```sh
SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web
```

## Browser Smoke

```sh
npm run dev -- --host 127.0.0.1
```

Open the local Vite URL at a phone width and verify:

- Today shows pack-backed next water, shelter, and town context.
- Offline status shows pack source, receipts, loaded age, and regions.
- Refresh updates the pack when online.
- Scout answers show receipts, confidence, and safety/caveat chips.
- Failed refresh keeps the cached pack instead of dropping to empty state.

## Native Phone Prep

Install native project folders only on the machine doing the phone build:

```sh
npm run cap:add:ios
npm run cap:add:android
```

Then sync the built web app into the native project:

```sh
npm run cap:sync:ios
npm run cap:sync:android
```

Open the platform project:

```sh
npm run cap:open:ios
npm run cap:open:android
```

For an iPhone pilot install, use Xcode after `cap:open:ios`:

- Pick the connected iPhone as the run target.
- Set Chris's Apple developer team/signing if Xcode asks.
- Build and run on device.
- After first online refresh, enable airplane mode and reopen the app to confirm the cached pack still drives Today and Scout.

## Pilot Caveats

- Water is open-reference candidate data. Treat it as low-confidence until current flow/potability is confirmed.
- Shelter and town entries are open-data candidates, not guaranteed current logistics.
- Scout's local fallback is deterministic and receipt-bound; it is not a live emergency service.
- This is a Dad-ready pilot track, not an App Store release package.
