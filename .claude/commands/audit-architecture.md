---
description: 🏗️ Architecture Review - Run the architect-consultant agent for system design evaluation
---

# Architecture Assessment

Run the **architect-consultant** agent for comprehensive architectural analysis.

## Target (optional)
$ARGUMENTS

## Output

**Targeted Reviews:** `./audit-reports/{target-slug}/architecture-assessment.md`
**Full Codebase:** `./audit-reports/architecture-assessment.md`

## Batch Mode

When invoked as part of `/audit-full` or `/audit-quality`, return only a brief status:

```
✓ Architecture Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary}
```
