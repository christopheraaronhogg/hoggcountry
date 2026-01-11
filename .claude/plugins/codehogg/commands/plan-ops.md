---
description: 🚀 ULTRATHINK Ops Planning - DevOps, Cost, Docs, QA, Observability (5 consultants)
---

# Operations Planning (5 Consultants)

Run 5 operations-focused consultants in **Design Mode** to plan deployment, testing, monitoring, documentation, and cost management.

## Target Feature

$ARGUMENTS

## When to Use

- Features requiring infrastructure changes
- High-reliability features
- Features with cost implications
- Complex deployment requirements
- Features needing detailed test strategy

## Included Consultants

| Consultant | Design Output | File |
|------------|---------------|------|
| devops-consultant | Deployment plan, infrastructure | `09-deployment-plan.md` |
| cost-consultant | Cost projections, budgets | `10-cost-projections.md` |
| docs-consultant | Documentation plan | `11-documentation-plan.md` |
| qa-consultant | Test strategy, acceptance criteria | `12-test-strategy.md` |
| observability-consultant | Logging, monitoring, alerting | `13-observability-plan.md` |

## Execution Protocol

### Step 1: Create Planning Directory
```bash
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
- devops-consultant → `09-deployment-plan.md`
- cost-consultant → `10-cost-projections.md`
- docs-consultant → `11-documentation-plan.md`
- qa-consultant → `12-test-strategy.md`
- observability-consultant → `13-observability-plan.md`

### Step 3: Compile Summary
After all complete, create:
- `00-ops-summary.md` - Combined operations planning

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-ops-summary.md
├── 09-deployment-plan.md
├── 10-cost-projections.md
├── 11-documentation-plan.md
├── 12-test-strategy.md
└── 13-observability-plan.md
```

## Ops Summary Format

```markdown
# Operations Summary: {Feature Name}

## Deployment Strategy
{Key points from 09-deployment-plan.md}

## Cost Projections
{Monthly estimates, scaling costs from 10}

## Documentation Plan
{What docs to create from 11}

## Test Strategy
{Coverage plan, acceptance criteria from 12}

## Observability
{Logging, metrics, alerts from 13}

## Operational Checklist
- [ ] Environment variables documented
- [ ] CI/CD pipeline updated
- [ ] Tests written and passing
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Runbook created
```

## Minimal Return Pattern

Each consultant returns only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## Related Commands

- `/plan-foundation` - Add product spec and architecture
- `/plan-backend` - Add API, database, security design
- `/plan-frontend` - Add UI, UX design
