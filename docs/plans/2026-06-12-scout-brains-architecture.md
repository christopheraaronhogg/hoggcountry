# Scout Brains: One Runtime, Swappable Engines

Date: 2026-06-12
Status: agreed direction (builds on docs/plans/2026-05-12-scout-local-first-phone-ai.md
and docs/plans/2026-06-11-product-strategy-one-trail-four-anchors.md)

## Decision

Scout is ONE runtime — one system prompt set, one tool registry, one grounding/
RAG layer, one reliability harness — with three swappable engines behind a
router. The engine never changes what Scout can do, only how well/fast it
thinks. Tools (update loadout, save plan, mile context, manual search) are the
stable contract; safety receipts and freshness labels apply on every engine.

## The three engines

### 1. On-device: Gemma 4 E2B / E4B (offline default)

Gemma 4 (released 2026-04-02, Apache 2.0) ships edge variants built for this:

| Model | RAM needed | Runs on | Notes |
|-------|-----------|---------|-------|
| E2B (~2.3B eff.) | ~2.5 GB model package | Android 12+ w/ enough free storage and RAM for LiteRT-LM | default |
| E4B (~4.5B eff.) | ~4 GB | 6GB+ devices (Pixel 6+, S21+, 2022+ mid-flagships) | "high" option |

Both: text + vision + native audio input, 128K context, and **function
calling** — which is what makes offline loadout updates and plan edits work
(the model calls the same tools, executed locally against the encrypted store).

Runtimes for the Capacitor app:
- **Android:** LiteRT-LM with a first-run/on-demand model download. Gemma 4 E2B
  is too large for the base Play app bundle, so do not plan to embed it directly
  in the APK/AAB. Prefer LiteRT-LM for guaranteed offline behavior after the
  model is downloaded before trail use.
- **iOS:** official Google iOS path still maturing; llama.cpp (GGUF) via a
  native Capacitor plugin is the proven route today; revisit Core ML/MLX
  conversions as they land.
- Model selection UX: auto-detect by device RAM, expose E2B/E4B picker in
  settings ("selection of Gemma models"). Models download on wifi pre-trail,
  alongside route packs.

### 2. User-connected cloud (online, their account)

Two different OpenAI integrations — do not conflate them:

- **ChatGPT App (Apps SDK)** — `apps/scout-chatgpt-app/` already exists and is
  submitted. This puts Scout INSIDE ChatGPT: their plan, their models, our
  tools/data. It is a distribution channel, not a power source for our app.
  Next step there: add reviewed "Do" tools (save plan, update loadout) backed
  by account linking to the Laravel API.
- **"Their ChatGPT powering OUR app" — ALREADY SHIPPING in beta.** Scout's
  workspace has a direct ChatGPT connect flow
  (`app-api/claw/connect/openai-codex/*` + `lib/server/claw-openai-codex.ts`):
  PKCE OAuth against auth.openai.com using the Codex app client, tokens stored
  per workspace, and `claw-agent` runs cloud turns through the
  `openai-codex-responses` API under the user's own ChatGPT plan. There is
  also a localhost bridge (`scripts/scout-codex-local-bridge.mjs`) that shells
  out to the Codex CLI for dev/local use.

  Empirical finding (2026-06-12, verified live by Codex): OpenAI's authorize
  server **rejects unregistered redirect URIs** for the Codex client
  (`authorize_hydra_invalid_request` for
  https://hoggcountry.com/auth/chatgpt/callback). Only the registered
  localhost redirect works, which forces manual paste-back mode for every
  ChatGPT connect/login flow until the official program registers a cloud
  redirect for us.

  **Product decision (Chris, 2026-06-12): paste-back does not ship as a
  customer experience.** The public front door is Google + email. The
  consumer path to a cloud brain is the house-model subscription (zero
  setup). ChatGPT-connect remains in the gated beta workspace only
  (family/dev use), BYOK lives in advanced settings, and the one-tap
  "Continue with ChatGPT" login stays built but dark behind
  `PUBLIC_CHATGPT_LOGIN_ENABLED=1` + `SCOUT_OPENAI_CODEX_REDIRECT_URI`,
  ready to flip on the day OpenAI registers a redirect for us.

  Honest risk framing: this rides OpenAI's Codex OAuth client and the
  Codex-scoped responses endpoint, which OpenAI sanctions for Codex surfaces —
  not (yet) as a general third-party "user plan compute" API. It is solid for
  the closed beta, but it is a dependency OpenAI could narrow at any time, so
  it is **beta-grade, not the foundation for paid GA**. The durable ladder:
  1. Codex-OAuth connect (working now, beta users)
  2. **BYOK** via the BYOS provider registry (GA-grade, fully sanctioned)
  3. Official Sign-in-with-ChatGPT user-plan compute when OpenAI ships it
     (interest application submitted 2026-06; drop-in replacement for #1)

### 3. House cloud (our keys, Forge-side) — subscribers only

Decision 2026-06-12: **no rationed free cloud tier.** Free users get the
on-device engine (unlimited, zero marginal cost, and it markets the core
offline differentiator). House cloud (GPT-5.5 via the API: $5/$30 per 1M
tokens, $0.50 cached input as of June 2026) powers paying subscribers and
the public demo surfaces, and is the fallback when a user's key fails.

Pricing shape:

- **Free** — on-device Gemma only + follow + guide.
- **Trail Pass (monthly, and a season pass SKU)** — house GPT-5.5 with
  generous fair-use included usage, sync, offline packs. Unit economics:
  a grounded Scout turn is roughly 6–8K input / ~800 output ≈ $0.04–0.07
  at list, and the static corpus prefix is highly cacheable (cached input
  is 10x cheaper), so a ~$25–30/mo pass covers even heavy daily use.
  Route routine turns to a mini-class model, escalate hard ones to 5.5
  (scenario difficulty scoring already exists in the eval suite).
- **BYOK** — their key, minimal/no app fee; also the overflow path when a
  subscriber exceeds fair use (degrade gracefully: offer BYOK or top-up,
  never hard-stop mid-trail — worst case drop to on-device).
- **Sign-in-with-ChatGPT user-plan** — slots in as a provider when OpenAI
  ships it (interest form application submitted 2026-06).

Avoid raw usage-metered billing for consumers: thru-hikers budget the whole
hike in advance, and a taximeter on Scout suppresses the daily-loop habit the
product depends on. Metering stays internal (fair-use accounting), not the
customer-facing price.

## Router policy

```
offline                          -> on-device Gemma (E4B if able, else E2B)
online + user provider connected -> user's provider (BYOS / future user-plan)
online + subscriber              -> house cloud (GPT-5.5, fair-use)
online + free                    -> on-device engine (cloud upsell surface)
engine failure mid-thread        -> degrade down the list, tell the user
```

Rules that hold on every engine:
- Tool calls are the only way Scout mutates state (loadout, plans, docs).
- Source receipts + freshness labels on trail facts; "verify live" on
  time-sensitive data; the smaller the model, the tighter the tool guardrails.
- The reliability harness runs in API mode against EACH engine tier; an
  engine is not "supported" until it passes the easy-slice suite.

## Why this shape wins

- Offline is the foundation, not a fallback (AT coverage reality).
- Users who already pay OpenAI bring their own horsepower (margin + trust).
- The ChatGPT App meets customers where they already are and funnels them
  to the real app for offline/field use.
- One tool registry means Loadout/Plan/Manual features are built once and
  every brain — 2B on a phone or frontier in the cloud — drives the same
  product.

## Sequencing

1. Define the tool registry contract (TypeScript schema shared by web app,
   ChatGPT app, and the future native runtime). Loadout tools first.
2. BYOK end-to-end in the web app via the existing BYOS registry (OpenAI
   first), with the router + degradation UX.
3. Reliability harness in API mode against: house model, BYOK model.
4. Capacitor shell + native inference plugin spike: LiteRT-LM (Android),
   llama.cpp (iOS), Gemma 4 E2B first; harness against the local engine.
5. ChatGPT app v2: account linking + first "Do" tools.
6. Flip on Sign-in-with-ChatGPT user-plan compute when OpenAI ships it.

## Sources

- https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/
- https://huggingface.co/blog/gemma4
- https://developers.googleblog.com/bring-state-of-the-art-agentic-skills-to-the-edge-with-gemma-4/
- https://developers.googleblog.com/blazing-fast-on-device-genai-with-litert-lm/
- https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/
- https://developers.openai.com/apps-sdk
- https://techcrunch.com/2025/05/27/openai-may-soon-let-you-sign-in-with-chatgpt-for-other-apps/
- https://github.com/openai/codex/issues/10974 (user-plan compute: requested, not GA)
