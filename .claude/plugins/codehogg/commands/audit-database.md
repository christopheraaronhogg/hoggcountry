---
description: 🗄️ ULTRATHINK Database Review - Schema and query optimization using database-consultant
---

# ULTRATHINK: Database Assessment

ultrathink - Invoke the **database-consultant** subagent for comprehensive database evaluation.

## Output Location

**Targeted Reviews:** When a specific area is provided, save to:
`./audit-reports/{target-slug}/database-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/database-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Order tables` → `orders`
- `User authentication` → `user-auth`
- `File storage` → `file-storage`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Schema Design
- Table structure and relationships
- Normalization level appropriateness
- Foreign key usage
- Naming conventions
- Data type choices

### Query Performance
- N+1 query detection
- Complex query analysis
- Eager loading usage
- Query builder patterns

### Index Analysis
- Missing indexes
- Unused indexes
- Composite index opportunities
- Full-text search needs

### Data Integrity
- Constraint usage
- Validation at DB level
- Soft delete patterns
- Audit trail implementation

### Migration Patterns
- Migration organization
- Rollback safety
- Data migration handling
- Zero-downtime migration readiness

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-backend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Database Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal database assessment to the appropriate path with:
- **Query Performance Score (1-10)**
- **Schema Diagram** (ASCII if helpful)
- **Critical N+1 Queries**
- **Missing Index Recommendations**
- **Schema Improvement Opportunities**
- **Quick Wins**
- **Prioritized Action Items**

**Reference exact tables, columns, and queries with issues.**
