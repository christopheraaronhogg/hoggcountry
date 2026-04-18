# ChatGPT as the cloud delegate brain (2026-04-18)

## Correct target

Hogg Country is a **cloud service**.

That means the intended shape is:

- Hogg Country runs the per-user delegate in the cloud
- each user gets a private workspace, artifact store, and session scope
- the user connects their ChatGPT/Codex account to Hogg Country
- Hogg Country uses that connected ChatGPT account as the upstream model brain for that user's delegate

This is different from the earlier local-companion-first interpretation.

## What the OpenClaw research proves

OpenClaw already demonstrates four important pieces:

1. **ChatGPT/Codex OAuth is real** via `openai-codex/*`
2. **OAuth credentials are refreshable** and include access token, refresh token, expiry, and account id
3. **Auth profiles are isolateable per agent**
4. **Multiple profiles can coexist** and be selected deterministically

Relevant OpenClaw facts:

- OAuth docs: auth profiles are stored per agent in `auth-profiles.json`
- multi-agent docs: each agent has its own `agentDir`, workspace, sessions, and auth profiles
- provider code: Codex OAuth stores `{ access, refresh, expires, accountId }`
- auth status CLI: multiple `openai-codex` OAuth profiles can exist in one runtime

## What this means for Hogg Country

The right cloud architecture is **not** "billing passthrough."

The right cloud architecture is:

- user grants Hogg Country a provider connection
- Hogg Country stores that user's ChatGPT/Codex OAuth credential set in an encrypted per-user credential vault
- Hogg Country's cloud delegate resolves model turns against that user's upstream credential set
- Hogg Country writes outputs into that user's private workspace and artifact store

In other words, the user is not just funding raw API calls. They are connecting an upstream model account that Hogg Country can use on their behalf.

## First viable cloud milestone

### Milestone 1: connect ChatGPT and answer one real cloud-hosted turn

The first proof should be:

1. user signs into Hogg Country
2. user clicks `Connect ChatGPT`
3. Hogg Country completes OpenAI/Codex OAuth
4. Hogg Country stores encrypted credential fields per user:
   - provider
   - access token
   - refresh token
   - expires_at
   - account_id
   - profile label
5. user sends a prompt in `/app/claw` or a narrow `/app/coach` surface
6. Hogg Country cloud worker resolves that user's ChatGPT credential set
7. Hogg Country gets a real response from `openai-codex/gpt-5.4`
8. response is returned and logged to that user's workspace/session

That is the real cloud proof.

## Recommended system split

### Laravel control plane
Owns:

- user auth
- billing and entitlements
- provider connection records
- encrypted credential storage
- usage ledger
- audit trail

### Delegate runtime
Owns:

- prompt assembly
- artifact retrieval
- model invocation using the resolved provider credential set
- artifact updates
- bounded background jobs later

### SvelteKit app
Owns:

- `Connect ChatGPT` settings UI
- provider status UI
- chat / coach surface
- workspace views for outputs and artifacts

## Data model addition

The current architecture doc already has `ProviderCredential`.

For this ChatGPT cloud lane, it should explicitly support an OAuth credential form like:

- `provider = openai-codex`
- `credential_type = oauth`
- `account_label`
- `account_id`
- `access_token_ciphertext`
- `refresh_token_ciphertext`
- `expires_at`
- `status`
- `last_validated_at`
- `user_id`
- `workspace_id` or logical routing reference

## Isolation rules

For this to be safe in a cloud SaaS shape:

- one user's OAuth credentials must never be readable from another user's runtime
- one user's delegate must only resolve that user's provider credential set
- credential material must stay server-side only
- every turn must record which provider/account lane was used
- background work must be separately gated from foreground chat until policy and product fit are clearer

## What is already de-risked

These parts now look solid enough to build around:

- private per-user workspace direction
- artifact-first delegate model
- cloud-side control plane in Laravel
- ChatGPT/Codex OAuth as a technically working upstream model lane

## What is still the hard part

The big unresolved issue is **background autonomous use**.

Foreground cloud turns look much more plausible:

- user connected account
- user requests a response
- cloud delegate answers using their upstream ChatGPT credential

The harder question is whether Hogg Country should run fully unattended builder loops, overnight jobs, or proactive background artifact maintenance against that same ChatGPT-connected lane.

That needs separate product, legal, and operational validation.

## Best next implementation slice

Build this next:

1. Laravel `provider_credentials` storage for `openai-codex` OAuth
2. `Connect ChatGPT` account settings flow
3. narrow server-side `respond once` endpoint using the connected `openai-codex` credential
4. one gated app UI that proves:
   - connect
   - ask
   - receive response
   - persist result to workspace

Only after that should Hogg Country decide whether ChatGPT can also power the background delegate loop.

## Current product recommendation

If ChatGPT is meant to be the main workhorse, the right product order is:

- **cloud-hosted per-user delegate first**
- **user-connected ChatGPT/Codex OAuth as the primary foreground brain**
- **house-funded fallback inference second**
- **background autonomous use on the ChatGPT lane only after the cloud connector is real and validated**
