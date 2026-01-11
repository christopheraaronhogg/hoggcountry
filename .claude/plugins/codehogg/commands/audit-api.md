---
description: ⚙️ ULTRATHINK API/Backend Review - Deep backend systems analysis using backend-consultant
---

# ULTRATHINK: Backend Assessment

ultrathink - Invoke the **backend-consultant** subagent for comprehensive backend systems evaluation.

## Output Location

**Targeted Reviews:** When a specific feature/module is provided, save to:
`./audit-reports/{target-slug}/backend-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/backend-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Order processing` → `order-processing`
- `API endpoints` → `api-endpoints`
- `Authentication` → `authentication`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### API Design
- RESTful conventions
- Endpoint organization
- Request/response patterns
- Error handling consistency
- Versioning strategy

### Service Architecture
- Controller organization
- Service layer patterns
- Repository patterns
- Middleware usage

### Data Access
- ORM usage patterns
- Query optimization
- N+1 query detection
- Transaction management

### Error Handling
- Exception handling strategy
- Error response consistency
- Logging implementation
- Monitoring integration

### Security Implementation
- Authentication flow
- Authorization patterns
- Input validation
- CSRF/XSS protection

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-backend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Backend Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal backend assessment to the appropriate path with:
- **API Quality Score (1-10)**
- **Critical Issues**
- **Performance Concerns**
- **Security Gaps**
- **Quick Wins**
- **Prioritized Recommendations**

**Reference exact files, classes, and methods with issues.**
