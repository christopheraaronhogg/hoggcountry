# Scout Resources Model

**Status:** Draft
**Date:** 2026-05-03
**Owner:** Hogg Country / Scout
**Related:** `docs/plans/2026-05-01-scout-document-system-prd.md`, `docs/plans/2026-05-02-scout-standard-documents-plan.md`

## 1. Product decision

Scout needs two different artifact classes:

1. **Documents** — living work products Scout or the user creates, maintains, versions, reviews, and exports.
2. **Resources** — user-supplied or user-approved source material Scout can use as context.

This split keeps the workspace understandable. A PDF upload, bank statement, web page, FarOut note, photo, spreadsheet, or pasted text should not automatically become a maintained Scout document. It should first be a **Resource**. Scout can then summarize it, extract facts from it, answer questions about it, or create a new maintained **Document** from it.

Example: if a user uploads a bank statement, the statement remains a private Resource. Scout can analyze it and create a maintained spending-category report as a Document, then export that report as a PDF. The generated report is reviewable and versioned; the original bank statement remains immutable source material.

## 2. Plain-language model

| Concept | Meaning | Examples | Scout behavior |
| --- | --- | --- | --- |
| **Resource** | Source material the user adds or points Scout at. | PDF, image, CSV, bank statement, guide excerpt, web URL, hostel page, NWS link, FarOut screenshot, pasted note. | Read, extract, summarize, cite, search, and use as private context. Do not silently rewrite. |
| **Document** | A maintained artifact in the workspace. | Current Plan, 7-Day Plan, Resupply Plan, spending-category report, gear shakedown, family update draft. | Draft, revise, version, compare, mark active, export. |
| **Export** | A file generated from a Document or analysis result. | PDF report, printable checklist, CSV summary, family-facing brief. | Generated output; not the source of truth unless saved back as a Document version. |

## 3. UX implications

### `/app/docs`

Docs should show maintained artifacts only:

- Standard document shelf
- Extra documents
- Version history and review state
- Export actions

Docs should not become a cluttered file dump.

### `/app/resources`

Resources should be the private source locker:

- Upload file
- Add web address
- Paste note/text
- See extracted text/metadata
- Toggle searchable/private context usage
- Ask Scout about selected resources
- Create a Document from selected resources

### `/app/claw`

Scout composer should support two attachment chips:

- `Using resource: March bank statement.pdf`
- `Updating document: Spending report`

The distinction should be visible. If Scout is reading a resource, it should say so. If Scout is updating a document, it should create a version.

## 4. Resource types

Start with a small set:

- `file` — PDF, image, text, markdown, HTML, CSV.
- `url` — user-saved web address with fetched snapshot where allowed.
- `note` — pasted user text or quick context.
- `official-source` — ATC/NWS/land-manager links Scout checked or the user pinned.

Later candidates:

- email/imported message
- audio/transcript
- map/location trace
- integration-backed source such as banking, Garmin, FarOut, A.T. Guide, or Google Drive

## 5. Resource data model

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
  addedBy: 'user' | 'scout' | 'system';
  createdAt: string;
  updatedAt: string;
}
```

Resource-derived document versions should record provenance:

```ts
export interface WorkspaceDocumentSourceReceipt {
  label: string;
  type: 'resource' | 'private-doc' | 'manual' | 'official-source' | 'user-confirmation' | 'scout-estimate' | 'public-corpus';
  resourceId?: string | null;
  status: 'used' | 'unchecked' | 'stale' | 'needs-confirmation';
  href?: string | null;
}
```

## 6. Guardrails

- Resources are private by default.
- Sensitive resources, especially financial/medical documents, should get an obvious `sensitive` or domain-specific label.
- Scout can read and transform resources only inside the user's workspace boundary.
- Uploaded resources are not shared, published, or promoted into collective trail intelligence.
- URL resources should store source URL, fetch time, and a snapshot/excerpt when allowed. If fetch fails, keep the URL as a pointer and say it was not checked.
- AI-created outputs from resources become Documents or Exports, not silent mutations of the original resource.
- PDFs generated from AI analysis should include a source/provenance footer when practical.

## 7. First shippable slice

1. Rename/import mental model in the UI: imported files become Resources, not Docs.
2. Add a Resources shelf/page with upload, URL, and pasted note support.
3. Let Scout attach one or more Resources to a turn.
4. Add `Create document from resources` for reports/plans/summaries.
5. Add PDF export from a generated Document/report after the user reviews it.

This keeps the core product clean: **Resources are what Scout uses; Documents are what Scout helps maintain.**
