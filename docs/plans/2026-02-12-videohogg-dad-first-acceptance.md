# VideoHogg Dad-First Intake Acceptance Criteria (v1)

**Date:** 2026-02-12
**Scope:** `/videohogg` front-end intake and `/api/v1/videohogg` API payload contract

## Goal
Make VideoHogg the fastest path for Dad on trail while preserving enough structured
data so an editor can reliably hand off a production-ready cut.

## Baseline Assumptions
- Google auth + allowlist remains required.
- Existing contract supports: `notes`, `file_notes_json`, `channel_profile_json`,
  `job_overrides_json`, `remotion_edits_json`, `editor_brief_json`,
  `thumbnail_refs_json`, `thumbnail_refs[]`.
- File upload limit remains 120 clips and 500MB per clip (subject to PHP limits).

## Acceptance Criteria

### 1) Dad-First Experience
1. New users should be able to complete an initial run in **2 steps**:
   - Upload clips.
   - Add quick context + submit.
2. Fast mode is default and visibly simpler than Builder mode.
3. There is a single clear action that applies sensible defaults for Dad’s
   trail flow (profile, durations, and editor brief) without manual setup.
4. Advanced controls must not block submission in Fast mode.
5. Any settings changes in Fast mode are optional and clearly marked as optional.

### 2) Data Capture for Editor Quality
1. Every submitted clip has a per-clip note field, even if empty.
2. An optional editor brief is always accepted and persisted through:
   - API response
   - run manifest
   - run model metadata (`extra`)
3. Thumbnail references (when provided) are persisted with per-ref notes and
   surfaced in the manifest.
4. Remotion edits are optional and non-disruptive if skipped.
5. The manifest includes resolved settings so the editor can reproduce
   expectation on later passes.

### 3) Reliability
1. Page should work on mobile first and not require desktop-only interactions
   for submit.
2. Draft state is durable across refresh:
   - flow mode
   - brief values
   - settings and notes
3. Failed network responses should show clear actionable copy.
4. Upload completion shows concise summary for auditing after submit.

### 4) Security & Access
1. Submit endpoint still requires allowed account and valid token.
2. Sensitive tokens are never shown in query params or logs.
3. File and thumbnail uploads are validated (size/mime caps remain in place).

### 5) API Contract
1. `editor_brief_json` validates as JSON object and is ignored or rejected when
   malformed (400/422 path covered).
2. `thumbnail_refs_json` validates as JSON array matching `thumbnail_refs[]` count.
3. Response includes `editor_brief`, `settings_resolution`, thumbnail counts, and
   file summary.

### 6) Definition of Done (for this pass)
- [ ] Fast mode defaults are obvious and prefilled for Dad-first.
- [ ] Advanced mode remains available for Builder flow.
- [ ] Backend stores editor brief + thumbnail refs end-to-end.
- [ ] All changed paths covered by regression checks (build + targeted API tests).
