# Trail Assistant BYOS Architecture Decision (2026-03-03)

## Decision
**Adopt BYO OpenAI API key as the only production-feasible BYOS path right now.**

Do **not** implement “Sign in with ChatGPT/OpenAI subscription passthrough” for Trail Assistant billing at this time.

## Status
- Decision type: Architecture Decision Record (ADR)
- Status: **Accepted (current-state)**
- Owner: Trail Assistant sprint
- Review trigger: if OpenAI releases a documented third-party user OAuth + billing passthrough product

---

## Verified facts (source-backed)

1. **ChatGPT subscriptions and API billing are separate.**
   - OpenAI Help Center (“What is ChatGPT Plus?”): “Not included: API usage is separate and billed independently.”
   - Source: https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus

2. **You cannot “move” ChatGPT subscription spend into API usage.**
   - OpenAI Help Center: “Our API service is billed and managed separately to ChatGPT.”
   - Source: https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api

3. **ChatGPT and API platform billing/tenancy are separate systems.**
   - OpenAI Help Center: ChatGPT workspace/billing does not translate to API platform billing.
   - Source: https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform

4. **OpenAI API auth is API-key based and keys must remain server-side.**
   - API docs: Bearer `OPENAI_API_KEY`; do not expose keys in client-side code.
   - Source: https://platform.openai.com/docs/api-reference/introduction

5. **OpenAI “OAuth” docs in Actions/Apps SDK are for ChatGPT connecting to *your* OAuth server, not for funding your third-party app with a user’s ChatGPT subscription.**
   - Source: https://platform.openai.com/docs/actions/authentication
   - Source: https://developers.openai.com/apps-sdk/build/auth/

6. **Credential-sharing is prohibited in OpenAI Terms.**
   - Terms: users may not share account credentials.
   - Source: https://openai.com/policies/terms-of-use/

---

## What is possible now

1. **BYO API key model (supported now):**
   - User brings their own OpenAI API key.
   - Trail Assistant uses it server-side for that user’s model calls.
   - Usage is funded directly by user API billing, not by our platform account.

2. **App-managed billing model (supported now):**
   - Trail Assistant charges users via own subscription (Stripe or similar).
   - All model calls run through Trail Assistant’s platform API key(s).

3. **Hybrid model (supported now):**
   - Offer either BYO key or app-managed subscription path.

---

## What is **not** possible now (based on public docs)

1. **No documented “Sign in with OpenAI” flow that lets third-party apps charge a user’s ChatGPT Plus/Pro subscription for API calls.**
2. **No documented passthrough of ChatGPT subscription entitlements into OpenAI API usage for external apps.**
3. **Not acceptable to ask users for ChatGPT account credentials as a workaround.**

---

## Safest implementation pattern for Trail Assistant BYOS

### Recommended architecture (now)
1. User authenticates to Trail Assistant (our auth).
2. User chooses provider mode (`openai_api_key` now; future providers behind feature flags).
3. User adds API key in secure settings page.
4. Backend encrypts key at rest and stores only masked preview + metadata for UI.
5. Each request resolves entitlement and provider via server-side provider abstraction.
6. Backend enforces per-user quotas/rate limits and request logging (without raw secrets).

### Code scaffold added in this sprint
- Provider/entitlement abstraction:
  - `backend/app/Support/TrailAssistantByosProviderRegistry.php`
  - `backend/app/Support/TrailAssistantByosEntitlementService.php`
  - `backend/app/Support/TrailAssistantByosEntitlement.php`
- Public provider-capability endpoint:
  - `GET /api/v1/trail-assistant/byos/providers`
- Config surface:
  - `backend/config/trail_assistant.php` → `byos` section

This gives us a clean seam for future provider expansion without rewriting intake/chat flows.

---

## Fallback monetization/auth plan (if passthrough remains unavailable)

1. **Primary fallback:** Trail Assistant subscription tiers (app-funded model usage).
2. **Optional advanced lane:** BYO API key for power users who want direct spend control.
3. **Auth:** keep Trail Assistant auth independent (email/social), no dependency on OpenAI identity availability.
4. **Billing UX:** clearly separate “Trail Assistant subscription” vs “Bring your own API key”.

---

## Security, abuse, legal/compliance guardrails

1. **Secrets handling**
   - Encrypt BYO keys at rest.
   - Never log raw keys.
   - Mask in UI (`sk-...abcd`).
2. **Transport**
   - TLS-only endpoints.
   - Server-side model calls only.
3. **Abuse controls**
   - Per-user rate limits and daily caps.
   - Burst and anomaly detection.
   - Quarantine/suspend on abuse signals.
4. **Policy compliance**
   - No credential-sharing workflows.
   - Explicit consent copy about data handling and third-party model provider usage.
5. **Operational controls**
   - Key validation probes (safe, low-cost) before enabling active status.
   - Rotation/revocation flow in account settings.

---

## Assumptions / watch list

1. OpenAI may ship broader third-party identity/billing features later; monitor docs/changelog.
2. If official user-token OAuth + scoped billing arrives, evaluate migration path from API-key BYOS.
3. Legal review required before broad launch of BYO secret storage in production.
