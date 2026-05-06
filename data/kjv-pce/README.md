# KJV PCE Resource Pack

This directory stores the canonical Hogg Country King James Version Pure Cambridge Edition corpus.

Generate it with:

```bash
node scripts/build-kjv-context.js
```

The script fetches the pinned `webplantmedia/the-holy-bible` SQL dump at commit `e892b40ae90667c6680eefc5faf9520079d18261`, extracts the `cpe_bible` table, verifies 31,102 verses plus Pure Cambridge Edition spot checks, and writes deterministic outputs.

Outputs:

- `kjv-pce.json`: canonical machine-readable corpus.
- `kjv-pce.jsonl`: line-oriented search/indexing corpus.
- `kjv-pce.csv`: tabular export.
- `kjv-pce.md`: readable Markdown for resource/manual use.
- `kjv-pce.sqlite`: local lookup database with FTS table when `sqlite3` is available.

Public app copies are written to `public/kjv-pce.md`, `public/kjv-pce.jsonl`, and legacy `public/kjv-context.txt`.

Do not label another KJV source as PCE unless it passes the verification checks.
