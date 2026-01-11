---
description: ⚡ ULTRATHINK Quick Planning - 7 key consultants for moderate features
---

# Quick Feature Planning (7 Consultants)

Run 7 essential consultants in **Design Mode** across 2 waves for faster planning of moderate features.

## Target Feature

$ARGUMENTS

## When to Use

- Medium-sized features
- Time-constrained planning
- Features without complex compliance/SEO needs
- Internal tools or admin features

## Included Consultants

| Wave | Consultant | Design Output |
|------|------------|---------------|
| 1 | product-consultant | Product spec, scope |
| 1 | architect-consultant | System design |
| 1 | code-quality-consultant | Coding standards |
| 2 | backend-consultant | API design |
| 2 | database-consultant | Data model |
| 2 | ui-design-consultant | Visual specs |
| 2 | ux-consultant | User flows |

## Excluded (Use `/plan-full` if needed)

- stack-consultant (live research)
- security-consultant
- compliance-consultant
- devops-consultant
- cost-consultant
- docs-consultant
- qa-consultant
- observability-consultant
- copy-consultant
- performance-consultant
- seo-consultant

## Execution Protocol

### Step 1: Create Planning Directory
```bash
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Wave 1 - Foundation (3)
Launch in parallel:
- product-consultant → `01-product-spec.md`
- architect-consultant → `02-architecture-design.md`
- code-quality-consultant → `03-code-standards.md`

Wait for completion.

### Step 3: Wave 2 - Core Implementation (4)
Launch in parallel:
- backend-consultant → `04-api-design.md`
- database-consultant → `05-data-model.md`
- ui-design-consultant → `14-ui-design-spec.md`
- ux-consultant → `15-ux-flows.md`

Wait for completion.

### Step 4: Compile PRD
Create:
- `00-prd.md` - Unified requirements
- `00-implementation-plan.md` - Task list

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-prd.md
├── 00-implementation-plan.md
├── 01-product-spec.md
├── 02-architecture-design.md
├── 03-code-standards.md
├── 04-api-design.md
├── 05-data-model.md
├── 14-ui-design-spec.md
└── 15-ux-flows.md
```

## Minimal Return Pattern

Each consultant returns only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## After Planning

Implement with `/implement-solo` (recommended).

## Need More Coverage?

Run individual plan commands for missing areas:
- `/plan-security` - Add threat model
- `/plan-qa` - Add test strategy
- `/plan-performance` - Add performance budgets
