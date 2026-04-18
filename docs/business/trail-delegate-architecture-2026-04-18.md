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
- a fake “use your ChatGPT subscription here” passthrough

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
- Today, Manual, Tools, Docs, Claw surfaces
- future account, billing, provider settings, support-circle screens

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
Use a **hybrid funding model**:
- platform-funded usage for bundled plans
- BYOS API key for users who want direct control over model spend

### What users can plug in today
Supported production-feasible lane:
- **their own provider API key**, starting with OpenAI API keys

### What users cannot plug in today
Not supported:
- ChatGPT Plus or Pro subscription passthrough
- handing us their ChatGPT login
- using consumer chat subscriptions as third-party API billing

That matches the current BYOS ADR already in the repo.

### BYOS request flow
1. user signs into Hogg Country
2. user opens provider settings
3. user chooses:
   - `Hogg Country included AI`
   - `Bring my own API key`
4. if BYOS, user submits provider key over TLS
5. backend encrypts and stores the secret
6. backend runs a low-cost validation probe
7. entitlement service marks provider lane active
8. future delegate requests resolve funding mode server-side
9. usage ledger records whether the request was platform-funded or BYOS-funded

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
- your ChatGPT subscription does not fund API calls here
- if you want to use your own AI billing, add an API key
- your key is encrypted and only used server-side for your requests

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

### Phase 1, now shipped locally
- private workspace records
- manual sections
- imported docs
- safe checklist tools
- workspace search

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

1. Deploy the newly shipped private workspace slice to Forge
2. Keep validating the artifact-first gated app shape
3. Add real auth + account settings next
4. Implement BYOS credential storage and provider validation in Laravel
5. Put Coach behind that entitlement layer instead of bolting model calls directly into the client

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
- they cannot plug in a normal ChatGPT subscription as a billing passthrough
- the safest commercial model is **hybrid: platform-funded by default, BYOS for power users**
