# Forge Scout Web Runtime Runbook

Last verified: 2026-06-20

## Purpose

Run the Scout SvelteKit app from the legacy filesystem path `apps/openclaw-web` on the Forge box without changing the existing Nginx site root. The package, PM2 app name, and storage path use Scout naming.

The active production shape is:

- Nginx and PHP-FPM stay in front
- Laravel keeps `/api/*`, `/up`, and `/native`
- Laravel proxies the SvelteKit web surface to the Node app on localhost, including non-GET app/API requests needed by the gated `/app` beta workspace
- PM2 keeps the Node app alive
- `app.hoggcountry.com` is the private web-app host; the apex still serves the public site and `/app` auth gate.

## Current live paths

- site root: `/home/forge/hoggcountry.on-forge.com/current`
- app root: `/home/forge/hoggcountry.on-forge.com/current/apps/openclaw-web`
- PM2 app name: `hoggcountry-scout`
- Node bind: `127.0.0.1:3000`
- private workspace data root: `/home/forge/hoggcountry.on-forge.com/storage/app/scout-workspaces`
- public Trail Updates data/media root: `/home/forge/hoggcountry.on-forge.com/storage/app/{private,public}/trail-updates`
- shared Node dependency cache: `/home/forge/hoggcountry.on-forge.com/shared/node_modules`
- current release pruning policy: keep active release plus one known-good rollback release; as of 2026-05-02 the active release is `1777743519`, with `1777740505` retained as the known-good rollback. Older retained releases `1777668594` and `1777667921` can be pruned after the new standard-documents release has baked.

## Required Laravel env

In `/home/forge/hoggcountry.on-forge.com/.env`:

```env
SCOUT_WEB_PROXY_ENABLED=true
SCOUT_WEB_PROXY_ORIGIN=http://127.0.0.1:3000
PUBLIC_REGISTRATION_ENABLED=false
SCOUT_LAUNCH_INVITE_EMAIL=<private beta email>
SCOUT_LAUNCH_INVITE_PASSWORD=<private beta password>
SCOUT_LAUNCH_INVITE_NAME=<private beta name>
SCOUT_LAUNCH_INVITE_TRAIL_NAME=<private beta trail name>
```

Keep `PUBLIC_REGISTRATION_ENABLED=false` while the hosted Scout lane is funded
by a house OpenAI key. `/signup` is a launch-list page, not account creation.
The invite variables above lazily provision the private test account on first
successful login without reopening public registration.

For a house-funded web Scout model lane, also set these values in the same
shared Forge env file. Keep the API key in Forge only; never commit it.

```env
OPENAI_API_KEY=<project key>
SCOUT_PROVIDER=openai
SCOUT_MODEL=gpt-5.5
```

If `SCOUT_MODEL` is omitted, the web Scout API lane defaults to
`gpt-5.4-mini`. The native/mobile app remains on its offline/on-device policy;
this hosted model lane is only for the web app while App Store release work is
still in progress.

## App subdomain

`app.hoggcountry.com` should point at the same Forge server as the apex domain:

- DNS: `A app 129.212.138.246`
- Forge site domain: add `app.hoggcountry.com`
- SSL: issue or refresh a Let's Encrypt certificate covering `app.hoggcountry.com`

The SvelteKit hook redirects `https://app.hoggcountry.com/` to `/app`. Login,
signup/waitlist, and `/app/*` routes remain available on both hosts.

After changing those values:

```bash
cd /home/forge/hoggcountry.on-forge.com/current/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
```

## PM2 runtime contract

The repo-owned PM2 config is:

- it also pins `SCOUT_WORKSPACE_DATA_DIR` to the shared Forge storage path so private manuals, tools, and imported docs survive release swaps

- `apps/openclaw-web/ecosystem.config.cjs`

It intentionally points at the stable `current` symlink instead of a numbered release path.

Important: if the PM2 app was originally created from a numbered release path, `pm2 startOrReload` can leave the running process pinned to that old release. After deploys, verify PM2 is actually running from `current`.

Start or reload it from the repo root on the server:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout:pm2
```

Check status:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout:pm2:status
pm2 show hoggcountry-scout | grep 'exec cwd'
pm2 logs hoggcountry-scout --lines 50
```

If `exec cwd` still points at a numbered `releases/...` path, rebind PM2 once:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-scout || true
npm run forge:scout:pm2
pm2 save
```

## Manual deploy flow

1. Upload a new numbered release under `releases/`. If cloning from the current release first, resolve the real path before copying; do **not** copy the `current` symlink itself.

```bash
APP=/home/forge/hoggcountry.on-forge.com
RELEASE=<release>
BASE=$(readlink -f "$APP/current")
mkdir -p "$APP/releases"
cp -al "$BASE" "$APP/releases/$RELEASE"
```

2. Inside that release:

```bash
APP=/home/forge/hoggcountry.on-forge.com
REL="$APP/releases/<release>"
cd "$REL"
ln -nfs "$APP/.env" backend/.env
rm -rf backend/storage
ln -nfs "$APP/storage" backend/storage
mkdir -p backend/bootstrap/cache
cd backend && composer install --no-interaction --prefer-dist --optimize-autoloader && cd ..

# Do not symlink node_modules to another numbered release; those are pruned.
# Do not leave root node_modules as a symlink to shared/node_modules either: npm
# workspace links under @hoggcountry are relative, so a shared realpath makes them
# resolve toward nonexistent shared package paths.
#
# Current safe pattern: hardlink/copy the stable third-party cache into the release,
# then rebuild @hoggcountry workspace symlinks so they point at this release's apps/*
# and packages/* directories.
rm -rf node_modules
if [ -d "$APP/shared/node_modules" ]; then
  cp -al "$APP/shared/node_modules" node_modules
else
  npm install --package-lock=false
fi
rm -rf node_modules/@hoggcountry
mkdir -p node_modules/@hoggcountry
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
for (const base of ['apps', 'packages']) {
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(base, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.name?.startsWith('@hoggcountry/')) continue;
    const linkPath = path.join('node_modules', ...manifest.name.split('/'));
    fs.mkdirSync(path.dirname(linkPath), { recursive: true });
    fs.rmSync(linkPath, { recursive: true, force: true });
    fs.symlinkSync(path.join('..', '..', base, entry.name), linkPath);
  }
}
NODE

npm run build:scout:forge

# Optional after a dependency-changing successful build: refresh the stable cache,
# but leave the active release using its release-local hardlinked node_modules tree.
rm -rf "$APP/shared/node_modules.next"
cp -al node_modules "$APP/shared/node_modules.next"
rm -rf "$APP/shared/node_modules.next/@hoggcountry"
rm -rf "$APP/shared/node_modules"
mv "$APP/shared/node_modules.next" "$APP/shared/node_modules"
```

3. Flip `current` to the new release
4. Restart the Node app from the new `current`

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout:pm2
pm2 show hoggcountry-scout | grep 'exec cwd'
```

If that still shows a numbered `releases/...` path, delete and recreate the app once so PM2 rebinds to `current`:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-scout || true
npm run forge:scout:pm2
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
- `https://hoggcountry.on-forge.com/updates`
- `https://hoggcountry.on-forge.com/updates/feed?limit=50`
- `https://hoggcountry.on-forge.com/videos`
- `https://hoggcountry.on-forge.com/guide`
- `https://hoggcountry.on-forge.com/guide/quick/layering`
- `https://hoggcountry.on-forge.com/tools`
- `https://hoggcountry.on-forge.com/at-map`
- `https://hoggcountry.on-forge.com/track`
- `https://hoggcountry.on-forge.com/track/map-pack`
- `https://hoggcountry.on-forge.com/login`
- `https://hoggcountry.on-forge.com/manifest.webmanifest`
- `https://hoggcountry.on-forge.com/service-worker.js`
- `https://hoggcountry.on-forge.com/rss.xml`
- `https://hoggcountry.on-forge.com/sitemap.xml`
- `https://hoggcountry.on-forge.com/api/v1/health`

The SvelteKit beta owns `/track`, `/videos`, and `/at-map` directly. They are not expected to redirect to `/dad/*`.

Trips, Blog, and Tags are not cutover blockers for the Forge beta and should stay out of public navigation, the service-worker runtime list, and smoke-test requirements.

Gated app workspace checks should also work through the Laravel bridge, not only against localhost:

- `/signup`
- `/app`
- `/app/setup`
- `/app/today`
- `/app/manual`
- `/app/tools`
- `/app/docs`
- `/app/resources`
- `/app/scout`
- `/app/scout?resourceId=<resource-id>`
- `/app/scout?resourceId=<resource-id>&resourceAction=document`
- `/app/claw` compatibility route
- `POST /app-api/workspace/initialize`
- `POST /app-api/workspace/profile/current-mile`
- `POST /app-api/workspace/tools/checklist`
- `POST /app-api/workspace/resources` JSON note/URL and multipart text upload
- `POST /app-api/workspace/documents` multipart upload

## Failure modes

### Root falls back to JSON again

Likely causes:

- `SCOUT_WEB_PROXY_ENABLED` is false
- Laravel config cache is stale
- PM2 app is down or not listening on `127.0.0.1:3000`

Check:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout:pm2:status
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
npm run build:scout:forge
npm run forge:scout:pm2
pm2 show hoggcountry-scout | grep 'exec cwd'
npm run verify:forge
```

If `exec cwd` is still a numbered release path, rebind PM2:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
pm2 delete hoggcountry-scout || true
npm run forge:scout:pm2
pm2 save
```

## Important note

Keep `hoggcountry.com` on Netlify until this Forge runtime is considered routine and repeatable. This runbook only covers the Forge-domain validation path.
