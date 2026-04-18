# Forge OpenClaw Web Runtime Runbook

Last verified: 2026-04-17

## Purpose

Run `apps/openclaw-web` on the Forge box without changing the existing Nginx site root.

The active production shape is:

- Nginx and PHP-FPM stay in front
- Laravel keeps `/api/*`, `/up`, and `/native`
- Laravel proxies public GET and HEAD requests to the SvelteKit Node app on localhost
- PM2 keeps the Node app alive

## Current live paths

- site root: `/home/forge/hoggcountry.on-forge.com/current`
- app root: `/home/forge/hoggcountry.on-forge.com/current/apps/openclaw-web`
- PM2 app name: `hoggcountry-openclaw`
- Node bind: `127.0.0.1:3000`

## Required Laravel env

In `/home/forge/hoggcountry.on-forge.com/.env`:

```env
OPENCLAW_WEB_PROXY_ENABLED=true
OPENCLAW_WEB_PROXY_ORIGIN=http://127.0.0.1:3000
```

After changing those values:

```bash
cd /home/forge/hoggcountry.on-forge.com/current/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
```

## PM2 runtime contract

The repo-owned PM2 config is:

- `apps/openclaw-web/ecosystem.config.cjs`

It intentionally points at the stable `current` symlink instead of a numbered release path.

Important: if the PM2 app was originally created from a numbered release path, `pm2 startOrReload` can leave the running process pinned to that old release. After deploys, verify PM2 is actually running from `current`.

Start or reload it from the repo root on the server:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:openclaw:pm2
```

Check status:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:openclaw:pm2:status
pm2 show hoggcountry-openclaw | grep 'exec cwd'
pm2 logs hoggcountry-openclaw --lines 50
```

If `exec cwd` still points at a numbered `releases/...` path, rebind PM2 once:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-openclaw || true
npm run forge:openclaw:pm2
pm2 save
```

## Manual deploy flow

1. Upload a new numbered release under `releases/`
2. Inside that release:

```bash
cd /home/forge/hoggcountry.on-forge.com/releases/<release>
ln -nfs /home/forge/hoggcountry.on-forge.com/.env backend/.env
ln -nfs /home/forge/hoggcountry.on-forge.com/storage backend/storage
mkdir -p backend/bootstrap/cache
cd backend && composer install --no-interaction --prefer-dist --optimize-autoloader && cd ..
npm install --package-lock=false
npm run build:openclaw:forge
```

3. Flip `current` to the new release
4. Restart the Node app from the new `current`

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:openclaw:pm2
pm2 show hoggcountry-openclaw | grep 'exec cwd'
```

If that still shows a numbered `releases/...` path, delete and recreate the app once so PM2 rebinds to `current`:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-openclaw || true
npm run forge:openclaw:pm2
pm2 save
```

5. Clear Laravel caches

```bash
cd /home/forge/hoggcountry.on-forge.com/current/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
```

6. Verify the public site

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run verify:forge
```

## Smoke checks

These should pass when the bridge is healthy:

- `https://hoggcountry.on-forge.com/`
- `https://hoggcountry.on-forge.com/guide`
- `https://hoggcountry.on-forge.com/guide/quick/layering`
- `https://hoggcountry.on-forge.com/api/v1/health`
- `https://hoggcountry.on-forge.com/api/v1/trail-assistant/plans`
- `https://hoggcountry.on-forge.com/api/v1/trail-assistant/byos/providers`

Alias redirects should also behave:

- `/track` -> `/dad/map`
- `/videos` -> `/dad/videos`
- `/at-map` -> `/dad/map`

## Failure modes

### Root falls back to JSON again

Likely causes:

- `OPENCLAW_WEB_PROXY_ENABLED` is false
- Laravel config cache is stale
- PM2 app is down or not listening on `127.0.0.1:3000`

Check:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:openclaw:pm2:status
curl -I http://127.0.0.1:3000/
cd backend
php artisan optimize:clear
```

### API is healthy but guide or homepage fails

Likely causes:

- Node app was not rebuilt for the new release
- PM2 is still pinned to an old release path instead of `current`
- guide content path handling regressed in the Node build

Check:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run build:openclaw:forge
npm run forge:openclaw:pm2
pm2 show hoggcountry-openclaw | grep 'exec cwd'
npm run verify:forge
```

If `exec cwd` is still a numbered release path, rebind PM2:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-openclaw || true
npm run forge:openclaw:pm2
pm2 save
```

## Important note

Keep `hoggcountry.com` on Netlify until this Forge runtime is considered routine and repeatable. This runbook only covers the Forge-domain validation path.
