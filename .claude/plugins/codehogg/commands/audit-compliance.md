---
description: ⚖️ ULTRATHINK Compliance Review - GDPR, CCPA, and privacy compliance using compliance-consultant
---

# ULTRATHINK: Compliance Assessment

ultrathink - Invoke the **compliance-consultant** subagent for comprehensive privacy and regulatory compliance evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/compliance-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/compliance-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `User registration` → `user-registration`
- `Payment flow` → `payment`
- `Cookie consent` → `cookie-consent`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### GDPR Compliance (EU)
- Lawful basis for processing
- Consent mechanisms
- Data minimization
- Purpose limitation
- Storage limitation
- Data subject rights implementation

### CCPA Compliance (California)
- Right to Know mechanisms
- Right to Delete implementation
- Right to Opt-Out ("Do Not Sell")
- Non-discrimination policies
- Privacy notice requirements

### Cookie Consent Management
- Cookie categorization
- Consent before tracking
- Granular consent options
- Easy withdrawal mechanism
- Cookie banner implementation

### Privacy Policy Audit
- Data collection disclosure
- Third-party sharing disclosure
- User rights documentation
- Clear, understandable language
- Last updated date

### Data Handling Practices
- PII in logs (names, emails, IPs)
- Sensitive data in URLs
- Encryption at rest/transit
- Data retention policies
- Third-party data sharing

### Consent Implementation
- Pre-checked boxes (violation)
- Granular consent options
- Consent audit trail
- Age verification (if applicable)

### Data Subject Rights
- Access request mechanisms
- Deletion workflows
- Data portability
- Rectification capabilities

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-backend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Compliance Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal compliance assessment to the appropriate path with:
- **Compliance Score (1-10)**
- **GDPR Compliance Assessment**
- **CCPA Compliance Assessment**
- **Cookie Consent Review**
- **Privacy Policy Audit**
- **Critical Violations**
- **Risk Assessment** (legal/financial exposure)
- **Remediation Recommendations**

**Be thorough about compliance risks. Reference exact files, code patterns, and regulatory requirements.**

**Note:** This assessment provides technical compliance guidance but does not constitute legal advice. Recommend legal counsel review for complex issues.
