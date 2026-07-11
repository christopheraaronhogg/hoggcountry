# Scout offline-readiness hardening

**Date:** 2026-07-11  
**Status:** Accepted for implementation  
**Scope:** Native mobile Scout using the pinned Gemma 4 E2B LiteRT-LM model

## Problem

The app currently collapses three different facts into one green “Ready” state:

1. the model file exists and passed its checksum;
2. LiteRT-LM can initialize that exact model on this phone;
3. Scout has completed a local-only answer with the network disconnected.

Only the first fact is presently proven. Both native engines report availability before their first heavy initialization, iOS does not expose its warm-up method, and the UI says Scout “works fully offline” as soon as the file verifies. At the same time, a second chat turn can be submitted while the first is streaming, which can race iOS initialization and interleave token listeners.

The product should be boringly truthful: hikers must be able to distinguish “downloaded” from “tested on this phone,” and Scout must run one bounded local turn at a time.

## Approaches considered

### A. Change the copy only

Rename “Ready” to “Downloaded” and leave runtime behavior unchanged.

This removes the most visible false claim, but it does not prove that LiteRT can load the model and does not prevent concurrent inference. It is necessary but insufficient.

### B. Run a full smoke answer automatically on every launch

Initialize Gemma and generate a probe response during startup.

This gives fresh proof, but it adds seconds of launch contention, memory pressure, battery drain, and surprise heat. Scout’s local model is deliberately absent from the boot path, so an unconditional launch probe would regress a core reliability rule.

### C. Progressive readiness with an explicit offline test (selected)

Keep the model off the critical launch path and expose three independent stages:

- **Model verified:** the pinned model file matches its manifest.
- **Runtime initialized:** an awaited native warm-up successfully initialized LiteRT during this session.
- **Offline test passed:** while native network status reports disconnected, a fixed local-only Scout question produced a non-empty on-device answer from the current model and field pack.

The pass proof is device-local and bound to a versioned identity containing the model ID, expected checksum and size, app version/build, and readiness-schema version. A changed model or app build invalidates the proof. File verification never inherits runtime proof by itself.

This is the smallest design that is honest, user-testable, and cheap during normal launches.

## Product behavior

### Readiness states

The UI derives a single display state from independent evidence:

| State | Meaning | Allowed claim |
| --- | --- | --- |
| `needs_model` | Model absent, partial, or invalid | “Download model” |
| `file_verified` | Exact model file passed native verification | “Model verified” |
| `initializing` | Awaited LiteRT initialization is running | “Starting local AI” |
| `runtime_ready` | LiteRT initialized in this session | “Local AI started” |
| `testing` | Local-only offline probe is running | “Testing on this phone” |
| `offline_ready` | Bound offline smoke proof passed | “Offline test passed” |
| `failed` | Warm-up or probe failed | Plain error plus retry |

The Today and Safety surfaces may say “Offline tested” only for `offline_ready`. They may say “Model verified” for the checksum state, but never “On-device AI” or “Available” solely because a file exists.

### Test flow

The Offline brain card owns the initial flow:

1. download and verify the pinned model;
2. tap **Test Scout offline**;
3. if native network status is connected, stop and ask the hiker to enable Airplane Mode and turn Wi-Fi off;
4. await real native engine initialization;
5. run one local-only, battery-saver Scout question against the current cached field pack;
6. pass only for a non-empty `on-device-gemma` / `on-device` answer with local tool or source evidence;
7. persist the bound proof and show its timestamp.

The test does not refresh data, write chat history, mutate hike state, or invoke cloud fallback. Passing proves local inference and cached context plumbing; it does not prove that cached weather, water, closures, or services are current.

### One turn at a time

Concurrency is blocked at all useful layers:

- the Trail store refuses a second send while any Scout reply is active;
- send, quick-prompt, resume, and relevant text controls are disabled for the full reply, not merely until the first token;
- native iOS initialization/generation is serialized, and Android rejects or serializes overlapping requests without sharing token streams.

The full-reply counter is authoritative. The “thinking” flag remains visual only because it becomes false after the first streamed token.

## Native runtime contract

### Warm-up

`warmUp` becomes an awaited result rather than a fire-and-forget hint. It returns success only after `Engine.initialize()` completes, with a structured error on failure. JavaScript caches successful initialization for the session and invalidates it after a generation/runtime failure or model replacement.

### Prompt roles

System grounding must use the native system-message facility rather than concatenating it into user text:

- iOS: `ConversationConfig(systemMessage: Message(..., role: .system))`
- Android: `ConversationConfig(systemInstruction = Contents.of(...))`

The user prompt remains a user message. This preserves the intended instruction hierarchy for Gemma 4.

### Bounds and cancellation

LiteRT-LM 0.13.1 does not expose an exact per-request output-token limit. `EngineConfig.maxNumTokens` is the total KV-cache window, not an output cap. Native adapters therefore:

- keep the JS-requested budget as a conservative streamed-output ceiling;
- cancel the active conversation when that ceiling or timeout is reached;
- mark budget cancellation as `truncated`;
- surface timeout, busy, initialization, and memory failures distinctly;
- never describe an estimated character/token ceiling as exact model-token accounting.

Battery saver will use a smaller prompt/history/output budget. Native KV-cache reduction is a later device-measured optimization because changing it without physical memory/quality measurements can make answers less reliable.

## Download and manifest truth

- Android verification markers bind schema version, model ID, expected SHA-256, expected size, actual size, and modification time.
- Disk preflight reserves meaningful headroom (at least 512 MB or 15% of the model size, whichever is larger) for temporary files, caches, and OS pressure.
- iOS currently uses a foreground `URLSession`. Until a background-session implementation is proven on device, iOS copy must say to keep the app open and on power; it must not promise survival after locking or terminating the app.
- Wi-Fi/metered checks remain an admission guard. Continuous mid-transfer network-policy enforcement is follow-up work because it requires native transfer-policy handling and device testing.

## Persistence and privacy

The offline-test proof lives in Capacitor Preferences with a localStorage mirror, outside cloud-backed hike state. It contains no prompt or answer text—only schema/model/app identity, pass time, and coarse platform. A malformed or mismatched proof is ignored and replaced only by a new successful test.

## Verification

Automated gates:

- readiness-proof parse, binding, invalidation, and display-state unit tests;
- native bridge warm-up contract tests;
- store/UI concurrent-send tests;
- provider tests for system/user separation and battery-saver budgets;
- Svelte check, mobile unit suite, production build;
- Android compile/debug APK;
- iOS compile where Xcode tooling is available.

Physical release gates remain explicit and cannot be simulated away:

- install the release/TestFlight build on the target phone;
- download/verify the model, kill and relaunch the app;
- enable Airplane Mode, turn Wi-Fi off, and pass the in-app test;
- ask real water, shelter, terrain, bailout, weather-staleness, and emergency-boundary questions;
- measure first-answer latency, peak memory, temperature, and battery drain;
- repeat after backgrounding, low-power mode, and an app update.

Until those device gates pass, the repository can be build-ready and contract-tested, but it must not be reported as physically trail-proven.
