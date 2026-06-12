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
| E2B (~2.3B eff.) | ~1.5 GB | any Android 12+ w/ 3GB+ RAM (most phones since 2020) | default |
| E4B (~4.5B eff.) | ~4 GB | 6GB+ devices (Pixel 6+, S21+, 2022+ mid-flagships) | "high" option |

Both: text + vision + native audio input, 128K context, and **function
calling** — which is what makes offline loadout updates and plan edits work
(the model calls the same tools, executed locally against the encrypted store).

Runtimes for the Capacitor app:
- **Android:** LiteRT-LM embedded in the APK (self-contained) or AICore /
  MediaPipe AI Tasks (Play-services-managed download). Prefer LiteRT-LM for
  guaranteed offline behavior on trail.
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
- **"Their ChatGPT powering OUR app"** — as of June 2026, OpenAI's
  Sign-in-with-ChatGPT is previewed (Codex CLI connects ChatGPT accounts;
  Plus/Pro grants API credits) but third-party "requests run on the user's
  plan" is NOT yet GA. Design for it now: it becomes one more provider in the
  BYOS registry when it ships. Until then, the shipping path is **BYOK** —
  user pastes their own OpenAI (or other) API key into the BYOS provider
  registry the backend already has. Apply to OpenAI's sign-in developer
  interest program so we're early when user-plan compute opens up.

### 3. House cloud (our keys, Forge-side)

Default for free-tier/rationed use, the public demo surfaces, and any
concierge-reviewed flow. Also the fallback when a user's key fails mid-thread.

## Router policy

```
offline                          -> on-device Gemma (E4B if able, else E2B)
online + user provider connected -> user's provider (BYOS / future user-plan)
online + no provider             -> house cloud (rationed)
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
