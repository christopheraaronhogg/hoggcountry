---
description: 🔐 ULTRATHINK Security Review - Exhaustive security audit using security-consultant
---

# ULTRATHINK: Security Assessment

ultrathink - Invoke the **security-consultant** subagent for comprehensive security evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/security-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/security-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Authentication flow` → `authentication`
- `Payment processing` → `payment`
- `Admin Dashboard` → `admin-dashboard`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### OWASP Top 10
- Injection vulnerabilities (SQL, XSS, Command)
- Broken authentication
- Sensitive data exposure
- XML External Entities
- Broken access control
- Security misconfiguration
- Cross-Site Scripting
- Insecure deserialization
- Known vulnerable components
- Insufficient logging

### Authentication & Authorization
- Auth flow security
- Session management
- Password policies
- MFA implementation
- Role-based access control

### Data Protection
- Encryption at rest
- Encryption in transit
- PII handling
- Data sanitization
- Secure deletion

### Input Validation
- User input sanitization
- File upload security
- API input validation
- CSRF protection

### Dependencies
- Known vulnerabilities
- Outdated packages
- Supply chain risks

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-backend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Security Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal security assessment to the appropriate path with:
- **Security Score (1-10)**
- **Critical Vulnerabilities (CVSS 7+)**
- **High Priority Issues**
- **Medium/Low Issues**
- **Compliance Gaps** (GDPR, PCI, etc.)
- **Remediation Roadmap**
- **Quick Security Wins**

**Be thorough about security risks. Reference exact files and vulnerable code patterns.**
