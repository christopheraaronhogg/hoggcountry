---
description: 🔐 Security Review - Run the security-consultant agent for OWASP analysis and vulnerability assessment
---

# Security Assessment

Run the **security-consultant** agent for comprehensive security evaluation.

## Target (optional)
$ARGUMENTS

## Output

**Targeted Reviews:** `./audit-reports/{target-slug}/security-assessment.md`
**Full Codebase:** `./audit-reports/security-assessment.md`

## Batch Mode

When invoked as part of `/audit-full` or `/audit-backend`, return only a brief status:

```
✓ Security Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary}
```
