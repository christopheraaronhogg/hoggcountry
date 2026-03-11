# Trail Assistant Queue Review Helper

Last updated: 2026-03-05

## Purpose
Automate daily + weekly queue-health review so open Trail Assistant tasks don’t silently age.

Helper script:
- `scripts/trail_assistant_queue_review_helper.py`

NPM alias:
- `npm run trail-assistant:queue-review -- ...args...`

## What it does
- Reads:
  - `docs/business/trail-assistant-backlog.md`
  - `docs/business/trail-assistant-runlog.md`
- Generates a markdown queue review report with:
  - daily snapshot (active task, open/done counts, runlog entries)
  - weekly snapshot (task-level status table + last-touch timestamps)
  - stale-task flags (`stale > N days`)
  - blocker/escalation signal (`owner decision + >24h` text detection)
  - escalation recipient hint when required

Default report output:
- `docs/business/daily-updates/assets/<date>/queue-review.md`

## Common usage
```bash
npm run trail-assistant:queue-review -- --date 2026-03-05 --print-report
```

Dry run (no file write):
```bash
python3 scripts/trail_assistant_queue_review_helper.py --date 2026-03-05 --dry-run --print-report
```

## Useful options
- `--date YYYY-MM-DD` (default: today in America/Chicago)
- `--stale-days <int>` (default: `2`)
- `--output <path>`
- `--escalation-recipient <email>` (default: `christopheraaronhogg@gmail.com`)
- `--dry-run`
- `--print-report`

## Operational note
If the report flags `Owner-decision blocker over 24h detected: yes`, route escalation through the approved blocker email workflow (`trail-assistant:blocker-email`) and include Option A / Option B + default path deadline.
