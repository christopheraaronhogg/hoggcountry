---
description: 🎨 UI Design Review - Run the ui-design-consultant agent for visual design audit and AI slop detection
---

# UI Design Assessment

Run the **ui-design-consultant** agent for comprehensive visual design evaluation with AI slop detection.

## Target (optional)
$ARGUMENTS

## Output

**Targeted Reviews:** `./audit-reports/{target-slug}/ui-design-assessment.md`
**Full Codebase:** `./audit-reports/ui-design-assessment.md`

## Batch Mode

When invoked as part of `/audit-full` or `/audit-frontend`, return only a brief status:

```
✓ UI Design Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary}
```
