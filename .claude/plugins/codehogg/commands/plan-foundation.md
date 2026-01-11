---
description: 🏗️ ULTRATHINK Foundation Planning - Product, Architecture, Code Standards (3 consultants)
---

# Foundation Planning (3 Consultants)

Run 3 foundation consultants in **Design Mode** to establish requirements, architecture, and coding standards before diving into implementation details.

## Target Feature

$ARGUMENTS

## When to Use

- Initial feature scoping
- Before full planning to validate direction
- Quick architectural decisions
- Establishing coding patterns for a new area

## Included Consultants

| Consultant | Design Output | File |
|------------|---------------|------|
| product-consultant | Product spec, user stories, scope | `01-product-spec.md` |
| architect-consultant | System design, components | `02-architecture-design.md` |
| code-quality-consultant | Coding standards, patterns | `03-code-standards.md` |

## Execution Protocol

### Step 1: Create Planning Directory
```bash
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Launch All 3 in Parallel
Launch with `run_in_background: true`:
- product-consultant → `01-product-spec.md`
- architect-consultant → `02-architecture-design.md`
- code-quality-consultant → `03-code-standards.md`

### Step 3: Compile Summary
After all complete, create:
- `00-foundation-summary.md` - Key decisions and next steps

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-foundation-summary.md
├── 01-product-spec.md
├── 02-architecture-design.md
└── 03-code-standards.md
```

## Foundation Summary Format

```markdown
# Foundation Summary: {Feature Name}

## Product Vision
{Key points from 01-product-spec.md}

## Architecture Decisions
{Key points from 02-architecture-design.md}

## Coding Approach
{Key points from 03-code-standards.md}

## Ready for Next Phase?
- [ ] Requirements clear
- [ ] Architecture validated
- [ ] Patterns established

## Recommended Next Steps
{Which additional planning commands to run}
```

## Minimal Return Pattern

Each consultant returns only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## Next Steps

After foundation planning:
- `/plan-backend "{feature}"` - Add API, database, security design
- `/plan-frontend "{feature}"` - Add UI, UX design
- `/plan-full "{feature}"` - Run all remaining consultants
