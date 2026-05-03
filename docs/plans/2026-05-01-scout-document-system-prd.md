# PRD: Scout Document System

**Status:** Draft
**Date:** 2026-05-01
**Owner:** Hogg Country / Scout
**Surface:** `/app/docs`, `/app/claw`, future document APIs

## 1. Problem

Scout is becoming a real trail workspace, not just a chat box. The current Docs surface can import files, search them, and save Scout replies as assistant-generated documents, but it blurs two different jobs: maintaining living work products and storing user-supplied source material.

That is not enough for the product direction. Hikers need living artifacts they can trust, review, revise, and bring into a Scout conversation. A plan should not disappear into chat history or become a dead saved note. It should have versions, provenance, review state, and an obvious loop: **open document → ask Scout about it → revise → compare previous version → accept or roll back**.

## 2. Product stance

Documents are first-class workspace artifacts, but uploaded files and saved links should be modeled separately as **Resources**.

Chat remains the primary working surface, but documents are the durable memory layer. Scout should help create and revise them, but the hiker owns them. The system must keep private-use separate from public sharing.

Core rule: **Use this to help me** is not the same as **share this publicly**.

Second core rule: **Resource** is not the same as **Document**. A resource is source material Scout can read or cite. A document is a maintained artifact Scout can draft, revise, version, and export.

## 3. Current state

Existing lightweight pieces:

- `ImportedDocument` in `packages/manual-core/src/index.ts` stores `title`, `fileName`, `kind`, `rights`, `searchable`, `textContent`, `note`, `importedAt`, and `sizeBytes`.
- `/app/docs` can currently import text/markdown/html/pdf files, search workspace material, list docs, and delete docs.
- Scout can save a strong reply to Docs through `/app-api/claw/save-document`.
- Scout can revise a selected assistant-generated plan in place from `/app/claw` through `/app-api/claw/reply`.

Gaps:

- Imported files are still presented as documents, even though they are better understood as immutable/private source resources.
- No dedicated Resources surface for uploaded files, web addresses, pasted notes, official-source pointers, or extracted text.
- No version history.
- No diff/review flow.
- No document detail/editor page.
- No explicit document status: draft, reviewed, active, archived.
- No clear attachment model for bringing one or more docs into chat context.
- No citations/provenance model per document revision.
- No rollback.
- No sharing permissions per document.
- No mobile-first document review UX.

## 4. Goals

| Goal | What success looks like |
| --- | --- |
| Make documents durable | A hiker can open a plan, see the current version, and trust it as the latest artifact. |
| Separate resources from maintained docs | Uploaded files, saved URLs, and pasted source notes live in a Resources locker; generated plans/reports live as Documents. |
| Make revisions safe | Every Scout rewrite creates a version that can be reviewed, compared, accepted, or rolled back. |
| Make chat + docs work together | A hiker can attach a document to the conversation and ask Scout to explain, revise, summarize, or update it. |
| Let Scout transform resources into docs | A user can attach resources, ask Scout to analyze them, and save the result as a maintained document or export. |
| Keep source confidence visible | Each document can show what came from private imports, Scout assumptions, official checks, or user confirmations. |
| Stay private-first | Documents are private by default and sharing is explicit per document/artifact. |
| Stay mobile-first | Review and revision must work cleanly on a phone without a Notion-style desktop editor. |

## 5. Non-goals for v1

- Not building a full Notion/Google Docs clone.
- Not real-time multi-user editing.
- Not public publishing by default.
- Not collaborative comments from family/friends yet.
- Not automatic promotion of user docs into shared Scout knowledge.
- Not importing copyrighted guidebooks except user-supplied/user-owned excerpts or files.
- Not silently converting every upload or URL into a maintained document.
- Not building full financial, medical, legal, or tax automation; sensitive-resource analysis must stay clearly user-reviewed.

## 6. Core user stories

### Story 1: Review a document

As a hiker, I want to open a saved Scout plan or imported document so I can understand what it says and whether I trust it.

Acceptance criteria:

- Document list shows title, type, status, last updated, and whether it is searchable.
- Tapping a document opens a detail view.
- Detail view shows current content, metadata, source/provenance summary, and actions.
- Mobile view prioritizes content first, with metadata/actions tucked into compact controls.

### Story 2: Bring a document into Scout

As a hiker, I want to ask Scout about a specific document so the answer is grounded in that artifact.

Acceptance criteria:

- From document detail, user can tap **Ask Scout about this**.
- Scout composer receives/attaches the document context.
- Conversation visibly indicates the active document context.
- Scout answer distinguishes document-backed facts from assumptions or current-source checks.

### Story 2A: Bring resources into Scout

As a hiker or workspace user, I want to upload a file, paste a note, or save a web address so Scout can use it as source context without confusing it with a maintained document.

Acceptance criteria:

- User can add a resource from file upload, URL, or pasted text.
- Resource detail shows source type, title, processing/searchable state, sensitivity label, and extracted summary when available.
- User can attach one or more resources to a Scout turn.
- Scout answers clearly distinguish resource-backed facts from assumptions.
- Scout can create a maintained document from selected resources when the user asks.
- Original resources are not rewritten by Scout.

Example: user uploads a bank statement as a private financial resource. Scout can produce a categorized spending report and export it as a PDF, but the bank statement remains immutable source material.

### Story 3: Revise a document with Scout

As a hiker, I want Scout to revise a plan or note without destroying the previous version.

Acceptance criteria:

- User can ask Scout to revise an assistant-generated document.
- The system creates a proposed revision/version.
- User can review before making it active.
- Previous active version remains available.
- Revision records include created time, author (`user`, `Scout`, `system`), prompt/message reference, and source receipts where available.

### Story 4: Compare versions

As a hiker, I want to compare the current plan with the previous version so I can see what Scout changed.

Acceptance criteria:

- Versions list is visible from document detail.
- User can open any previous version.
- User can compare current vs selected previous version.
- Diff starts simple: added/removed/changed sections or line-level markdown diff.
- User can restore a previous version.

### Story 5: Mark trust/review state

As a hiker, I want to know whether a document is a rough draft, reviewed plan, active plan, or archived note.

Acceptance criteria:

- Document status supports at least: `draft`, `needs-review`, `active`, `archived`.
- Scout-generated revisions default to `needs-review` unless explicitly accepted.
- Active plan is easy to identify in Docs and in Scout.
- Archived docs remain searchable unless the user disables that.

### Story 6: Control privacy and sharing

As a hiker, I want every document private by default and shareable only when I choose.

Acceptance criteria:

- New documents default to private.
- Visibility model is explicit and per document: `private`, `trusted-link`, `public` later.
- v1 can store visibility even if public sharing UI is deferred.
- Scout never treats a private doc as public trail intel.

## 7. Proposed data model

The current `ImportedDocument` can evolve into a richer `WorkspaceDocument` model.

```ts
export type WorkspaceDocumentKind =
  | 'plan'
  | 'trail-note'
  | 'gear-list'
  | 'resupply-plan'
  | 'journal'
  | 'imported-file'
  | 'other';

export type WorkspaceDocumentStatus = 'draft' | 'needs-review' | 'active' | 'archived';
export type WorkspaceDocumentVisibility = 'private' | 'trusted-link' | 'public';
export type WorkspaceDocumentRights = 'user-imported' | 'assistant-generated' | 'user-authored';

export interface WorkspaceDocument {
  id: string;
  title: string;
  kind: WorkspaceDocumentKind;
  status: WorkspaceDocumentStatus;
  visibility: WorkspaceDocumentVisibility;
  rights: WorkspaceDocumentRights;
  currentVersionId: string;
  searchable: boolean;
  summary: string;
  tags: string[];
  sourceDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  contentMarkdown: string;
  summary: string;
  author: 'user' | 'scout' | 'system';
  sourceMessageId?: string | null;
  revisionPrompt?: string | null;
  sourceReceipts: WorkspaceDocumentSourceReceipt[];
  createdAt: string;
}

export interface WorkspaceDocumentSourceReceipt {
  label: string;
  type: 'resource' | 'private-doc' | 'manual' | 'official-source' | 'user-confirmation' | 'scout-estimate' | 'public-corpus';
  resourceId?: string | null;
  status: 'used' | 'unchecked' | 'stale' | 'needs-confirmation';
  href?: string | null;
}
```

Migration note: keep compatibility with existing `ImportedDocument` during transition. Do not break search/import flows while upgrading storage.

Resources get a sibling model. See `docs/plans/2026-05-03-scout-resources-model.md` for the full product model.

```ts
export type WorkspaceResourceKind = 'file' | 'url' | 'note' | 'official-source';
export type WorkspaceResourceStatus = 'processing' | 'ready' | 'failed' | 'archived';
export type WorkspaceResourceSensitivity = 'normal' | 'private' | 'sensitive' | 'financial' | 'medical';

export interface WorkspaceResource {
  id: string;
  workspaceId: string;
  kind: WorkspaceResourceKind;
  title: string;
  sourceUri?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  status: WorkspaceResourceStatus;
  sensitivity: WorkspaceResourceSensitivity;
  searchable: boolean;
  extractedText?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 8. UX shape

### `/app/docs`

Mobile-first document list:

- Search bar.
- Filter chips: `All`, `Active`, `Needs review`, `Plans`, `Imports`, `Archived`.
- Document cards with status, last updated, summary, and quick actions.
- Primary action: `New doc` / `Import`.
- Docs should list maintained artifacts, not every uploaded resource. Import/upload entry points can route into Resources and then offer `Create document from this`.

### `/app/resources`

Mobile-first resource locker:

- Upload file.
- Add web address.
- Paste note/text.
- Show searchable/extracted status.
- Mark sensitivity: normal, private, sensitive, financial, medical.
- Ask Scout about selected resources.
- Create a maintained document/report from selected resources.

### `/app/docs/[documentId]`

Document detail:

- Header: title, status, visibility, last updated.
- Body: current version markdown.
- Action bar:
  - `Ask Scout about this`
  - `Revise with Scout`
  - `Versions`
  - `Mark active`
  - `Archive`
- Side/bottom drawer:
  - Source receipts.
  - Version history.
  - Search/index status.

### `/app/claw`

Conversation integration:

- Composer supports attached document chips.
- Composer supports attached resource chips.
- If a document is active, show a small pill above composer: `Using: 7-day plan` with remove button.
- If a resource is active, show a distinct pill: `Using resource: March statement.pdf`.
- Prompt starters can be document-aware:
  - `Revise this`
  - `Summarize changes`
  - `What is risky?`
  - `Update after today`
- Scout replies that propose edits should create a proposed version, not silently overwrite.
- Scout replies that analyze resources should offer `Save as document` or `Export PDF` after user review.

## 9. Suggested implementation phases

### Phase 1 — Versioned document foundation

- Add versioned document types in `manual-core` or server workspace types.
- Extend workspace JSON storage with `documentsV2` or migrate `documents` carefully.
- Add read/write helpers:
  - create document
  - create version
  - set current version
  - list versions
  - restore version
  - update status/visibility/searchable
- Keep existing `ImportedDocument` search working during migration.

### Phase 2 — Document detail page

- Add `/app/docs/[documentId]`.
- Render current version.
- Show metadata, status, source receipts, and versions list.
- Add restore previous version.
- Add simple markdown display first; editing can be later.

### Phase 3 — Scout attachment and revision flow

- Add document attachment to `/app/claw` composer.
- Add resource attachment to `/app/claw` composer.
- Add API support for `documentContextIds` or `activeDocumentId`.
- Add API support for `resourceContextIds`.
- When Scout revises a document, create a proposed version with status `needs-review`.
- Add `Accept revision` and `Reject revision` UX.

### Phase 3A — Resources foundation

- Split imported files/URLs/pasted notes into a Resources model and surface.
- Keep resource originals immutable.
- Store extracted text and summaries for Scout search/context.
- Let Scout create a maintained document from one or more resources.
- Add PDF export for generated reports after user review.

### Phase 4 — Diff and review polish

- Add current-vs-previous diff.
- Add source receipt badges.
- Add confidence/review summary.
- Add mobile-friendly revision drawer.

### Phase 5 — Sharing controls

- Add document visibility UI.
- Keep default private.
- Add trusted-link/public later only after privacy audit.

## 10. Risks and guardrails

| Risk | Why it matters | Guardrail |
| --- | --- | --- |
| Becoming Notion-lite | Too much editor surface will distract from Scout's trail job | Keep v1 markdown/current-version focused. No block editor. |
| Silent overwrites | Hiker loses trust if Scout changes docs without review | Every AI revision creates a version; user accepts active version. |
| Source confusion | Plans may mix facts, assumptions, and live checks | Require source receipts / confidence labels per revision. |
| Resource/document confusion | User uploads become clutter or get rewritten unexpectedly | Resources are source material; Documents are maintained artifacts. Scout creates derived docs rather than mutating resources. |
| Privacy leakage | Private docs could accidentally become public/social | Visibility defaults private; public promotion is separate. |
| Sensitive data mishandling | Financial/medical uploads carry higher privacy risk | Add sensitivity labels, private defaults, provenance, and explicit user review before export/share. |
| Mobile clutter | Docs can become too much UI | Content first, actions in drawers, composer integration simple. |

## 11. Recommendation

Build this next as a foundation layer, but keep the v1 scope tight.

Recommended first shippable slice:

1. Versioned assistant-generated docs.
2. Document detail page.
3. `Ask Scout about this` from document detail.
4. Proposed revision creates a new version instead of overwriting.
5. Version history + restore.

Recommended next slice after that:

1. Resources page/locker for uploads, URLs, and pasted notes.
2. Resource attachment chips in Scout.
3. `Create document from resources` flow.
4. Reviewed PDF export from generated documents/reports.

This gives Scout the artifact loop Chris is asking for without turning the beta into a giant document editor or file dump too early.
