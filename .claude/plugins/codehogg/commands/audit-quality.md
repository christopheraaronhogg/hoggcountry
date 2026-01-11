---
description: 🏛️ ULTRATHINK Quality Audit - Architecture, Code Quality, Requirements (3 consultants in parallel)
---

# Quality Audit Bundle

Run 3 quality-focused consultants in parallel for comprehensive code and architectural quality assessment.

## Included Consultants

| Consultant | Focus |
|------------|-------|
| **architect-consultant** | System structure, modularity, scalability |
| **code-quality-consultant** | Tech debt, maintainability, SOLID |
| **product-consultant** | Requirements, scope, prioritization |

## When to Use

- Technical debt assessment
- Architecture review
- Refactoring planning
- Sprint planning input
- Code health check
- Pre-major-feature preparation

## Output Location

**Targeted Reviews:** When a specific area is provided, save to:
`./audit-reports/{target-slug}/`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/quality-audit-{timestamp}/`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `API Layer` → `api-layer`
- `Shared components` → `shared-components`
- `Order module` → `order-module`

## Target
$ARGUMENTS

## Execution Protocol

### Step 1: Create Report Directory
```bash
# For targeted:
mkdir -p audit-reports/{target-slug}

# For full:
mkdir -p audit-reports/quality-audit-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Launch All 3 in Parallel
Launch with `run_in_background: true`:
```
architect-consultant → writes to {dir}/architecture-assessment.md
code-quality-consultant → writes to {dir}/code-quality-assessment.md
product-consultant → writes to {dir}/requirements-assessment.md
```

### Step 3: Wait and Compile
After all 3 complete, create:
- `00-quality-summary.md` - Combined quality findings

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
├── 00-quality-summary.md        # Combined findings
├── architecture-assessment.md
├── code-quality-assessment.md
└── requirements-assessment.md
```

## Quality Summary Format

The `00-quality-summary.md` should include:

1. **Code Health Score** (1-10)
2. **Architecture Score** (1-10)
3. **Maintainability Index** (1-10)
4. **Technical Debt** (estimated hours)
5. **Feature Completeness** (%)
6. **Top Refactoring Priorities**
7. **Architectural Concerns**
8. **Top 5 Quality Actions**

## Related Commands

- `/audit-architecture` - Architecture only
- `/audit-code` - Tech debt only
- `/audit-requirements` - Product scope only
- `/audit-quick` - Adds security, performance, UI/UX
- `/audit-full` - All 15 consultants
