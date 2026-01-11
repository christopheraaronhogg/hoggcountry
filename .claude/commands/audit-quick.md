---
description: ⚡ Quick Audit - Run 7 key consultant agents in 2 waves for fast comprehensive overview
---

# Quick Audit (7 Agents)

Run the 7 most critical consultant agents in **2 waves** for a fast but comprehensive overview.

## Agents

| Agent | Focus |
|-------|-------|
| architect-consultant | System structure, modularity |
| security-consultant | OWASP, vulnerabilities |
| performance-consultant | Bottlenecks, optimization |
| code-quality-consultant | Tech debt, maintainability |
| ui-design-consultant | Visual design, AI slop |
| ux-consultant | Usability, accessibility |
| copy-consultant | Voice, content quality |

## Execution

### Wave 1: Core (4 agents in parallel)
- architect-consultant
- security-consultant
- performance-consultant
- code-quality-consultant

**Wait for Wave 1 to complete.**

### Wave 2: User-Facing (3 agents in parallel)
- ui-design-consultant
- ux-consultant
- copy-consultant

**Wait for Wave 2 to complete.**

### Compile Summary
Read all 7 reports and create:
- `00-quick-summary.md`
- `00-priority-actions.md`

## Output Structure

```
audit-reports/{timestamp}/
├── 00-quick-summary.md
├── 00-priority-actions.md
├── 01-architecture-assessment.md
├── 02-code-quality-assessment.md
├── 05-security-assessment.md
├── 09-ux-assessment.md
├── 14-ui-design-assessment.md
├── 15-copy-assessment.md
└── 16-performance-assessment.md
```

## Minimal Return Pattern

Each agent writes full report to file, returns only:

```
✓ {Domain} Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary}
```
