# AWOL water sources (private workspace)

This folder is for **local-only** AWOL-derived data (PDF + extracted tables). It is set up so the sensitive files stay out of git.

## What goes here

- `AT-Guide-2026.pdf` (or similar) — your purchased AWOL / A.T. Guide PDF
- `awol-water-sources.csv` — hand-entered water sources (copy from the template)
- `awol-water-sources.json` — generated from the CSV (for scripts/tools)
- `awol-water-sources.md` — generated “easy to browse” reference

## Workflow

0) Put your purchased PDF here (gitignored):

- `private/awol/AT-Guide-2026.pdf`

1) Generate the water dataset + reference in one shot:

`npm run awol:build-water`

2) (Optional) Extract PDF text (sometimes useful for copy/paste):

`npm run awol:pdf-to-text`

3) (Alternative) If you want to hand-enter or fix entries, start from the template:

- From: `private/awol/awol-water-sources.template.csv`
- To: `private/awol/awol-water-sources.csv`

4) Fill out `awol-water-sources.csv` with rows like:

- `mile` (number, AWOL mile)
- `name` (string)
- `type` (`spring|stream|river|piped|town|unknown`)
- `offTrail` (miles off trail, numeric; use `0` if on trail)

Tip: if you’re copying messy text, create `private/awol/awol-water-sources.raw.txt` and run:

`npm run awol:raw-to-csv`

5) Generate JSON:

`npm run import:awol-water`

6) Generate the “single-file” reference:

`npm run ref:awol-water`

7) (Optional) Compare coverage vs the public site dataset:

`npm run compare:water`

This folder is gitignored-by-default via `private/awol/.gitignore` (only this README + the template are tracked).
