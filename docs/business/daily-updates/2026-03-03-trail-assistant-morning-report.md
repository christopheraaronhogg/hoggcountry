# Trail Assistant Morning Report — 2026-03-03

## Summary
Overnight sprint delivered a **working local demo path** for Trail Assistant with intake submission + visible profile state route, plus a source-backed BYOS architecture decision and implementation scaffold.

Production public URLs remain misaligned (404/500/404 pattern), so morning demo should use the local route below until deploy alignment is fixed.

---

## What changed

### 1) Demo-readiness path (shipped locally)
- Enhanced `/trail-assistant` to include:
  - profile state save/clear + preview,
  - intake metadata bridge for profile snapshot,
  - clear status messaging and flow continuity.
- Added dedicated profile path: `/trail-assistant-profile`.
- Updated `/trail-assistant-thanks` with profile-route link.

### 2) BYOS decision + scaffold
- Added architecture decision doc:
  - `docs/business/trail-assistant-byos-architecture-decision-2026-03-03.md`
- Added backend provider/entitlement scaffold:
  - `TrailAssistantByosProviderRegistry`
  - `TrailAssistantByosEntitlementService`
  - `TrailAssistantByosEntitlement`
- Added public capability endpoint:
  - `GET /api/v1/trail-assistant/byos/providers`

### 3) Evidence artifacts
- Evidence folder:
  - `docs/business/daily-updates/assets/2026-03-03/trail-assistant-demo/`
- Includes screenshots + curl/status outputs + local DB intake evidence.

---

## Commits
- _Pending in this report draft; fill with commit hashes after final commit/push._

---

## Live + local URLs

### Public (current observed)
- `https://hoggcountry.com/trail-assistant` → 404
- `https://hoggcountry.com/trail-assistant-thanks` → 404
- `https://hoggcountry.on-forge.com/` → 500
- `https://hoggcountry.on-forge.com/api/v1/health` → 200
- `https://hoggcountry.on-forge.com/api/v1/trail-assistant/plans` → 404

### Local demo (working)
- `http://127.0.0.1:4321/trail-assistant`
- `http://127.0.0.1:4321/trail-assistant-profile`
- `http://127.0.0.1:4321/trail-assistant-thanks`
- `http://127.0.0.1:18000/api/v1/health`
- `http://127.0.0.1:18000/api/v1/trail-assistant/plans`
- `http://127.0.0.1:18000/api/v1/trail-assistant/byos/providers`

### Local startup commands used
```bash
# terminal 1 (backend)
cd backend
mkdir -p database && touch database/database.sqlite
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=18000

# terminal 2 (frontend)
PUBLIC_API_BASE_URL=http://127.0.0.1:18000/api/v1 npm run dev -- --host 127.0.0.1 --port 4321
```

---

## Screenshot inventory
- `01-local-intake-profile-saved.png` — local `/trail-assistant` with saved profile state visible
- `02-local-intake-thanks.png` — successful submit landing page
- `03-local-profile-route.png` — dedicated `/trail-assistant-profile` route with persisted state
- `04-local-api-byos-providers.png` — BYOS capability endpoint response
- `05-public-trail-assistant-404.png` — current public 404 proof
- `06-public-api-plans-404.png` — current Forge plans 404 proof

All under:
`docs/business/daily-updates/assets/2026-03-03/trail-assistant-demo/`

---

## BYOS findings (concise)

### Possible now
- BYO OpenAI API key (user-funded API usage)
- App-managed billing (Trail Assistant-funded API usage)
- Hybrid (user chooses lane)

### Not possible now (from current public OpenAI docs)
- Using a user’s ChatGPT Plus/Pro subscription as third-party API billing passthrough
- “Sign in with OpenAI” flow that grants third-party app API spend against ChatGPT subscription entitlements

### Decision
- Implement BYO API key path now; keep subscription-passthrough as explicit unsupported placeholder.

---

## Production-readiness gaps remaining
1. **Deploy drift fix:** Netlify + Forge are not serving latest Trail Assistant route/API set.
2. **Public verification rerun:** Need successful public 200 checks for intake + thanks + plans endpoints.
3. **BYOS hardening:** secure persistent storage/rotation UX for user API keys (scaffold exists; full key lifecycle not yet shipped).
4. **Auth-backed profile persistence:** current demo profile uses localStorage; production should use authenticated server-side profile state.
