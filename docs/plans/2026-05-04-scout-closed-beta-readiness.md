# Scout closed-beta readiness sprint

Status: in progress  
Date: 2026-05-04

## Launch goal

A closed-beta hiker can use Scout as a private trail workspace without needing a polished public launch:

1. Sign up by direct link.
2. Ask Scout for practical trail help.
3. Add private source material as Resources.
4. Attach a Resource to Scout.
5. Turn a useful Scout reply into a reviewable Doc.
6. Re-open Docs later as maintained artifacts, not buried chat.

## Product rule

- Resources are source material: uploaded files, URLs, pasted notes, screenshots, official-source pointers, financial/medical/private context.
- Documents are maintained artifacts: plans, reports, briefs, revisions, exports.
- Scout can read Resources, cite/summarize them, and draft Documents from them. Scout should not silently rewrite uploaded originals.

## Current readiness status

### Ready enough for local beta smoke

- Direct-link beta shell remains `noindex,nofollow`.
- `/app/resources` exists for file uploads, URLs, and pasted notes.
- Resources carry type, sensitivity, status, searchability, source URI/file metadata, extracted text when available, and summary fields.
- Workspace storage migrates snapshots to version 4 with `resources` preserved.
- `/app-api/workspace/resources` supports resource creation/import with beta intake caps: max 8 files per request, max 8 MB per file, and max 80,000 pasted-note characters.
- `/app-api/workspace/resources/[resourceId]` supports deletion.
- Workspace search includes Resources alongside manual sections, Docs, tools, and corpus sources.
- Scout can open from a Resource with `resourceId` and attach it visibly as private context.
- Resource cards offer `Ask Scout` and `Draft Doc`; draft replies can be saved into Docs through the existing Scout save flow.
- `/app/docs` now treats legacy imports as legacy and points new source material to Resources.

### Still required before handing beta users a link

- Run a Forge disk sanity check before deployment.
- Deploy to Forge validation/private-beta surface only after explicit approval.
- Browser-QA on Forge with a fresh beta user:
  - signup
  - create note Resource
  - upload text Resource
  - add URL Resource
  - open Scout from Resource
  - use Draft Doc from Resource
  - save Scout reply into Docs
  - reopen saved Doc detail page
- Soak one broader free-form Scout planning prompt; if it 504s, keep beta copy narrow around Resources/Docs and constrained starters.
- Be explicit with beta users: text/markdown/HTML/CSV Resources are readable now; PDFs are metadata-only until text extraction lands, so users should paste/export text when Scout needs to analyze a PDF.

## Non-goals for this sprint

- No public `hoggcountry.com` cutover.
- No public navigation to `/signup`, `/app`, or Scout beta links.
- No Notion/Google Docs clone.
- No PDF export/editor polish until the Resource → Scout → Doc loop is verified.
