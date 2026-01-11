---
description: 💰 ULTRATHINK Cost Review - Cloud cost optimization analysis using cost-consultant
---

# ULTRATHINK: Cost Assessment

ultrathink - Invoke the **cost-consultant** subagent for comprehensive cloud cost evaluation.

## Output Location

**Targeted Reviews:** When a specific service/feature is provided, save to:
`./audit-reports/{target-slug}/cost-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/cost-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Image Processing` → `image-processing`
- `Storage Layer` → `storage`
- `API Services` → `api-services`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Resource Utilization
- Compute resource sizing
- Storage optimization
- Database tier appropriateness
- CDN and caching usage

### Cost Drivers
- Identify top spending categories
- API call volumes
- Data transfer costs
- Third-party service costs

### Optimization Opportunities
- Reserved capacity candidates
- Spot/preemptible workloads
- Auto-scaling effectiveness
- Idle resource detection

### Code-Level Costs
- Expensive operations
- Unnecessary API calls
- Inefficient queries
- Redundant processing

### FinOps Maturity
- Cost visibility
- Budget controls
- Allocation tagging
- Anomaly detection

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-ops`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Cost Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal cost assessment to the appropriate path with:
- **Executive Summary**
- **Current Cost Estimate (monthly)**
- **Cost Breakdown by Category**
- **Top 10 Optimization Opportunities**
- **Estimated Savings (per optimization)**
- **FinOps Maturity Score (1-5)**
- **Implementation Roadmap**
- **Quick Wins vs Strategic Changes**

**Be specific about cost drivers. Reference exact services and inefficient patterns.**
