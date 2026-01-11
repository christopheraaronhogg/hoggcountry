---
description: ⚡ ULTRATHINK Quick Audit - 7 critical assessments in 2 waves (4+3) for fast comprehensive overview
---

# Quick Audit (Batched)

Run the 7 most critical consultant analyses in **2 waves (4+3)** for a fast but comprehensive overview using ULTRATHINK deep reasoning.

## Why Batched?

Even 7 parallel consultants can strain context limits. Running in 2 smaller waves (4 then 3) keeps things manageable while still being fast.

## The Essential 7

| Consultant | Why Essential |
|------------|---------------|
| **architect-consultant** | Foundation - structure affects everything |
| **security-consultant** | Critical - vulnerabilities can't wait |
| **performance-consultant** | User-facing - affects experience |
| **code-quality-consultant** | Maintainability - affects velocity |
| **ui-design-consultant** | Visual polish - first impression |
| **ux-consultant** | Usability - user success |
| **copy-consultant** | Content - communication quality |

## Wave Structure

### Wave 1: Core (4 consultants)
| Consultant | Focus |
|------------|-------|
| architect-consultant | System structure |
| security-consultant | Vulnerabilities |
| performance-consultant | Bottlenecks |
| code-quality-consultant | Tech debt |

### Wave 2: User-Facing (3 consultants)
| Consultant | Focus |
|------------|-------|
| ui-design-consultant | Visual design |
| ux-consultant | Usability |
| copy-consultant | Content quality |

## When to Use

- Need faster results than full audit
- Regular check-in on codebase health
- Pre-launch sanity check
- When the 8 other domains are less relevant

## Execution Protocol

### Step 1: Create Report Directory
```bash
mkdir -p audit-reports/$(date +%Y%m%d-%H%M%S)
```

### Step 2: Wave 1 - Core
Launch 4 consultants in parallel with `run_in_background: true`:
```
architect-consultant → writes to {dir}/01-architecture-assessment.md
security-consultant → writes to {dir}/14-security-assessment.md
performance-consultant → writes to {dir}/11-performance-assessment.md
code-quality-consultant → writes to {dir}/03-code-quality-assessment.md
```

**Wait for all 4 to complete before proceeding.**

### Step 3: Wave 2 - User-Facing
Launch 3 consultants:
```
ui-design-consultant → writes to {dir}/15-ui-design-assessment.md
ux-consultant → writes to {dir}/09-ux-assessment.md
copy-consultant → writes to {dir}/04-copy-assessment.md
```

**Wait for all 3 to complete.**

### Step 4: Compile Quick Summary
Read all 7 report files and create:
- `00-quick-summary.md` - Combined findings
- `00-priority-actions.md` - Top recommendations

## Minimal Return Pattern

**CRITICAL:** Each consultant must:
1. Write full report directly to their designated file
2. Return ONLY a brief status (not the full report):

```
✓ Complete. Saved to {filepath}
  Critical: X | High: Y | Medium: Z
  Key: {one-line summary of top finding}
```

## Output Structure

```
audit-reports/{timestamp}/
├── 00-quick-summary.md          # Combined findings
├── 00-priority-actions.md       # Top recommendations
├── 01-architecture-assessment.md
├── 03-code-quality-assessment.md
├── 04-copy-assessment.md
├── 09-ux-assessment.md
├── 11-performance-assessment.md
├── 14-security-assessment.md
└── 15-ui-design-assessment.md
```

## Quick Summary Format

The `00-quick-summary.md` should be concise:

1. **Health Score** (1-10 overall)
2. **Critical Blockers** (stop-ship issues)
3. **High Priority Fixes** (fix this week)
4. **Key Strengths** (what's working)
5. **Top 5 Actions** (most impactful)

## Domains NOT Included

The following are skipped in quick audit:
- Backend (covered partially by architecture)
- Database (specialized)
- DevOps (operational)
- Documentation (support)
- Laravel (framework-specific)
- QA (testing)
- Requirements (product)
- Cost (operational)

## Alternative Commands

- `/audit-full` - All 15 consultants in 3 waves
- `/audit-frontend` - UI, UX, Copy, Performance
- `/audit-backend` - Backend, Database, Laravel, Security
- `/audit-custom` - Pick your own domains
