# Trail Assistant Runlog Autopdater Helper

Last updated: 2026-03-04

## Purpose
Keep `docs/business/trail-assistant-runlog.md` current with consistent timestamped entries and less manual markdown editing.

Helper script:
- `scripts/trail_assistant_runlog_autoupdater.py`

NPM alias:
- `npm run trail-assistant:runlog-autoupdate -- ...args...`

## What it does
- Appends a structured runlog entry with:
  - timestamp
  - task worked
  - what changed bullets
  - optional validation bullets
  - optional safety impact line
  - next step
  - blocker status
- Auto-creates `## YYYY-MM-DD` section when missing.
- Uses America/Chicago timezone by default.

## Required arguments
- `--task`
- `--change` (repeatable; at least one)
- `--next-step`
- `--blocker-status`

Optional:
- `--validation` (repeatable)
- `--safety-impact`
- `--timestamp`
- `--dry-run`
- `--print-entry`
- `--runlog <path>`

## Example
```bash
npm run trail-assistant:runlog-autoupdate -- \
  --task "P0.3 — Daily runlog autopdater helper" \
  --change "Added structured runlog append helper with date-section auto-create." \
  --change "Added npm alias for repeatable cron use." \
  --validation "python3 scripts/trail_assistant_runlog_autoupdater.py --help" \
  --next-step "Execute P0.4 daily/weekly queue review automation." \
  --blocker-status "P0.7 deploy drift remains blocked on owner deploy-surface decision."
```

## Dry-run preview
```bash
python3 scripts/trail_assistant_runlog_autoupdater.py \
  --task "Example" \
  --change "Example change" \
  --next-step "Example next" \
  --blocker-status "None" \
  --dry-run
```

`--dry-run` prints the generated entry without writing the runlog file.
