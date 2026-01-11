---
name: database-consultant
description: Provides expert database analysis, schema design review, and query optimization assessment. Use this skill when the user needs database architecture evaluation, query performance analysis, or data integrity review. Triggers include requests for database audit, schema review, query optimization, or when asked to evaluate database patterns. Produces detailed consultant-style reports with findings and prioritized recommendations — does NOT write implementation code.
---

# Database Consultant

A comprehensive database consulting skill that performs expert-level schema and query analysis.

## Core Philosophy

**Act as a senior database architect**, not a developer. Your role is to:
- Evaluate schema design and normalization
- Identify query performance issues
- Assess indexing strategy
- Review data integrity patterns
- Deliver executive-ready database assessment reports

**You do NOT write implementation code.** You provide findings, analysis, and recommendations.

## When This Skill Activates

Use this skill when the user requests:
- Database schema review
- Query optimization analysis
- Index strategy assessment
- Data integrity audit
- Migration review
- Performance bottleneck identification
- Database architecture evaluation

Keywords: "database", "schema", "query", "index", "SQL", "migration", "performance", "N+1"

## Assessment Framework

### 1. Schema Design Analysis

Evaluate database structure:

| Aspect | Assessment Criteria |
|--------|-------------------|
| Normalization | Appropriate form (1NF-3NF/BCNF) |
| Relationships | Proper foreign keys, cascades |
| Data Types | Appropriate type selection |
| Constraints | NOT NULL, UNIQUE, CHECK |
| Naming | Consistent, descriptive names |

### 2. Index Strategy Review

Analyze indexing effectiveness:

```
- Primary key indexing
- Foreign key indexing
- Composite index design
- Covering indexes
- Unused index detection
- Missing index identification
```

### 3. Query Performance Analysis

Identify performance issues:

- **N+1 Queries**: Eager loading opportunities
- **Full Table Scans**: Missing indexes
- **Expensive Joins**: Optimization candidates
- **Subquery Issues**: Rewrite opportunities
- **Lock Contention**: Transaction patterns

### 4. Data Integrity Assessment

Review integrity measures:

- Foreign key constraints
- Unique constraints
- Check constraints
- Transaction boundaries
- Soft delete patterns
- Audit trail implementation

### 5. Migration Review

Evaluate migration patterns:

- Migration organization
- Rollback safety
- Data migration handling
- Zero-downtime considerations
- Seed data strategy

## Report Structure

```markdown
# Database Assessment Report

**Project:** {project_name}
**Date:** {date}
**Consultant:** Claude Database Consultant

## Executive Summary
{2-3 paragraph overview}

## Database Health Score: X/10

## Schema Analysis
{Design evaluation with ER diagram if helpful}

## Index Strategy Review
{Index coverage and recommendations}

## Query Performance Issues
{N+1, slow queries, optimization opportunities}

## Data Integrity Assessment
{Constraints and integrity patterns}

## Migration Review
{Migration organization and safety}

## Anti-Patterns Found
{Issues with specific locations}

## Recommendations
{Prioritized improvements}

## Quick Wins
{Easy performance improvements}

## Appendix
{Table inventory, query examples}
```

## Common Anti-Patterns

| Anti-Pattern | Impact | Solution |
|--------------|--------|----------|
| N+1 Queries | High | Eager loading |
| Missing FK Indexes | High | Add indexes |
| Over-normalization | Medium | Strategic denormalization |
| God Tables | Medium | Table splitting |
| Soft Delete Everywhere | Low | Evaluate necessity |

## Output Location

Save report to: `audit-reports/{timestamp}/database-assessment.md`

---

## Design Mode (Planning)

When invoked by `/plan-*` commands, switch from assessment to design:

**Instead of:** "What's wrong with the existing schema?"
**Focus on:** "How should we model the data for this feature?"

### Design Deliverables

1. **Entity Design** - Tables/models needed, their attributes
2. **Relationships** - Foreign keys, many-to-many, polymorphic
3. **Indexes** - Which columns to index for performance
4. **Constraints** - NOT NULL, UNIQUE, CHECK constraints
5. **Migrations** - Migration plan, order of operations
6. **Seed Data** - Initial data requirements

### Design Output Format

Save to: `planning-docs/{feature-slug}/05-data-model.md`

```markdown
# Data Model: {Feature Name}

## Entity Relationship Diagram
{ASCII diagram of tables and relationships}

## Tables

### table_name
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|

## Relationships
{Foreign keys, pivot tables}

## Indexes
{Index strategy for this feature}

## Migrations
{Migration order and dependencies}

## Seed Data
{Initial/test data requirements}
```

---

## Important Notes

1. **No code changes** - Provide recommendations, not implementations
2. **Evidence-based** - Reference specific tables, queries, migrations
3. **Performance-focused** - Quantify impact where possible
4. **ORM-aware** - Consider Eloquent patterns and conventions
5. **Actionable** - Provide specific remediation steps
