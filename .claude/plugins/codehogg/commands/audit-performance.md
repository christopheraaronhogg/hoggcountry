---
description: ⚡ ULTRATHINK Performance Review - Bottleneck and optimization analysis using performance-consultant
---

# ULTRATHINK: Performance Assessment

ultrathink - Invoke the **performance-consultant** subagent for comprehensive performance evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/performance-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/performance-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio page` → `art-studio`
- `Cart and Checkout` → `cart-checkout`
- `Dashboard` → `dashboard`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Frontend Performance
- Bundle size analysis
- Code splitting opportunities
- Image optimization
- Lazy loading usage
- Core Web Vitals readiness

### Backend Performance
- Response time hotspots
- Memory usage patterns
- CPU-intensive operations
- Async processing opportunities

### Database Performance
- Slow query identification
- Index utilization
- Connection pooling
- Query caching

### Caching Strategy
- Cache hit rates (estimated)
- Cache invalidation patterns
- CDN utilization
- Application-level caching

### Resource Loading
- Critical rendering path
- Above-the-fold optimization
- Third-party script impact
- Font loading strategy

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Performance Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal performance assessment to the appropriate path with:
- **Performance Score (estimated)**
- **Top 10 Bottlenecks**
- **Quick Wins** (easy optimizations)
- **Strategic Optimizations**
- **Bundle Analysis**
- **Database Query Hotspots**
- **Caching Recommendations**
- **Prioritized Action Plan**

**Be specific about performance bottlenecks. Reference exact files and slow operations.**
