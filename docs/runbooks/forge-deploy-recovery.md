# Forge Deploy Recovery Runbook

Last verified: 2026-04-09

## Current Diagnosis

The Forge-hosted backend at `https://hoggcountry.on-forge.com` is not serving the same code that exists on GitHub `main`.

Evidence gathered from this repo and the live site:

- GitHub `main` head is `8fbe603765477634ab3d51ec7a6f1eb6a386223b`.
- The Forge deployment log is building commit `3725da8395241d5b01c06e61c3a3063e2200a200`.
- That commit does **not** exist in `christopheraaronhogg/hoggcountry`.
- Live Forge responses on 2026-04-09:
  - `GET /` → `500`
  - `GET /api/v1/health` → `200`
  - `GET /api/v1/trail-assistant/plans` → `404`
  - `GET /api/v1/trail-assistant/byos/providers` → `404`
- In this repo, the missing public `trail-assistant/plans` route exists in [backend/routes/api.php](/Users/Chris/Documents/GitHub/hoggcountry/backend/routes/api.php) and was introduced in commit `80a8b561`.

Conclusion:

- The live Forge backend is either pointed at the wrong repository/ref, or stuck on an old release.
- The deployment log failure
  - `cat: /home/forge/.forge/provision-165112762.output: No such file or directory`
  - is consistent with Forge losing track of its own release/provision artifact after the build completed.
- This does **not** look like a normal application runtime build failure in the current repo.

## What This Means

There are two distinct issues:

1. **Deploy target mismatch**
   - Forge is building a commit hash that is not in this repo.
2. **Managed deploy failure**
   - Forge reports `Build ready to be deployed`, then fails while reading a missing `provision-*.output` file.

Fix the source mismatch first. If Forge is pointed at the wrong ref, no amount of redeploying will land the current code.

## Owner Actions in Forge

### 1. Verify the site source configuration

In the Forge dashboard for `hoggcountry.on-forge.com`:

- Open the site settings / general tab.
- Confirm the Git provider is the correct GitHub installation/account.
- Confirm the repository is `christopheraaronhogg/hoggcountry`.
- Confirm the deploy branch is `main`.
- Confirm the commit Forge thinks is latest matches GitHub `main`, not `3725da8395241d5b01c06e61c3a3063e2200a200`.

If any of those are wrong:

- disconnect and reconnect the repository,
- re-select `christopheraaronhogg/hoggcountry`,
- re-select `main`,
- save,
- redeploy.

### 2. Reset the deployment state

After the repo/branch is verified, use Forge’s deployment recovery controls:

- open the site’s `Deployments` tab,
- retry the failed deployment if available,
- if the site stays in a broken state, use Forge’s deployment reset/self-help option for the site,
- then trigger a fresh deploy.

Forge’s zero-downtime docs note that releases are created under a `releases` directory and activated by symlink. A broken deployment state can leave the active release stale even if GitHub has newer commits.

### 3. Enable deployment health checks

In Forge site settings:

- enable `Health check`,
- set the health-check URL to:
  - `https://hoggcountry.on-forge.com/api/v1/health`

That won’t detect missing public `trail-assistant` routes by itself, but it will at least catch total release breakage.

### 4. Run a post-deploy verification sweep

From the repo root:

```bash
npm run verify:forge
```

Expected result after a correct deploy:

- `/` → `200`
- `/api/v1/health` → `200`
- `/api/v1/trail-assistant/plans` → `200`
- `/api/v1/trail-assistant/byos/providers` → `200`

If Forge is configured to pass build metadata via env vars, you can also verify the exact deployed commit:

```bash
EXPECTED_SHA=<github_sha> npm run verify:forge
```

## Recommended Deploy Metadata

The Laravel health and root endpoints now support optional build metadata through these env vars:

- `APP_BUILD_SHA`
- `APP_BUILD_BRANCH`
- `APP_BUILD_TIME`

Set those in the Forge deploy step if possible so `/api/v1/health` can identify the active release.

Suggested values inside the deploy script:

```bash
export APP_BUILD_SHA="$(git rev-parse HEAD)"
export APP_BUILD_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
export APP_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

If Forge Sites does not expose shell env export in the deploy UI, record the active commit in a file or provider-specific build variable instead.

## Optional: GitHub-Driven Deploy Authority

To reduce dashboard drift, this repo now supports an optional GitHub Actions to Forge deploy path.

If you want GitHub `main` to become the deploy authority, add these GitHub secrets/variables:

Secrets:

- `FORGE_API_TOKEN`
- `FORGE_SSH_PRIVATE_KEY`

Repository variables:

- `FORGE_SERVER_NAME`
- `FORGE_SITE_NAME`
- `FORGE_BASE_URL` (optional, default `https://hoggcountry.on-forge.com`)

Then enable the workflow in [.github/workflows/forge-deploy.yml](/Users/Chris/Documents/GitHub/hoggcountry/.github/workflows/forge-deploy.yml).

## Access Notes

This machine was able to reach likely origin IPs over TCP 22, but login failed because no matching private key is available locally. Direct access was therefore blocked by credentials, not by networking.

Also note:

- `hoggcountry.on-forge.com` itself resolves behind Cloudflare and is not the SSH origin host.
- A direct `ssh forge@hoggcountry.on-forge.com` attempt times out on port 22, which is expected for an edge hostname.
