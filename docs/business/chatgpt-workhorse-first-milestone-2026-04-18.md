# ChatGPT workhorse first milestone (2026-04-18)

## Goal

Get Hogg Country talking through the user's own ChatGPT account before building broader provider abstraction.

## Hard proof

A real ChatGPT/Codex OAuth-backed response was verified locally through Scout:

```bash
openclaw infer model run --gateway --json --model openai-codex/gpt-5.4 \
  --prompt 'Reply with exactly: Hogg Country ChatGPT subscription proof.'
```

Result:

```text
Hogg Country ChatGPT subscription proof
```

That means the first practical milestone is real now:

- user signs into ChatGPT/Codex locally
- Hogg Country sends a prompt into that local companion lane
- a real answer comes back

## What this is not

This is **not** a proof that Hogg Country can run unattended cloud background jobs against a user's ChatGPT subscription.

It is a proof that a **user-authenticated local companion** can make ChatGPT/Codex the main foreground workhorse.

## Fastest implementation path

### 1. Use a local companion, not Forge, for the first connector

The first connector should live on the user's machine:

- Scout handles ChatGPT/Codex OAuth
- Hogg Country talks to a local loopback bridge
- the bridge shells into `openclaw infer model run --gateway ...`

This avoids pretending Forge can safely spend a user's ChatGPT subscription in the background.

### 2. Keep the first transport dead simple

Repo helper scripts added for this milestone:

- `npm run trail-assistant:chatgpt-proof`
  - one-shot proof that ChatGPT/Codex OAuth can answer
- `npm run trail-assistant:chatgpt-bridge`
  - starts a tiny loopback bridge on `http://127.0.0.1:4318`
  - routes `POST /reply` to `openclaw infer model run --gateway --json --model openai-codex/gpt-5.4`

Bridge request shape:

```json
{
  "prompt": "Give me today's trail brief.",
  "model": "openai-codex/gpt-5.4"
}
```

Bridge response shape:

```json
{
  "ok": true,
  "provider": "openai-codex",
  "model": "gpt-5.4",
  "output": "..."
}
```

### 3. Treat this as the first supported ChatGPT lane

For now the realistic product split is:

- **Supported now:** user-authenticated local ChatGPT/Codex companion for attended requests
- **Also supported now:** BYO OpenAI API key
- **Still unresolved:** hosted unattended background delegate execution on a ChatGPT subscription

## Recommended next build slices

1. Add a small settings screen for `ChatGPT companion` vs `BYO API key`.
2. Add a local-connector handshake flow that stores a loopback bridge URL per device.
3. Route the first real Hogg Country prompt surface through the bridge.
4. Keep house-funded inference as a fallback lane, not the main lane.

## Product call

If ChatGPT is the intended workhorse, the right first ship is:

- **foreground companion-first ChatGPT lane now**
- **own inference fallback later**
- **hosted background delegate research after the connector is real**
