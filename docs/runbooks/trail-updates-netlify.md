# Trail Updates Netlify Runbook

Last updated: 2026-04-29

## Purpose

`hoggcountry.com` has a lightweight Trail Updates feature for Jimmy to post quick mobile updates for people who do not follow Facebook.

Public URLs after deploy:

- `https://hoggcountry.com/updates/`
- homepage module on `https://hoggcountry.com/`

Admin URL after deploy:

- `https://hoggcountry.com/admin/updates/`

## Storage and runtime

The live Astro/Netlify public site uses Netlify Functions and Netlify Blobs:

- `netlify/functions/trail-updates-auth.ts` handles the simple passcode session.
- `netlify/functions/trail-updates.ts` lists, creates, patches, and deletes update records.
- `netlify/functions/trail-update-media.ts` serves uploaded image/video media.
- Blob store `trail-updates` holds `updates.json`.
- Blob store `trail-update-media` holds uploaded media files.

## Required Netlify environment variables

Set these in the Netlify site environment before deploy:

```txt
HOGG_ADMIN_PASSCODE=0721
TRAIL_UPDATES_SESSION_SECRET=<long random secret>
```

Generate the secret locally with:

```bash
openssl rand -base64 48
```

`HOGG_ADMIN_PASSCODE` intentionally defaults to `0721` in code for local/dev convenience, but production should still set it explicitly.

## Deploy checklist

1. Confirm the working tree only contains intended Trail Updates changes plus any pre-existing unrelated changes.
2. Set Netlify env vars above.
3. Deploy the Astro public site.
4. Confirm public page renders:

```bash
curl -I https://hoggcountry.com/updates/
```

5. Open admin page on mobile/desktop:

```txt
https://hoggcountry.com/admin/updates/
```

6. Enter passcode `0721`.
7. Post a small text-only update first.
8. Confirm it appears on:

```txt
https://hoggcountry.com/updates/
https://hoggcountry.com/
```

9. Post one photo update from a phone and confirm media loads.

## Local verification commands

```bash
npm run build:public
npx netlify functions:build --filter @hoggcountry/public --src netlify/functions --functions .netlify/functions
```

Known local note: Netlify Functions build may warn that `import.meta` is unavailable for CJS output because existing functions import `src/lib/config.ts`. The build has completed successfully with those warnings.

## V1 limits

- Designed for low-risk trail updates, not private data.
- One media file per update.
- Media limit: 20 MB.
- Accepted media: JPG, PNG, WebP, GIF, MP4, MOV, WebM.
- No comments, likes, or follower accounts.
- Passcode auth is intentionally simple and can be replaced later with stronger auth.
