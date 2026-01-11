---
description: 💰 ULTRATHINK Cost Design - Resource projections, budgets, ROI
---

# Cost Design

Invoke the **cost-consultant** in Design Mode for cost projection and budget planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/10-cost-projections.md`

## Design Considerations

### Resource Requirements
- Compute resources (CPU, memory)
- Storage requirements (database, files, cache)
- Network/bandwidth needs
- CDN requirements
- Third-party service usage

### Cost Drivers Analysis
- Primary cost components
- Variable vs. fixed costs
- Per-user vs. per-transaction costs
- Third-party API costs
- Infrastructure overhead

### Scaling Cost Model
- How costs change with user growth
- How costs change with data growth
- Horizontal vs. vertical scaling costs
- Reserved capacity opportunities
- Spot/preemptible workload candidates

### Optimization Opportunities
- Built-in cost efficiency patterns
- Caching to reduce compute
- Async processing to reduce peak load
- Storage tiering strategies
- Auto-scaling configuration

### Budget Planning
- Initial implementation costs
- Monthly operational costs
- Growth projections
- Cost allocation by component
- Budget buffer recommendations

### FinOps Considerations
- Cost visibility requirements
- Tagging/allocation strategy
- Anomaly detection needs
- Cost review cadence
- Optimization triggers

## Design Deliverables

1. **Resource Projections** - Expected compute, storage, database needs
2. **Cost Estimates** - Monthly/annual cost projections by category
3. **Scaling Considerations** - How costs change with growth
4. **Optimization Opportunities** - Built-in cost efficiency from the start
5. **Budget Recommendations** - Suggested budget allocation
6. **ROI Analysis** - Expected return vs. infrastructure cost

## Output Format

Deliver cost design document with:
- **Cost Breakdown Table** (category, monthly, annual)
- **Scaling Cost Model** (chart or table showing growth impact)
- **Resource Sizing Recommendations**
- **Optimization Checklist** (built-in efficiency measures)
- **Budget Allocation** (by component/phase)
- **ROI Calculation** (if applicable)

**Be specific about cost drivers. Provide concrete estimates where possible.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
