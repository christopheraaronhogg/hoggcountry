# VideoHogg Self-Edit → Batch Handoff Spec (v2 intake)

Date: 2026-02-09
Owner: VideoHogg
Status: Implemented in intake + API contract (worker follow-through still required)

## 1) Context + Direction

VideoHogg is shifting from "upload clips + generic render" to a deterministic handoff flow:

1. Creator self-edits on timeline (trim/reorder/include/exclude).
2. Creator selects channel profile defaults.
3. Creator adds run-specific overrides + handoff instructions + optional thumbnail reference assets.
4. Queue worker receives a single resolved settings snapshot and returns a package:
   - final edit
   - transcript
   - 3 title options
   - 3 description options
   - chapter timestamps (when enabled)

## 2) Compatibility Guardrail

The intake API must remain compatible with existing clients. These fields are still accepted and continue to work unchanged:

- `files[]`
- `file_notes_json`
- `notes`
- `remotion_edits_json`

New fields are additive and optional.

## 3) Design-System Snapshot (VideoHogg page)

The current `/videohogg` UI language is intentionally preserved:

- **Typography:** Oswald/Anton display + readable body text, trail-journal style.
- **Palette:** paper neutrals + pine greens + marker-yellow accents.
- **Components:** bordered cards/panels with subtle gradients, rounded 10–16px radii, soft shadows.
- **Interaction:** direct, low-friction controls (chips, drag/drop, clear state, compact status surfaces).
- **Motion:** short, utilitarian transitions (100–150ms); avoid decorative over-animation.

New controls must match this visual language and not introduce unrelated design motifs.

## 4) New Intake Contract (additive)

`POST /api/v1/videohogg/runs` now accepts optional multipart fields:

- `channel_profile_json` (JSON object)
- `job_overrides_json` (JSON object)
- `thumbnail_refs_json` (JSON array metadata)
- `thumbnail_refs[]` (image files)

### 4.1 channel_profile_json

```json
{
  "id": "youtube_longform",
  "name": "YouTube Long Form",
  "defaults": {
    "output": {
      "target_platform": "youtube",
      "aspect_ratio": "16:9",
      "duration_target_minutes": 9,
      "deliverables": {
        "final_video": true,
        "transcript": true,
        "title_options": 3,
        "description_options": 3,
        "chapter_timestamps": true,
        "social_short_clip": true
      }
    },
    "handoff": {
      "mode": "self-edit-then-batch"
    }
  }
}
```

### 4.2 job_overrides_json

A sparse object containing only explicit run-level overrides.

```json
{
  "output": {
    "aspect_ratio": "9:16",
    "duration_target_minutes": 8
  },
  "handoff": {
    "instructions": "Keep intro under 10s and emphasize product closeups."
  }
}
```

### 4.3 thumbnail_refs_json + thumbnail_refs[]

`thumbnail_refs_json` maps per-file metadata by index:

```json
[
  { "index": 0, "name": "sample-1.jpg", "note": "Prefer this text hierarchy" },
  { "index": 1, "name": "sample-2.png", "note": "Use similar contrast treatment" }
]
```

`thumbnail_refs[]` contains the corresponding uploaded image files.

## 5) Deterministic Resolution Contract

Every run writes a `settings_resolution` object to `manifest.json` with strict precedence:

1. `job_overrides`
2. `channel_defaults`
3. `system_defaults`

Output includes:

- `precedence`: ordered array
- `resolved`: final merged settings object
- `sources`: flattened source map (`path -> source`) for traceability

This gives the queue worker a single canonical execution snapshot.

## 6) Manifest Additions

`manifest.json` now includes:

- `intake_contract_version`
- `channel_profile`
- `job_overrides`
- `settings_resolution`
- `remotion_edits_path` (when present)
- `remotion_edits_summary`
- `thumbnail_references` (with note + path/url)
- `thumbnail_ref_count`
- `thumbnail_ref_noted_count`

## 7) Queue Worker Expectations (next implementation stage)

Worker should consume `settings_resolution.resolved` + `manifest.files` + `remotion_edits` and produce:

- `final_video` artifact
- `transcript` artifact
- `titles` (exact count from resolved settings, default 3)
- `descriptions` (exact count from resolved settings, default 3)
- `chapter_timestamps` when enabled
- `social_short_clip` when enabled

Completion payload should store links/paths to each artifact in `run.extra.output_package`.

## 8) Acceptance Criteria

- Existing upload clients continue working (no required new fields).
- New UI supports channel profile + run overrides + thumbnail references.
- API stores remotion edits + thumbnail references + settings resolution deterministically.
- Claiming workers can read all required context from run manifest.
- Automated tests cover contract persistence for at least one run containing all new optional fields.
