---
description: 🗄️ ULTRATHINK Database Design - Schema, models, relationships
---

# Database Design

Invoke the **database-consultant** in Design Mode for data modeling and schema planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/05-data-model.md`

## Design Considerations

### Schema Design
- Table structure and columns
- Normalization level (1NF, 2NF, 3NF, or denormalized)
- Data type selection
- Naming conventions
- Column constraints

### Relationship Design
- Foreign key relationships
- One-to-many vs. many-to-many
- Polymorphic relationships (if needed)
- Self-referential relationships
- Cascade delete/update behavior

### Index Strategy
- Primary keys
- Foreign key indexes
- Query-based indexes
- Composite indexes
- Full-text search indexes

### Data Integrity
- NOT NULL constraints
- UNIQUE constraints
- CHECK constraints
- Default values
- Triggers (if needed)

### Migration Planning
- Migration file structure
- Order of operations
- Rollback strategy
- Data migration handling
- Zero-downtime considerations

### Query Performance
- Expected query patterns
- Eager loading requirements
- Query optimization approach
- Caching integration

## Design Deliverables

1. **Entity Design** - Tables/models needed, their attributes
2. **Relationships** - Foreign keys, many-to-many, polymorphic
3. **Indexes** - Which columns to index for performance
4. **Constraints** - NOT NULL, UNIQUE, CHECK constraints
5. **Migrations** - Migration plan, order of operations
6. **Seed Data** - Initial data requirements

## Output Format

Deliver database design document with:
- **Entity Relationship Diagram** (ASCII or description)
- **Table Definitions** (columns, types, constraints)
- **Index Definitions**
- **Migration Sequence**
- **Example Queries** (common operations)
- **Seed Data Specification**

**Be specific about data modeling. Provide exact column definitions and relationships.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
