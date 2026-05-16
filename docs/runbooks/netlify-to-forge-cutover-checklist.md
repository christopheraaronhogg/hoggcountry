# Netlify to Forge Cutover Checklist

Last verified: 2026-04-17

## Goal

Move the public Hogg Country site from Netlify to Forge only after the Forge-hosted SvelteKit frontend is proven stable on the Forge domain.

This checklist assumes:

- `https://hoggcountry.on-forge.com` is already serving the public frontend through Laravel plus the localhost Node bridge
- the Node app is managed by PM2
- the backend API remains on the same Forge host

## Do not cut over until these are true

- `npm run verify:forge` passes against `https://hoggcountry.on-forge.com`
- `pm2 show hoggcountry-scout` reports `online`
- `/`, `/guide`, and `/guide/quick/layering` work on the Forge domain
- `/api/v1/health`, `/api/v1/trail-assistant/plans`, and `/api/v1/trail-assistant/byos/providers` work on the Forge domain
- alias redirects still behave:
  - `/track` -> `/dad/map`
  - `/videos` -> `/dad/videos`
  - `/at-map` -> `/dad/map`
- the remaining public drawer destinations are either ported, intentionally redirected, or intentionally hidden for launch
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
npm run verify:forge --base-url https://hoggcountry.com
```

7. Manually smoke-check the real domain:
   - homepage shell and hero
   - guide index
   - a nested guide page like `/guide/quick/layering`
   - public tool redirects
   - API health route
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
