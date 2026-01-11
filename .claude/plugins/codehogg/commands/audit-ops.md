---
description: 🔧 ULTRATHINK Operations Audit - DevOps, Cost, Docs, QA, Observability (5 consultants in parallel)
---

# Operations Audit Bundle

Run 5 operations-focused consultants in parallel for comprehensive operational excellence assessment.

## Included Consultants

| Consultant | Focus |
|------------|-------|
| **devops-consultant** | CI/CD, infrastructure, deployment |
| **cost-consultant** | Cloud costs, FinOps, optimization |
| **docs-consultant** | Documentation coverage, quality |
| **qa-consultant** | Testing strategy, coverage |
| **observability-consultant** | Logging, monitoring, APM, alerting |

## When to Use

- Infrastructure review
- Cost optimization initiative
- Documentation audit
- Test coverage assessment
- DevOps maturity check
- Pre-scaling preparation

## Output Location

**Targeted Reviews:** When a specific system/area is provided, save to:
`./audit-reports/{target-slug}/`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/ops-audit-{timestamp}/`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `CI Pipeline` → `ci-pipeline`
- `Deployment process` → `deployment`
- `Testing infrastructure` → `testing`

## Target
$ARGUMENTS

## Execution Protocol

### Step 1: Create Report Directory
```bash
# For targeted:
mkdir -p audit-reports/{target-slug}

# For full:
mkdir -p audit-reports/ops-audit-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
```
devops-consultant → writes to {dir}/devops-assessment.md
cost-consultant → writes to {dir}/cost-assessment.md
docs-consultant → writes to {dir}/documentation-assessment.md
qa-consultant → writes to {dir}/qa-assessment.md
observability-consultant → writes to {dir}/observability-assessment.md
```

### Step 3: Wait and Compile
After all 5 complete, create:
- `00-ops-summary.md` - Combined operations findings

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
├── 00-ops-summary.md            # Combined findings
├── devops-assessment.md
├── cost-assessment.md
├── documentation-assessment.md
├── qa-assessment.md
└── observability-assessment.md
```

## Ops Summary Format

The `00-ops-summary.md` should include:

1. **Operations Maturity Score** (1-5)
2. **DevOps Maturity** (1-5)
3. **FinOps Maturity** (1-5)
4. **Test Coverage** (%)
5. **Documentation Coverage** (%)
6. **Observability Maturity** (1-5)
7. **Monthly Cost Estimate**
8. **Potential Savings**
9. **Top 5 Ops Actions**

## Related Commands

- `/audit-devops` - CI/CD and infrastructure only
- `/audit-cost` - Cloud costs only
- `/audit-docs` - Documentation only
- `/audit-qa` - Testing only
- `/audit-observability` - Logging, monitoring, APM only
- `/audit-full` - All 18 consultants
