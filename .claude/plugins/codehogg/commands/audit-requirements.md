---
description: 📋 ULTRATHINK Requirements Review - Product scope and prioritization analysis using product-consultant
---

# ULTRATHINK: Requirements Assessment

ultrathink - Invoke the **product-consultant** subagent for comprehensive requirements evaluation.

## Output Location

**Targeted Reviews:** When a specific feature/area is provided, save to:
`./audit-reports/{target-slug}/requirements-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/requirements-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Checkout Flow` → `checkout`
- `User Dashboard` → `dashboard`
- `Admin Features` → `admin`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Feature Analysis
- Implemented features inventory
- Feature completeness
- Partially implemented features
- Dead/unused features

### Scope Assessment
- Core functionality coverage
- MVP completeness
- Feature creep indicators
- Missing essential features

### Prioritization
- Business value alignment
- Technical dependency order
- Quick wins identification
- Risk assessment

### User Stories
- Clarity and specificity
- Acceptance criteria presence
- Testability
- User-centered language

### Technical Feasibility
- Over-engineered solutions
- Under-specified requirements
- Technical debt from rushed features
- Scalability considerations

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quality`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Requirements Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal requirements assessment to the appropriate path with:
- **Executive Summary**
- **Feature Inventory**
- **Completeness Score (%)**
- **Priority Misalignments**
- **Scope Recommendations**
- **Missing Requirements**
- **Technical Debt from Requirements**
- **Prioritized Backlog Suggestions**

**Be specific about scope gaps. Reference exact features and missing functionality.**
