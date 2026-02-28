# Trail Assistant Daily One-Sheet Reports

This folder holds a daily single-page HTML status brief for Trail Assistant development.

## Outputs

- `YYYY-MM-DD.html` — dated one-sheet report
- `latest.html` — always points to the newest generated report
- `assets/YYYY-MM-DD/*` — screenshots used by the report

## Generate manually

From repo root:

```bash
scripts/trail_assistant_daily_one_sheet.sh
```

Or for a specific date:

```bash
scripts/trail_assistant_daily_one_sheet.sh 2026-02-28
```

## Data sources

- `docs/business/trail-assistant-runlog.md`
- `docs/business/trail-assistant-backlog.md`
- git commits for the report date
- live screenshots from:
  - `https://hoggcountry.on-forge.com/`
  - `https://hoggcountry.on-forge.com/trail-assistant`

## Notes

- Screenshot capture is best-effort; report generation still succeeds if capture fails.
- If you want custom screenshots, add them to `assets/YYYY-MM-DD/` and regenerate.
