# Hoggcountry Offline Architecture Assessment - Lane 3

Timestamp: 2026-06-20T23-00-37-0500
Branch: `main`
Head: `33f0652876beeeebdee53e0e7be43f501a27b7d6`
Mode: read-only source assessment; only this audit artifact was added.

## Scope

This assessment traces the current code paths for:

- mobile document storage, editing, and search;
- Bible storage and search;
- Scout context retrieval;
- on-device model availability and download;
- offline persistence and no-signal behavior.

The requested unrelated dirty files were ignored. Several additional dirty mobile files are relevant to this lane (`mobile/src/lib/scout/tool-registry.ts`, `mobile/src/lib/scout/providers/on-device-gemma.ts`, `mobile/src/lib/trailState.svelte.ts`, iOS model wiring, and model download UI files). I assessed the working tree as it exists because those files directly affect current offline architecture.

## Executive Summary

Hoggcountry has a credible offline-mobile foundation, but it is not yet a coherent offline document architecture. The real pieces are: local editable notes, a packaged KJV Bible asset with on-device lexical search, a cached field-pack store, a deterministic Scout fallback, and native model-management bridges for Gemma 4. These pieces are enough for a controlled cached offline demo if the model and field pack are prepared ahead of time.

The main architectural gap is retrieval. Mobile Scout does not yet have a unified local corpus for "Bible + hiker docs + guide excerpts + generated/edited notes." It has a field-pack object plus a simple `source_search` tool that string-matches guide excerpts and saved documents, and a separate Bible search tool. Server-side Scout has a richer private workspace document/resource/search model, but that model is not connected to the mobile offline app.

For a true zero-internet demo, the hardest blocker is not Bible or note storage; it is first-run model availability. The app downloads a roughly 2.6 GB Gemma LiteRT-LM model from a remote URL and only runs the local model after checksum verification. Without a pre-downloaded or sideloaded model, a fresh no-network install can only show local Bible/search and status/fallback behavior, not differentiated offline AI.

## Current Architecture Map

### Mobile App Shell

The mobile app is a SvelteKit static app packaged with Capacitor. The mobile Trail Assistant store owns tab state, profile, Scout chat, field pack, local documents, model status, and sync state in `mobile/src/lib/trailState.svelte.ts`. It creates a mobile persistence adapter and an `InMemoryContextPackStore` backed by that adapter at `mobile/src/lib/trailState.svelte.ts:111-123`.

Scout is intentionally mobile-offline-first in this path. Calls from the mobile store pass `allowCloud: false` and, under the Gemma-only policy, force `preferredMode: 'on-device'` at `mobile/src/lib/trailState.svelte.ts:666-673` and `mobile/src/lib/trailState.svelte.ts:725-731`.

### Server Workspace Surface

The SvelteKit server workspace has a richer online document/resource model stored as JSON records under backend storage. A workspace snapshot includes `documents`, `resources`, `tools`, provider connections, messages, facts, location history, loadout, and skill settings at `apps/openclaw-web/src/lib/server/workspace-store.ts:142-163`.

This server surface is real, but it is not the mobile offline document store. It can create/import/edit/version workspace documents, save Scout replies as documents, and search private workspace documents/resources through the server Scout agent. That is the future cloud mirror target, not the current mobile offline substrate.

## What Is Real Now

### 1. Local Mobile Documents Exist

Mobile has a real local document type and local CRUD path:

- `TrailDocument` is part of mobile trail state and includes `id`, `title`, `body`, `source`, `createdAt`, and `updatedAt`.
- Local document limits are explicit: 50 documents and 12,000 characters per body in `mobile/src/lib/local-documents.ts:4-5`.
- Creation uses `crypto.randomUUID()` and records source as `manual` or `scout-draft` in `mobile/src/lib/local-documents.ts:16-30`.
- Updates clamp body text and update timestamps in `mobile/src/lib/local-documents.ts:33-44`.
- Documents are converted into Scout context references by `toContextDocuments()` in `mobile/src/lib/local-documents.ts:53-61`.

The mobile store exposes document creation, update, delete, save-last-Scout-answer, and draft-with-Scout behavior in `mobile/src/lib/trailState.svelte.ts:753-790`. Each document mutation syncs the local docs into the field pack through `#syncDocumentsToFieldPack()` at `mobile/src/lib/trailState.svelte.ts:277-281`.

The UI is functional, not just a mock. The Trail tab supports saving offline docs, clearing the editor, saving the last Scout answer, asking Scout to draft a document, editing an existing document, and deleting documents in `mobile/src/lib/components/TrailTab.svelte`.

### 2. Local Mobile Document Search Exists, But It Is Minimal

Mobile Scout's `source_search` tool searches loaded field guide excerpts and saved hiker documents in `mobile/src/lib/scout/built-in-tools.ts:370-420`.

The implementation is simple lexical inclusion:

- lowercases the query;
- splits into tokens longer than two characters;
- searches `guideExcerpts` title/body/tags;
- searches saved document title/body;
- returns a joined summary and receipts.

This is real search, but not a corpus engine. There is no persistent index, no ranking beyond array order, no chunking, no phrase search, no stemming, no recency or source-type scoring, and no query expansion.

There is also a routing weakness: `source_search` runs by default only when no keyword-triggered tool fired. The tool registry first runs specific tools for water, shelter, town, weather, miles, gear, current-mile, and Bible keywords at `mobile/src/lib/scout/tool-registry.ts:34-69`. It only runs `current_mile` plus `source_search` when no tool invocations exist at `mobile/src/lib/scout/tool-registry.ts:100-106`. That means a prompt about "water in my saved note" may trigger `next_water` and never search the saved notes.

### 3. Offline KJV Bible Is Real

The mobile Bible path is a genuine offline asset and index:

- `mobile/src/lib/bible/bible-index.ts:1-16` states the intended architecture: packaged static KJV asset, no network, 66 books, 31,102 verses, used by both Scout and the Bible reader.
- `loadBibleIndex()` fetches `/bible/kjv.json`, parses it, builds an in-memory index, memoizes the promise, and retries on failure at `mobile/src/lib/bible/bible-index.ts:158-177`.
- The index tokenizes and builds an inverted token map at `mobile/src/lib/bible/bible-index.ts:73-111`.
- Search ranks by distinct query-token coverage, total hits, and shorter verses at `mobile/src/lib/bible/bible-index.ts:113-145`.
- The Bible reader loads the index on mount and supports Browse, Read, Search, and Ask modes in `mobile/src/lib/components/BibleReader.svelte:58-71` and `mobile/src/lib/components/BibleReader.svelte:51-56`.
- Bible Ask first does local verse lookup before Scout synthesis at `mobile/src/lib/components/BibleReader.svelte:123-145`.
- Scout has an explicit `bible_search` tool that loads the same index and returns verse receipts at `mobile/src/lib/scout/built-in-tools.ts:437-484`.

This means Bible reading and lexical Bible search should survive a no-internet session once the packaged app assets are available.

### 4. Server-Side KJV Search Is More Capable Than Mobile

The server corpus package has a richer KJV PCE implementation than mobile. It parses book/chapter/verse references and ranges in `packages/corpus/src/kjv-pce.ts:194-231`, checks direct reference hits before topic/phrase hits in `packages/corpus/src/kjv-pce.ts:233-250`, and has topic reference helpers in `packages/corpus/src/kjv-pce.ts:253-291`.

The server Scout agent includes KJV PCE as a searchable source when the scripture skill is enabled at `apps/openclaw-web/src/lib/server/claw-agent.ts:753-775`.

Mobile's Bible index has browse and lexical search, but not the same direct reference/range lookup quality. The mobile UI has a small `parseRef()` helper for opening a reference in the reader at `mobile/src/lib/components/BibleReader.svelte:88-112`, but the mobile `bible_search` tool does not share the richer server `searchKjvPce()` logic.

### 5. Scout Context Retrieval Is Real, But Pre-Model And Heuristic

The mobile Scout runtime loads the context pack, runs tools, chooses a model provider, and sends the tool summaries to the provider at `mobile/src/lib/scout/scout-runtime.ts:25-44`.

The on-device Gemma provider does not support dynamic tool calls. Its capabilities explicitly set `supportsToolCalls: false` at `mobile/src/lib/scout/providers/on-device-gemma.ts:61-66`. Tool selection happens before the model runs, through the keyword registry. The provider renders a compact system context containing hiker position and tool findings at `mobile/src/lib/scout/providers/on-device-gemma.ts:173-190`.

This is a reasonable offline architecture for a small model: deterministic retrieval first, small model synthesis second. The current implementation, however, only gives the model whatever tools the keyword registry happened to fire.

### 6. Field Pack Offline Cache Is Real

The context pack store is in-memory with optional persistence:

- storage key: `hoggcountry:scout:context-pack:v1` at `mobile/src/lib/scout/context-pack-store.ts:23`;
- load from adapter and merge saved pack at `mobile/src/lib/scout/context-pack-store.ts:46-61`;
- remote refresh from endpoint with `cache: no-store` at `mobile/src/lib/scout/context-pack-store.ts:71-99`;
- on fetch/validation failure, preserve current pack and mark cached/stale/error status at `mobile/src/lib/scout/context-pack-store.ts:100-110`;
- update hiker, weather, loadout, and documents into the same pack at `mobile/src/lib/scout/context-pack-store.ts:113-145`;
- persist whole pack JSON at `mobile/src/lib/scout/context-pack-store.ts:178-185`.

The mobile store loads the pack, resets uncalibrated users to the bundled starter pack, syncs documents into it, applies pack data to state, and refreshes from network only when online and calibrated at `mobile/src/lib/trailState.svelte.ts:245-258`.

### 7. Offline State Persistence Is Real

Mobile state persistence uses a `PersistenceAdapter` backed by Capacitor Preferences on native and mirrored into `localStorage`:

- native Preferences adapter is dynamically imported at `mobile/src/lib/mobile-persistence.ts:30-33`;
- `get()` prefers native then localStorage at `mobile/src/lib/mobile-persistence.ts:49-54`;
- `set()` writes native and then localStorage, warning but continuing if native fails at `mobile/src/lib/mobile-persistence.ts:55-66`.

Trail state is snapshotted as JSON and includes active tab, profile, chat messages, check-ins, documents, reports, privacy/settings, sync state, current mile, day number, support circle, and `lastSyncAt` at `mobile/src/lib/trail-state-persistence.ts:41-61`.

This is adequate for profile, recent chat, small notes, and a compact field pack. It is not adequate as the final storage layer for a growing offline source library.

### 8. Model Availability And Download Plumbing Is Real

The mobile Scout runtime can include deterministic fallback, on-device Gemma, and cloud providers, but mobile passes `allowCloud: false` so cloud does not run from the mobile path. The runtime is built in `mobile/src/lib/scout/index.ts:31-49`.

Model routing is intentionally fail-closed for Gemma-only:

- forced `preferredMode: 'on-device'` routes to on-device even if availability is false at `mobile/src/lib/scout/model-router.ts:35-44`;
- runtime rethrows on-device failures under forced on-device mode instead of silently using deterministic fallback at `mobile/src/lib/scout/scout-runtime.ts:45-76`;
- mobile chat starts model download when useful and returns a plain status message when Gemma is unavailable at `mobile/src/lib/trailState.svelte.ts:655-664`.

The TypeScript bridge defines status, download, network, and event contracts at `mobile/src/lib/scout/capacitor-gemma-bridge.ts:15-38` and `mobile/src/lib/scout/capacitor-gemma-bridge.ts:111-136`.

The model download session handles:

- unsupported/native-unavailable status;
- runtime-unavailable status;
- missing download config;
- offline network;
- metered network prompt;
- progress tracking;
- reconcile on resume;
- unavailable answer text.

Those branches are in `mobile/src/lib/scout/model-download-session.svelte.ts:74-150` and `mobile/src/lib/scout/model-download-session.svelte.ts:152-230`.

Android has default model URL, SHA-256, and byte size configured in Gradle at `mobile/android/app/build.gradle:21-31`, and links LiteRT-LM Android at `mobile/android/app/build.gradle:82-90`.

iOS has a matching model contract, app-private model store, size/hash verification, and iCloud-backup exclusion in `mobile/ios/App/App/scout/ScoutModelStore.swift:20-33`, `mobile/ios/App/App/scout/ScoutModelStore.swift:84-168`, and `mobile/ios/App/App/scout/ScoutModelStore.swift:171-191`. The iOS plugin exposes status/download/generation calls in `mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:23-33`, reports runtime configuration through `canImport(LiteRTLM)` at `mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:237-251`, and honestly reports that iOS foreground downloads do not survive app termination at `mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:186-199`.

## What Is UI-Only, Thin, Or Absent

### 1. Offline Source Docs Are Not Yet A First-Class Corpus

The product goal is offline searchable source docs including Bible, hiker docs, and generated/edited notes. Today, those exist as separate mechanisms:

- Bible: packaged static asset plus in-memory index.
- Hiker docs and Scout drafts: small `TrailDocument[]` inside `TrailState`.
- Guide excerpts: entries inside the current `ContextPack`.
- Server docs/resources: server JSON workspace records.

There is no mobile `CorpusStore`, no normalized document/chunk table, no persistent search index, no shared receipt model across Bible/docs/guide, and no future sync metadata on mobile document records.

### 2. Mobile Docs Have Editing, But Not Import Or Rich Document Management

Mobile supports manual note entry and saving the last Scout answer. It does not currently support:

- importing markdown/text/PDF files into the mobile offline app;
- attaching source URI/license/provenance to mobile docs;
- document versions or review states;
- delete tombstones;
- conflict handling;
- chunk-level receipts;
- explicit "searchable/private/sensitive" flags.

The server workspace does have many of these concepts. It imports documents in `apps/openclaw-web/src/lib/server/workspace-store.ts:1240-1286`, creates workspace resources in `apps/openclaw-web/src/lib/server/workspace-store.ts:1302-1422`, creates documents in `apps/openclaw-web/src/lib/server/workspace-store.ts:1461-1523`, saves Scout replies as documents in `apps/openclaw-web/src/lib/server/workspace-store.ts:1526-1630`, edits versions in `apps/openclaw-web/src/lib/server/workspace-store.ts:1755-1812`, and exposes routes for documents/resources in `apps/openclaw-web/src/routes/app-api/workspace/documents/+server.ts:7-40`, `apps/openclaw-web/src/routes/app-api/workspace/documents/[documentId]/+server.ts:10-83`, and `apps/openclaw-web/src/routes/app-api/workspace/resources/+server.ts:10-72`.

But none of that is the offline mobile path today.

### 3. Search Is Not Guaranteed To Run When It Should

Because `source_search` only runs when no other mobile tool triggers, saved docs can be skipped for ordinary trail questions. This is the highest-leverage retrieval bug for the offline product. A hiker will expect Scout to use saved notes even when the prompt also contains "water", "shelter", "town", "gear", or "weather."

### 4. Mobile Bible Search Is Lexical, Not Reference-Complete

The mobile Bible path is real, but exact reference/range lookup is weaker than the server KJV PCE package. "John 3:16" quality depends on the lexical index and reader helper behavior rather than the robust `lookupKjvPceReference()` server implementation.

For a Bible-forward offline product, the mobile Bible tool should support exact book/chapter/verse and ranges before lexical/topic search.

### 5. Persistence Is Whole-JSON Small-State Persistence

The app persists state and context pack as whole JSON strings through Preferences/localStorage. That is good for current app continuity. It is fragile for a larger offline library:

- document bodies are duplicated in `TrailState` and in the context pack document list;
- writes rewrite the whole snapshot;
- no chunk-level writes;
- no index-level persistence;
- no conflict/sync journal;
- no storage pressure strategy;
- no migration layer for a corpus schema.

### 6. Cloud Mirror Is A Future Architecture, Not Current Mobile Behavior

The server workspace can already store private docs/resources and search them from the server agent. The mobile app does not mirror its local documents to those APIs, does not import server workspace docs for offline use, and does not maintain stable IDs/tombstones suitable for later ChatGPT/MCP/API parity.

The right conclusion is not "cloud docs are absent"; it is "cloud docs are real in the web workspace and disconnected from the mobile offline corpus."

## What Blocks A Zero-Internet Demo

### Cold Install, No Internet

A cold install with zero internet cannot prove differentiated offline AI unless the model file is already on the device. The native model stores are configured to download `gemma-4-E2B-it.litertlm`, expected size 2,588,147,712 bytes, from Hugging Face with SHA-256 verification (`mobile/android/app/build.gradle:26-31`, `mobile/ios/App/App/scout/ScoutModelStore.swift:20-27`). Without network, `startIfUseful()` returns the offline/no-internet branch and tells the user to connect to Wi-Fi (`mobile/src/lib/scout/model-download-session.svelte.ts:90-94`, `mobile/src/lib/scout/model-download-session.svelte.ts:119-126`).

Bible search should work offline from the packaged asset. Manual note creation should work offline. Cached field-pack answers should work if the app has a bundled or previously saved pack. But on-device AI requires a verified model before the no-signal window begins.

### Cached Demo, Internet Used Beforehand

A controlled no-signal demo is possible if these are prepared while online:

1. the mobile build includes `/bible/kjv.json`;
2. the hiker profile is calibrated and the field pack is refreshed/saved;
3. the Gemma model has been downloaded, checksum-verified, and warmed;
4. any demo hiker/source docs have been manually entered or already present in state;
5. the device is then put into airplane mode and Scout is asked questions that hit the saved pack/Bible/docs.

This is a "prepared offline demo," not a "fresh zero-internet install" demo.

### Product Demo Risks

- If `VITE_SCOUT_MODEL_POLICY` resolves to `gemma4-only`, Scout will not use deterministic fallback as a model substitute. That is correct honesty, but a no-model/no-network demo will show status messages rather than AI answers.
- If the hiker is uncalibrated, `#loadFieldPack()` resets to the bundled starter pack and does not have a personalized pack centered on the hiker (`mobile/src/lib/trailState.svelte.ts:245-258`).
- Mobile source search can miss saved docs because `source_search` is skipped when other keyword tools fire.
- iOS model download does not survive app termination; it only reports foreground in-flight state (`mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:186-199`).
- No physical-device build/test was run as part of this read-only assessment, so runtime availability on a specific iOS/Android device is not proven here.

## Architectural Gap Analysis

### Gap 1: Storage Model Is Split Across State, Field Pack, Bible Asset, And Server Workspace

Current mobile state is centered on `TrailState`, not a corpus. The field pack is a useful context envelope, but it is doing double duty as Scout retrieval source, hiker context, weather cache, loadout, and local document carrier.

Impact: as soon as hiker docs grow beyond a handful of notes, the app will either bloat state snapshots or need a parallel store. If that parallel store is added ad hoc later, cloud mirroring and receipts will be harder.

### Gap 2: Search Is Tool-Based, Not Source-Based

The server agent has a concept of source lanes and `searchable-now` hits (`apps/openclaw-web/src/lib/server/claw-agent.ts:778-850`). Mobile has individual tools and a fallback `source_search`. This makes source retrieval incidental rather than foundational.

Impact: Scout can answer from nearby water or weather context while ignoring the hiker's saved doc that directly answers the prompt.

### Gap 3: Mobile And Server Bible Search Diverge

Mobile and server both have KJV search, but server KJV PCE has better reference parsing and topic lookup. Maintaining two Bible search semantics will produce inconsistent answers between offline mobile and future ChatGPT/MCP/API surfaces.

Impact: "offline app quality" and "later cloud mirror quality" will drift unless the mobile app adopts the same reference-first search behavior.

### Gap 4: No Offline Demo Readiness Contract

The code has model status, field-pack status, Bible loading, and document persistence, but there is no single readiness contract that says: "This phone is ready for a 0-internet Scout demo."

Impact: demo success depends on hidden preconditions. The UI can show model status, but the product needs an explicit all-green offline readiness check.

### Gap 5: Server Workspace Is Ahead Of Mobile, But Not A Source Of Truth For Offline

Server workspace docs/resources have versions, searchability flags, resources, saved Scout replies, and source receipts. Mobile docs are small local records. There is no shared local-first schema that can later sync up to the server without mapping loss.

Impact: if mobile moves fast with one schema and server moves with another, later ChatGPT/MCP/API mirroring becomes a migration project instead of a sync adapter.

## Five Implementation Moves

### Move 1: Add A Mobile `LocalCorpusStore` Without Rewriting Trail State

Keep `TrailState` for UI/session state, but move source-document storage into a small local corpus layer. Start with an IndexedDB-backed store in the WebView, plus a manifest pointer in the existing persistence adapter. Avoid SQLite or a large dependency until a real need appears.

Minimum record shape:

- `id`
- `kind`: `hiker-doc`, `scout-draft`, `guide-excerpt`, `bible-verse`, later `workspace-doc`
- `title`
- `body` or `chunkText`
- `source`
- `createdAt`, `updatedAt`
- `searchable`
- `sensitivity`
- `provenance`
- `deletedAt` for later sync tombstones

This fits the existing architecture because `TrailDocument` can continue powering the UI while `toContextDocuments()` becomes a projection from corpus records. The field pack stops being the long-term document store and becomes a retrieval/context envelope again.

### Move 2: Replace Mobile `source_search` With A Unified Offline Search Service

Create `offline-search.ts` that searches:

- current field-pack guide excerpts;
- local corpus hiker docs and Scout drafts;
- Bible hits through the same reference-first KJV logic;
- later downloaded workspace resources.

Do not add embeddings yet. A simple BM25-like lexical ranker over chunks is enough and fits the existing code. Reuse the current Bible tokenizer and manual-core scoring ideas. Most importantly, run unified source search on every Scout turn, then run domain tools as additional context, not as a replacement for document search.

The immediate bug fix is: `runToolsFor()` should always include a bounded `source_search`/`offline_search` result unless the prompt is explicitly non-retrieval or the corpus is empty.

### Move 3: Port Reference-First KJV Search Into Mobile

Move the robust KJV PCE reference/range behavior from `packages/corpus/src/kjv-pce.ts` into a browser/mobile-safe shared package or a mobile-local module generated from the same source data. Mobile Bible search should do:

1. exact reference/range lookup;
2. topic lookup;
3. phrase/token lookup.

This avoids two Bible behaviors and makes later ChatGPT/MCP/API parity cleaner. It also improves no-internet demo quality immediately because a hiker asking "John 3:16" or "Psalm 23" should get exact scripture without relying on broad lexical scoring.

### Move 4: Add An Offline Readiness Preflight

Add one mobile readiness contract used by Settings and Scout chat before demos:

- Bible asset loads and verse count is correct;
- context pack source is bundled/saved/remote and not expired, with calibrated hiker mile when applicable;
- local corpus index is built;
- model status is `ready`;
- runtime is configured;
- model warm-up succeeded or failed with a retryable reason;
- device network can be turned off and the app still answers a known local prompt.

This should be a small service over existing status methods, not a new framework. It can render as "Offline Scout readiness" in Settings and optionally as a short chat status card when Gemma-only is required.

### Move 5: Make Cloud Mirroring A Sync Adapter, Not A New Document Model

After the mobile corpus exists, add a narrow sync adapter that maps local corpus records to the existing workspace APIs:

- mobile local docs map to workspace documents;
- source snippets/files map to workspace resources;
- Scout drafts keep stable IDs and version/tombstone metadata;
- server workspace IDs are recorded as remote aliases, not replacements for local IDs.

Use the existing server workspace routes and store functions rather than inventing a second cloud doc system. Delay ChatGPT/MCP/API integration until local IDs, receipt semantics, and conflict behavior are stable. This preserves offline app quality as the primary architecture and makes cloud a mirror rather than a dependency.

## Recommended Implementation Order

1. Fix retrieval coverage by always running bounded source search on mobile Scout turns.
2. Add mobile reference-first KJV lookup so Bible behavior is exact and demo-safe.
3. Add `LocalCorpusStore` and migrate current `TrailDocument[]` writes into it while preserving the current UI.
4. Add the offline readiness preflight and a seeded demo checklist.
5. Add cloud mirror adapter to the existing SvelteKit workspace docs/resources APIs.

## Risk Register

| Risk | Severity | Evidence | Recommendation |
| --- | --- | --- | --- |
| Fresh no-internet install cannot run on-device AI | Critical | Model requires remote download and verification before `ready` | Support pre-seeded/sideloaded model for demos or make readiness preflight explicit |
| Saved docs can be skipped by Scout retrieval | High | `source_search` only runs when no trigger fired | Always run bounded offline source search |
| Mobile document storage will not scale | High | Whole JSON state/pack persistence; 50 docs x 12k char cap | Add corpus store before import/file support |
| Bible behavior differs mobile vs server | Medium | Mobile lexical index vs server reference-first KJV PCE | Share/port KJV reference-first search |
| Cloud workspace and mobile docs diverge | Medium | Server workspace docs/resources are richer but disconnected | Add sync adapter after local corpus IDs stabilize |
| iOS download resilience is weaker than Android | Medium | iOS foreground URLSession does not survive app termination | Show this honestly in readiness; consider background session later |

## Bottom Line

The offline app is not vapor. It has real offline Bible, real local notes, real cached field-pack behavior, real no-cloud mobile Scout routing, and real native model status/download plumbing. The gap is architectural integration: the current pieces need a local corpus/search layer so Scout retrieves from the same source universe that the product promises.

The fastest high-confidence path is not to add a new framework or cloud dependency. It is to make source search unconditional and unified, give mobile the same reference-first Bible semantics as the server, move docs out of whole-state persistence into a small local corpus store, and only then mirror that corpus to the already-existing workspace document/resource APIs.
