# Skill: Audit Trail Facts

**Trigger:** `/audit-trail-facts`
**Purpose:** Validate the trail-facts.yaml database against official sources and ensure internal consistency.

---

## Overview

This skill validates the **single source of truth** (`src/data/trail-facts.yaml`) against official AT sources and verifies that all generated content uses the correct values.

## Data Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRAIL DATA FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Official Sources (AWOL, ATC, NPS)                                     │
│          │                                                              │
│          ▼                                                              │
│  ┌────────────────────────────────────┐                                │
│  │   src/data/trail-facts.yaml        │  ◄── SINGLE SOURCE OF TRUTH   │
│  │   (YAML, cited, human-editable)    │                                │
│  └────────────────┬───────────────────┘                                │
│                   │                                                     │
│    ┌──────────────┼──────────────┬───────────────┐                     │
│    │              │              │               │                      │
│    ▼              ▼              ▼               ▼                      │
│ ┌──────┐    ┌──────────┐   ┌─────────┐    ┌──────────┐                │
│ │Parser│    │TypeScript│   │ Website │    │ TrailHogg│                │
│ │      │    │ Wrapper  │   │  Pages  │    │   Game   │                │
│ │  ↓   │    │          │   │         │    │          │                │
│ │Guide │    │trailFacts│   │ Import  │    │ Import   │                │
│ │Chaps │    │   .ts    │   │ values  │    │ values   │                │
│ └──────┘    └──────────┘   └─────────┘    └──────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## What Gets Validated

### 1. Citation Completeness
Every fact in trail-facts.yaml must have:
```yaml
citation:
  source: AWOL | ATC | NPS | USFS | ALDHA | MEASURED
  year: 2026
  page: 12  # optional
  note: "Additional context"  # optional
```

### 2. Official Source Cross-Check
Compare our values against authoritative sources:
- **AWOL 2026** - Primary source for mileage, towns, services
- **ATC** - Trail length, statistics, state boundaries
- **NPS** - Official park service data

### 3. Internal Consistency
Ensure values propagate correctly:
- Generated guide chapters have correct values
- No hardcoded values that bypass the YAML
- All `{{...}}` templates resolved

---

## Multi-Agent Validation Pipeline

### Agent 1: YAML Structure Validator
```
Task: Validate trail-facts.yaml structure and citations

Check:
- Every fact object has a citation block
- Citation sources are valid enum values
- Citation years are current (2024-2026)
- Required fields present (value, citation)
- Numeric values are reasonable ranges
- No duplicate entries

Output: List of structural issues
```

### Agent 2: Official Source Checker
```
Task: Cross-reference key facts against official sources

Priority facts to verify:
1. trail.total_miles (2197.4)
2. trail.approach_trail_miles (8.8)
3. extremes.highest_point.elevation (6643)
4. extremes.lowest_point.elevation (124)
5. State boundary miles
6. Major landmark mile markers

Sources:
- appalachiantrail.org
- AWOL 2026 guide
- nps.gov/appa

Output: Discrepancies with official sources
```

### Agent 3: Generated Content Checker
```
Task: Verify generated files match YAML source

Files to check:
- src/content/guide/00-introduction.md
- src/content/guide/*.md (all chapters)
- Check for any remaining "2,197.9" (old value)
- Check for unresolved {{...}} templates

Output: Internal inconsistencies with file:line
```

### Agent 4: Report Generator
```
Task: Compile actionable audit report

# Trail Facts Audit Report
Generated: {timestamp}
Source: src/data/trail-facts.yaml
AWOL Edition: 2026

## Summary
- Total facts in YAML: X
- Citations valid: X/X
- Official source matches: X/X
- Internal consistency: X/X

## Issues Found
### Critical (Fix Now)
- [file:line] Description

### Warnings (Review)
- [file:line] Description

## Recommendations
1. ...
```

---

## Template Syntax Reference

The master guide uses these templates (replaced by parse-master-guide.js):

### Simple Values
```markdown
The trail is {{trail.total_miles}} miles long.
→ The trail is 2197.4 miles long.
```

### Formatted Values
```markdown
{{trail.total_miles|commas}} → 2,197.4
{{trail.total_miles|round}}  → 2197
{{trail.total_miles|display}} → 2,197.4 (uses .display field)
{{trail.total_miles|marketing}} → 2,190+ (uses .marketing field)
```

### Landmark Access
```markdown
{{landmarks.blood_mountain.elevation}} → 4458
{{landmarks.blood_mountain.mile}} → 30.7
```

### Fact Boxes
```markdown
{{factbox:landmarks.blood_mountain}}

→ > **📍 Blood Mountain**
  > Mile 30.7 | Elevation 4,458 ft | GA
  > *Highest point in Georgia on AT*
  > <small>Source: AWOL 2026</small>
```

### Town Tables
```markdown
{{table:towns.GA}}

→ | Town | Mile | From Trail | Grocery | Outfitter | Hostel | PO |
  |------|------|------------|---------|-----------|--------|-----|
  | Mountain Crossings | 31.7 | On trail | ✓ | ✓ | ✓ | — |
```

---

## How to Run

### Quick Validation
```bash
# Just run the parser to see fact loading
npm run update-guide
```

### Full Audit
```
/audit-trail-facts
```

This launches the multi-agent pipeline to:
1. Validate YAML structure
2. Check against official sources
3. Verify generated content
4. Generate report

---

## Maintenance Workflow

### Annual Update (New AWOL Release)
1. Get new AWOL guide (typically January)
2. Update `trail-facts.yaml`:
   - Change `_meta.awol_edition`
   - Update `_meta.last_verified`
   - Review and update any changed values
3. Run `/audit-trail-facts`
4. Run `npm run update-guide`
5. Run `npm run build` to verify
6. Commit: `chore: update trail data for AWOL 2027`

### Adding New Data
1. Add to appropriate section in `trail-facts.yaml`
2. Include full citation
3. Use in master guide with `{{path.to.value}}`
4. Run `npm run update-guide`
5. Verify in generated output

### Fixing Discrepancies
1. Run `/audit-trail-facts` to identify issues
2. Fix in `trail-facts.yaml` (NEVER edit generated files)
3. Run `npm run update-guide` to regenerate
4. Verify fix with another audit

---

## Key Files

| File | Role |
|------|------|
| `src/data/trail-facts.yaml` | **SINGLE SOURCE OF TRUTH** |
| `src/data/trailFacts.ts` | TypeScript wrapper for code access |
| `scripts/parse-master-guide.js` | Parser with fact injection |
| `MASTER_NOBO_FIELD_GUIDE.md` | Prose with `{{...}}` templates |
| `src/content/guide/*.md` | Generated (auto-overwritten) |

---

## Why This Architecture?

### Before
- Facts scattered across 10+ files
- No citations - unverifiable
- Easy to introduce drift (2,197.9 vs 2,197.4)
- Hard for AI to help maintain

### After
- **One YAML file** contains all facts
- **Every fact cited** - fully verifiable
- **Parser injects** facts at build time
- **Audit skill** catches drift automatically
- **AI can easily** add/update/verify data

### The Key Insight
By separating **DATA** (YAML) from **PROSE** (master guide), we can:
- Focus fact-checking on structured data only
- Let AI help maintain the database
- Keep prose natural and readable
- Automatically propagate updates everywhere
