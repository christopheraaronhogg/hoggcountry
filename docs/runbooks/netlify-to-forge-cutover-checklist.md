# Netlify to Forge Cutover Checklist

Last verified: 2026-06-12

## Execution status (2026-06-12)

The live cutover is complete:

- [x] Route parity: every public Astro surface ported to SvelteKit and verified live on the Forge domain (incl. /at-map trail explorer, /videohogg, /trail-assistant, /guide/manual-builder, /game via legacy-public fallback)
- [x] `npm run verify:forge` passes — "problems: none"
- [x] Security headers (CSP/frame/sniff/referrer/permissions) now applied by the SvelteKit app itself (`hooks.server.ts`), so Netlify's header config is no longer load-bearing
- [x] `www.` requests 301 to the apex at the app layer — no Nginx config needed
- [x] Forge auto-deploys from `main`
- [x] **Forge dashboard:** `hoggcountry.com` and `www.hoggcountry.com` added to `hoggcountry.on-forge.com`
- [x] **Forge SSL:** Let's Encrypt certificate active for apex + www
- [x] **Namecheap DNS host:** authoritative nameservers are `dns1.registrar-servers.com` and `dns2.registrar-servers.com`
- [x] **Current DNS:** `@` A record points to Forge `129.212.138.246`; `www` CNAME points to `hoggcountry.com`
- [x] **Current live domain:** `https://hoggcountry.com/` serves SvelteKit through Forge; `https://www.hoggcountry.com/` redirects to apex

DNS rollback snapshot (previous Netlify values, recorded 2026-06-11 before cutover):

- Namecheap previously had ALIAS records for `@` and `www` to `apex-loadbalancer.netlify.com.`
- apex `hoggcountry.com` A → `75.2.60.5`, `99.83.231.61`
- `www.hoggcountry.com` A → `75.2.60.5`, `99.83.231.61`

Note: Netlify stopped deploying pushes from this repo sometime before 2026-06-11
(multiple pushes produced no new deploy). The live Netlify site is frozen at a
pre-migration build, which makes it a stable rollback target but means nothing
new ships through Netlify. This removes the "freeze deploys" concern for the
Netlify side of the cutover window.

## Goal

Move the public Hogg Country site from Netlify to Forge only after the Forge-hosted SvelteKit frontend is proven stable on the Forge domain. This move was completed on 2026-06-12.

This checklist assumes:

- `https://hoggcountry.on-forge.com` is already serving the public frontend through Laravel plus the localhost Node bridge
- the Node app is managed by PM2
- the backend API remains on the same Forge host
- `hoggcountry.com` now points at Forge; Netlify is rollback-only

## Do not cut over until these are true

- `npm run verify:forge` passes against `https://hoggcountry.on-forge.com`
- `pm2 show hoggcountry-scout` reports `online`
- `/`, `/updates`, `/videos`, `/guide`, `/guide/quick/layering`, `/tools`, `/at-map`, `/track`, `/login`, and `/admin/updates` work on the Forge domain
- Ported parity routes work on the Forge domain: `/at-weather`, `/trail`, `/tools/character`, `/dispatch`, `/videohogg`, `/trail-assistant`, `/guide/manual-builder`, `/game/` (legacy-public fallback), `/AT-Field-Guide-2026.pdf`
- `/updates/feed?limit=50` is public, non-empty, and includes both `youtube_video` and `youtube_short`
- `/track/map-pack` returns Garmin-backed current coordinates and tracker history
- `/api/v1/health` works on the Forge domain
- `/manifest.webmanifest`, `/service-worker.js`, `/rss.xml`, and `/sitemap.xml` work on the Forge domain
- Trips, Blog, and Tags are not presented as production-beta navigation items or smoke-test blockers
- authenticated `/app/*` routes redirect anonymous visitors to `/login`
- Chris is ready for the live domain switch

## Prep, 24 to 48 hours before cutover

1. Lower DNS TTL for `hoggcountry.com` and `www.hoggcountry.com` if the current DNS provider allows it.
2. Record the current Netlify DNS or domain settings before changing anything.
3. In Forge, add the real custom domains to the site, but do not remove the Forge validation domain.
4. Let Forge provision SSL for the real domains before final traffic cutover if possible.
5. Confirm the exact DNS values from Forge before editing DNS. Do not guess record values from memory.

## Pre-cutover snapshot

Record these before switching traffic:

- git commit intended for launch
- current Forge `current` symlink target
- current Forge `.env` backup path
- `pm2 ls` output
- Netlify site settings or DNS targets currently serving `hoggcountry.com`

## Cutover steps

1. Freeze deploys.
   - Do not start unrelated frontend or backend deploy work during the switch.

2. Re-verify Forge right before the change.

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run verify:forge
pm2 show hoggcountry-scout
```

3. Verify the live custom domain is still on Netlify.
   - Confirm `https://hoggcountry.com` still returns the expected Netlify response before changing DNS.

4. Update DNS to the Forge-provided target for:
   - `hoggcountry.com`
   - `www.hoggcountry.com`

   Follow the exact target values shown by Forge for the site. Do not improvise A, AAAA, or CNAME values.

5. Wait for propagation.
   - Check both the apex and `www`.
   - Expect partial propagation during the window.

6. Validate the real domain after propagation.

```bash
npm run verify:forge -- --base-url https://hoggcountry.com --sha=$(git rev-parse HEAD)
```

7. Manually smoke-check the real domain:
   - homepage shell and hero
   - latest trail feed and YouTube video/Short cards
   - guide index
   - a nested guide page like `/guide/quick/layering`
   - public tools hub
   - live AT map and `/track/map-pack`
   - login/signup/recovery surfaces
   - API health route
   - manifest, service worker, RSS, and sitemap
   - CSS and JS assets loading without console 404s

8. Verify `www` behavior.
   - Confirm whether `www.hoggcountry.com` should redirect to apex or remain directly served.
   - Keep that behavior intentional and documented.

9. Leave the Forge validation domain in place.
   - `hoggcountry.on-forge.com` stays useful for diagnosis even after the custom domain moves.

## Post-cutover monitoring

For the first hour, re-check:

- `pm2 logs hoggcountry-scout --lines 100`
- Laravel logs if needed
- `https://hoggcountry.com/api/v1/health`
- `https://hoggcountry.com/guide`
- one or two public assets under `/_app/`

Watch for:

- root falling back to JSON instead of HTML
- missing `/_app/*` assets
- 502 or 503 errors from the Laravel proxy path
- redirect loops
- SSL mismatch on apex or `www`

## Post-cutover repo cleanup

Only after hoggcountry.com is stable on Forge:

1. Delete the Astro route tree `src/pages/` (the SvelteKit app owns every route; shared components in `src/components/`, `src/lib/`, `src/stores/`, `src/data/`, and `src/content/` stay — Scout web imports them cross-tree).
2. Remove `build:netlify`, `build:public`, the `apps/public` shim, `astro.config.mjs`, and the Astro dependencies from the root package.json.
3. Retire `netlify.toml` and the Netlify site (or keep it as a redirect shell).
4. Move remaining root `public/` assets into `apps/openclaw-web/static/` or keep serving them via the `[...legacyPublic]` fallback route.

## Rollback plan

If the cutover is bad, do this in order:

1. Point DNS back to the previous Netlify values.
2. Leave Forge validation running on `hoggcountry.on-forge.com`.
3. If needed, keep the Forge backend healthy by disabling only the public bridge:

```env
SCOUT_WEB_PROXY_ENABLED=false
```

Then clear Laravel caches:

```bash
cd /home/forge/hoggcountry.on-forge.com/current/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
```

That rollback returns `/` on Forge to the old API JSON response while preserving the backend.

## Decision gate before live cutover

Do the custom-domain move only after these are true:

- the Forge-domain frontend has stayed stable for a full working session
- the PM2 runtime and deploy flow feel routine, not fragile
- the remaining public route gaps are acceptable for launch
- rollback steps are written down and tested mentally before touching DNS
