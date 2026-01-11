---
description: 🎯 UX Review - Run the ux-consultant agent for usability and accessibility analysis
---

# UX Assessment

Run the **ux-consultant** agent for comprehensive usability and accessibility evaluation.

## Target (optional)
$ARGUMENTS

## Output

**Targeted Reviews:** `./audit-reports/{target-slug}/ux-assessment.md`
**Full Codebase:** `./audit-reports/ux-assessment.md`

## Batch Mode

When invoked as part of `/audit-full` or `/audit-frontend`, return only a brief status:

```
✓ UX Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary}
```
