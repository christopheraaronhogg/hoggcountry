# Scout Standard Documents Plan

**Status:** Draft
**Date:** 2026-05-02
**Owner:** Hogg Country / Scout
**Related:** `docs/plans/2026-05-01-scout-document-system-prd.md`

## 1. Product read

Chris's direction: Scout should not feel like a loose file dump. It should have a compact set of standard trail documents that make the workspace understandable, while still allowing the hiker or Scout to create extra documents when the situation calls for it.

The right shape is a **small standard document shelf** plus an **extra docs locker**.

- Standard docs are the predictable trail artifacts Scout should always know about.
- Extra docs are flexible, user-created or Scout-drafted artifacts.
- Every document, standard or extra, has preserved version history.
- Scout can draft a missing standard document, revise an existing document, or propose an extra document from a conversation.
- The hiker stays in control of what becomes the current trusted version.

Guardrail: this should not become a Notion clone. The document system is for trail decisions, not general-purpose writing.

## 2. Standard document shelf

Keep this compact for v1. Six standard slots are enough to make the product feel organized without overwhelming a hiker.

| Standard doc | Purpose | Scout behavior | Empty-state CTA |
| --- | --- | --- | --- |
| **Hiker Profile** | Stable constraints: trail name, direction, current mile, pace, food carry limit, medical/comfort constraints, contact notes. | Scout treats this as durable personal context. Changes should be explicit and versioned. | `Build profile` |
| **Current Plan** | The next 24 hours: target miles, camp/water/town options, weather, risks, go/no-go checks. | Scout updates this frequently from daily brief, hiker messages, and confirmed location. | `Draft today's plan` |
| **7-Day Plan** | Rolling medium-range trail plan: town/resupply assumptions, zero/nero candidates, weather/risk watchlist. | Scout revises when current mile, injury, weather, food, or alerts change. | `Draft 7-day plan` |
| **Resupply Plan** | Food carry, next town, services, timing, constraints, and backup options. | Scout keeps this practical and source-aware; imported guide/FarOut notes can ground it. | `Plan next resupply` |
| **Gear + Body Notes** | Gear issues, clothing/layering, foot/knee/body constraints, repair needs, sleep/cold notes. | Scout uses this to adjust mileage and safety recommendations. | `Start gear/body notes` |
| **Safety + Risk Brief** | Current safety facts: weather risk, closures, bears, burn bans, emergency assumptions, missing source checks. | Scout separates official alerts, private notes, and assumptions. | `Build risk brief` |

These should render as fixed slots even when empty. Empty is useful: it tells the hiker what Scout can help create next.

## 3. Extra documents

Extra docs cover everything outside the standard shelf.

Examples:

- Town note: `Glasgow options`
- Weather analysis: `Cold rain plan for Saturday night`
- Story/social draft: `Trail update draft`
- Budget/logistics note
- Permit/logistics checklist
- Family communication note
- Medical incident note
- Gear shakedown
- Imported file/note

Extra docs can be created in three ways:

1. **User drafts manually** from Docs with `New doc`.
2. **User asks Scout**: “Draft a Glasgow town plan as a doc.”
3. **Scout proposes one** after a conversation: “This should become a Resupply Plan / extra doc.”

Scout should ask for confirmation before creating clutter unless the user explicitly says to draft/save it.

## 4. Document model rules

All documents share the same durable model.

Required fields:

- `id`
- `slotKey` for standard docs, null for extra docs
- `title`
- `kind`
- `status`: `draft`, `needs-review`, `active`, `archived`
- `visibility`: default `private`
- `searchable`: default true for trusted/private workspace use, user-toggleable
- `currentVersionId`
- `versions[]`
- `sourceReceipts[]`
- `createdBy`: `user`, `scout`, or `system`
- `updatedAt`

Version fields:

- `versionNumber`
- `contentMarkdown`
- `summary`
- `author`: `user`, `scout`, or `system`
- `sourceMessageId` when created from a conversation
- `revisionPrompt`
- `sourceReceipts`
- `createdAt`

Rules:

- No AI rewrite silently overwrites the current document.
- A Scout draft creates a version with `needs-review` unless the user explicitly accepts it as active.
- Restoring an old version creates a new current version or moves `currentVersionId` with an audit record; either way, history remains intact.
- Imported docs are usually not rewritten in place. Scout can summarize or create a derived extra doc from them.
- Standard docs can be archived only by hiding/resetting the slot, not by deleting the concept.

## 5. UX plan

### `/app/docs`

Top structure:

1. Search
2. **Standard docs** compact shelf
3. **Extra docs** list
4. Import / New doc actions

Standard shelf card states:

- Empty: title, purpose, `Draft with Scout`
- Draft: title, last edited, `Review`
- Needs review: highlighted, `Compare / Accept`
- Active: current summary, `Ask Scout`, `Revise`
- Archived/reset: `Restore / Draft again`

Extra docs list:

- Compact cards with kind, status, updated date, version count
- Filters: `All`, `Needs review`, `Active`, `Imports`, `Archived`
- Primary actions: `Open`, `Ask Scout`, `Archive`

### `/app/docs/[documentId]`

Document detail should stay content-first:

- Header: title, standard slot badge if applicable, status, version count
- Current version content
- Sticky/mobile action bar:
  - `Ask Scout`
  - `Revise`
  - `Versions`
  - `Mark active`
- Version history drawer:
  - list versions
  - view old version
  - compare with current
  - restore
- Source receipts drawer:
  - private imports
  - official checks
  - user confirmations
  - Scout assumptions

### `/app/claw`

Scout conversation should understand documents as artifacts:

- Composer can attach one doc or target a standard slot.
- If a standard doc is missing, Scout can offer: `Draft Current Plan`, `Draft Resupply Plan`, etc.
- If a reply looks like a durable artifact, show:
  - `Save as extra doc`
  - `Update Current Plan`
  - `Update 7-Day Plan`
- If revising an existing doc, show a visible mode: `Updating: 7-Day Plan`.
- After Scout drafts a version, show `Review version` rather than pretending it is final.

## 6. First shippable slice

Build the smallest version that proves the product model.

### Slice A — standard slots in Docs

- Add standard document slot definitions in one shared module.
- `/app/docs` renders the six standard slots above extra docs.
- Existing docs map into a slot when `slotKey` or `kind` matches.
- Empty slots show `Draft with Scout` CTAs.

### Slice B — draft standard doc with Scout

- Clicking `Draft with Scout` opens `/app/claw` with a target slot and starter prompt.
- Scout reply can be saved into that slot as a document version.
- If the slot was empty, the first saved version becomes `active` or `needs-review` depending on user action.

### Slice C — version history is universal

- Every standard and extra doc displays version count.
- Document detail supports viewing previous versions.
- Restore/mark-current is available from detail.

### Slice D — extra doc creation

- Add `New doc` in `/app/docs` for a blank markdown doc.
- Add `Save as extra doc` action on Scout replies.
- Extra docs appear below standard docs and share the same history model.

## 7. Acceptance criteria

- `/app/docs` shows exactly six standard document slots, even if no document exists yet.
- User can create/draft an extra document without attaching it to a standard slot.
- Scout can create a draft for a standard slot from a conversation.
- Scout can save a reply as an extra document.
- Every document detail page shows current version and version history.
- Revising a document creates a new version; old versions remain viewable.
- Standard docs and extra docs are private by default.
- Mobile layout is clean: standard shelf first, extra docs second, actions in compact drawers/buttons.

## 8. Recommendation

Do this next as a product cleanup over the existing document-system foundation.

Recommended order:

1. Define standard slots and render them in `/app/docs`.
2. Wire slot-targeted Scout prompts from empty standard docs.
3. Ensure Scout save/revise can target either a standard slot or a new extra doc.
4. Polish version-history UX on detail pages.

This gives Chris the clean mental model: **Scout keeps a small set of standard trail documents current, and anything else can still become a private versioned document when needed.**
