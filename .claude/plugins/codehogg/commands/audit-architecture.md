---
description: 🏗️ ULTRATHINK Architecture Review - Deep architectural analysis using architect-consultant
---

# ULTRATHINK: Architecture Assessment

ultrathink - Invoke the **architect-consultant** subagent for comprehensive architectural evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/architecture-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/architecture-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio page` → `art-studio`
- `Cart and Checkout` → `cart-checkout`
- `API Layer` → `api-layer`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### System Structure
- Overall architecture pattern (MVC, layered, hexagonal, etc.)
- Module organization and boundaries
- Component coupling and cohesion

### Dependency Analysis
- External dependency management
- Internal module dependencies
- Circular dependency detection

### Scalability Assessment
- Horizontal scaling readiness
- Bottleneck identification
- State management patterns

### Code Organization
- Directory structure effectiveness
- Naming conventions consistency
- Configuration management

### Integration Patterns
- API design quality
- Service communication patterns
- Data flow architecture

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-quality`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Architecture Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal architecture assessment to the appropriate path with:
- **Executive Summary** (2-3 sentences)
- **Architecture Diagram** (ASCII if helpful)
- **Strengths** (what's working well)
- **Critical Issues** (priority fixes)
- **Recommendations** (prioritized action items)
- **Technical Debt Inventory**

**Be specific about architectural problems. Reference exact files and patterns.**
