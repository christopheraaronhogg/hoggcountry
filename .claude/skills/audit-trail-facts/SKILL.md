---
name: audit-trail-facts
description: Validates AT trail facts against official sources (ATC, AWOL, NPS, ALDHA). Use when verifying mileage, landmarks, towns, or any Appalachian Trail data. Supports multi-source citation and cross-referencing.
metadata:
  author: hoggcountry
  version: "2.0"
  sources: ATC, AWOL, NPS, ALDHA, USGS
---

# Audit Trail Facts

Validates the `src/data/trail-facts.yaml` database against official sources and ensures internal consistency across the codebase.

## When to Use This Skill

- Verifying any AT mileage, elevation, or distance
- Adding new landmarks, towns, or shelters to the database
- Annual update when new AWOL guide releases
- Before any public content release
- When user questions a specific fact

## Quick Start

```bash
# Regenerate guide with current facts
npm run update-guide

# Check for hardcoded values that bypass YAML
grep -r "2,197" src/pages/ src/content/
```

## Data Architecture

```
Official Sources (ATC, AWOL, NPS, ALDHA)
         │
         ▼
┌────────────────────────────────────┐
│   src/data/trail-facts.yaml        │  ← SINGLE SOURCE OF TRUTH
│   (YAML with multi-source citations)│
└────────────────┬───────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 Parser     TypeScript    Audit
 (inject)    (code)      (validate)
```

## Verification Workflow

### Step 1: Identify Fact to Verify

Determine what type of fact needs verification:
- **Distance/Mileage** → Check ATC, AWOL, GPS data
- **Elevation** → Check USGS, ATC, hiking apps
- **Town Services** → Check AWOL, town websites, recent hiker reports
- **Statistics** → Check ATC annual reports, ALDHA surveys

### Step 2: Consult Reference Sources

See [references/SOURCES.md](references/SOURCES.md) for detailed source information:

| Source | Best For | How to Access |
|--------|----------|---------------|
| ATC | Official mileage, state data | appalachiantrail.org |
| AWOL | Detailed waypoints, services | Published guide (annual) |
| NPS | Park-specific data | nps.gov/appa |
| ALDHA | Hiker statistics | aldha.org |
| USGS | Elevation verification | nationalmap.gov |

### Step 3: Update trail-facts.yaml

Add or update with multi-source citation:

```yaml
blood_mountain:
  name: Blood Mountain
  mile: 30.7
  elevation: 4458
  state: GA
  type: summit
  citations:
    - source: AWOL
      year: 2026
      page: 14
    - source: ATC
      year: 2026
      note: "ATC Data Book confirms mileage"
    - source: USGS
      note: "Elevation from USGS topo"
```

### Step 4: Regenerate Content

```bash
npm run update-guide
```

### Step 5: Verify Propagation

Check that templates were replaced:
```bash
# Should find no unresolved templates
grep -r "{{" src/content/guide/
```

## Multi-Agent Validation

When running a full audit, spawn these agents in parallel:

### Agent 1: YAML Structure Check
```
Read src/data/trail-facts.yaml
Verify:
- Every fact has at least one citation
- Citation sources are valid (ATC|AWOL|NPS|USGS|ALDHA|MEASURED)
- Citation years are current (2024-2026)
- No duplicate landmark IDs
- Mile markers are in ascending order
```

### Agent 2: Official Source Verification
```
For priority facts, fetch from official sources:
- trail.total_miles → Check ATC website
- extremes.highest_point → Cross-ref ATC + USGS
- State boundary miles → Check ATC Data Book

Use references/SOURCES.md for URLs and methods.
Flag any discrepancies with our YAML.
```

### Agent 3: Internal Consistency
```
Check generated files match YAML:
- grep for old values (2197.9, etc.)
- grep for unresolved {{...}} templates
- Compare key values in track.astro, about.astro
```

### Agent 4: Report Generation
```
Compile findings:
- Total facts checked
- Citations validated
- Discrepancies found
- Recommended fixes
```

## Template Syntax

The parser supports these templates in MASTER_NOBO_FIELD_GUIDE.md:

| Syntax | Output | Example |
|--------|--------|---------|
| `{{trail.total_miles}}` | Raw value | 2197.4 |
| `{{trail.total_miles\|commas}}` | With commas | 2,197.4 |
| `{{trail.total_miles\|round}}` | Rounded | 2197 |
| `{{trail.total_miles\|display}}` | Display field | 2,197.4 |
| `{{trail.total_miles\|marketing}}` | Marketing field | 2,190+ |
| `{{landmarks.X.mile}}` | Landmark mile | 30.7 |
| `{{landmarks.X.elevation}}` | Elevation | 4458 |
| `{{factbox:landmarks.X}}` | Fact card | (blockquote) |
| `{{table:towns.GA}}` | Town table | (markdown table) |

## Common Tasks

### Add a New Landmark

1. Find in [references/SOURCES.md](references/SOURCES.md)
2. Add to `trail-facts.yaml` under `landmarks:`
3. Include citations from 2+ sources if possible
4. Run `npm run update-guide`

### Update for New AWOL Edition

1. Update `_meta.awol_edition` in YAML
2. Review changed values (relocations change miles)
3. Update citations to new year
4. Run full audit
5. Commit: `chore: update trail data for AWOL 2027`

### Fix a Discrepancy

1. Identify authoritative source
2. Update `trail-facts.yaml` (NEVER edit generated files)
3. Run `npm run update-guide`
4. Verify fix propagated

## Files

| Path | Purpose |
|------|---------|
| `src/data/trail-facts.yaml` | Single source of truth |
| `src/data/trailFacts.ts` | TypeScript wrapper |
| `scripts/parse-master-guide.js` | Parser with injection |
| `references/SOURCES.md` | How to query each source |
| `references/PRIORITY-FACTS.md` | Key facts to always verify |
