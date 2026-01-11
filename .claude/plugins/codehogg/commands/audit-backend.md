---
description: ⚙️ ULTRATHINK Backend Audit - Backend, Database, Stack, Security, Compliance (5 consultants in parallel)
---

# Backend Audit Bundle

Run 5 backend-focused consultants in parallel for comprehensive server-side quality assessment.

## Included Consultants

| Consultant | Focus |
|------------|-------|
| **backend-consultant** | API design, services, data access |
| **database-consultant** | Schema, queries, indexes, N+1 |
| **stack-consultant** | Framework best practices (live research) |
| **security-consultant** | OWASP, vulnerabilities, auth |
| **compliance-consultant** | GDPR, CCPA, privacy, data handling |

## When to Use

- Pre-launch backend security check
- After major API changes
- Database optimization review
- Laravel upgrade preparation
- Security audit

## Output Location

**Targeted Reviews:** When a specific feature/module is provided, save to:
`./audit-reports/{target-slug}/`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/backend-audit-{timestamp}/`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Authentication flow` → `authentication`
- `Order processing` → `order-processing`
- `File uploads` → `file-uploads`

## Target
$ARGUMENTS

## Execution Protocol

### Step 1: Create Report Directory
```bash
# For targeted:
mkdir -p audit-reports/{target-slug}

# For full:
mkdir -p audit-reports/backend-audit-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
```
backend-consultant → writes to {dir}/backend-assessment.md
database-consultant → writes to {dir}/database-assessment.md
stack-consultant → writes to {dir}/stack-assessment.md
security-consultant → writes to {dir}/security-assessment.md
compliance-consultant → writes to {dir}/compliance-assessment.md
```

### Step 3: Wait and Compile
After all 5 complete, create:
- `00-backend-summary.md` - Combined backend findings

## Minimal Return Pattern

**CRITICAL:** Each consultant must:
1. Write full report directly to their designated file
2. Return ONLY a brief status:

```
✓ Complete. Saved to {filepath}
  Critical: X | High: Y | Medium: Z
  Key: {one-line summary}
```

## Output Structure

```
audit-reports/{dir}/
├── 00-backend-summary.md        # Combined findings
├── backend-assessment.md
├── database-assessment.md
├── stack-assessment.md
├── security-assessment.md
└── compliance-assessment.md
```

## Backend Summary Format

The `00-backend-summary.md` should include:

1. **Backend Quality Score** (1-10)
2. **Security Score** (1-10)
3. **API Design Score** (1-10)
4. **Critical Vulnerabilities** (CVSS 7+)
5. **N+1 Query Count**
6. **Missing Indexes**
7. **Framework Anti-Patterns**
8. **Compliance Gaps**
9. **Top 5 Backend Actions**

## Related Commands

- `/audit-api` - API and services only
- `/audit-database` - Schema and queries only
- `/audit-stack` - Framework best practices with live research
- `/audit-security` - Full security audit
- `/audit-compliance` - GDPR, CCPA, privacy only
- `/audit-quick` - Adds architecture, performance, UI/UX
