# VideoHogg Agentic Editing System (Remotion + AI)

Date: 2026-02-11
Owner: VideoHogg

## Purpose
Implement a service-style, asynchronous pipeline for user-submitted video requests where:
1) user submits assets + direction,
2) VideoHogg takes ownership (`in_hands`),
3) editing proceeds asynchronously,
4) delivery includes final package + title/description options.

This implements the Remotion-first "video as code" direction while keeping intake deterministic and testable.

---

## System Model

### Intake (Creator-facing)
- Route: `POST /api/v1/videohogg/runs`
- Inputs include clips, notes, optional Remotion edits, channel profile defaults, thumbnail refs.
- Output creates `videohogg_runs` row + manifest snapshot and returns `run_id`.

### Queue + Service Lifecycle (Operator/Worker-facing)
- Queue claim route moves queued work into processing.
- Service lifecycle statuses (separate from queue runtime status):
  - `submitted`
  - `in_hands`
  - `in_progress`
  - `packaging`
  - `delivered`
  - `revision_requested`
  - `completed`
  - `blocked`

Queue runtime status remains:
- `queued` | `processing` | `done` | `failed`

### Delivery Contract (Required)
When marked `delivered` / `completed`, system enforces package containing:
- at least 3 title options
- at least 3 description options

Optional package assets:
- final video URL/path
- short clip URL/path
- transcript URL/path

---

## Implemented API Surface

### Existing queue endpoints
- `GET /api/v1/videohogg/runs`
- `GET /api/v1/videohogg/runs/{runId}`
- `POST /api/v1/videohogg/runs/claim`
- `POST /api/v1/videohogg/runs/{runId}/heartbeat`
- `POST /api/v1/videohogg/runs/{runId}/complete`
- `POST /api/v1/videohogg/runs/{runId}/fail`

### New service endpoint
- `POST /api/v1/videohogg/runs/{runId}/service-status`
  - Updates lifecycle status with transition guards.
  - Enforces output package requirement for `delivered` / `completed`.

---

## Data Model Additions (`videohogg_runs`)

Added fields:
- `service_status`
- `service_status_changed_at`
- `service_status_note`
- `in_hands_at`
- `in_progress_at`
- `packaging_at`
- `delivered_at`
- `revision_requested_at`
- `service_completed_at`
- `blocked_at`

Also stores timeline history under `extra.service_history`.

---

## Frontend UX (VideoHogg page)

Added a "VideoHogg service lifecycle" card that:
- polls run status after submission,
- displays current service stage chip,
- shows latest note,
- shows timeline timestamps,
- renders delivery package (including title/description options) when available.

---

## Transition Rules (v1)

Allowed transitions:
- `submitted` -> `in_hands` | `blocked`
- `in_hands` -> `in_progress` | `blocked`
- `in_progress` -> `packaging` | `blocked`
- `packaging` -> `in_progress` | `delivered` | `blocked`
- `delivered` -> `revision_requested` | `completed` | `blocked`
- `revision_requested` -> `in_hands` | `in_progress` | `blocked`
- `completed` -> `revision_requested`
- `blocked` -> `in_hands` | `in_progress` | `packaging` | `delivered` | `completed`

---

## Robust Test Protocol (Replicate → Fix → Retest)

For every mismatch/fulfillment bug class:
1. Recreate deterministic fixture state in tests.
2. Assert failure mode under old behavior or invalid transition.
3. Implement fix/guard.
4. Re-run same tests and assert expected pass behavior.

Coverage added/updated:
- `backend/tests/Feature/Api/V1/VideoHoggQueueTest.php`
  - lifecycle status behavior
  - delivery package enforcement
  - completion transition path

---

## Next Stage (Worker Runtime)

To fully realize agentic editing:
- Worker consumes manifest + `settings_resolution` + `remotion_edits`.
- Worker writes `output_package` with final assets + metadata variants.
- Worker updates service status in this sequence:
  - `in_hands` -> `in_progress` -> `packaging` -> `delivered`
- Human approval action can then move `delivered` -> `completed`.

This stage can be implemented with a dedicated watcher/worker process using the existing queue endpoints.
