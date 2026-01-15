# Skill: Audit Trail Facts

**Trigger:** `/audit-trail-facts`
**Purpose:** Cross-reference and validate ALL Appalachian Trail facts across the codebase using multiple independent agents that check each other's work.

---

## Overview

This skill ensures factual accuracy across all AT-related content by using a **multi-agent cross-verification system**. No single agent can hallucinate facts because each finding must be confirmed by independent agents checking different sources.

## Architecture: 5-Agent Cross-Check System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUDIT-TRAIL-FACTS PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │  EXTRACTOR   │    │   CITATION   │    │   INTERNAL   │             │
│  │    AGENT     │    │    AGENT     │    │  VALIDATOR   │             │
│  │              │    │              │    │              │             │
│  │ Scans code   │    │ Fetches from │    │ Compares our │             │
│  │ for all AT   │    │ ATC, AWOL,   │    │ files against│             │
│  │ claims       │    │ NPS sources  │    │ trailData.ts │             │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘             │
│         │                   │                   │                      │
│         └─────────┬─────────┴─────────┬─────────┘                      │
│                   ▼                   ▼                                │
│         ┌──────────────────────────────────────┐                       │
│         │         RECONCILER AGENT              │                       │
│         │                                       │                       │
│         │  Compares all 3 agent outputs        │                       │
│         │  Flags discrepancies                 │                       │
│         │  Requires 2/3 agreement minimum      │                       │
│         └──────────────────┬───────────────────┘                       │
│                            ▼                                           │
│         ┌──────────────────────────────────────┐                       │
│         │         REPORTER AGENT                │                       │
│         │                                       │                       │
│         │  Generates actionable report         │                       │
│         │  Cites sources with file:line        │                       │
│         │  Prioritizes fixes by severity       │                       │
│         └──────────────────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Execution Steps

### Phase 1: Extract All Claims (Extractor Agent)

Launch agent to scan the ENTIRE codebase for AT-related facts:

```
Search for:
- Mile markers (regex: \d{1,4}\.?\d* miles?)
- Elevation values (regex: \d{3,5}\s*(ft|feet|'))
- Town names with distances
- Shelter names
- State boundaries
- Dates and statistics
- Any "2,19" or "2,20" patterns (trail length)

Files to scan:
- src/**/*.{ts,tsx,astro,svelte,md}
- MASTER_NOBO_FIELD_GUIDE.md
- trailhogg/**/*.ts
- public/**/*.json

Output: JSON array of claims with file:line citations
```

### Phase 2: Fetch Official Sources (Citation Agent)

Launch SEPARATE agent to fetch authoritative data:

```
Sources to check (in priority order):
1. AWOL 2026 guide data (if available via API/PDF)
2. ATC official mileage: https://appalachiantrail.org
3. NPS trail data: https://www.nps.gov/appa
4. Guthook/FarOut crowdsourced data

Output: JSON with official values and source URLs
```

### Phase 3: Internal Consistency Check (Internal Validator Agent)

Launch SEPARATE agent to compare internal sources:

```
Compare:
- src/data/trailData.ts (canonical source)
- MASTER_NOBO_FIELD_GUIDE.md
- src/pages/track.astro
- src/pages/about.astro
- src/pages/guide/index.astro
- trailhogg/trailhogg/shared/src/trailData.ts (game data)

Check for:
- Same landmark = same mile marker everywhere
- Same town = same services listed
- Total trail length consistent
- State boundary miles match

Output: List of internal inconsistencies with file:line
```

### Phase 4: Reconcile Findings (Reconciler Agent)

Launch agent with outputs from ALL THREE previous agents:

```
Rules:
- If 3/3 agents agree: VERIFIED
- If 2/3 agents agree: LIKELY CORRECT (flag minority for review)
- If all disagree: REQUIRES MANUAL VERIFICATION

Flag:
- Values that differ by >0.5 miles
- Elevation differences >50 feet
- Missing landmarks in any source
- Contradictory services (e.g., "has hostel" vs "no hostel")
```

### Phase 5: Generate Report (Reporter Agent)

Final agent produces actionable output:

```markdown
# Trail Facts Audit Report
Generated: {timestamp}
Canonical Source: src/data/trailData.ts
AWOL Edition Verified: 2026

## Summary
- Total claims scanned: X
- Verified correct: X
- Discrepancies found: X
- Requires manual review: X

## Critical Issues (Fix Immediately)
| Claim | Location | Our Value | Official Value | Source |
|-------|----------|-----------|----------------|--------|
| Total miles | about.astro:21 | 2197.9 | 2197.4 | AWOL 2026 |

## Warnings (Review Soon)
...

## Internal Inconsistencies
| Fact | File A | File B | Values |
|------|--------|--------|--------|
...

## Recommendations
1. Update src/data/trailData.ts with corrected values
2. Run update script to propagate changes
3. Schedule next audit for {date}
```

---

## How to Run

When user invokes `/audit-trail-facts`, execute this sequence:

```typescript
// 1. Launch 3 agents IN PARALLEL (they don't depend on each other)
const [extractorResult, citationResult, validatorResult] = await Promise.all([
  Task({ subagent_type: 'Explore', prompt: EXTRACTOR_PROMPT }),
  Task({ subagent_type: 'Explore', prompt: CITATION_PROMPT }),
  Task({ subagent_type: 'Explore', prompt: VALIDATOR_PROMPT })
]);

// 2. Launch reconciler with all 3 outputs
const reconciled = await Task({
  subagent_type: 'general-purpose',
  prompt: `Given these three independent audits, reconcile findings...\n${extractorResult}\n${citationResult}\n${validatorResult}`
});

// 3. Generate final report
const report = await Task({
  subagent_type: 'general-purpose',
  prompt: `Generate audit report from reconciled findings:\n${reconciled}`
});

// 4. Write report to AUDIT_REPORT.md
Write({ file_path: 'AUDIT_REPORT.md', content: report });
```

---

## Agent Prompts

### Extractor Agent Prompt
```
You are scanning the hoggcountry codebase for ALL Appalachian Trail factual claims.

Search these file patterns:
- src/**/*.{ts,astro,svelte}
- **/*.md
- trailhogg/**/*.ts

Extract every instance of:
1. Mile markers (e.g., "mile 31.7", "2,197.4 miles", "at mi 100")
2. Elevations (e.g., "6,643 feet", "4458'", "elevation 3,782")
3. Town/landmark names with any associated data
4. State boundaries or state-specific claims
5. Statistics (completion rate, shelter count, etc.)

Output format (JSON):
{
  "claims": [
    {
      "type": "distance|elevation|landmark|statistic",
      "value": "the exact value found",
      "context": "surrounding text for clarity",
      "file": "path/to/file.ts",
      "line": 123
    }
  ]
}

Do NOT verify claims - just extract them. Another agent will verify.
```

### Citation Agent Prompt
```
You are fetching OFFICIAL Appalachian Trail data from authoritative sources.

Primary source: AWOL on the Appalachian Trail 2026 edition
Secondary: ATC (appalachiantrail.org), NPS (nps.gov/appa)

Fetch and compile:
1. Official total trail length (NOBO)
2. Approach trail length
3. State boundary mile markers
4. Major landmark mile markers
5. Highest/lowest points
6. Shelter count
7. Completion statistics

For each fact, provide:
- The official value
- The source (URL or publication)
- Date verified

Output format (JSON):
{
  "officialFacts": [
    {
      "fact": "total_trail_length",
      "value": 2197.4,
      "unit": "miles",
      "source": "AWOL 2026, page 1",
      "url": "https://...",
      "verified": "2026-01-14"
    }
  ]
}

If you cannot verify from official sources, say "UNVERIFIED" - do not guess.
```

### Validator Agent Prompt
```
You are checking INTERNAL CONSISTENCY across hoggcountry files.

Read these files and compare all AT facts between them:
1. src/data/trailData.ts (CANONICAL - this is our source of truth)
2. MASTER_NOBO_FIELD_GUIDE.md
3. src/pages/track.astro
4. src/pages/about.astro
5. src/pages/guide/index.astro
6. trailhogg/trailhogg/shared/src/trailData.ts

For each fact that appears in multiple files:
- Note if values match exactly
- Flag any differences with both values
- Note which file should be considered authoritative

Output format (JSON):
{
  "comparisons": [
    {
      "fact": "total_trail_length",
      "canonical": { "value": 2197.4, "file": "src/data/trailData.ts", "line": 45 },
      "occurrences": [
        { "value": 2197.9, "file": "track.astro", "line": 9, "matches": false },
        { "value": 2197.4, "file": "about.astro", "line": 21, "matches": true }
      ],
      "status": "INCONSISTENT"
    }
  ]
}
```

---

## Key Files

| File | Role |
|------|------|
| `src/data/trailData.ts` | **CANONICAL SOURCE** - All facts with citations |
| `MASTER_NOBO_FIELD_GUIDE.md` | Field guide prose - should match canonical |
| `trailhogg/**/trailData.ts` | Game data - should match canonical |
| `AUDIT_REPORT.md` | Generated report (gitignored) |

---

## Maintenance

- **Run annually** when new AWOL guide releases (typically January)
- **Run after** any major content updates
- **Run before** any public release or announcement

## Why Multiple Agents?

A single agent could:
- Misread a value and "verify" it against the same mistake
- Hallucinate an "official source" that doesn't exist
- Miss inconsistencies between files

With 3+ independent agents:
- Each agent works from different starting points
- Disagreements force manual review
- No single point of hallucination failure
