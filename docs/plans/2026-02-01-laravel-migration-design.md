# Laravel (Forge) migration — design draft (v0)

Status: **planning only** (no implementation changes).

## Why we’re doing this
We are reaching “real product” needs:
- logins + password reset + email verification
- subscriptions + feature gating
- persistent user data (trail profile / character)
- a user-accessible “Trail Vault” for generated files (not trapped in Telegram)
- auditability: what was generated, when, and for whom

Today:
- **hoggcountry** = Astro static site on Netlify (plus Netlify Functions)
- **hoggcountry-os** = tenant-first assistant + per-user folders (Telegram-first)

The intent is to add a **durable backend** without breaking the fast static site.

---

## North Star (target experience)
1) A user can create an account, verify email, reset password.
2) A user can subscribe and immediately unlock features.
3) A user can open a dashboard and see:
   - current “Character Sheet” + trail settings
   - latest generated artifacts (PDF/CSV/MD)
   - exports by date/type (zip download)
4) Telegram becomes an integration channel, not the only UI.

---

## Two viable architectures (pick one)

### Option A (recommended): **Hybrid**
- Keep **marketing + guide + static tools** on Netlify (fast, cheap, great SEO).
- Add **Laravel app/API** on Forge at `app.hoggcountry.com`.
- Astro tools can call the Laravel API for authenticated data when needed.

Pros: minimal disruption; best of both worlds; easy incremental migration.
Cons: two deploy surfaces; cross-domain auth considerations.

### Option B: **Full migration**
- Move everything into Laravel (Blade or Inertia/React/Vue).

Pros: one stack, one deploy surface.
Cons: bigger rewrite; slower iteration; more risk.

---

## Recommendation
Start with **Option A (Hybrid)**.
- It aligns with how we’re already split (website vs OS).
- It lets us ship accounts/subscriptions/file vault quickly without rewriting the Field Guide and existing static pages.

---

## Phase plan (incremental)

### Phase 0 — Decisions + scaffolding (1–2 days)
- Choose architecture (A vs B).
- Choose file storage: S3 vs Cloudflare R2 (recommended) vs local-only.
- Choose billing provider: Stripe (recommended).
- Decide tenancy model (see below).

### Phase 1 — Forge foundation (1–2 days)
- New Laravel repo/app (or new `/backend` folder, but repo is cleaner).
- Forge: provision server, PHP, queue worker, scheduler, Redis, DB, backups.
- Basic health endpoints, logging, error reporting.

### Phase 2 — Auth (1–2 days)
- Laravel auth scaffolding (Fortify/Breeze/Jetstream).
- Email verification + password reset.
- Session auth for web; token auth for API (Sanctum).

### Phase 3 — Subscription + entitlements (2–4 days)
- Stripe + Laravel Cashier.
- Plans: Free / Supporter / Pro (names TBD).
- Feature flag table (entitlements) so pricing can change without rewrites.

### Phase 4 — “Trail Vault” files (2–5 days)
- Object storage bucket.
- Model: `documents` table (owner, type, original prompt/job, size, checksum, created_at).
- API to list + download via signed URL.
- UI: “My Files” with filters + “Download zip of last 30 days.”

### Phase 5 — Integrations (2–5 days)
- Telegram linking:
  - user logs into web → generates pairing token
  - user sends token to bot → backend links telegram_user_id
- HoggCountry OS push:
  - OS can upload generated artifacts to API using a per-tenant token
  - backend stores metadata + file

### Phase 6 — Migrate dynamic pieces off Netlify Functions (optional)
- Move any AI calls, KJV lookup endpoints, etc. into Laravel jobs/queues.

---

## Tenancy model (important)
Start simple:
- `users` table is primary tenant boundary.
- Most data tables include `user_id` FK.

If we later need organizations (family accounts, group hikes):
- add `accounts` (team) and `account_id` on records.

Avoid heavy multi-tenant packages until we outgrow `user_id`.

---

## Data model (v1)
- `users` (email, password, verified_at)
- `profiles` (display name, trail name, telegram username/id)
- `trail_profiles` or `characters` (JSON column mirroring `hcCharacter.v1`)
- `documents` (user_id, type, title, storage_key, sha256, size, metadata JSON)
- `jobs` / `runs` (audit trail: what generated which document)
- `subscriptions` (Cashier)

---

## Security + privacy notes
- All files must be access-controlled per user.
- Signed URLs expire.
- Store only the minimum PII.
- Add an “export my data” and “delete my account” path later.

---

## Rollout strategy
- First ship: “Trail Vault” + auth behind `app.hoggcountry.com`.
- Keep current Netlify site unchanged.
- Add a single link in the Netlify nav: “Dashboard” → `app.hoggcountry.com`.

---

## Open questions (we’ll answer one at a time)
1) Do you want **Option A (Hybrid)** (Netlify stays + Laravel app subdomain) or **Option B (Full migration)**?
