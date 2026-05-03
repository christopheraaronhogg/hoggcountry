# Trail Delegate Architecture (2026-04-18)

## Decision

Build Hogg Country as a **persistent trail delegate system**, not a generic hiking chatbot.

Each paying user gets:
- one private trail workspace
- one durable profile and artifact set
- one bounded agent loop that keeps improving that workspace over time
- optional BYOS model funding through a user-provided API key

The app should stay manual-first and artifact-first. Chat helps, but the product value lives in durable plans, checklists, notes, and operating documents the hiker can inspect and export.

---

## Product shape

### What the user is buying
The user is buying a private trail operating system that can:
- help them set up their hike
- turn trail decisions into reusable artifacts
- keep a living field manual current
- watch for contradictions and drift
- propose next actions when context changes

### What the user is not buying
- a shared group bot
- a magic black box with hidden memory only
- a workflow that depends on exposing raw model credentials in the client
- a fake generic “your ChatGPT plan just pays our server bill” passthrough

---

## Core architecture

```text
SvelteKit app (apps/openclaw-web)
  -> Laravel control plane (auth, billing, entitlements, audit, queues, BYOS config)
  -> Artifact store (manual, tools, docs, plans, exports)
  -> Agent runtime lane (per-user delegate execution)
  -> SpacetimeDB sidecar (later: presence, live map, realtime collaboration)
  -> Ops console / human escalation lane
```

### 1. Web product shell
**Current home:** `apps/openclaw-web`

Responsibilities:
- public product pages
- gated `/app/*` workspace
- signup/onboarding
- Today, Manual, Tools, Docs, Scout surfaces
- future account, billing, provider settings, support-circle screens

Naming transition note:
- user-facing assistant name should now be `Scout`
- preferred plain-English descriptor is `your personal trail assistant`
- the currently working route and some internal code still use temporary `claw` names such as `/app/claw`, `clawMessages`, and nearby server files
- keep visible product copy on `Scout`, and treat the remaining `claw` names as migration debt until the second rename pass lands

Rules:
- first paint must work without live realtime dependency
- public routes stay dependable under SSR
- private routes can hydrate richer live state after load

### 2. Laravel control plane
**Current home:** `backend/`

Responsibilities:
- auth and identity
- subscription and entitlement state
- BYOS provider registry and secure credential storage
- audit logs and policy enforcement
- queueing and scheduled jobs
- human escalation and moderation workflows
- stable system-of-record for user/account data

Rules:
- secrets never leave the server
- billing and entitlements stay deterministic here
- every high-risk or paid action should be auditable here

### 3. Per-user artifact store
The delegate needs durable product outputs, not just chat transcripts.

Primary artifacts:
- `manual.md` or sectioned manual records
- `gear-plan.json`
- `resupply-plan.json`
- `training-plan.md`
- `risk-triggers.json`
- `checklists/*.json`
- imported supporting docs and notes

Current shipped slice already covers the first layer of this idea:
- private profile
- manual sections
- imported docs
- safe checklist tools
- a cloud `/app/claw` console with per-workspace connected-account state, even though the user-facing product name is now Scout during the transition
- pending `FactCandidate` extraction from Scout turns so reusable trail intel can enter a review queue instead of staying trapped in chat
- a first artifactization pass where strong Scout replies can be saved into Docs as searchable markdown plan artifacts and later revised in place from Scout
- a Dad field-pilot surface on Scout that pastes the latest public Garmin fix and dispatch context into one-click planning prompts, so the product can be tested against real trail conditions first

### 4. Agent runtime lane
Near term, this can run as a server-side delegate worker behind Laravel-owned permissions and entitlements.

Responsibilities:
- grounded answer generation
- artifact updates
- contradiction detection
- proactive builder jobs
- safe tool generation inside a constrained schema

Design rule:
- the delegate can recommend and draft
- the control plane owns permissions, identity, quotas, and provider selection

### 5. SpacetimeDB sidecar
Use later for hot realtime surfaces, not as the only source of truth.

Good fits:
- live map fanout
- presence
- active support sessions
- fast shared updates for town/safety coordination

Not the right place for:
- billing truth
- entitlement truth
- raw secret storage
- canonical audit history

### 6. Collective trail intelligence layer
Hogg Country should learn from many hikers over time without breaking private workspace boundaries.

Responsibilities:
- collect candidate facts, town notes, hostel patterns, shuttle intel, closure reports, and route corrections from foreground and background delegate work
- normalize those reports into a review queue instead of silently promoting them into trusted docs
- run fact-checkers, duplicate detection, freshness scoring, and human review where needed
- promote approved facts into shared documentation, town cards, planning hints, and future model grounding corpora
- keep provenance so every shared fact can be traced back to source reports and review decisions

Design rule:
- user workspaces stay private by default
- only extracted fact candidates with clear provenance can move into the shared intelligence layer
- shared docs must prefer reviewed facts over raw chat anecdotes

---

## Per-user tenancy model

Each subscriber needs a hard private boundary.

### Required isolation units
For every user:
- account id
- workspace id
- artifact namespace
- memory namespace
- provider credential set
- usage ledger
- session history scope
- background job scope

### Minimum data model

#### User
- `id`
- `email`
- `trail_name`
- `plan_tier`
- `status`

#### Workspace
- `id`
- `user_id`
- `current_hike_id`
- `delegate_state`
- `created_at`
- `updated_at`

#### HikerProfile
- direction
- start date
- target pace
- budget tier
- experience level
- shelter preference
- water capacity
- health notes
- reflection style

#### Artifact
- `id`
- `workspace_id`
- `kind`
- `title`
- `body` or `json_payload`
- `source`
- `version`
- `updated_by` (`user|assistant|system`)

#### SourceDocument
- `id`
- `workspace_id`
- `kind`
- `title`
- `text_content`
- `rights`
- `searchable`

#### FactCandidate
- `id`
- `workspace_id`
- `artifact_id` or `message_id`
- `kind` (`hostel|resupply|water|closure|shuttle|weather_pattern|gear|medical|other`)
- `claim_text`
- `region_slug`
- `mile_range_start`
- `mile_range_end`
- `source_type` (`user_report|delegate_extraction|human_ops`)
- `confidence`
- `status` (`pending|needs_review|approved|rejected|stale`)
- `review_notes`
- `fresh_until`

#### ToolDefinition
- `id`
- `workspace_id`
- `kind`
- `schema_version`
- `title`
- `instructions`
- `json_payload`
- `author_type`

#### MemoryEntry
- `id`
- `workspace_id`
- `kind` (`fact|preference|decision|risk|todo`)
- `content`
- `confidence`
- `source_artifact_id`

#### ProviderCredential
- `id`
- `user_id`
- `provider`
- `mode` (`byos|platform`)
- `secret_ciphertext`
- `key_hint`
- `status`
- `last_validated_at`

#### UsageLedger
- `id`
- `user_id`
- `provider`
- `model`
- `request_type`
- `estimated_cost`
- `funding_mode`
- `created_at`

---

## Delegate loop design

The product should support both **foreground turns** and a **background builder loop**.

### Foreground turn
Trigger:
- user opens Today
- user asks Coach a question
- user edits manual/tool/doc state

Flow:
1. load workspace state
2. resolve entitlements and provider mode
3. gather relevant artifacts, memory, and current trail context
4. run delegate reasoning for the task
5. return user-facing answer
6. optionally draft or update artifacts
7. log usage, mutations, and audit trail

### Background builder loop
Trigger:
- scheduled sweep
- after important user action
- after new source import
- after route/weather/safety state change

Jobs:
- detect missing manual sections
- tighten vague checklists
- spot contradictions between plan, pace, budget, and current mile
- propose town or resupply updates
- create safe draft tools for repeated decisions
- surface the next 1 to 3 meaningful actions
- extract candidate shared facts from user-approved reports when they could improve the wider trail corpus

### Shared intelligence loop
Trigger:
- a foreground or background turn produces a candidate fact worth broader reuse
- a user submits a hostel, shuttle, water, or closure correction
- human ops records a verified update

Flow:
1. extract structured claim candidates from private artifacts or chat
2. redact or drop personal details that do not belong in shared knowledge
3. dedupe against existing shared facts and nearby pending claims
4. run fact-checkers and freshness checks
5. send ambiguous or high-impact claims to human review
6. promote approved facts into shared docs, town cards, and model-grounding corpora
7. keep source provenance and expiry metadata so old trail intel can age out cleanly

### Guardrails
The builder loop must not:
- silently publish anything publicly
- contact external parties without permission
- mutate paid settings or provider credentials on its own
- create arbitrary executable code

---

## Safe tool schema

Start with a constrained DSL, not arbitrary user code.

### Supported tool kinds in early phases
- `checklist`
- `calculator`
- `decision_tree`
- `planner`
- `tracker`
- `reminder_rule`
- `comparison_table`

### Example: checklist schema

```json
{
  "id": "tool_123",
  "kind": "checklist",
  "schemaVersion": 1,
  "title": "Rain camp reset",
  "summary": "Keep camp setup clean in bad weather.",
  "instructions": "Run top to bottom before you settle in.",
  "items": [
    { "id": "item_1", "label": "Pitch shelter first" },
    { "id": "item_2", "label": "Protect sleep clothes" },
    { "id": "item_3", "label": "Eat before hands go cold" }
  ]
}
```

### Example: calculator schema

```json
{
  "id": "tool_456",
  "kind": "calculator",
  "schemaVersion": 1,
  "title": "Food carry calculator",
  "inputs": [
    { "key": "days", "type": "number" },
    { "key": "calories_per_day", "type": "number" }
  ],
  "formula": "days * calories_per_day",
  "output": {
    "label": "Target calories to carry",
    "unit": "kcal"
  }
}
```

Rule:
- every tool kind gets a strict schema and validator
- no freeform code execution in MVP
- generated tools must remain human-readable and editable

---

## BYOS model funding design

## Current decision
Use a **hybrid provider model**:
- platform-funded usage for bundled plans
- BYOS API key for users who want direct control over model spend
- a separate user-connected account lane for providers that support external-tool OAuth, starting with OpenAI Codex / ChatGPT OAuth research

### What users can plug in today
Supported or technically viable lanes:
- **their own provider API key**, starting with OpenAI API keys
- **a connected OpenAI Codex / ChatGPT OAuth account** as a cloud-side upstream model lane for that user's delegate, once Hogg Country wires the server-side connector

### What users cannot plug in today
Not supported:
- generic ChatGPT Plus or Pro billing passthrough
- exposing raw model credentials in the client
- treating consumer chat subscriptions as interchangeable with normal server-side API billing

### What is still unresolved
Needs separate validation:
- unattended background delegate execution against a connected ChatGPT subscription
- long-running autonomous cloud jobs that spend the user's connected chat account without an active foreground request

The older BYOS ADR is still useful for billing-separation caution, but it is too narrow to describe the newer connected-account lane.

### Provider connection flow
1. user signs into Hogg Country
2. user opens provider settings
3. user chooses:
   - `Hogg Country included AI`
   - `Bring my own API key`
   - `Connect ChatGPT`
4. if API-key BYOS, user submits provider key over TLS
5. if ChatGPT connect, user completes provider OAuth and Hogg Country stores the resulting server-side credential set
6. backend encrypts and stores the credential material
7. backend runs a validation probe or status check
8. entitlement service marks the chosen lane active
9. future delegate requests resolve provider mode server-side
10. usage ledger records whether the request was platform-funded, API-key-funded, or connected-account-backed

### Provider abstraction contract
Each provider integration should expose:
- `validateCredential()`
- `listSupportedModels()`
- `invokeModel()`
- `estimateCost()`
- `redactCredential()`
- `supportsToolCalling()`
- `supportsResponsesApi()`
- `supportsStreaming()`

### Account UX copy
The UI should say this plainly:
- connecting ChatGPT is not the same thing as handing us a raw API key
- your connected provider account is used server-side only for your Hogg Country requests
- a ChatGPT connection is not generic API billing passthrough
- if you want direct API billing control, add an API key instead

---

## Recommended service boundaries for MVP

### Frontend
Owns:
- product UX
- local draft state
- offline cache
- optimistic rendering where safe

### Laravel API
Owns:
- auth
- billing
- entitlements
- BYOS credentials
- workspace metadata
- job dispatch
- audit trails

### Delegate worker
Owns:
- prompt assembly
- artifact mutation proposals
- search over workspace artifacts
- safe tool drafting

### Realtime sidecar
Owns later:
- live map/presence/session fanout

### Human ops lane
Owns:
- escalations
- sensitive logistics
- safety review
- abuse handling

---

## MVP build order

### Phase 0, already started
- gated app shell in `apps/openclaw-web`
- private workspace concept
- manual-first product posture

### Phase 1, shipped on Forge
- private workspace records
- manual sections
- imported docs and multipart upload through the Laravel bridge
- safe checklist tools
- workspace search
- gated `/app` routes verified on the Forge domain after the bridge began proxying non-GET workspace requests

### Phase 2
- move workspace persistence from file-backed prototype storage to Laravel-owned user storage
- add real account auth beyond the beta cookie
- add account settings for provider mode and API key connection

### Phase 3
- add Coach turn execution against workspace artifacts
- add usage ledger and provider abstraction in active use
- add artifact mutation review flow for assistant-written changes

### Phase 4
- add background builder loop
- generate draft tools and plan updates automatically
- add notification/inbox surface for proposed changes

### Phase 5
- add support-circle, concierge escalation, and hot realtime lanes
- add richer town/shuttle/partner workflows
- introduce SpacetimeDB for the low-latency pieces that need it

---

## Immediate implementation recommendation

1. Keep validating the artifact-first gated app shape with real trail use
2. Add real auth + account settings next
3. Implement BYOS credential storage and provider validation in Laravel
4. Put Scout behind that entitlement layer instead of bolting model calls directly into the client
5. Move the file-backed workspace prototype into Laravel-owned user storage once account identity is real

---

## Bottom line

Hogg Country should be powered like this:
- **SvelteKit app for the user experience**
- **Laravel for identity, billing, BYOS, audit, and control-plane truth**
- **artifact-first per-user workspaces**
- **a bounded delegate runtime that improves those artifacts over time**
- **SpacetimeDB only where realtime actually matters**

And for AI subscriptions:
- users can plug in an **API subscription** through a provider key
- users may also be able to plug in a **connected ChatGPT/Codex account** as the upstream brain for their cloud-hosted delegate
- they cannot plug in a normal ChatGPT subscription as a generic billing passthrough
- the safest commercial model is still **hybrid: platform-funded by default, user-connected lanes where technically supported, and BYOS for power users**
